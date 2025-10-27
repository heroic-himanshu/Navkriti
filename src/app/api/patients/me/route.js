
import { NextResponse } from "next/server";
import { authenticate } from "@/middleware/auth";


export async function GET(req) {
  try {
    const auth = await authenticate(req);

    if (auth.error) {
      return NextResponse.json(
        { success: false, error: auth.error },
        { status: auth.status }
      );
    }
    return NextResponse.json({success:true, data:auth.patient}, { status: 201 });
  } catch (error) {
    console.error("Get patients error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch alerts" },
      { status: 500 }
    );
  }
}
