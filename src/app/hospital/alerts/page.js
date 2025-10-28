// app/admin/alerts/page.js
"use client";
import React, { useEffect, useState } from "react";
import AlertCard from "@/components/AlertCard";
import ResolvedAlertCard from "@/components/ResolvedAlertCard";
import SideBar from "@/components/SideBar";
import { Bell } from "lucide-react";
import { fetchWithProgress } from "@/lib/fetchWithProgess";
import { PulseLoader } from "react-spinners";

const Alerts = () => {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    fetchAlerts();
  }, []);

  const fetchAlerts = async () => {
    setLoading(true);

    const token = localStorage.getItem("adminToken");
    if (!token) {
      setError("No authentication token found");
      setLoading(false);
      return;
    }

    try {
      const response = await fetchWithProgress("/api/alerts", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const data = await response.json();
      const alertsArray = data || [];
      setAlerts(alertsArray);
    } catch (error) {
      console.error("Error fetching alerts:", error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  // Register global methods for Pusher real-time updates
  useEffect(() => {
    window.updateAlertList = {
      addAlert: (newAlert) => {
        setAlerts((prevAlerts) => {
          const exists = prevAlerts.some((a) => a._id === newAlert._id);
          if (exists) return prevAlerts;
          return [newAlert, ...prevAlerts];
        });
      },

      updateAlert: (updatedAlert) => {
        setAlerts((prevAlerts) =>
          prevAlerts.map((alert) =>
            alert._id === updatedAlert._id ? updatedAlert : alert
          )
        );
      },

      removeAlert: (alertId) => {
        setAlerts((prevAlerts) =>
          prevAlerts.filter((alert) => alert._id !== alertId)
        );
      },
    };

    return () => {
      delete window.updateAlertList;
    };
  }, []);

  const formatDuration = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const seconds = Math.floor(diffMs / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days} day${days !== 1 ? "s" : ""} `;
    if (hours > 0) return `${hours} hour${hours !== 1 ? "s" : ""} `;
    if (minutes > 0) return `${minutes} minute${minutes !== 1 ? "s" : ""} `;
    return `${seconds} second${seconds !== 1 ? "s" : ""} `;
  };

  if (loading) {
    return (
      <div>
        <SideBar active={"alerts"} />
        <div className="container">
          <div>
            <PulseLoader />
            <p className="ml-4 text-gray-600">Loading alerts...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <SideBar active={"alerts"} />
        <div className="container">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            <p className="font-bold">Error loading alerts</p>
            <p>{error}</p>
            <button
              onClick={fetchAlerts}
              className="mt-2 bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  const filteredAlerts = alerts.filter((alert) => {
    if (filter === "all") return true;
    return alert.status === filter;
  });

  const pendingAlerts = filteredAlerts.filter((a) => a.status === "pending");
  const resolvedAlerts = filteredAlerts.filter((a) => a.status !== "pending");

  return (
    <div>
      <SideBar active={"alerts"} />
      <div className="container">
        <div className="introPara">
          <h2>Alerts Management</h2>
          <p className="txt-light">
            Monitor and manage patient emergency alerts
          </p>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 border-b border-gray-200 pb-2 mb-6">
          {["all", "pending", "acknowledged", "resolved"].map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-4 py-2 rounded-t-lg font-semibold transition-colors ${
                filter === status
                  ? "bg-red-500 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
              {status === "pending" && pendingAlerts.length > 0 && (
                <span className="ml-2 bg-white text-red-500 px-2 py-0.5 rounded-full text-xs">
                  {pendingAlerts.length}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Active Alerts */}
        <div>
          <h2>
            Active Alerts{" "}
            <span className="missed-doses-text">{pendingAlerts.length}</span>
          </h2>

          {alerts.length === 0 ? (
            <div className="text-center py-8 bg-gray-50 rounded">
              <Bell className="w-12 h-12 mx-auto mb-2 text-gray-300" />
              <p className="text-gray-500">No alerts found</p>
            </div>
          ) : pendingAlerts.length === 0 ? (
            <p className="text-gray-500 py-4">No pending alerts</p>
          ) : (
            pendingAlerts.map((alert) => (
              <AlertCard
                key={alert._id}
                alertype={alert.alert_type}
                alert_id={alert._id}
                patient_id={alert.patient_id}
                iconClassName="fa-circle-info"
                className="emergency-card"
                patient_name={alert.patient_name}
                message={alert.category}
                time={formatDuration(alert.created_at || alert.createdAt)}
                setRefresh={fetchAlerts}
              />
            ))
          )}
        </div>

        {/* Resolved Alerts */}
        {resolvedAlerts.length > 0 && (
          <div className="mt-6">
            <h2>
              Resolved Alerts{" "}
              <span className="resolved-alert-text">
                {resolvedAlerts.length}
              </span>
            </h2>
            {resolvedAlerts.map((alert) => (
              <ResolvedAlertCard
                key={alert._id}
                alertype={alert.alert_type}
                alert_id={alert._id}
                iconClassName="fa-thumbs-up"
                className="doses-missed-card"
                patient_name={alert.patient_name}
                message={alert.category}
                time={formatDuration(alert.created_at || alert.createdAt)}
                setRefresh={fetchAlerts}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Alerts;
