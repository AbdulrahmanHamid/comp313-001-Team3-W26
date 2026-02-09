import React, { useEffect, useState } from "react";
import { getFirestore, collection, onSnapshot, updateDoc, doc } from "firebase/firestore";
import { listenToDoctors } from "../../services/usersService";
import DataTable from "../../components/DataTable";
import { Line } from "react-chartjs-2";
import { Chart as ChartJS, LineElement, CategoryScale, LinearScale, PointElement, Filler } from "chart.js";
import "../../styles/ClinicDashboard.css";

ChartJS.register(LineElement, CategoryScale, LinearScale, PointElement, Filler);

const NoShowList = () => {
  const db = getFirestore();
  const [stats, setStats] = useState({ total: 0, rebooked: 0, escalations: 0 });
  const [appointments, setAppointments] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [trendData, setTrendData] = useState([]);
  const [selectedApt, setSelectedApt] = useState(null);
  const [actionType, setActionType] = useState(null);
  const [newDate, setNewDate] = useState("");
  const [newTime, setNewTime] = useState("");

  useEffect(() => {
    listenToDoctors(setDoctors);
    const unsub = onSnapshot(collection(db, "appointments"), (snapshot) => {
      const list = snapshot.docs
        .map((doc) => ({ id: doc.id, ...doc.data() }))
        .filter((apt) => apt.status?.toLowerCase() === "no-show");
      setAppointments(list);
      setStats({
        total: list.length,
        rebooked: list.filter((a) => a.action_status === "Rebooked").length,
        escalations: list.filter((a) => a.action_status === "Escalated").length,
      });
      generateTrendData(list);
    });
    return unsub;
  }, [db]);

  const generateTrendData = (list) => {
    const last7 = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split("T")[0];
      last7.push({ date: dateStr, count: list.filter((a) => a.date === dateStr).length });
    }
    setTrendData(last7);
  };

  const getDoctorName = (doctorId) => doctors.find((d) => d.id === doctorId)?.fullName || "N/A";

  const handleRebook = async () => {
    if (!newDate || !newTime) {
      alert("Select date and time!");
      return;
    }
    try {
      await updateDoc(doc(db, "appointments", selectedApt.id), {
        action_status: "Rebooked",
        status: "Pending",
        date: newDate,
        time: newTime,
      });
      alert("✅ Rebooked!");
      setSelectedApt(null);
      setActionType(null);
      setNewDate("");
      setNewTime("");
    } catch (error) {
      alert("❌ Error: " + error.message);
    }
  };

  const handleEscalate = async () => {
    try {
      await updateDoc(doc(db, "appointments", selectedApt.id), { action_status: "Escalated" });
      alert("✅ Escalated!");
      setSelectedApt(null);
      setActionType(null);
    } catch (error) {
      alert("❌ Error: " + error.message);
    }
  };

  const tableRows = appointments.map((apt) => ({
    id: apt.id,
    Date: apt.date,
    Time: apt.time,
    Patient: apt.patientName,
    Doctor: getDoctorName(apt.doctorId),
    Reason: apt.reason,
    Status: (
      <span className={`status-badge status-${(apt.action_status || "no-show").toLowerCase().replace(" ", "-")}`}>
        {apt.action_status || "No-Show"}
      </span>
    ),
  }));

  const tableActions = (apt) => [
    { label: "📞 Rebook", onClick: () => { setSelectedApt(apt); setActionType("rebook"); setNewDate(apt.date); setNewTime(apt.time); } },
    { label: "⚠️ Escalate", onClick: () => { setSelectedApt(apt); setActionType("escalate"); }, style: { marginLeft: "5px", background: "#ff9999" } },
  ];

  return (
    <div className="clinic-content-box">
      <div className="clinic-page-header">
        <h2>📋 No-Show Management</h2>
      </div>
      <div className="noshow-stats">
        {[
          { title: "Total No-Shows", value: stats.total },
          { title: "Rebooked", value: stats.rebooked, color: "stat-success" },
          { title: "Escalated", value: stats.escalations, color: "stat-urgent" },
        ].map((stat, i) => (
          <div key={i} className="stat-card">
            <h4>{stat.title}</h4>
            <p className={`stat-number ${stat.color || ""}`}>{stat.value}</p>
          </div>
        ))}
      </div>
      <div className="noshow-chart-container">
        <h3>7-Day Trend</h3>
        <Line
          data={{
            labels: trendData.map((d) => d.date),
            datasets: [
              {
                label: "No-Shows",
                data: trendData.map((d) => d.count),
                borderColor: "#ff4444",
                backgroundColor: "rgba(255, 68, 68, 0.1)",
                tension: 0.4,
                fill: true,
              },
            ],
          }}
          options={{ responsive: true }}
        />
      </div>
      <div className="noshow-table-section">
        <h3>No-Show Appointments</h3>
        <DataTable
          columns={["Date", "Time", "Patient", "Doctor", "Reason", "Status"]}
          rows={tableRows}
          actions={tableActions}
          emptyMessage="No no-shows"
        />
      </div>
      {selectedApt && actionType && (
        <div className="manage-box">
          <div className="manage-header">
            <h3>{actionType === "rebook" ? "📞 Rebook" : "⚠️ Escalate"}</h3>
            <button className="close-btn" onClick={() => setSelectedApt(null)}>✖</button>
          </div>
          <div className="modal-content">
            <p><strong>Patient:</strong> {selectedApt.patientName}</p>
            <p><strong>Original Date:</strong> {selectedApt.date}</p>
            <p><strong>Original Time:</strong> {selectedApt.time}</p>
            <p><strong>Doctor:</strong> {getDoctorName(selectedApt.doctorId)}</p>
            <p><strong>Reason:</strong> {selectedApt.reason}</p>
            {actionType === "rebook" && (
              <div className="rebook-inputs">
                <div className="input-group">
                  <label htmlFor="rebook-date">New Date:</label>
                  <input
                    id="rebook-date"
                    type="date"
                    value={newDate}
                    onChange={(e) => setNewDate(e.target.value)}
                    className="rebook-input"
                  />
                </div>
                <div className="input-group">
                  <label htmlFor="rebook-time">New Time:</label>
                  <input
                    id="rebook-time"
                    type="time"
                    value={newTime}
                    onChange={(e) => setNewTime(e.target.value)}
                    className="rebook-input"
                  />
                </div>
              </div>
            )}
          </div>
          <div className="manage-actions">
            <button className="save-btn" onClick={actionType === "rebook" ? handleRebook : handleEscalate}>
              ✅ Confirm {actionType === "rebook" ? "Rebook" : "Escalation"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default NoShowList;
