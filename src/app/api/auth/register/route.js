
import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongoose';
import { generateToken, createTokenResponse } from '@/lib/jwt';
import Patient from '@/models/patient';

export async function POST(request) {
  try {
    await dbConnect();
    
    const { name, ph_number, sex, age, med_history, password } = await request.json();
    
    // Validate input
    if (!name || !ph_number || !sex||!age) {
      return NextResponse.json(
        { success: false, error: 'Please provide all required fields' },
        { status: 400 }
      );
    }
    
    if (password.length < 6) {
      return NextResponse.json(
        { success: false, error: 'Password must be at least 6 characters' },
        { status: 400 }
      );
    }
    
    // Check if patient already exists
    const existingpatient = await Patient.findOne({ ph_number });
    
    if (existingpatient) {
      return NextResponse.json(
        { success: false, error: 'patient already exists with this phone Number' },
        { status: 400 }
      );
    }
    
    // Create patient
    const patient = await Patient.create({
      name, ph_number, sex, age, med_history, password// Will be hashed by pre-save middleware
    });
    
    // Generate token
    const token = generateToken(patient._id);
    
    // Return response
    return NextResponse.json(
      createTokenResponse(patient, token),
      { status: 201 }
    );
  } catch (error) {
    console.error('Register error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Registration failed' },
      { status: 500 }
    );
  }
}