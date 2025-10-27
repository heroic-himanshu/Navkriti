
import { NextResponse } from 'next/server';
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
    
    return NextResponse.json(
      {
        success: true,
        patient: {
          pid: auth.patient._id,
          name: auth.patient.name,
          ph_number: auth.patient.ph_number,
          med_history:auth.patient.med_history,
          sex:auth.patient.sex,
          age:auth.patient.age,
          createdAt: auth.patient.createdAt,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to get patient info' },
      { status: 500 }
    );
  }
}