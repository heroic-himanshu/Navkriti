

// app/api/patient/medicines/history/route.js
// Get medicine intake history
import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongoose';
import Patient from '@/models/patient';

import { authenticate } from '@/middleware/auth';
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
    
    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get('days')) || 7;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const patient = await Patient.findById(auth.patient._id);
    
    if (!patient) {
      return NextResponse.json(
        { success: false, error: 'Patient not found' },
        { status: 404 }
      );
    }

    // Filter intake history
    const history = patient.medicine_intakes.filter(
      intake => new Date(intake.scheduled_time) >= startDate
    );

    // Calculate statistics
    const stats = {
      total: history.length,
      taken: history.filter(i => i.status === 'taken').length,
      missed: history.filter(i => i.status === 'missed').length,
      skipped: history.filter(i => i.status === 'skipped').length,
      pending: history.filter(i => i.status === 'pending').length,
    };

    stats.adherence_rate = stats.total > 0 
      ? ((stats.taken / (stats.total - stats.pending)) * 100).toFixed(1)
      : 0;

    return NextResponse.json({
      success: true,
      data: {
        history: history.sort((a, b) => new Date(b.scheduled_time) - new Date(a.scheduled_time)),
        stats,
      },
    });
  } catch (error) {
    console.error('Get history error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch history' },
      { status: 500 }
    );
  }
}