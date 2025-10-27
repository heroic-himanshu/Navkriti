// app/api/admin/auth/login/route.js
import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongoose';
import Admin from '@/models/admin';
import { generateToken, createTokenResponse } from '@/lib/jwt';

export async function POST(request) {
  try {
    await dbConnect();
    
    const { email, password } = await request.json();
    
    // Validate input
    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: 'Please provide email and password' },
        { status: 400 }
      );
    }
    
    // Find admin and include password field
    const admin = await Admin.findOne({ email }).select('+password');
    
    if (!admin) {
      return NextResponse.json(
        { success: false, error: 'Invalid credentials' },
        { status: 401 }
      );
    }
    
    if (!admin.isActive) {
      return NextResponse.json(
        { success: false, error: 'Admin account is deactivated' },
        { status: 403 }
      );
    }
    
    // Check password
    const isPasswordMatch = await admin.comparePassword(password);
    
    if (!isPasswordMatch) {
      return NextResponse.json(
        { success: false, error: 'Invalid credentials' },
        { status: 401 }
      );
    }
    
    // Generate token
    const token = generateToken(admin._id);
    
    // Return response
    return NextResponse.json(
      createTokenResponse(admin, token),
      { status: 200 }
    );
  } catch (error) {
    console.error('Admin login error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Login failed' },
      { status: 500 }
    );
  }
}