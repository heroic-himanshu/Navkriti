// app/api/admin/patients/[id]/medical-history/route.js
import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongoose';
import Patient from '@/models/patient';
import { checkPermission } from '@/middleware/adminAuth';
import { ObjectId } from 'mongodb';

// POST - Add medical history entry (requires edit_patients permission)
export async function POST(request, { params }) {
  try {
    const auth = await checkPermission(request, 'edit_patients');
    
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
    
    const { dept, doctor_name, followup, alert_type, problem, prescription } = await request.json();
    
    if (!dept) {
      return NextResponse.json(
        { success: false, error: 'Department is required' },
        { status: 400 }
      );
    }
    
    const medicalEntry = {
      dept,
      doctor_name,
      followup,
      alert_type: alert_type || 'Low',
      problem,
      prescription,
    };
    
    const updatedPatient = await Patient.findByIdAndUpdate(
      id,
      { $push: { med_history: medicalEntry } },
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
        message: 'Medical history added successfully',
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Add medical history error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to add medical history' },
      { status: 500 }
    );
  }
}

// DELETE - Remove medical history entry (requires edit_patients permission)
export async function DELETE(request, { params }) {
  try {
    const auth = await checkPermission(request, 'edit_patients');
    
    if (auth.error) {
      return NextResponse.json(
        { success: false, error: auth.error },
        { status: auth.status }
      );
    }
    
    await dbConnect();
    
    const { id } = params;
    const { searchParams } = new URL(request.url);
    const historyId = searchParams.get('historyId');
    
    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, error: 'Invalid patient ID' },
        { status: 400 }
      );
    }
    
    if (!historyId) {
      return NextResponse.json(
        { success: false, error: 'Medical history ID is required' },
        { status: 400 }
      );
    }
    
    const updatedPatient = await Patient.findByIdAndUpdate(
      id,
      { $pull: { med_history: { _id: historyId } } },
      { new: true }
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
        message: 'Medical history removed successfully',
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Remove medical history error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to remove medical history' },
      { status: 500 }
    );
  }
}