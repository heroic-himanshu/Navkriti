import dbConnect from '@/lib/mongoose';
import Patient from "@/models/patient";
import Alert from "@/models/alert";
import { v4 as uuidv4 } from "uuid";

function genId() {
  const d = new Date().toISOString().split("T")[0].replace(/-/g, "");
  return `ALERT-${d}-${uuidv4().slice(0, 4).toUpperCase()}`;
}

/**
 * Prepare features for AI model prediction
 */
function prepareFeatures(patient, consecutiveMissed) {
  const intakes = patient.medicine_intakes || [];
  const totalDoses = intakes.length;
  const missedDoses = intakes.filter(i => i.status === "missed").length;
  const takenDoses = intakes.filter(i => i.status === "taken").length;
  
  // Calculate days since last taken
  const takenIntakes = intakes
    .filter(i => i.status === "taken")
    .sort((a, b) => new Date(b.scheduled_time) - new Date(a.scheduled_time));
  const daysSinceLastTaken = takenIntakes.length > 0
    ? Math.floor((Date.now() - new Date(takenIntakes[0].scheduled_time)) / (1000 * 60 * 60 * 24))
    : 999;
  
  // Calculate adherence rate
  const adherenceRate = totalDoses > 0 ? (takenDoses / totalDoses) * 100 : 0;
  
  // Map alert level to type for the model
  const alertLevel = patient.alert_status?.level || "low";
  const alertTypeMap = { high: 2, medium: 1, low: 0 };
  
  return {
    age: patient.age || 0,
    total_doses_prescribed: totalDoses,
    doses_missed: missedDoses,
    doses_taken: takenDoses,
    consecutive_missed: consecutiveMissed,
    days_since_last_taken: daysSinceLastTaken,
    adherence_rate: adherenceRate,
    previous_hospitalizations: patient.previous_hospitalizations || 0,
    comorbidity_count: patient.comorbidities?.length || 0,
    sex: patient.sex === "Male" ? 1 : 0, // Binary encoding
    medication_criticality: patient.medication_criticality || 1, // 1-5 scale
    has_comorbidities: (patient.comorbidities?.length || 0) > 0 ? 1 : 0,
    follow_up_missed: patient.follow_up_missed || 0,
    side_effects_reported: patient.side_effects_reported || 0,
    medication_name: patient.medicine_name || "",
    dept: patient.department || "",
    medication_color: patient.medication_color || "",
    alert_type: alertTypeMap[alertLevel] || 0
  };
}

/**
 * Call AI model API for prediction
 */
async function predictWithAI(features) {
  try {
    // Replace with your actual AI model endpoint
    const response = await fetch(process.env.AI_MODEL_ENDPOINT || 'http://localhost:5000/predict', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Add authentication if needed
        // 'Authorization': `Bearer ${process.env.AI_MODEL_API_KEY}`
      },
      body: JSON.stringify({ features })
    });

    if (!response.ok) {
      throw new Error(`AI model returned ${response.status}`);
    }

    const result = await response.json();
    // Expected response format: { should_alert: boolean, risk_score: number, severity: "high"|"medium"|"low" }
    return result;
  } catch (error) {
    console.error('AI prediction error:', error);
    // Fallback to rule-based approach
    return fallbackRuleBased(features);
  }
}

/**
 * Fallback rule-based logic if AI model is unavailable
 */
function fallbackRuleBased(features) {
  const { consecutive_missed, adherence_rate, alert_type } = features;
  
  if (alert_type === 2) { // high
    if (consecutive_missed >= 2) return { should_alert: true, severity: "high", risk_score: 0.9 };
  } else if (alert_type === 1) { // medium
    if (consecutive_missed >= 5) return { should_alert: true, severity: "high", risk_score: 0.85 };
    if (consecutive_missed >= 2) return { should_alert: true, severity: "medium", risk_score: 0.6 };
  } else { // low
    if (consecutive_missed >= 5) return { should_alert: true, severity: "low", risk_score: 0.5 };
  }
  
  return { should_alert: false, severity: "low", risk_score: 0.1 };
}

export async function runMedicationAlertJob(io = null) {
  await dbConnect();
  const patients = await Patient.find({}).lean();

  const since = new Date(Date.now() - 24 * 60 * 60 * 1000);

  for (const p of patients) {
    const intakes = p.medicine_intakes || [];
    const recent = [...intakes]
      .sort((a, b) => new Date(b.scheduled_time) - new Date(a.scheduled_time))
      .slice(0, 15);

    // Count consecutive misses
    let consecutiveMissed = 0;
    for (const intake of recent) {
      if (intake.status === "missed") consecutiveMissed++;
      else break;
    }

    // Prepare features for AI model
    const features = prepareFeatures(p, consecutiveMissed);
    
    // Get AI prediction
    const prediction = await predictWithAI(features);
    
    if (!prediction.should_alert) continue;

    // Avoid duplicate alerts in 24h
    const exists = await Alert.findOne({
      patient_id: p._id,
      category: "medication",
      createdAt: { $gte: since },
    });
    if (exists) continue;

    // Create alert with AI prediction data
    const alert = await Alert.create({
      alert_id: genId(),
      category: "medication",
      alert_type: prediction.severity,
      patient_id: p._id,
      patient_name: p.name,
      patient_phone: p.ph_number,
      medication_name: p.medicine_name,
      consecutive_missed: consecutiveMissed,
      total_missed: p.total_missed || 0,
      ai_risk_score: prediction.risk_score,
      ai_predicted: true,
      adherence_rate: features.adherence_rate,
      days_since_last_taken: features.days_since_last_taken
    });

    // Real-time emit
    if (io) io.emit("new-alert", alert);
  }
}

// Optional: Batch prediction for better performance
export async function runMedicationAlertJobBatch(io = null) {
  await dbConnect();
  const patients = await Patient.find({}).lean();

  const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
  
  // Prepare all features first
  const patientFeatures = [];
  for (const p of patients) {
    const intakes = p.medicine_intakes || [];
    const recent = [...intakes]
      .sort((a, b) => new Date(b.scheduled_time) - new Date(a.scheduled_time))
      .slice(0, 15);

    let consecutiveMissed = 0;
    for (const intake of recent) {
      if (intake.status === "missed") consecutiveMissed++;
      else break;
    }

    patientFeatures.push({
      patient: p,
      features: prepareFeatures(p, consecutiveMissed),
      consecutiveMissed
    });
  }

  // Batch predict (if your AI model supports it)
  try {
    const response = await fetch(process.env.AI_MODEL_ENDPOINT || 'http://localhost:5000/predict_batch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        batch: patientFeatures.map(pf => pf.features) 
      })
    });

    const predictions = await response.json();

    // Process predictions
    for (let i = 0; i < patientFeatures.length; i++) {
      const { patient, features, consecutiveMissed } = patientFeatures[i];
      const prediction = predictions[i];

      if (!prediction.should_alert) continue;

      const exists = await Alert.findOne({
        patient_id: patient._id,
        category: "medication",
        createdAt: { $gte: since },
      });
      if (exists) continue;

      const alert = await Alert.create({
        alert_id: genId(),
        category: "medication",
        alert_type: prediction.severity,
        patient_id: patient._id,
        patient_name: patient.name,
        patient_phone: patient.ph_number,
        medication_name: patient.medicine_name,
        consecutive_missed: consecutiveMissed,
        total_missed: patient.total_missed || 0,
        ai_risk_score: prediction.risk_score,
        ai_predicted: true,
        adherence_rate: features.adherence_rate,
        days_since_last_taken: features.days_since_last_taken
      });

      if (io) io.emit("new-alert", alert);
    }
  } catch (error) {
    console.error('Batch prediction failed, falling back to individual predictions', error);
    // Fallback to regular job
    return runMedicationAlertJob(io);
  }
}