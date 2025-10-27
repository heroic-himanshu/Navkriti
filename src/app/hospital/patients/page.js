"use client";
import SideBar from "@/components/SideBar";
import React, { useState } from "react";
import PatientCard from "@/components/PatientCard";
import { usePatients } from "@/store/patientStore";
import styles from "./patients.module.css";
import { set } from "mongoose";

const Patients = () => {
  const {
    patients,
    missedDosesMap,
    loading,
    alerts,
    setAlerts,
    refreshAlerts,
    setRefreshAlerts,
  } = usePatients();
  const [searchTerm, setSearchTerm] = useState("");
  const [alert, setAlert] = useState({ message: "", color: "" });
  const filteredPatients = patients.filter(
    (p) =>
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.ph_number.toString().includes(searchTerm)
  );

  // if (loading) return <p style={{ textAlign: "center", padding: "40px" }}>Loading patients...</p>;

  return (
    <div>
      <SideBar active="patients" />
      <div className={styles.container}>
        <div className={styles.topSection} id="topSection">
          <div>
            <h2 className={styles.header}>Patients</h2>
            <p className={styles.subIntro}>Manage and monitor patient care</p>
          </div>
          <div>
            <div className={styles.searchBox} id="searchPatientBox">
              <i className="fa-solid fa-magnifying-glass"></i>
              <input
                type="text"
                placeholder="Search patients"
                value={searchTerm}
                id="searchPatient"
                className={styles.searchInput}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </div>

        <div className="container">
          <p>{alert.message}</p>
          {filteredPatients.length === 0 ? (
            <div style={{ textAlign: "center", padding: "40px" }}>
              No patients found
            </div>
          ) : (
            <div className="patient-container">
              {filteredPatients.map((p) => {
                const follow_up = p.med_history
                  .map((m) => new Date(m.followup))
                  .filter((d) => d >= new Date())
                  .sort((a, b) => a - b)[0];

                return (
                  <PatientCard
                    setAlert={setAlert}
                    setRefresh={setRefreshAlerts}
                    key={p._id}
                    id={p._id}
                    name={p.name}
                    age={p.age}
                    sex={p.sex}
                    phone={p.ph_number}
                    follow_up={
                      follow_up ? follow_up.toLocaleDateString() : "N/A"
                    }
                    condition={
                      p.med_history?.[p.med_history.length - 1]?.problem ||
                      "N/A"
                    }
                    missed_doses={missedDosesMap[p._id] || 0}
                  />
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Patients;
