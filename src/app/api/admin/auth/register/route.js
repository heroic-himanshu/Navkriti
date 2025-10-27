// app/api/admin/auth/register/route.js
import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongoose';
import Admin from '@/models/admin';
import { generateToken, createTokenResponse } from '@/lib/jwt';

export async function POST(request) {
  try {
    await dbConnect();
    
    const { name, email, password } = await request.json();
    
    // Validate input
    if (!name || !email || !password) {
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
    
    // Check if admin already exists
    const existingAdmin = await Admin.findOne({ email });
    
    if (existingAdmin) {
      return NextResponse.json(
        { success: false, error: 'Admin already exists with this email' },
        { status: 400 }
      );
    }
    
    // Create admin
    const admin = await Admin.create({
      name,
      email,
      password,
    });
    
    // Generate token
    const token = generateToken(admin._id);
    
    // Return response
    return NextResponse.json(
      createTokenResponse(admin, token),
      { status: 201 }
    );
  } catch (error) {
    console.error('Admin register error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Registration failed' },
      { status: 500 }
    );
  }
}