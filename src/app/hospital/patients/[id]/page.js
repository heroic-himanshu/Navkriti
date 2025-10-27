"use client";
import PatientPage from "@/components/PatientPage";
import React from "react";
import { useEffect, useState } from "react";
const Patient = ({ params }) => {
  const [patient, setPatient] = useState({
      reminder_settings: {
        enabled: true,
        notification_method: "app",
        reminder_before_minutes: 15,
      },
      alert_status: {
        level: "",
        risk_factors: [],
      },
      current_alerts: {
        has_active_sos: false,
        has_active_medication_alert: false,
        alert_count_last_7_days: 0,
      },
      _id: "68fb159acb8f685fca24de57",
      name: "",
      sex: "",
      age: 0,
      ph_number: 0,
      address: "",
      med_history: [
        {
          dept: "",
          doctor_name: "",
          followup: "2025-10-27T00:00:00.000Z",
          alert_type: "low",
          problem: "Heart attack",
          prescription: [
            {
              name: "dolo ",
              color: "orange",
              dosage: "1 tablet",
              frequency: "4 times daily",
              acceptedtime: "6-10, 11-15, 16-20, 20-24",
              duration_days: 7,
              start_date: "2025-10-24T05:58:51.824Z",
              end_date: "2025-10-31T05:58:51.824Z",
              instructions: "",
              is_active: true,
              _id: "68fb159ecb8f685fca24de71",
            },
          ],
          visit_date: "2025-10-24T05:58:54.107Z",
          _id: "68fb159ecb8f685fca24de70",
          createdAt: "2025-10-24T05:58:54.108Z",
          updatedAt: "2025-10-24T05:58:54.108Z",
        },
        {
          dept: "Nark",
          doctor_name: "Yamraj",
          followup: "2025-11-14T00:00:00.000Z",
          alert_type: "High",
          problem: "Death",
          prescription: [
            {
              name: "Amlodipine 5mg",
              color: "white",
              dosage: "1 tablet",
              frequency: "Once daily",
              acceptedtime: "8-20",
              duration_days: 30,
              start_date: "2025-10-24T06:38:07.307Z",
              end_date: "2025-11-23T06:38:07.307Z",
              instructions: "Take after breakfast",
              is_active: true,
              _id: "68fb1ecf342231e22cea51a8",
            },
          ],
          visit_date: "2025-10-24T06:38:07.307Z",
          _id: "68fb1ecf342231e22cea51a7",
          createdAt: "2025-10-24T06:38:07.308Z",
          updatedAt: "2025-10-24T06:38:07.308Z",
        },
        {
          dept: "Nark",
          doctor_name: "Yamraj",
          followup: "2025-11-14T00:00:00.000Z",
          alert_type: "low",
          problem: "Death",
          prescription: [
            {
              name: "Amlodipine 5mg",
              color: "white",
              dosage: "1 tablet",
              frequency: "Once daily",
              acceptedtime: "8-20",
              duration_days: 30,
              start_date: "2025-10-24T06:38:18.213Z",
              end_date: "2025-11-23T06:38:18.213Z",
              instructions: "Take after breakfast",
              is_active: true,
              _id: "68fb1eda342231e22cea51b3",
            },
          ],
          visit_date: "2025-10-24T06:38:18.213Z",
          _id: "68fb1eda342231e22cea51b2",
          createdAt: "2025-10-24T06:38:18.213Z",
          updatedAt: "2025-10-24T06:38:18.213Z",
        },{
          dept: "Nark",
          doctor_name: "Yamraj",
          followup: "2025-11-14T00:00:00.000Z",
          alert_type: "medium",
          problem: "Death",
          prescription: [
            {
              name: "Amlodipine 5mg",
              color: "white",
              dosage: "1 tablet",
              frequency: "Once daily",
              acceptedtime: "8-20",
              duration_days: 30,
              start_date: "2025-10-24T06:38:41.451Z",
              end_date: "2025-11-23T06:38:41.451Z",
              instructions: "Take after breakfast",
              is_active: true,
              _id: "68fb1eda342231e22cea51b3",
            },
          ],
          visit_date: "2025-10-24T06:38:41.451Z",
        }
      ],
      previous_hospitalizations: 0,
      medicine_intakes: [
        {
          prescription_id: "68fb159ecb8f685fca24de71",
          medicine_name: "dolo ",
          scheduled_time: "2025-10-24T06:01:27.604Z",
          taken_time: null,
          status: "missed",
          _id: "68fb1637cb8f685fca24dee8",
          createdAt: "2025-10-24T06:01:27.606Z",
          updatedAt: "2025-10-24T06:01:27.606Z",
        },
        {
          prescription_id: "68fb159ecb8f685fca24de71",
          medicine_name: "dolo ",
          scheduled_time: "2025-10-24T06:17:17.525Z",
          taken_time: null,
          status: "skipped",
          _id: "68fb19edcb8f685fca24df7d",
          createdAt: "2025-10-24T06:17:17.526Z",
          updatedAt: "2025-10-24T06:17:17.526Z",
        },
        {
          prescription_id: "68fb1ecf342231e22cea51a8",
          medicine_name: "Amlodipine 5mg",
          scheduled_time: "2025-10-24T06:38:32.438Z",
          taken_time: null,
          status: "skipped",
          _id: "68fb1ee8cb8f685fca24e0d8",
          createdAt: "2025-10-24T06:38:32.441Z",
          updatedAt: "2025-10-24T06:38:32.441Z",
        },
        {
          prescription_id: "68fb1eda342231e22cea51b3",
          medicine_name: "Amlodipine 5mg",
          scheduled_time: "2025-10-24T06:38:41.451Z",
          taken_time: "2025-10-24T06:38:41.451Z",
          status: "taken",
          _id: "68fb1ef1cb8f685fca24e0ee",
          createdAt: "2025-10-24T06:38:41.455Z",
          updatedAt: "2025-10-24T06:38:41.455Z",
        },
        
      ],
      side_effects_history: [],
      createdAt: "2025-10-24T05:58:50.840Z",
      updatedAt: "2025-10-24T06:38:41.455Z",
      __v: 4,
    });
  useEffect(() => {
    const fetchPatient = async () => {
      const { id } = await params;
      try {
        const res = await fetch(`/api/admin/patients/${id}`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            authorization: `Bearer ${localStorage.getItem("adminToken")}`,
          },
        });
        const data = await res.json();
        console.log(data.data);
        setPatient(data.data);
      } catch (err) {
        console.error("Error fetching patient:", err);
      }
    };
    fetchPatient();
  }, []);
  return (
    <div>
      {/* {Object.keys(patient).map((key) => (
        <p key={key}>
          {key}:{" "}
          {typeof patient[key] === "object" && patient[key] !== null
            ? JSON.stringify(patient[key])
            : patient[key]}
        </p>
      ))} */}
      <PatientPage patient={patient} />
    </div>
  );
};

export default Patient;
