
import { NextResponse } from 'next/server';
import { verifyToken, getTokenFromHeaders } from '@/lib/jwt';
import dbConnect from '@/lib/mongoose';
import Patient from '@/models/patient';

export async function authenticate(request) {
  try {
    const token = getTokenFromHeaders(request);
    
    if (!token) {
      return {
        error: 'Not authorized, no token',
        status: 401,
      };
    }
    
    const decoded = verifyToken(token);
    
    if (!decoded) {
      return {
        error: 'Not authorized, token invalid',
        status: 401,
      };
    }
    
    await dbConnect();
    const patient = await Patient.findById(decoded.id).select('-password');
    
    if (!patient) {
      return {
        error: 'patient not found',
        status: 404,
      };
    }
    
    return { patient };
  } catch (error) {
    return {
      error: 'Authentication failed',
      status: 401,
    };
  }
}