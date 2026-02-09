import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getPatientById, updatePatient } from "../../../services/patientsService";
import "../../../styles/ClinicDashboard.css";

const PatientDetails = () => {
  const { patientId } = useParams();
  const navigate = useNavigate();
  const [patient, setPatient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    age: "",
    phone: "",
    email: "",
    condition: "",
  });

  useEffect(() => {
    fetchPatient();
  }, [patientId]);

  const fetchPatient = async () => {
    try {
      setLoading(true);
      const patientData = await getPatientById(patientId);
      setPatient(patientData);
      setFormData({
        firstName: patientData.firstName || "",
        lastName: patientData.lastName || "",
        age: patientData.age || "",
        phone: patientData.phone || "",
        email: patientData.email || "",
        condition: patientData.condition || "",
      });
      setLoading(false);
    } catch (error) {
      console.error("Error fetching patient:", error);
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      await updatePatient(patientId, {
        ...formData,
        age: parseInt(formData.age) || 0,
      });
      alert("Patient updated successfully!");
      setEditing(false);
      fetchPatient();
    } catch (error) {
      console.error("Error updating patient:", error);
      alert("Failed to update patient");
    }
  };

  if (loading) {
    return (
      <div className="clinic-content-box">
        <p>Loading patient details...</p>
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="clinic-content-box">
        <p>Patient not found</p>
      </div>
    );
  }

  return (
    <div className="clinic-content-box">
      <div className="clinic-page-header">
        <button className="clinic-btn-back" onClick={() => navigate(-1)}>
          ← Back
        </button>
        <h2>Patient Details</h2>
        <button
          className="clinic-btn-primary"
          onClick={() => setEditing(!editing)}
        >
          {editing ? "❌ Cancel" : "✏️ Edit"}
        </button>
      </div>

      {editing ? (
        <div className="manage-box">
          <div className="manage-header">
            <h3>✏️ Edit Patient Information</h3>
          </div>

          <div className="manage-form">
            <input
              type="text"
              placeholder="First Name *"
              value={formData.firstName}
              onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
            />

            <input
              type="text"
              placeholder="Last Name *"
              value={formData.lastName}
              onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
            />

            <input
              type="number"
              placeholder="Age"
              value={formData.age}
              onChange={(e) => setFormData({ ...formData, age: e.target.value })}
            />

            <input
              type="tel"
              placeholder="Phone Number *"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            />

            <input
              type="email"
              placeholder="Email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />

            <input
              type="text"
              placeholder="Condition"
              value={formData.condition}
              onChange={(e) => setFormData({ ...formData, condition: e.target.value })}
            />
          </div>

          <div className="manage-actions">
            <button className="save-btn" onClick={handleSave}>
              💾 Save Changes
            </button>
          </div>
        </div>
      ) : (
        <div className="patient-details-card">
          <div className="patient-info-row">
            <strong>Name:</strong>
            <span>
              {patient.firstName} {patient.lastName}
            </span>
          </div>
          <div className="patient-info-row">
            <strong>Age:</strong>
            <span>{patient.age} years</span>
          </div>
          <div className="patient-info-row">
            <strong>Phone:</strong>
            <span>{patient.phone}</span>
          </div>
          <div className="patient-info-row">
            <strong>Email:</strong>
            <span>{patient.email || "N/A"}</span>
          </div>
          <div className="patient-info-row">
            <strong>Condition:</strong>
            <span>{patient.condition || "N/A"}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default PatientDetails;
