import { runMedicationAlertJob } from "@/utils/medicationAlertJob";

export async function GET() {
  await runMedicationAlertJob();
  return new Response("Medication alert job completed");
}
