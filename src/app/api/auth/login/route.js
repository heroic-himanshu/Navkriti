
import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongoose';
import Patient from '@/models/patient';
import { generateToken, createTokenResponse } from '@/lib/jwt';

export async function POST(request) {
  try {
    await dbConnect();
    
    const { ph_number, password } = await request.json();
    
    // Validate input
    if (!ph_number || !password) {
      return NextResponse.json(
        { success: false, error: 'Please provide phone number and password' },
        { status: 400 }
      );
    }
    
    // Find patient and include password field
    const patient = await Patient.findOne({ ph_number }).select('+password');
    
    if (!patient) {
      return NextResponse.json(
        { success: false, error: 'Invalid credentials' },
        { status: 401 }
      );
    }
    
    // Check password
    const isPasswordMatch = await patient.comparePassword(password);
    
    if (!isPasswordMatch) {
      return NextResponse.json(
        { success: false, error: 'Invalid credentials' },
        { status: 401 }
      );
    }
    
    // Generate token
    const token = generateToken(patient._id);
    
    // Return response
    return NextResponse.json(
      createTokenResponse(patient, token),
      { status: 200 }
    );
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Login failed' },
      { status: 500 }
    );
  }
}