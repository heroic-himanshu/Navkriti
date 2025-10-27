import dbConnect from "@/lib/mongoose";
import Alert from "@/models/alert";
import { checkPermission } from '@/middleware/adminAuth';
import { NextResponse } from "next/server";
// GET all alerts (with filters)
export async function GET(req) {
  try {
    const auth = await checkPermission(req, "view_patients");

    if (auth.error) {
      return NextResponse.json(
        { success: false, error: auth.error },
        { status: auth.status }
      );
    }
    await dbConnect();
    const { searchParams } = new URL(req.url);
    const filter = {};
    if (searchParams.get("status")) filter.status = searchParams.get("status");
    if (searchParams.get("category"))
      filter.category = searchParams.get("category");
    if (searchParams.get("patient_id"))
      filter.patient_id = searchParams.get("patient_id");

    const alerts = await Alert.find(filter).sort({ createdAt: -1 });
    return NextResponse.json(alerts);
  } catch (error) {
    console.error("Get patients error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch alerts" },
      { status: 500 }
    );
  }
}
