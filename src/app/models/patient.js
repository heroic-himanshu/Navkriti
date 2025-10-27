
import mongoose from "mongoose";
import bcrypt from "bcryptjs";

// Prescription Schema
const prescriptionSchema = new mongoose.Schema({
  name: { type: String, required: true },
  color: { type: String },
  dosage: { type: String }, // e.g., "1 tablet", "2 ml"
  frequency: { type: String }, // e.g., "3 times a day", "twice daily"
  acceptedtime: { type: String }, // Time ranges: "5-9, 11-15, 17-22"
  duration_days: { type: Number }, // How many days to take
  start_date: { type: Date, default: Date.now },
  end_date: { type: Date },
  instructions: { type: String }, // e.g., "Take after meals"
  is_active: { type: Boolean, default: true },
});

// Medicine Intake Log Schema
const medicineIntakeSchema = new mongoose.Schema(
  {
    prescription_id: { type: mongoose.Schema.Types.ObjectId, required: true },
    medicine_name: { type: String, required: true },
    scheduled_time: { type: Date, required: true }, // When it should be taken
    taken_time: { type: Date }, // When it was actually taken
    status: {
      type: String,
      enum: ["pending", "taken", "missed", "skipped"],
      default: "pending",
    },
    notes: { type: String }, // Patient notes about side effects, etc.
  },
  {
    timestamps: true,
  }
);

// Medical History Schema
const medicalHistorySchema = new mongoose.Schema(
  {
    dept: { type: String, required: true },
    doctor_name: { type: String },
    followup: { type: Date },
    alert_type: { type: String, default: "low" },
    problem: { type: String },
    prescription: [prescriptionSchema],
    visit_date: { type: Date, default: Date.now },
  },
  {
    timestamps: true,
  }
);

// Main Patient Schema
const patientSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Please provide a name"],
      maxlength: [60, "Name cannot be more than 60 characters"],
    },
    sex: {
      type: String,
      required: [true, "Please provide sex"],
      enum: ["M", "F", "N"],
      maxlength: [1, "Must be M, F, or N"],
    },
    age: {
      type: Number,
      required: [true, "Please provide age"],
      min: [0, "Age must be positive"],
    },
    ph_number: {
      type: Number,
      required: [true, "Please provide phone number"],
      unique: true,
      min: [1000000000, "Phone number must be 10 digits"],
      max: [9999999999, "Phone number must be 10 digits"],
    },
    address: {
      type: String,
      maxlength: [200, "Address cannot be more than 200 characters"],
    },
    password: {
      type: String,
      required: [true, "Please provide a password"],
      minlength: [6, "Password must be at least 6 characters"],
      select: false,
    },
    med_history: [medicalHistorySchema],
    medicine_intakes: [medicineIntakeSchema],
    reminder_settings: {
      enabled: { type: Boolean, default: true },
      notification_method: {
        type: String,
        enum: ["app", "sms", "both"],
        default: "app",
      },
      reminder_before_minutes: { type: Number, default: 15 }, // Remind 15 mins before
    },
    previous_hospitalizations: {
      type: Number,
      default: 0,
    },
    side_effects_history: [
      {
        medication_name: String,
        side_effect: String,
        severity: String,
        reported_date: Date,
      },
    ],
    alert_status: {
      level: {
        type: String,
        enum: ["ignore", "low", "medium", "high"],
        default: "low",
      },
      confidence: Number,
      last_predicted: Date,
      risk_score: Number,
      risk_factors: [String],
    },
    current_alerts: {
      has_active_sos: { type: Boolean, default: false },
      has_active_medication_alert: { type: Boolean, default: false },
      latest_alert_id: { type: mongoose.Schema.Types.ObjectId, ref: "Alert" },
      latest_alert_type: String,
      alert_count_last_7_days: { type: Number, default: 0 },
    },
  },
  {
    timestamps: true,
  }
);

// Hash password before saving
patientSchema.pre("save", async function (next) {
  if (!this.isModified("password")) {
    return next();
  }

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Method to compare password
patientSchema.methods.comparePassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Method to get active prescriptions
patientSchema.methods.getActivePrescriptions = function () {
  const activePrescriptions = [];

  this.med_history.forEach((history) => {
    if (history.prescription && history.prescription.length > 0) {
      history.prescription.forEach((med) => {
        if (med.is_active) {
          // Check if medicine is still within duration
          const endDate =
            med.end_date ||
            new Date(
              med.start_date.getTime() + med.duration_days * 24 * 60 * 60 * 1000
            );
          if (new Date() <= endDate) {
            activePrescriptions.push({
              ...med.toObject(),
              history_id: history._id,
              dept: history.dept,
              doctor_name: history.doctor_name,
            });
          }
        }
      });
    }
  });

  return activePrescriptions;
};

export default mongoose.models.Patient ||
  mongoose.model("Patient", patientSchema);
