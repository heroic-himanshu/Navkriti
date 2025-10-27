// utils/patientAuth.js

import { fetchWithProgress } from "@/lib/fetchWithProgess";

// Get patient token from localStorage
export const getPatientToken = () => {
  if (typeof window !== "undefined") {
    return localStorage.getItem("patientToken");
  }
  return null;
};

// Get patient data from localStorage
export const getPatientData = () => {
  if (typeof window !== "undefined") {
    const data = localStorage.getItem("patientData");
    return data ? JSON.parse(data) : null;
  }
  return null;
};

// Check if patient is authenticated
export const isPatientAuthenticated = () => {
  return !!getPatientToken();
};

// Logout patient
export const logoutPatient = () => {
  if (typeof window !== "undefined") {
    localStorage.removeItem("patientToken");
    localStorage.removeItem("patientData");
    window.location.href = "/patient/login";
  }
};

// Fetch with patient authentication
export const fetchWithPatientAuth = async (url, options = {}) => {
  const token = getPatientToken();
  
  const headers = {
    "Content-Type": "application/json",
    ...options.headers,
  };
  
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  
  const response = await fetchWithProgress(url, {
    ...options,
    headers,
  });
  
  // If unauthorized, logout
  if (response.status === 401) {
    logoutPatient();
  }
  
  return response;
};

// Get current patient info from API
export const getCurrentPatient = async () => {
  try {
    const response = await fetchWithPatientAuth("/api/auth/me");
    const data = await response.json();
    
    if (data.success) {
      // Update localStorage with latest data
      localStorage.setItem("patientData", JSON.stringify(data.user));
      return data.user;
    }
    
    return null;
  } catch (error) {
    console.error("Error fetching patient:", error);
    return null;
  }
};