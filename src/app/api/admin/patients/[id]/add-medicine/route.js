// app/api/admin/patients/[id]/add-medicine/route.js
// Admin API to add medicine to patient's medical history
import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongoose';
import Patient from '@/models/patient';
import { checkPermission } from '@/middleware/adminAuth';
import { ObjectId } from 'mongodb';

export async function POST(request, { params }) {
  try {
    const auth = await checkPermission(request, 'edit_patients');
    
    if (auth.error) {
      return NextResponse.json(
        { success: false, error: auth.error },
        { status: auth.status }
      );
    }

    await dbConnect();
    
    const { id } = await params;
    
    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, error: 'Invalid patient ID' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const {
      dept,
      doctor_name,
      problem,
      followup,
      alert_type,
      prescription, // Array of medicines
    } = body;

    // Validate required fields
    if (!dept || !prescription || prescription.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Department and at least one medicine are required' },
        { status: 400 }
      );
    }

    // Validate medicines
    for (const med of prescription) {
      if (!med.name) {
        return NextResponse.json(
          { success: false, error: 'Medicine name is required' },
          { status: 400 }
        );
      }
      if (!med.acceptedtime) {
        return NextResponse.json(
          { success: false, error: 'Medicine time schedule is required' },
          { status: 400 }
        );
      }
    }

    // Format medicines with proper structure
    const formattedMedicines = prescription.map(med => ({
      name: med.name,
      color: med.color || 'white',
      dosage: med.dosage || '1 tablet',
      frequency: med.frequency || 'As prescribed',
      acceptedtime: med.acceptedtime, // e.g., "5-9, 11-15, 17-22"
      duration_days: med.duration_days || 7,
      start_date: med.start_date ? new Date(med.start_date) : new Date(),
      end_date: med.end_date ? new Date(med.end_date) : null,
      instructions: med.instructions || '',
      is_active: true,
    }));

    // Calculate end_date if not provided
    formattedMedicines.forEach(med => {
      if (!med.end_date && med.duration_days) {
        const endDate = new Date(med.start_date);
        endDate.setDate(endDate.getDate() + med.duration_days);
        med.end_date = endDate;
      }
    });

    // Create new medical history entry
    const newHistory = {
      dept,
      doctor_name: doctor_name || '',
      problem: problem || '',
      followup: followup ? new Date(followup) : null,
      alert_type: alert_type || 'Low',
      prescription: formattedMedicines,
      visit_date: new Date(),
    };

    // Update patient
    const patient = await Patient.findByIdAndUpdate(
      id,
      { $push: { med_history: newHistory } },
      { new: true, runValidators: true }
    ).select('-password');

    if (!patient) {
      return NextResponse.json(
        { success: false, error: 'Patient not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: patient,
        message: 'Medicines added successfully',
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Add medicine error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to add medicines' },
      { status: 500 }
    );
  }
}
