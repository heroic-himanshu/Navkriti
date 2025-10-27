"use client";
import AppointmentCard from "@/components/AppointmentCard";
import PatientSideBar from "@/components/PatientSideBar";
import { fetchWithProgress } from "@/lib/fetchWithProgess";
import React, { useState, useEffect } from "react";
const CheckUps = () => {
  const [patient, setPatient] = useState({
    name: "",
    med_history: [],
  });
  useEffect(() => {
    async function fetchPatientData() {
      try {
        const token = localStorage.getItem("patientToken");
        let data = await fetchWithProgress("/api/patients/me", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            authorization: `Bearer ${token}`,
          },
        });
        const res = await data.json();
        console.log(res);
        if (res.success) {
          setPatient(res.data);
        }
      } catch (err) {
        console.error("Error authenticating patient:", err);
      }
    }
    fetchPatientData();
  }, []);

  return (
    <div>
      <PatientSideBar active={"checkups"} />
      <div className="container introPara appointmentIntro">
        <div>
          <h2>Checkup Schedule</h2>
          <p className="txt-light">Manage your appointments</p>
        </div>

        <div className="appointmentList">
          <h3 className="appointmentListHeading">Upcoming Appointments</h3>
          <div className="appointments">
            {patient.med_history
              .filter((val) => {
                return new Date(val.followup) >= new Date();
              })
              .map((e) => {
                return (
                  <AppointmentCard
                    key={e.followup}
                    patient={{
                      name: patient.name,
                      date: new Date(e.followup).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      }),
                      med_history: [
                        {
                          problem: e.problem,
                          doctor_name: e.doctor_name,
                          dept: e.dept,
                        },
                      ],
                    }}
                  />
                );
              })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckUps;
