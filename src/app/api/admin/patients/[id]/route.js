// app/api/admin/patients/[id]/route.js
import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongoose';
import Patient from '@/models/patient';
import { checkPermission } from '@/middleware/adminAuth';
import { ObjectId } from 'mongodb';

// GET - View single patient (requires view_patients permission)
export async function GET(request, { params }) {
  try {
    const auth = await checkPermission(request, 'view_patients');
    
    if (auth.error) {
      return NextResponse.json(
        { success: false, error: auth.error },
        { status: auth.status }
      );
    }
    
    await dbConnect();
    
    const { id } = await params;
    
    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, error: 'Invalid patient ID' },
        { status: 400 }
      );
    }
    
    const patient = await Patient.findById(id).select('-password');
    
    if (!patient) {
      return NextResponse.json(
        { success: false, error: 'Patient not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(
      {
        success: true,
        data: patient,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Get patient error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch patient' },
      { status: 500 }
    );
  }
}

// PUT - Update patient (requires edit_patients permission)
export async function PUT(request, { params }) {
  try {
    const auth = await checkPermission(request, 'edit_patients');
    
    if (auth.error) {
      return NextResponse.json(
        { success: false, error: auth.error },
        { status: auth.status }
      );
    }
    
    await dbConnect();
    
    const { id } = await params;
    
    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, error: 'Invalid patient ID' },
        { status: 400 }
      );
    }
    
    const body = await request.json();
    
    // Don't allow updating password through this route
    delete body.password;
    delete body._id;
    
    const updatedPatient = await Patient.findByIdAndUpdate(
      id,
      { $set: body },
      { new: true, runValidators: true }
    ).select('-password');
    
    if (!updatedPatient) {
      return NextResponse.json(
        { success: false, error: 'Patient not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(
      {
        success: true,
        data: updatedPatient,
        message: 'Patient updated successfully',
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Update patient error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update patient' },
      { status: 500 }
    );
  }
}

// DELETE - Delete patient (requires delete_patients permission)
export async function DELETE(request, { params }) {
  try {
    const auth = await checkPermission(request, 'delete_patients');
    
    if (auth.error) {
      return NextResponse.json(
        { success: false, error: auth.error },
        { status: auth.status }
      );
    }
    
    await dbConnect();
    
    const { id } = params;
    
    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, error: 'Invalid patient ID' },
        { status: 400 }
      );
    }
    
    const deletedPatient = await Patient.findByIdAndDelete(id);
    
    if (!deletedPatient) {
      return NextResponse.json(
        { success: false, error: 'Patient not found' },
        { status: 404 }
      );
    }
    return NextResponse.json(
      {
        success: true,
        message: 'Patient deleted successfully',
        data: { id },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Delete patient error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete patient' },
      { status: 500 }
    );
  }
}