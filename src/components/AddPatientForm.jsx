"use client";
import React, { useState } from "react";
import PatientRegister from "./PatientRegister";
import SideBar from "./SideBar";
const AddPatient = () => {

    return (
        <>
            <SideBar active={"add patient"} />
            <div className="form-container patient-register-container">
                <div className="right">
                    <PatientRegister />
                </div>
            </div>
        </>
    );
};

export default AddPatient;

