// middleware/adminAuth.js
import { NextResponse } from 'next/server';
import { verifyToken, getTokenFromHeaders } from '@/lib/jwt';
import dbConnect from '@/lib/mongoose';
import Admin from '@/models/admin';

// Authenticate admin
export async function authenticateAdmin(request) {
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
    const admin = await Admin.findById(decoded.id).select('-password');
    
    if (!admin) {
      return {
        error: 'Admin not found',
        status: 404,
      };
    }
    
    if (!admin.isActive) {
      return {
        error: 'Admin account is deactivated',
        status: 403,
      };
    }
    
    return { admin };
  } catch (error) {
    return {
      error: 'Authentication failed',
      status: 401,
    };
  }
}

// Check specific permission
export async function checkPermission(request, requiredPermission) {
  const auth = await authenticateAdmin(request);
  
  if (auth.error) {
    return auth;
  }
  
  return { admin: auth.admin };
}