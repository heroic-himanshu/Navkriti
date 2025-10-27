// app/api/admin/patients/missed-doses/route.js
// Get missed doses count for all patients
import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongoose';
import Patient from '@/models/patient';
import { checkPermission } from '@/middleware/adminAuth';

export async function GET(request) {
  try {
    const auth = await checkPermission(request, 'view_patients');
    
    if (auth.error) {
      return NextResponse.json(
        { success: false, error: auth.error },
        { status: auth.status }
      );
    }

    await dbConnect();

    // Get all patients
    const patients = await Patient.find({}).select('_id medicine_intakes');

    // Calculate missed doses for each patient
    const missedDosesMap = {};

    patients.forEach(patient => {
      const missedCount = patient.medicine_intakes.filter(
        intake => intake.status === 'missed'
      ).length;
      
      missedDosesMap[patient._id.toString()] = missedCount;
    });

    return NextResponse.json({
      success: true,
      data: missedDosesMap,
    });
  } catch (error) {
    console.error('Get missed doses error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch missed doses' },
      { status: 500 }
    );
  }
}
