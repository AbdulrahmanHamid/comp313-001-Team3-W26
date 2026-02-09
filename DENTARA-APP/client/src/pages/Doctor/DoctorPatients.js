import React from "react";
import { Routes, Route } from "react-router-dom";
import DoctorPatientsList from "./DoctorPatientsList";
import DoctorPatientDetails from "./DoctorPatientDetails";

const DoctorPatients = () => {
  return (
    <Routes>
      <Route path="/" element={<DoctorPatientsList />} />
      <Route path=":patientId" element={<DoctorPatientDetails />} />
    </Routes>
  );
};

export default DoctorPatients;
