// app/api/admin/patients/[id]/missed-doses/route.js
// Get missed doses count for a specific patient
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

    const { id } = params;
    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get('days')) || 30; // Default last 30 days

    const patient = await Patient.findById(id);

    if (!patient) {
      return NextResponse.json(
        { success: false, error: 'Patient not found' },
        { status: 404 }
      );
    }

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Count missed doses in the specified period
    const missedDoses = patient.medicine_intakes.filter(
      intake => 
        intake.status === 'missed' && 
        new Date(intake.scheduled_time) >= startDate
    );

    // Get details about missed medicines
    const missedMedicinesMap = {};
    missedDoses.forEach(dose => {
      const medicineName = dose.medicine_name;
      if (!missedMedicinesMap[medicineName]) {
        missedMedicinesMap[medicineName] = 0;
      }
      missedMedicinesMap[medicineName]++;
    });

    return NextResponse.json({
      success: true,
      data: {
        patient_id: patient._id,
        patient_name: patient.name,
        total_missed: missedDoses.length,
        days_checked: days,
        missed_by_medicine: missedMedicinesMap,
        recent_missed: missedDoses
          .sort((a, b) => new Date(b.scheduled_time) - new Date(a.scheduled_time))
          .slice(0, 5)
          .map(dose => ({
            medicine_name: dose.medicine_name,
            scheduled_time: dose.scheduled_time,
            date: new Date(dose.scheduled_time).toLocaleDateString(),
          })),
      },
    });
  } catch (error) {
    console.error('Get patient missed doses error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch missed doses' },
      { status: 500 }
    );
  }
}