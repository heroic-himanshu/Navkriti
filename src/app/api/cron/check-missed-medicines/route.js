// app/api/cron/check-missed-medicines/route.js
// This should be called periodically (e.g., every hour) by a cron service
import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongoose';
import Patient from '@/models/patient';

// Helper function to parse time slots
function parseTimeSlots(timeString) {
  // "5-9, 11-15, 17-22" -> [{start: 5, end: 9}, ...]
  const slots = timeString.split(',').map(slot => {
    const [start, end] = slot.trim().split('-').map(Number);
    return { start, end };
  });
  return slots;
}

// Helper function to check if a time slot has passed
function hasTimeSlotPassed(slot, marginHours = 2) {
  const now = new Date();
  const slotEndTime = new Date();
  slotEndTime.setHours(slot.end, 0, 0, 0);
  
  // Add margin (e.g., 2 hours after the end time)
  slotEndTime.setHours(slotEndTime.getHours() + marginHours);
  
  return now > slotEndTime;
}

// Helper function to create scheduled time for a slot
function createScheduledTime(slot) {
  const scheduledTime = new Date();
  const middleHour = Math.floor((slot.start + slot.end) / 2);
  scheduledTime.setHours(middleHour, 0, 0, 0);
  return scheduledTime;
}

export async function GET(request) {
  try {
    // Verify cron secret for security (optional but recommended)
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;
    
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await dbConnect();

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    // Get all patients with active prescriptions
    const patients = await Patient.find({
      'med_history.prescription.is_active': true,
    });

    let totalChecked = 0;
    let totalMarkedMissed = 0;
    const results = [];

    for (const patient of patients) {
      let patientMissedCount = 0;
      
      // Get active prescriptions for this patient
      const activeMedicines = patient.getActivePrescriptions();
      
      for (const med of activeMedicines) {
        if (!med.acceptedtime) continue;
        
        try {
          const timeSlots = parseTimeSlots(med.acceptedtime);
          
          for (const slot of timeSlots) {
            totalChecked++;
            
            // Check if this time slot has passed (with 2 hour margin)
            if (!hasTimeSlotPassed(slot, 2)) {
              continue; // Time slot hasn't passed yet
            }
            
            // Create the scheduled time for this slot
            const scheduledTime = createScheduledTime(slot);
            scheduledTime.setFullYear(today.getFullYear(), today.getMonth(), today.getDate());
            
            // Check if there's already a log for this medicine at this time today
            const existingLog = patient.medicine_intakes.find(intake => {
              const intakeDate = new Date(intake.scheduled_time);
              const isSameDay = 
                intakeDate.getFullYear() === today.getFullYear() &&
                intakeDate.getMonth() === today.getMonth() &&
                intakeDate.getDate() === today.getDate();
              
              const isSameMedicine = intake.prescription_id.equals(med._id);
              const isSameTimeSlot = intakeDate.getHours() >= slot.start && intakeDate.getHours() <= slot.end;
              
              return isSameDay && isSameMedicine && isSameTimeSlot;
            });
            
            // If no log exists, mark as missed
            if (!existingLog) {
              patient.medicine_intakes.push({
                prescription_id: med._id,
                medicine_name: med.name,
                scheduled_time: scheduledTime,
                taken_time: null,
                status: 'missed',
                notes: 'Auto-marked as missed by cron job',
              });
              
              patientMissedCount++;
              totalMarkedMissed++;
            }
          }
        } catch (error) {
          console.error(`Error processing medicine ${med.name} for patient ${patient.name}:`, error);
        }
      }
      
      // Save patient if any medicines were marked as missed
      if (patientMissedCount > 0) {
        await patient.save();
        results.push({
          patient_id: patient._id,
          patient_name: patient.name,
          missed_count: patientMissedCount,
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Cron job completed successfully',
      timestamp: new Date().toISOString(),
      stats: {
        patients_checked: patients.length,
        slots_checked: totalChecked,
        total_marked_missed: totalMarkedMissed,
        patients_with_missed_doses: results.length,
      },
      details: results,
    });
  } catch (error) {
    console.error('Cron job error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Cron job failed',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

// POST method for manual trigger (useful for testing)
export async function POST(request) {
  return GET(request);
}