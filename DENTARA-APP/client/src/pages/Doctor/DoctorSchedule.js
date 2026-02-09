import React, { useState, useEffect } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import {
  listenToDoctorAppointments,
  updateAppointmentStatus,
  addDoctorAppointment,
  getDoctorInfo,
  listenToAllPatients  // Changed: Listen to all patients, filter in component
} from "../../services/doctorService";
import { getTodayLocal } from "../../utils/dateUtils";
import "../../styles/DoctorSchedule.css";

const DoctorSchedule = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState([]);
  const [allPatients, setAllPatients] = useState([]);
  const [doctorPatients, setDoctorPatients] = useState([]); // FIXED: Store only doctor's patients
  const [doctorName, setDoctorName] = useState("");
  const [selectedDate, setSelectedDate] = useState(getTodayLocal());
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    completed: 0,
    cancelled: 0
  });
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    patientId: "",
    time: "",
    reason: "",
    room: ""
  });

  // OPTIMIZATION: Separate useEffect for doctor info (doesn't depend on date)
  useEffect(() => {
    if (!currentUser) return;

    getDoctorInfo(currentUser.uid).then((info) => {
      if (info) setDoctorName(info.fullName);
    });
  }, [currentUser]);

  // OPTIMIZATION: Separate useEffect for fetching all patients (doesn't depend on date)
  useEffect(() => {
    if (!currentUser) return;

    const unsubscribe = listenToAllPatients((patientsList) => {
      // FIXED: Filter patients by doctor ID
      const filtered = patientsList.filter(p => p.doctorId === currentUser.uid);
      setAllPatients(patientsList); // Keep all for reference
      setDoctorPatients(filtered); // Only doctor's patients for dropdown
    });

    return () => unsubscribe();
  }, [currentUser]);

  // OPTIMIZATION: Separate useEffect for appointments (depends on selected date)
  useEffect(() => {
    if (!currentUser) return;

    const unsubscribe = listenToDoctorAppointments(
      currentUser.uid,
      selectedDate,
      (appointmentsList) => {
        setAppointments(appointmentsList);

        // Calculate stats
        const total = appointmentsList.length;
        const pending = appointmentsList.filter(
          a => a.status === "Pending" || a.status === "Confirmed"
        ).length;
        const completed = appointmentsList.filter(
          a => a.status === "Completed"
        ).length;
        const cancelled = appointmentsList.filter(
          a => a.status === "Cancelled" || a.status === "No-Show"
        ).length;

        setStats({ total, pending, completed, cancelled });
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [currentUser, selectedDate]);

  // OPTIMIZATION: Memoize status class function
  const getStatusClass = (status) => {
    const statusMap = {
      Completed: "status-badge status-completed",
      Pending: "status-badge status-pending",
      Confirmed: "status-badge status-confirmed",
      "In Progress": "status-badge status-in-progress"
    };
    return statusMap[status] || "status-badge status-cancelled";
  };

  const handleAddAppointment = async (e) => {
    e.preventDefault();

    if (!formData.patientId || !formData.time || !formData.reason) {
      alert("Please fill in all required fields");
      return;
    }

    try {
      // FIXED: Find from doctorPatients, not allPatients
      const selectedPatient = doctorPatients.find(
        p => p.id === formData.patientId
      );

      if (!selectedPatient) {
        alert("Selected patient not found");
        return;
      }

      await addDoctorAppointment({
        patientId: formData.patientId,
        patientName: `${selectedPatient.firstName} ${selectedPatient.lastName}`,
        doctorId: currentUser.uid,
        date: selectedDate,
        time: formData.time,
        reason: formData.reason,
        room: formData.room || "TBD"
      });

      alert("Appointment added successfully!");
      setShowAddForm(false);
      setFormData({ patientId: "", time: "", reason: "", room: "" });
    } catch (error) {
      console.error("Error adding appointment:", error);
      alert("Failed to add appointment");
    }
  };

  const handleStartAppointment = async (appointmentId) => {
    try {
      await updateAppointmentStatus(appointmentId, "In Progress");
    } catch (error) {
      console.error("Error updating appointment:", error);
    }
  };

  const handleCompleteAppointment = async (appointmentId) => {
    try {
      await updateAppointmentStatus(appointmentId, "Completed");
    } catch (error) {
      console.error("Error completing appointment:", error);
    }
  };

  const handleViewPatient = (patientId) => {
    navigate(`/doctor-dashboard/patients/${patientId}`);
  };

  return (
    <div className="doctor-schedule-page">
      <div className="schedule-header">
        <h2>📅 Doctor's Schedule</h2>
        <span className="doctor-name">{doctorName || "Loading..."}</span>
      </div>

      <div className="schedule-container">
        {/* Date Selection */}
        <div className="date-row">
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="date-btn"
          />
        </div>

        {/* Summary Stats */}
        <div className="schedule-panels">
          <div className="summary-box">
            <h3>Today's Summary</h3>
            <ul>
              <li>
                <strong>Total:</strong> {stats.total}
              </li>
              <li>
                <strong>Pending:</strong> {stats.pending}
              </li>
              <li>
                <strong>Completed:</strong> {stats.completed}
              </li>
              <li>
                <strong>Cancelled/No-Show:</strong> {stats.cancelled}
              </li>
            </ul>
          </div>

          {/* Appointments List */}
          <div className="appointments-box">
            <h3>Appointments</h3>
            {loading ? (
              <p>Loading appointments...</p>
            ) : appointments.length === 0 ? (
              <p>No appointments for this date</p>
            ) : (
              <table className="appointments-table">
                <thead>
                  <tr>
                    <th>Time</th>
                    <th>Patient</th>
                    <th>Reason</th>
                    <th>Room</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {appointments.map((apt) => (
                    <tr key={apt.id}>
                      <td>{apt.time}</td>
                      <td>{apt.patientName}</td>
                      <td>{apt.reason}</td>
                      <td>{apt.room}</td>
                      <td>
                        <span className={getStatusClass(apt.status)}>
                          {apt.status}
                        </span>
                      </td>
                      <td>
                        {apt.status === "Pending" || apt.status === "Confirmed" ? (
                          <button
                            className="table-btn"
                            onClick={() => handleStartAppointment(apt.id)}
                          >
                            Start
                          </button>
                        ) : apt.status === "In Progress" ? (
                          <button
                            className="table-btn"
                            onClick={() => handleCompleteAppointment(apt.id)}
                          >
                            Complete
                          </button>
                        ) : (
                          <button
                            className="table-btn"
                            onClick={() => handleViewPatient(apt.patientId)}
                          >
                            View
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="action-row">
          <button
            className="action-btn"
            onClick={() => setShowAddForm(!showAddForm)}
          >
            {showAddForm ? "❌ Cancel" : "🆕 Add Appointment"}
          </button>
        </div>

        {/* Add Appointment Form */}
        {showAddForm && (
          <div className="appointment-form-container">
            <h3>Add New Appointment</h3>
            <form onSubmit={handleAddAppointment} className="appointment-form">
              <div className="form-field">
                <label htmlFor="patientSelect">Patient *</label>
                <select
                  id="patientSelect"
                  value={formData.patientId}
                  onChange={(e) =>
                    setFormData({ ...formData, patientId: e.target.value })
                  }
                  required
                >
                  <option value="">
                    {doctorPatients.length === 0
                      ? "No patients available"
                      : "Select a patient"}
                  </option>
                  {doctorPatients.map((patient) => (
                    <option key={patient.id} value={patient.id}>
                      {patient.firstName} {patient.lastName}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-field">
                <label htmlFor="timeInput">Time *</label>
                <input
                  id="timeInput"
                  type="time"
                  value={formData.time}
                  onChange={(e) =>
                    setFormData({ ...formData, time: e.target.value })
                  }
                  required
                />
              </div>

              <div className="form-field">
                <label htmlFor="reasonInput">Reason *</label>
                <input
                  id="reasonInput"
                  type="text"
                  value={formData.reason}
                  onChange={(e) =>
                    setFormData({ ...formData, reason: e.target.value })
                  }
                  required
                  placeholder="e.g., Cleaning, Filling"
                />
              </div>

              <div className="form-field">
                <label htmlFor="roomInput">Room</label>
                <input
                  id="roomInput"
                  type="text"
                  value={formData.room}
                  onChange={(e) =>
                    setFormData({ ...formData, room: e.target.value })
                  }
                  placeholder="e.g., Room 1"
                />
              </div>

              <button type="submit" className="submit-btn">
                Add Appointment
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default DoctorSchedule;
