import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { listenToDoctors } from "../../../services/usersService";
import "../../../styles/ClinicDashboard.css";

const PatientsPage = () => {
  const navigate = useNavigate();
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = listenToDoctors((doctorsList) => {
      setDoctors(doctorsList);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="clinic-content-box">
        <p>Loading doctors...</p>
      </div>
    );
  }

  return (
    <div className="clinic-content-box">
      <div className="clinic-page-header">
        <h2> Doctors & Their Patients</h2>
        <button
          className="clinic-btn-primary"
          onClick={() => navigate("/staff-dashboard/patients/all")}
        >
          📋 View All Patients
        </button>
      </div>

      {doctors.length === 0 ? (
        <p>No doctors found</p>
      ) : (
        <div className="doctors-grid">
          {doctors.map((doctor) => (
            <div
              key={doctor.id}
              className="doctor-card"
              onClick={() => navigate(`/staff-dashboard/patients/doctor/${doctor.id}`)}
            >
              <h3>{doctor.fullName}</h3>
              <p className="doctor-email">{doctor.email}</p>
              <button className="clinic-btn-secondary">View Patients →</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PatientsPage;
