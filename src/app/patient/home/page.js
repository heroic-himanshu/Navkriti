// app/patient/dashboard/page.js
"use client";
import { useRouter } from 'next/navigation';
import { fetchWithProgress, postJSON } from "@/lib/fetchWithProgess";
import PatientSideBar from "@/components/PatientSideBar";
import SOSBtn from "@/components/SOSBtn";
import React, { useState, useRef, useEffect } from "react";
import { Mic, AlertCircle, CheckCircle, Loader, X, Send } from "lucide-react";

const DashBoardPatient = () => {
  const router = useRouter();
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [status, setStatus] = useState("idle");
  const [message, setMessage] = useState("");
  const [permissionDenied, setPermissionDenied] = useState(false);

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const timerIntervalRef = useRef(null);
  const streamRef = useRef(null);
  const recordingStartTimeRef = useRef(null);

  const MAX_DURATION = 30;

  const CLOUDINARY_CLOUD_NAME = "debeqjgby";
  const CLOUDINARY_UPLOAD_PRESET = "Navkriti";

  useEffect(() => {
    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
        mediaRecorderRef.current.stop();
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true, sampleRate: 44100 },
      });

      streamRef.current = stream;
      setPermissionDenied(false);

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: "audio/webm;codecs=opus",
      });

      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) audioChunksRef.current.push(event.data);
      };

      mediaRecorder.start();
      setIsRecording(true);
      setStatus("recording");
      setRecordingDuration(0);
      recordingStartTimeRef.current = Date.now();

      timerIntervalRef.current = setInterval(() => {
        setRecordingDuration((prev) => {
          const newDuration = prev + 1;
          if (newDuration >= MAX_DURATION) handleSendRecording();
          return newDuration;
        });
      }, 1000);
    } catch (error) {
      console.error("Error accessing microphone:", error);
      if (error.name === "NotAllowedError" || error.name === "PermissionDeniedError") {
        setPermissionDenied(true);
        setMessage("Microphone permission denied.");
      } else {
        setMessage("Could not access microphone.");
      }
      setStatus("error");
    }
  };

  const stopRecording = () => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setIsRecording(false);
  };

  const uploadToCloudinary = async (audioBlob) => {
    const formData = new FormData();
    formData.append("file", audioBlob);
    formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);
    formData.append("resource_type", "video");

    const response = await fetchWithProgress(
      `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/video/upload`,
      { method: "POST", body: formData }
    );

    if (!response.ok) throw new Error("Failed to upload to Cloudinary");
    const data = await response.json();
    return data.secure_url;
  };

  const transcribeAudio = async (audioUrl) => {
    try {
      const data = await postJSON("http://localhost:8000/transcribe", { url: audioUrl });
      return data.text || data.transcription || data.result;
    } catch (error) {
      console.error("Transcription error:", error);
      return null;
    }
  };

  const aiAlertRate = async (transcription) => {
    try {
      // Fetch patient data
      const res = await fetchWithProgress("/api/patients/me", {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("patientToken")}`,
        },
      });
      
      const patientResponse = await res.json();
      const patientData = patientResponse.data;

      // Send to AI for rating
      const data = await postJSON("http://localhost:5000/api/ai", {
        ...patientData,
        transcription,
      });

      return data.rating_alert;
    } catch (error) {
      console.error("AI rating error:", error);
      return "medium"; // Default to medium if AI fails
    }
  };

  const handleSendRecording = async () => {
    if (!isRecording || isProcessing) return;

    const finalDuration = recordingStartTimeRef.current
      ? Math.floor((Date.now() - recordingStartTimeRef.current) / 1000)
      : recordingDuration;

    if (finalDuration < 1) {
      stopRecording();
      setStatus("error");
      setMessage("Recording too short.");
      setTimeout(() => {
        setStatus("idle");
        setMessage("");
        setRecordingDuration(0);
      }, 3000);
      return;
    }

    stopRecording();
    setIsProcessing(true);
    setStatus("processing");
    setMessage("Processing audio...");

    await new Promise((resolve) => setTimeout(resolve, 100));
    const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });

    try {
      setMessage("Uploading...");
      const audioUrl = await uploadToCloudinary(audioBlob);

      setMessage("Transcribing audio...");
      const transcription = await transcribeAudio(audioUrl);

      setMessage("AI analyzing emergency...");
      const alertType = await aiAlertRate(transcription);

      setMessage("Sending SOS alert...");
      const alertId = await sendSOSAlert(audioUrl, finalDuration, transcription, alertType);

      setStatus("success");
      setMessage("SOS alert sent! Redirecting to first aid...");

      // Store data for first aid page
      sessionStorage.setItem('sosAlertData', JSON.stringify({
        alertId,
        transcription,
        alertType,
        audioUrl,
        timestamp: new Date().toISOString()
      }));

      // Redirect to SOS first aid page after 2 seconds
      setTimeout(() => {
        router.push('/patient/sos');
      }, 2000);

    } catch (error) {
      console.error("Error in processing:", error);
      setStatus("error");
      setMessage("Failed to process audio.");

      setTimeout(() => {
        setStatus("idle");
        setMessage("");
        setRecordingDuration(0);
        audioChunksRef.current = [];
        recordingStartTimeRef.current = null;
      }, 5000);
      setIsProcessing(false);
    }
  };

  const handleDiscardRecording = () => {
    stopRecording();
    audioChunksRef.current = [];
    setStatus("idle");
    setMessage("");
    setRecordingDuration(0);
    recordingStartTimeRef.current = null;
  };

  const sendSOSAlert = async (audioUrl, duration, transcription, alertType) => {
    try {
      const patientToken = localStorage.getItem("patientToken");
      if (!patientToken) throw new Error("Not authenticated");

      let location = null;
      if (navigator.geolocation) {
        try {
          const position = await new Promise((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000 });
          });
          location = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          };
        } catch (error) {
          console.log("Location not available:", error);
        }
      }

      const payload = {
        audio_url: audioUrl,
        duration: duration,
        transcription: transcription,
        alert_type: alertType,
      };

      if (location) payload.location = location;

      const res = await postJSON("/api/alerts/sos/create-alert", payload, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${patientToken}`,
        },
      });
      let data = await res.json();
      if (data.success) {
        return data.alert._id;
      } else {
        throw new Error(data.error || "Failed to send alert");
      }
    } catch (error) {
      console.error("Error sending SOS:", error);
      throw error;
    }
  };

  const handleButtonPress = () => {
    if (status === "idle" && !isRecording && !isProcessing) {
      startRecording();
    }
  };

  const formatDuration = (seconds) => {
    return `0:${seconds.toString().padStart(2, "0")}`;
  };

  return (
    <>
      <PatientSideBar active={"home"} />
      <div className="container" style={{ marginBottom: "150px" }}>
        <h1>Welcome back, Devesh!</h1>
        <p className="txt-light">How are you feeling today?</p>

        <div className="sos-btn-container">
          <SOSBtn
            className={`sos-button ${status}`}
            handleMouseDown={handleButtonPress}
            handleMouseUp={() => {}}
            handleTouchStart={(e) => {
              e.preventDefault();
              handleButtonPress();
            }}
            handleTouchEnd={(e) => e.preventDefault()}
            disabled={isProcessing || status === "success"}
            message={
              <>
                {status === "idle" && (
                  <>
                    <i className="fa-solid fa-circle-exclamation"></i>
                    <div className="sos-text">SOS</div>
                  </>
                )}
                {status === "recording" && (
                  <>
                    <div className="recording-pulse"></div>
                    <Mic className="w-6 h-6 text-white" />
                    <div className="sos-timer">{formatDuration(recordingDuration)}</div>
                  </>
                )}
                {status === "processing" && (
                  <>
                    <Loader className="w-6 h-6 text-white animate-spin" />
                    <div className="sos-text-small">Sending...</div>
                  </>
                )}
                {status === "success" && (
                  <>
                    <CheckCircle className="w-6 h-6 text-white" />
                    <div className="sos-text-small">Sent!</div>
                  </>
                )}
                {status === "error" && (
                  <>
                    <AlertCircle className="w-6 h-6 text-white" />
                    <div className="sos-text-small">Error</div>
                  </>
                )}
              </>
            }
          />
          {status === "recording" && <div className="recording-ring"></div>}
        </div>

        {status === "recording" && (
          <div className="flex gap-4 justify-center mt-6">
            <button
              onClick={handleSendRecording}
              disabled={isProcessing || recordingDuration < 1}
              className="px-8 py-4 bg-green-600 text-white rounded-xl hover:bg-green-700 font-bold text-lg flex items-center gap-3 transition disabled:opacity-50 disabled:cursor-not-allowed shadow-lg sendSOSbtn"
            >
              <Send className="w-6 h-6" />
              Send SOS
            </button>
            <button
              onClick={handleDiscardRecording}
              disabled={isProcessing}
              className="px-8 py-4 bg-gray-600 text-white rounded-xl hover:bg-gray-700 font-bold text-lg flex items-center gap-3 transition disabled:opacity-50 disabled:cursor-not-allowed shadow-lg cancelSOSbtn"
            >
              <X className="w-6 h-6" />
              Cancel
            </button>
          </div>
        )}

        <div className="text-center max-w-md mt-6 instructions">
          {status === "idle" && !permissionDenied && (
            <div className="space-y-2">
              <p className="text-gray-600 text-sm font-semibold">
                Tap the SOS button to start recording emergency message
              </p>
              <p className="text-gray-500 text-xs">
                Maximum recording duration: {MAX_DURATION} seconds
              </p>
            </div>
          )}

          {status === "recording" && (
            <div className="space-y-2 mt-4">
              <p className="text-red-600 font-semibold animate-pulse text-lg">
                🔴 Recording in progress...
              </p>
              <p className="text-gray-600 text-sm">
                Speak your emergency message • Max {MAX_DURATION}s
              </p>
            </div>
          )}

          {message && (
            <div
              className={`mt-4 p-3 rounded-lg ${
                status === "success"
                  ? "bg-green-100 text-green-800"
                  : status === "error"
                  ? "bg-red-100 text-red-800"
                  : "bg-blue-100 text-blue-800"
              }`}
            >
              {message}
            </div>
          )}

          {permissionDenied && (
            <div className="mt-4 p-4 bg-yellow-100 border border-yellow-400 rounded-lg">
              <p className="text-yellow-800 text-sm mb-2">
                <strong>Microphone Access Required</strong>
              </p>
              <button
                onClick={() => window.location.reload()}
                className="mt-2 px-4 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700 text-sm"
              >
                Retry
              </button>
            </div>
          )}
        </div>

        {(status === "error" || permissionDenied) && (
          <div className="mt-4 p-4 bg-gray-100 rounded-lg">
            <p className="text-sm text-gray-700 mb-2">
              <strong>Need immediate help?</strong>
            </p>
            <a
              href="tel:102"
              className="block w-full px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 text-center"
            >
              📞 Call Emergency Services
            </a>
          </div>
        )}
      </div>
    </>
  );
};

export default DashBoardPatient;
