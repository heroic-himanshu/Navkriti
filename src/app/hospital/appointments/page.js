"use client";
import SideBar from "@/components/SideBar";
import AppointmentCard from "@/components/AppointmentCard";
import React, { useMemo } from "react";
import { usePatients } from "@/store/patientStore";

const Appointments = () => {
  const { patients, loading } = usePatients();

  const appointmentsByDate = useMemo(() => {
    const grouped = {};
    patients.forEach((p) => {
      const nextFollowUp = p.med_history
        .map((m) => new Date(m.followup))
        .filter((d) => d >= new Date())
        .sort((a, b) => a - b)[0];

      if (nextFollowUp) {
        const key = nextFollowUp.toISOString().split("T")[0];
        grouped[key] = [...(grouped[key] || []), p];
      }
    });
    return grouped;
  }, [patients]);

  const sortedDates = Object.keys(appointmentsByDate).sort(
    (a, b) => new Date(b) - new Date(a)
  );

  // if (loading) return <p style={{ textAlign: "center", padding: "40px" }}>Loading appointments...</p>;

  return (
    <div>
      <SideBar active="appointments" />

      <div className="container">
        <div className="introPara">
          <h2>Appointments</h2>
          <p className="txt-light">
            Manage patient appointments and appointment schedules
          </p>
        </div>

        <div className="complete-appointments-container">
          {sortedDates.length === 0 && (
            <p style={{ textAlign: "center", padding: "40px" }}>
              No Appointments Scheduled
            </p>
          )}

          {sortedDates.map((date) => (
            <div key={date} className="appointments-date-section">
              <h3>
                <i className="fa-solid fa-calendar"></i>{" "}
                {new Date(date).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                })}
              </h3>

              <div className="appointments-container">
                {appointmentsByDate[date].map((p) => (
                  <AppointmentCard key={p._id} patient={p} />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Appointments;
