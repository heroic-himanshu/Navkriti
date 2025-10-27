// models/Alert.js
import mongoose from "mongoose"; 

const alertSchema = new mongoose.Schema({
  // Alert Identification
  alert_id: { type: String, unique: true }, // e.g., "ALERT-20251022-001"
  alert_type: { 
    type: String, 
    enum: ['ignore', 'low', 'medium', 'high'],
    required: true 
  },
  
  // Alert Category
  category: {
    type: String,
    enum: ['sos', 'medication', 'ai_prediction', 'manual'],
    required: true
  },
  
  // Patient Reference
  patient_id: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Patient',
    required: true,
    index: true // Important for fast queries
  },
  patient_name: String, // Denormalized for quick display
  patient_phone: Number,
  patient_age: Number,
  
  // SOS-specific fields
  sos_audio_url: String, // S3/CloudStorage URL
  sos_transcription: String, // AI-converted text
  sos_duration: Number, // seconds
  sos_location: {
    latitude: Number,
    longitude: Number
  },
  
  // Medication Alert-specific fields
  medication_name: String,
  consecutive_missed: Number,
  total_missed: Number,
  last_taken_date: Date,
  
  // AI Analysis
  ai_confidence: Number,
  ai_risk_factors: [String],
  ai_recommendations: [String],
  
  // Alert Status & Workflow
  status: {
    type: String,
    enum: ['pending', 'acknowledged', 'in_progress', 'resolved', 'dismissed'],
    default: 'pending'
  },
  priority: {
    type: Number,
    min: 1,
    max: 5,
    default: 3
  },
  
  // Admin Actions
  assigned_to: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin'
  },
  acknowledged_at: Date,
  acknowledged_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin'
  },
  resolved_at: Date,
  resolved_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin'
  },
  resolution_notes: String,
  
  // Additional Context
  description: String,
  metadata: mongoose.Schema.Types.Mixed, // Flexible field for extra data
  
}, {
  timestamps: true // createdAt, updatedAt
});

// Indexes for performance
alertSchema.index({ status: 1, alert_type: 1 });
alertSchema.index({ patient_id: 1, createdAt: -1 });
alertSchema.index({ createdAt: -1 });
alertSchema.index({ category: 1, status: 1 });
const Alert = mongoose.models.Alert || mongoose.model('Alert', alertSchema);

export default Alert;