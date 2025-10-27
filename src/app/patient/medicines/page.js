import MedicineReminder from "@/components/MedicineReminder";
import PatientSideBar from "@/components/PatientSideBar";
import React from "react";

const Medicines = () => {
  return (
    <div>
      <PatientSideBar active={"medicines"} />
      <MedicineReminder />
    </div>
  );
};

export default Medicines;
