import dbConnect from "@/lib/mongoose";
import Alert from "@/models/alert";
import { v4 as uuidv4 } from "uuid";
import { NextResponse } from "next/server";
import { authenticate } from "@/middleware/auth";
import { triggerNewAlert } from '@/lib/pusher';
import { pusherServer } from '@/lib/pusher';
function genId() {
  const d = new Date().toISOString().split("T")[0].replace(/-/g, "");
  return `ALERT-${d}-${uuidv4().slice(0, 4).toUpperCase()}`;
}

export async function POST(req) {
  const currentTime = new Date();
  try {
    const auth = await authenticate(req);

    if (auth.error) {
      return NextResponse.json(
        { success: false, error: auth.error },
        { status: auth.status }
      );
    }
    await dbConnect();
    const body = await req.json();
    const alert = await Alert.create({
      alert_id: genId(),
      category: "sos",
      patient_id: auth.patient._id,
      patient_name: auth.patient.name,
      patient_phone: auth.patient.phone,
      patient_age: auth.patient.age,
      alert_type: body.alert_type || "high",
      priority: body.priority || 5,
      created_at: currentTime,
      ...body,
    });
    const alertData = {
      _id: alert._id.toString(),
      alert_id: alert.alert_id,
      alert_type: alert.alert_type,
      category: alert.category,
      patient_name: alert.patient_name,
      patient_phone: alert.patient_phone,
      patient_age: alert.patient_age,
      sos_audio_url: alert.sos_audio_url,
      sos_transcription: alert.sos_transcription,
      sos_duration: alert.sos_duration,
      sos_location: alert.sos_location,
      status: alert.status,
      priority: alert.priority,
      created_at: new Date().toISOString(),
    };
    await triggerNewAlert(alertData);
    return NextResponse.json({ success: true, alert }, { status: 201 });
  } catch (error) {
    console.error("Get patients error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch alerts" },
      { status: 500 }
    );
  }
}
