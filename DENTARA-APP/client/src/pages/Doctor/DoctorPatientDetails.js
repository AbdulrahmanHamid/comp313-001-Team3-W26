import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import {
  getPatientById,
  getPatientTreatments,
  getPatientClinicalNotes,
  addClinicalNote,
  getDoctorInfo
} from "../../services/doctorService";
import "../../styles/DoctorPatients.css";

const DoctorPatientDetails = () => {
  const { patientId } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [patient, setPatient] = useState(null);
  const [treatments, setTreatments] = useState([]);
  const [clinicalNotes, setClinicalNotes] = useState([]);
  const [newNote, setNewNote] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [doctorName, setDoctorName] = useState("");

  useEffect(() => {
    fetchPatientData();
    fetchDoctorName();
  }, [patientId, currentUser]);

  const fetchDoctorName = async () => {
    try {
      const info = await getDoctorInfo(currentUser.uid);
      if (info) setDoctorName(info.fullName);
    } catch (error) {
      console.error("Error fetching doctor name:", error);
    }
  };

  const fetchPatientData = async () => {
    try {
      setLoading(true);

      // Get patient details
      const patientData = await getPatientById(patientId);
      setPatient(patientData);

      // Get treatment history
      const treatmentsData = await getPatientTreatments(patientId);
      setTreatments(treatmentsData);

      // Get clinical notes
      const notesData = await getPatientClinicalNotes(patientId);
      setClinicalNotes(notesData);

      setLoading(false);
    } catch (error) {
      console.error("Error fetching patient data:", error);
      setLoading(false);
    }
  };

  const handleSaveNote = async () => {
    if (!newNote.trim()) {
      alert("Please enter a note");
      return;
    }

    try {
      setSaving(true);
      await addClinicalNote(
        patientId,
        `${patient.firstName} ${patient.lastName}`,
        doctorName || `Dr. ${currentUser.email.split("@")}`,
        newNote
      );

      alert("Note saved successfully!");
      setNewNote("");
      fetchPatientData(); // Refresh to show new note
      setSaving(false);
    } catch (error) {
      console.error("Error saving note:", error);
      alert("Failed to save note");
      setSaving(false);
    }
  };

  const handleScheduleNextVisit = () => {
    navigate("/doctor-dashboard/schedule");
  };

  if (loading) {
    return (
      <div className="doctor-patient-list">
        <p>Loading patient details...</p>
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="doctor-patient-list">
        <button className="action-btn" onClick={() => navigate(-1)}>
          ← Back
        </button>
        <p>Patient not found</p>
      </div>
    );
  }

  return (
    <div className="doctor-patient-list">
      <button className="action-btn" onClick={() => navigate(-1)}>
        ← Back
      </button>

      <h2 className="page-title">
        {patient.firstName} {patient.lastName}'s Details
      </h2>

      {/* Patient Information Card */}
      <div className="patient-info-card">
        <h3>Patient Information</h3>
        <div className="info-row">
          <span className="info-label">Name:</span>
          <span className="info-value">
            {patient.firstName} {patient.lastName}
          </span>
        </div>
        <div className="info-row">
          <span className="info-label">Age:</span>
          <span className="info-value">{patient.age || "-"}</span>
        </div>
        <div className="info-row">
          <span className="info-label">Phone:</span>
          <span className="info-value">{patient.phone || "-"}</span>
        </div>
        <div className="info-row">
          <span className="info-label">Email:</span>
          <span className="info-value">{patient.email || "-"}</span>
        </div>
        <div className="info-row">
          <span className="info-label">Condition:</span>
          <span className="info-value">{patient.condition || "-"}</span>
        </div>
      </div>

      {/* Treatments Section */}
      <div className="patient-details-section">
        <h3>💊 Treatment History</h3>
        {treatments.length === 0 ? (
          <p style={{ color: "#999", fontStyle: "italic" }}>
            No treatment history available
          </p>
        ) : (
          <table className="history-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Doctor</th>
                <th>Treatment</th>
                <th>Notes</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {treatments.map((treatment) => (
                <tr key={treatment.id}>
                  <td>{treatment.date}</td>
                  <td>{treatment.doctor}</td>
                  <td>{treatment.treatment}</td>
                  <td>{treatment.notes || "-"}</td>
                  <td>
                    <span
                      className={`status-badge status-${treatment.status
                        .toLowerCase()
                        .replace(" ", "-")}`}
                    >
                      {treatment.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Clinical Notes Section */}
      <div className="patient-details-section">
        <h3>📝 Clinical Notes</h3>

        {/* Add New Note Form */}
        <div className="add-note-form">
          <h4>Add Clinical Note</h4>
          <textarea
            value={newNote}
            onChange={(e) => setNewNote(e.target.value)}
            placeholder="Enter clinical notes here..."
            rows="4"
            className="note-textarea"
          />
          <button
            className="submit-btn"
            onClick={handleSaveNote}
            disabled={saving}
          >
            {saving ? "Saving..." : "Save Note"}
          </button>
        </div>

        {/* Display Existing Notes */}
        <div className="notes-list">
          {clinicalNotes.length === 0 ? (
            <p style={{ color: "#999", fontStyle: "italic" }}>
              No clinical notes yet
            </p>
          ) : (
            clinicalNotes.map((note) => (
              <div key={note.id} className="note-card">
                <div className="note-header">
                  <strong>{note.date}</strong>
                  <span className="note-doctor">{note.doctor}</span>
                </div>
                <p className="note-text">{note.notes}</p>
                <span
                  className={`status-badge status-${note.status
                    .toLowerCase()
                    .replace(" ", "-")}`}
                >
                  {note.status}
                </span>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="action-buttons">
        <button
          className="action-btn"
          onClick={handleScheduleNextVisit}
        >
          📅 Schedule Next Visit
        </button>
      </div>
    </div>
  );
};

export default DoctorPatientDetails;
