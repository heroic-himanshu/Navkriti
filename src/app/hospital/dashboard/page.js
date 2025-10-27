"use client";
import React, { useRef, useMemo, useEffect, useState } from "react";
import Chart from "chart.js/auto";
import DashBoardCard from "@/components/DashBoardCard";
import SideBar from "@/components/SideBar";
import { usePatients } from "@/store/patientStore";
import Link from "next/link";

const DashBoardHospital = () => {
  const [patientChangePercent, setPatientChangePercent] = useState(0);
  // const [refresh, setRefresh] = useState(false);
  const {
    patients,
    missedDosesMap,
    loading,
    alerts,
    setAlerts,
    refreshAlerts,
    setRefreshAlerts,
  } = usePatients();

  const chartRef = useRef(null);
  const chartInstanceRef = useRef(null);

  // Fetch alerts
  // useEffect(() => {
  //   const fetchAlerts = async () => {
  //     try {
  //       const res = await fetch("/api/alerts", {
  //         method: "GET",
  //         headers: {
  //           "Content-Type": "application/json",
  //           authorization: `Bearer ${localStorage.getItem("adminToken")}`,
  //         },
  //       });
  //       const data = await res.json();
  //       setAlerts(data);
  //     } catch (err) {
  //       console.error("Error fetching alerts:", err);
  //     }
  //   };
  //   fetchAlerts();
  // }, [refresh]);

  const today = new Date();
  const next7Days = new Date();
  next7Days.setDate(today.getDate() + 7);

  const { totalPatients, totalMissedDoses, alertType, totalUpcomingCheckups } =
    useMemo(() => {
      let totalMissed = 0;
      let alert = "low";
      let upcomingCheckups = 0;

      patients.forEach((p) => {
        const recentIntakes = (p.medicine_intakes || [])
          .filter((i) => i?.scheduled_time)
          .sort(
            (a, b) => new Date(b.scheduled_time) - new Date(a.scheduled_time)
          )
          .slice(0, 15);

        let consecutiveMissed = 0;
        for (const intake of recentIntakes) {
          if (intake.status === "missed") consecutiveMissed++;
          else if (intake.status === "taken") break;
        }
        totalMissed += consecutiveMissed;

        const lastAlert =
          p.med_history?.[p.med_history.length - 1]?.alert?.toLowerCase() || "";
        if (
          (lastAlert === "high" && consecutiveMissed > 2) ||
          (lastAlert === "med" && consecutiveMissed > 5)
        )
          alert = "high";
        else if (lastAlert === "med" || consecutiveMissed > 0)
          alert = alert !== "high" ? "med" : alert;

        // Checkups in next 7 days
        upcomingCheckups += (p.med_history || []).filter((m) => {
          const f = new Date(m.followup);
          return f >= today && f <= next7Days;
        }).length;
      });

      return {
        totalPatients: patients.length,
        totalMissedDoses: totalMissed,
        alertType: alert,
        totalUpcomingCheckups: upcomingCheckups,
      };
    }, [patients]);

  // Graph data for next 7 days
  const next7DaysData = useMemo(() => {
    const counts = { Mon: 0, Tue: 0, Wed: 0, Thu: 0, Fri: 0, Sat: 0, Sun: 0 };
    const dayLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const today = new Date();
    const next7Days = new Date();
    next7Days.setDate(today.getDate() + 7);

    patients.forEach((p) => {
      (p.med_history || []).forEach((m) => {
        if (m.followup) {
          const followupDate = new Date(m.followup);
          if (followupDate >= today && followupDate <= next7Days) {
            const day = dayLabels[followupDate.getDay()];
            counts[day] += 1;
          }
        }
      });
    });

    return ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map(
      (d) => counts[d]
    );
  }, [patients]);

  // Chart rendering
  useEffect(() => {
    if (!chartRef.current) return;
    if (chartInstanceRef.current) chartInstanceRef.current.destroy();
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
    chartInstanceRef.current = new Chart(chartRef.current, {
      type: "line",
      data: {
        labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
        datasets: [
          {
            label: "Upcoming Checkups",
            data: next7DaysData,
            borderColor: "#2563eb",
            backgroundColor: "rgba(37, 99, 235, 0.2)",
            tension: 0, // straight lines
          },
        ],
      },
      options: {
        responsive: true,
        plugins: { legend: { display: true } },
        scales: { y: { beginAtZero: true, precision: 0 } },
      },
    });

    return () => chartInstanceRef.current?.destroy();
  }, [next7DaysData]);

  const activeAlertsCount = alerts.filter((a) => a.status === "pending").length;

  // if (loading) return <p>Loading dashboard...</p>;
  const formatDuration = (ms) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days} day${days !== 1 ? "s" : ""}`;
    if (hours > 0) return `${hours} hour${hours !== 1 ? "s" : ""}`;
    if (minutes > 0) return `${minutes} minute${minutes !== 1 ? "s" : ""}`;
    return `${seconds} second${seconds !== 1 ? "s" : ""}`;
  };

  return (
    <>
      <SideBar active="dashboard" />
      <div className="container">
        <div className="dashboard-container">
          <h2>Dashboard</h2>
          <p>Welcome back, Hospital Administrator</p>
        </div>

        <div className="cards-container">
          <Link href="/hospital/patients">
            <DashBoardCard
              title="Total Patients"
              count={totalPatients}
              iconClass="fa-user"
              lastPara={`+${patientChangePercent}% from last week`}
            />
          </Link>

          <Link href="/hospital/patients">
            <DashBoardCard
              title="Missed Doses"
              count={totalMissedDoses}
              color={
                alertType === "high"
                  ? "red"
                  : alertType === "med"
                  ? "orange"
                  : "black"
              }
              iconClass="fa-solid fa-bell"
              lastPara={`Alert Level: ${alertType.toUpperCase()}`}
            />
          </Link>

          <Link href="/hospital/alerts">
            <DashBoardCard
              title="Active Alerts"
              count={activeAlertsCount}
              color="red"
              iconClass="fa-solid fa-info"
              lastPara="Urgent Action Required"
            />
          </Link>

          <Link href="/hospital/appointments">
            <DashBoardCard
              title="Upcoming Checkups"
              count={totalUpcomingCheckups}
              iconClass="fa-calendar"
              lastPara="Next 7 days"
            />
          </Link>
        </div>

        <div className="visual-section">
          <div className="graph-container">
            <h2>Patient Checkups - Weekly Overview</h2>
            <canvas ref={chartRef}></canvas>
          </div>

          <div className="recent-notifcation-container">
            <h2>Recent Notifications</h2>
            <ul>
              {alerts.slice(0, 4).map((alert) => (
                <li
                  key={alert._id}
                  className={alert.status === "pending" ? "emergency" : ""}
                >
                  {alert.category} alert for {alert.patient_name}.
                  <p>
                    {formatDuration(new Date() - new Date(alert.createdAt)) +
                      " ago"}
                  </p>
                </li>
              ))}
              {alerts.length === 0 && <li>No recent alerts.</li>}
            </ul>
          </div>
        </div>
      </div>
    </>
  );
};

export default DashBoardHospital;
