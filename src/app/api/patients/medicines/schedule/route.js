// app/api/patients/medicines/schedule/route.js
import { NextResponse } from 'next/server';
import { authenticate } from '@/middleware/auth';
import dbConnect from '@/lib/mongoose';
import Patient from '@/models/patient';

// Helper function to parse time slots
function parseTimeSlots(timeString) {
  // "5-9, 11-15, 17-22" -> [{start: 5, end: 9}, ...]
  try {
    const slots = timeString.split(',').map(slot => {
      const [start, end] = slot.trim().split('-').map(Number);
      return { start, end };
    });
    return slots;
  } catch (error) {
    console.error('Error parsing time slots:', error);
    return [];
  }
}

// Helper function to get middle time of slot
function getMiddleTime(slot) {
  const today = new Date();
  const middleHour = Math.floor((slot.start + slot.end) / 2);
  today.setHours(middleHour, 0, 0, 0);
  return today;
}

export async function GET(request) {
  try {
    const auth = await authenticate(request);
    
    if (auth.error) {
      return NextResponse.json(
        { success: false, error: auth.error },
        { status: auth.status }
      );
    }

    await dbConnect();
    const patient = await Patient.findById(auth.patient._id);
    
    if (!patient) {
      return NextResponse.json(
        { success: false, error: 'Patient not found' },
        { status: 404 }
      );
    }

    const activeMedicines = patient.getActivePrescriptions();
    const todaySchedule = [];

    // Get today's date range
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Get today's intake records
    const todayIntakes = patient.medicine_intakes.filter(intake => {
      const intakeDate = new Date(intake.scheduled_time);
      return intakeDate >= today && intakeDate < tomorrow;
    });

    // Parse time slots and create schedule
    activeMedicines.forEach(med => {
      if (med.acceptedtime) {
        const timeSlots = parseTimeSlots(med.acceptedtime);
        
        timeSlots.forEach(slot => {
          const scheduledTime = getMiddleTime(slot);
          
          // Check if this medicine at this time already has an intake record
          const alreadyRecorded = todayIntakes.some(intake => {
            const intakeDate = new Date(intake.scheduled_time);
            const isSameMedicine = intake.prescription_id.equals(med._id);
            const isSameTimeSlot = 
              intakeDate.getHours() >= slot.start && 
              intakeDate.getHours() <= slot.end;
            
            return isSameMedicine && isSameTimeSlot && 
                   ['taken', 'skipped', 'missed'].includes(intake.status);
          });

          // Only add to schedule if not already recorded
          if (!alreadyRecorded) {
            todaySchedule.push({
              prescription_id: med._id,
              medicine_name: med.name,
              color: med.color,
              dosage: med.dosage,
              time_range: slot,
              scheduled_time: scheduledTime,
              dept: med.dept,
              doctor_name: med.doctor_name,
              instructions: med.instructions,
            });
          }
        });
      }
    });

    // Sort by time
    todaySchedule.sort((a, b) => new Date(a.scheduled_time) - new Date(b.scheduled_time));

    return NextResponse.json({
      success: true,
      data: todaySchedule,
    });
  } catch (error) {
    console.error('Get schedule error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch schedule' },
      { status: 500 }
    );
  }
}