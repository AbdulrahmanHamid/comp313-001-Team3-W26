import React, { useEffect, useState } from "react";
import { getFirestore, collection, onSnapshot, updateDoc, doc, addDoc } from "firebase/firestore";
import { listenToDoctors } from "../../services/usersService";
import { formatDateLocal } from "../../utils/dateUtils";
import DataTable from "../../components/DataTable";
import { Line } from "react-chartjs-2";
import { Chart as ChartJS, LineElement, CategoryScale, LinearScale, PointElement, Filler } from "chart.js";
import "../../styles/ClinicDashboard.css";

ChartJS.register(LineElement, CategoryScale, LinearScale, PointElement, Filler);

const NoShowList = () => {
  const db = getFirestore();
  // 1. Set Management as the default active tab
  const [activeTab, setActiveTab] = useState("management"); 
  const [managementFilter, setManagementFilter] = useState("Action Required"); // Filter for the management tab
  
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
        // 2. Catch all variations of no-show to ensure none are missing
        .filter((apt) => {
           const status = apt.status?.toLowerCase() || "";
           return status === "no-show" || status === "no show" || status === "noshow";
        });
        
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
    const today = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      // ✅ BUG FIX: Using your dateUtils
      const dateStr = formatDateLocal(d);
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
      // 1. Create a brand new appointment for the patient
      // We extract the properties we want to copy, IGNORING the old ID, date, time, and status
      const { id, action_status, ...aptDataToCopy } = selectedApt;
      
      await addDoc(collection(db, "appointments"), {
        ...aptDataToCopy,
        date: newDate,
        time: newTime,
        status: "Pending", // The new appointment starts fresh
        createdAt: new Date().toISOString()
      });

      // 2. Mark the OLD appointment as resolved/rebooked so it stays in No-Show history
      await updateDoc(doc(db, "appointments", selectedApt.id), {
        action_status: "Rebooked",
        // Notice we DO NOT change the main 'status'. It stays 'No-Show' so KPIs don't drop.
      });

      alert("✅ Patient successfully rebooked! New appointment created.");
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

  // 3. Calculate total no-shows per patient
  const patientNoShowCounts = appointments.reduce((acc, apt) => {
    const key = apt.patientId || apt.patientName;
    if (key) {
      acc[key] = (acc[key] || 0) + 1;
    }
    return acc;
  }, {});

  const unresolvedAppointments = appointments.filter(apt => !apt.action_status);
  const resolvedAppointments = appointments.filter(apt => apt.action_status);
  
  const displayedAppointments = managementFilter === "Action Required" ? unresolvedAppointments : resolvedAppointments;

  const tableRows = displayedAppointments.map((apt) => {
    const totalNoShows = patientNoShowCounts[apt.patientId || apt.patientName] || 1;
    
    return {
      id: apt.id,
      _rawApt: apt, 
      Date: apt.date,
      Time: apt.time,
      // Display Patient name with the No-Show Counter underneath
      Patient: (
        <span>
          <strong>{apt.patientName}</strong> <br/>
          <small style={{ color: "#ff4444", fontWeight: "bold" }}>({totalNoShows} Total No-Shows)</small>
        </span>
      ),
      Doctor: getDoctorName(apt.doctorId),
      Reason: apt.reason,
      Status: (
        <span className={`status-badge status-${(apt.action_status || "no-show").toLowerCase().replace(" ", "-")}`}>
          {apt.action_status || "Action Required"}
        </span>
      ),
    };
  });

  const tableActions = (row) => {
    const actions = [];
    
    if (managementFilter === "Action Required") {
      actions.push({ 
        label: "📞 Rebook", 
        onClick: () => { 
          setSelectedApt(row._rawApt); 
          setActionType("rebook"); 
          setNewDate(row._rawApt.date); 
          setNewTime(row._rawApt.time); 
        } 
      });
      actions.push({ 
        label: "⚠️ Escalate", 
        onClick: () => { 
          setSelectedApt(row._rawApt); 
          setActionType("escalate"); 
        }, 
        style: { marginLeft: "5px", background: "#ff9999" } 
      });
    } else {
      // 4. In the Resolved Tab, allow Escalation if they were just rebooked previously
      if (row._rawApt.action_status !== "Escalated") {
        actions.push({ 
          label: "⚠️ Escalate", 
          onClick: () => { 
            setSelectedApt(row._rawApt); 
            setActionType("escalate"); 
          }, 
          style: { background: "#ff9999" } 
        });
      }
    }
    return actions;
  };

  return (
    <div className="clinic-content-box">
      <div className="clinic-page-header">
        <h2>📋 No-Show Center</h2>
      </div>

      {/* TABS FOR NO-SHOW CENTER */}
      <div className="tab-switcher">
        <button
          className={`tab-btn ${activeTab === "management" ? "active" : ""}`}
          onClick={() => setActiveTab("management")}
        >
          No-Show Management
        </button>
        <button
          className={`tab-btn ${activeTab === "summary" ? "active" : ""}`}
          onClick={() => setActiveTab("summary")}
        >
          No-Show Summary
        </button>
      </div>

      {/* MANAGEMENT TAB CONTENT */}
      {activeTab === "management" && (
        <div className="tab-content noshow-table-section">
          
          <div className="search-filter-container" style={{ justifyContent: "space-between", marginBottom: "20px" }}>
            <h3 style={{ margin: 0, color: "#3c0094" }}>
              {managementFilter === "Action Required" ? "Needs Attention" : "Resolved Records"}
            </h3>
            
            <div className="filter-group">
              <label>Current View: </label>
              <select 
                className="filter-select"
                value={managementFilter} 
                onChange={(e) => setManagementFilter(e.target.value)}
              >
                <option value="Action Required">Action Required ({unresolvedAppointments.length})</option>
                <option value="Resolved">History / Resolved ({resolvedAppointments.length})</option>
              </select>
            </div>
          </div>

          <DataTable
            columns={["Date", "Time", "Patient", "Doctor", "Reason", "Status"]}
            rows={tableRows}
            actions={tableActions}
            emptyMessage={managementFilter === "Action Required" ? "🎉 All No-Shows have been resolved!" : "No resolved records found."}
          />
        </div>
      )}

      {/* SUMMARY TAB CONTENT */}
      {activeTab === "summary" && (
        <div className="tab-content">
          <div className="noshow-stats">
            {[
              { title: "Total No-Shows (All Time)", value: stats.total },
              { title: "Successfully Rebooked", value: stats.rebooked, color: "stat-success" },
              { title: "Escalated / Warning", value: stats.escalations, color: "stat-urgent" },
            ].map((stat, i) => (
              <div key={i} className="stat-card">
                <h4>{stat.title}</h4>
                <p className={`stat-number ${stat.color || ""}`}>{stat.value}</p>
              </div>
            ))}
          </div>
          
          <div className="noshow-chart-container">
            <h3>7-Day No-Show Trend</h3>
            <Line
              data={{
                labels: trendData.map((d) => d.date),
                datasets: [
                  {
                    label: "Missed Appointments",
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
        </div>
      )}

      {/* REBOOK / ESCALATE MODAL */}
      {selectedApt && actionType && (
        <div className="manage-box" style={{ marginTop: "20px" }}>
          <div className="manage-header">
            <h3>{actionType === "rebook" ? "📞 Create New Rebook Appointment" : "⚠️ Escalate Patient"}</h3>
            <button className="close-btn" onClick={() => setSelectedApt(null)}>✖</button>
          </div>
          
          <div className="modal-content">
            <p><strong>Patient:</strong> {selectedApt.patientName}</p>
            <p><strong>Missed Date:</strong> {selectedApt.date} at {selectedApt.time}</p>
            <p><strong>Doctor:</strong> {getDoctorName(selectedApt.doctorId)}</p>
            
            {actionType === "rebook" && (
              <div className="rebook-inputs">
                <div className="input-group">
                  <label htmlFor="rebook-date">New Appointment Date:</label>
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
            
            {actionType === "escalate" && (
              <p style={{ color: "#d97706", marginTop: "10px" }}>
                Escalating this patient will notify management of repeated missed appointments.
              </p>
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