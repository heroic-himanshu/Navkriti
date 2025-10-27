"use client";
import { createContext, useContext, useState, useEffect } from "react";

const PatientContext = createContext();

export const PatientProvider = ({ children }) => {
  const [patients, setPatients] = useState([]);
  const [missedDosesMap, setMissedDosesMap] = useState({});
  const [alerts, setAlerts] = useState([]);
  const [refreshAlerts, setRefreshAlerts] = useState(false);
  const [loading, setLoading] = useState(true);

  const token =
    typeof window !== "undefined" ? localStorage.getItem("adminToken") : null;

  useEffect(() => {
    if (!token) return;

    const fetchData = async () => {
      setLoading(true);
      try {
        const headers = {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        };

        const [patientsRes, missedRes, alertsRes] = await Promise.all([
          fetch("/api/admin/patients", { headers }),
          fetch("/api/admin/patients/missed-doses", { headers }),
          fetch("/api/alerts", { headers }),
        ]);

        const [patientsData, missedData, alertsData] = await Promise.all([
          patientsRes.json(),
          missedRes.json(),
          alertsRes.json(),
        ]);

        setPatients(patientsData?.data || []);
        setMissedDosesMap(missedData?.data || {});
        setAlerts(alertsData || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [token, refreshAlerts]);

  return (
    <PatientContext.Provider
      value={{
        patients,
        missedDosesMap,
        alerts,
        setAlerts,
        refreshAlerts,
        setRefreshAlerts,
        loading,
      }}
    >
      {children}
    </PatientContext.Provider>
  );
};

export const usePatients = () => useContext(PatientContext);
