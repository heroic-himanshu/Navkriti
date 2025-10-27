// app/api/patient/medicines/intake/route.js
// Record medicine intake
import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongoose';
import Patient from '@/models/patient';

import { authenticate } from '@/middleware/auth';
export async function POST(request) {
  try {
    const auth = await authenticate(request);
    if (auth.error) {
      return NextResponse.json(
        { success: false, error: auth.error },
        { status: auth.status }
      );
    }

    await dbConnect();
    const { prescription_id, medicine_name, status, notes } = await request.json();

    if (!prescription_id || !medicine_name || !status) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const patient = await Patient.findById(auth.patient._id);
    
    if (!patient) {
      return NextResponse.json(
        { success: false, error: 'Patient not found' },
        { status: 404 }
      );
    }

    // Create intake log
    const intakeLog = {
      prescription_id,
      medicine_name,
      scheduled_time: new Date(),
      taken_time: status === 'taken' ? new Date() : null,
      status,
      notes,
    };

    patient.medicine_intakes.push(intakeLog);
    await patient.save();

    return NextResponse.json({
      success: true,
      message: 'Intake recorded successfully',
      data: intakeLog,
    });
  } catch (error) {
    console.error('Record intake error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to record intake' },
      { status: 500 }
    );
  }
}