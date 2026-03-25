import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getPatientById, updatePatient } from "../../../services/patientsService";
import { getPatientCommunications } from "../../../services/communicationsService"; // NEW IMPORT
import "../../../styles/ClinicDashboard.css";

const PatientDetails = () => {
  const { patientId } = useParams();
  const navigate = useNavigate();
  
  const [patient, setPatient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  
  // State for tabs and communication logs
  const [activeTab, setActiveTab] = useState("Details");
  const [commLogs, setCommLogs] = useState([]);

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    age: "",
    phone: "",
    email: "",
    condition: "",
  });

  useEffect(() => {
    fetchPatientData();
  }, [patientId]);

  const fetchPatientData = async () => {
    try {
      setLoading(true);
      
      // Fetch Patient Info
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

      // ENHANCEMENT: Fetch Communication History for this patient
      const logs = await getPatientCommunications(patientId);
      setCommLogs(logs);

      setLoading(false);
    } catch (error) {
      console.error("Error fetching patient data:", error);
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      await updatePatient(patientId, {
        ...formData,
        age: parseInt(formData.age) || 0,
      });
      alert("Patient updated successfully.");
      setEditing(false);
      fetchPatientData();
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
        <p>Patient not found.</p>
      </div>
    );
  }

  return (
    <div className="clinic-content-box">
      <div className="clinic-page-header">
        <button className="clinic-btn-back" onClick={() => navigate(-1)}>
          Back
        </button>
        <h2>Patient Profile: {patient.firstName} {patient.lastName}</h2>
        <button
          className="clinic-btn-primary"
          onClick={() => setEditing(!editing)}
        >
          {editing ? "Cancel" : "Edit Profile"}
        </button>
      </div>

      {/* ENHANCEMENT: Tab Navigation */}
      {!editing && (
        <div className="tabs" style={{ marginBottom: "20px" }}>
          <button 
            className={`tab-btn ${activeTab === "Details" ? "active" : ""}`} 
            onClick={() => setActiveTab("Details")}
          >
            Medical Information
          </button>
          <button 
            className={`tab-btn ${activeTab === "Comms" ? "active" : ""}`} 
            onClick={() => setActiveTab("Comms")}
          >
            Communication History
          </button>
        </div>
      )}

      {editing ? (
        <div className="manage-box">
          <div className="manage-header">
            <h3>Edit Patient Information</h3>
          </div>

          <div className="manage-form">
            <input
              type="text"
              placeholder="First Name"
              value={formData.firstName}
              onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
            />

            <input
              type="text"
              placeholder="Last Name"
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
              placeholder="Phone Number"
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
              Save Changes
            </button>
          </div>
        </div>
      ) : (
        <>
          {activeTab === "Details" && (
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

          {/* ENHANCEMENT: Communication History View */}
          {activeTab === "Comms" && (
            <div className="patient-details-card">
              <h3 style={{ marginTop: 0, color: "#3c0094" }}>Previous Logs & Messages</h3>
              {commLogs.length === 0 ? (
                <p style={{ color: "#666" }}>No communication history found for this patient.</p>
              ) : (
                <table className="clinic-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Type</th>
                      <th>Notes</th>
                      <th>Logged By</th>
                    </tr>
                  </thead>
                  <tbody>
                    {commLogs.map((log) => (
                      <tr key={log.id}>
                        <td>{new Date(log.createdAt).toLocaleDateString()}</td>
                        <td><span className="status-badge" style={{ backgroundColor: "#e9e6ff", color: "#3c0094" }}>{log.type}</span></td>
                        <td>{log.notes}</td>
                        <td>{log.loggedBy || "Staff"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default PatientDetails;