// app/api/admin/patients/route.js
import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongoose';
import Patient from '@/models/patient';
import { checkPermission } from '@/middleware/adminAuth';

// GET - View all patients (requires view_patients permission)
export async function GET(request) {
  try {
    const auth = await checkPermission(request, 'view_patients');
    
    if (auth.error) {
      return NextResponse.json(
        { success: false, error: auth.error },
        { status: auth.status }
      );
    }
    
    await dbConnect();
    
    // Get query parameters for filtering
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page')) || 1;
    const limit = parseInt(searchParams.get('limit')) || 10;
    const search = searchParams.get('search') || '';
    
    // Build query
    let query = {};
    if (search) {
      query = {
        $or: [
          { name: { $regex: search, $options: 'i' } },
          { ph_number: { $regex: search, $options: 'i' } },
        ],
      };
    }
    
    // Get total count
    const total = await Patient.countDocuments(query);
    
    // Get patients with pagination
    const patients = await Patient.find(query)
      .select('-password')
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip((page - 1) * limit);
    
    return NextResponse.json(
      {
        success: true,
        data: patients,
        pagination: {
          total,
          page,
          pages: Math.ceil(total / limit),
          limit,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Get patients error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch patients' },
      { status: 500 }
    );
  }
}

// POST - Create new patient (requires create_patients permission)
export async function POST(request) {
  try {
    const auth = await checkPermission(request, 'create_patients');
    
    if (auth.error) {
      return NextResponse.json(
        { success: false, error: auth.error },
        { status: auth.status }
      );
    }
    
    await dbConnect();
    
    const { name, ph_number, sex, age, med_history, password, address } = await request.json();
    
    // Validate input
    if (!name || !ph_number || !sex || !age || !password) {
      return NextResponse.json(
        { success: false, error: 'Please provide all required fields' },
        { status: 400 }
      );
    }
    
    // Check if patient already exists
    const existingPatient = await Patient.findOne({ ph_number });
    
    if (existingPatient) {
      return NextResponse.json(
        { success: false, error: 'Patient already exists with this phone number' },
        { status: 400 }
      );
    }
    
    // Create patient
    const patient = await Patient.create({
      name,
      ph_number,
      sex,
      age,
      med_history: med_history || [],
      password,
      address
    });
    
    // Return patient without password
    const patientData = await Patient.findById(patient._id).select('-password');
    
    return NextResponse.json(
      {
        success: true,
        data: patientData,
        message: 'Patient created successfully',
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Create patient error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to create patient' },
      { status: 500 }
    );
  }
}