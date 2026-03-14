import React, { useState, useEffect, useMemo } from "react";
import { useAuth } from "../../contexts/AuthContext";
import {
  listenToStaffAvailability,
  listenToAllStaffAvailability,
  blockTimeSlot,
  cancelAvailabilityBlock
} from "../../services/staffScheduleService";
import { listenToStaff } from "../../services/usersService";
import { getTodayLocal } from "../../utils/dateUtils";
import { db } from "../../firebase/firebaseConfig";
import { doc, getDoc } from "firebase/firestore";
import "../../styles/ClinicDashboard.css";

const StaffSchedule = () => {
  const { currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState("MySchedule");
  const [staffName, setStaffName] = useState("");
  const [loading, setLoading] = useState(true);

  // Calendar State
  const [currentMonth, setCurrentMonth] = useState(new Date());

  // My Schedule state
  const [myBlocks, setMyBlocks] = useState([]);
  const [selectedDate, setSelectedDate] = useState(getTodayLocal());
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    date: getTodayLocal(),
    startTime: "",
    endTime: "",
    reason: "",
    notes: ""
  });
  const [formError, setFormError] = useState("");

  // Staff Schedules tab state
  const [allStaff, setAllStaff] = useState([]);
  const [selectedStaffId, setSelectedStaffId] = useState("");
  const [allBlocks, setAllBlocks] = useState([]);
  const [staffFilterDate, setStaffFilterDate] = useState(getTodayLocal());

  useEffect(() => {
    if (!currentUser) return;
    const fetchName = async () => {
      const userDoc = await getDoc(doc(db, "users", currentUser.uid));
      if (userDoc.exists()) {
        const data = userDoc.data();
        const fullName = (data.firstName && data.lastName)
          ? `${data.firstName} ${data.lastName}`
          : data.email || "Staff Member";
        setStaffName(fullName);
      }
    };
    fetchName();
  }, [currentUser]);

  useEffect(() => {
    if (!currentUser) return;
    const unsub = listenToStaffAvailability(currentUser.uid, (blocks) => {
      setMyBlocks(blocks);
      setLoading(false);
    });
    return () => unsub();
  }, [currentUser]);

  useEffect(() => {
    const unsub = listenToStaff((list) => setAllStaff(list));
    return () => unsub();
  }, []);

  useEffect(() => {
    const unsub = listenToAllStaffAvailability((blocks) => setAllBlocks(blocks));
    return () => unsub();
  }, []);

  const filteredMyBlocks = useMemo(() => {
    if (!selectedDate) return myBlocks;
    return myBlocks.filter((b) => b.date === selectedDate);
  }, [myBlocks, selectedDate]);

  const filteredStaffBlocks = useMemo(() => {
    let filtered = allBlocks;
    if (selectedStaffId) {
      filtered = filtered.filter((b) => b.staffId === selectedStaffId);
    }
    return filtered;
  }, [allBlocks, selectedStaffId]);

  const selectedDayStaffBlocks = useMemo(() => {
    if (!staffFilterDate) return [];
    return filteredStaffBlocks.filter(b => b.date === staffFilterDate);
  }, [filteredStaffBlocks, staffFilterDate]);

  const handleBlockSubmit = async (e) => {
    e.preventDefault();
    setFormError("");

    if (!formData.date || !formData.startTime || !formData.endTime || !formData.reason) {
      setFormError("Please fill in all required fields.");
      return;
    }

    if (formData.endTime <= formData.startTime) {
      setFormError("End time must be after start time.");
      return;
    }

    try {
      await blockTimeSlot(currentUser.uid, staffName, formData);
      setFormData({ date: getTodayLocal(), startTime: "", endTime: "", reason: "", notes: "" });
      setShowAddForm(false);
    } catch (err) {
      setFormError(err.message || "Failed to block time slot.");
    }
  };

  const handleCancelBlock = async (blockId) => {
    if (!window.confirm("Cancel this availability block?")) return;
    try {
      await cancelAvailabilityBlock(blockId);
    } catch (err) {
      console.error("Error cancelling block:", err);
    }
  };

  const handlePrevMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  const handleNextMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));

  const renderCalendar = (blocksData, activeDate, setDateFn) => {
    const daysInMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate();
    const firstDayOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).getDay();

    const blanks = Array.from({ length: firstDayOfMonth }).map((_, i) => (
      <div key={`blank-${i}`} className="calendar-day empty"></div>
    ));

    const days = Array.from({ length: daysInMonth }).map((_, i) => {
      const dayNum = i + 1;
      const dateStr = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, "0")}-${String(dayNum).padStart(2, "0")}`;
      
      const dayBlocks = blocksData.filter((b) => b.date === dateStr);
      const isSelected = dateStr === activeDate;

      return (
        <div
          key={dayNum}
          className={`calendar-day ${isSelected ? "selected" : ""}`}
          onClick={() => {
             setDateFn(dateStr);
             // Also pre-fill the form date if clicking on My Schedule
             if (setDateFn === setSelectedDate) setFormData(prev => ({ ...prev, date: dateStr }));
          }}
        >
          <span className="day-number">{dayNum}</span>
          <div className="calendar-events">
            {dayBlocks.slice(0, 3).map((b) => (
              <div key={b.id} className="calendar-event-pill" title={`${b.startTime}-${b.endTime} (${b.staffName || 'Me'})`}>
                {b.startTime} - {b.staffName ? b.staffName.split(" ")[0] : b.reason}
              </div>
            ))}
            {dayBlocks.length > 3 && (
              <div className="calendar-event-pill" style={{ background: 'transparent', color: '#888' }}>
                +{dayBlocks.length - 3} more
              </div>
            )}
          </div>
        </div>
      );
    });

    return [...blanks, ...days];
  };

  if (loading) return <div className="clinic-page"><p>Loading Schedule...</p></div>;

  return (
    <div className="clinic-page">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
        <h2>📅 Staff Schedule</h2>
        <span style={{ color: "#666", fontSize: "14px" }}>Logged in as: <strong>{staffName}</strong></span>
      </div>

      <div className="tabs" style={{ marginBottom: "20px" }}>
        <button className={`tab-btn ${activeTab === "MySchedule" ? "active" : ""}`} onClick={() => setActiveTab("MySchedule")}>
          My Schedule
        </button>
        <button className={`tab-btn ${activeTab === "StaffSchedules" ? "active" : ""}`} onClick={() => setActiveTab("StaffSchedules")}>
          Clinic Overview
        </button>
      </div>

      {/* ============ TAB 1: MY SCHEDULE ============ */}
      {activeTab === "MySchedule" && (
        <div>
          {/* CALENDAR UI */}
          <div className="calendar-container">
            <div className="calendar-header">
              <button className="clinic-btn-small" onClick={handlePrevMonth}>← Prev Month</button>
              <h3>{currentMonth.toLocaleString('default', { month: 'long', year: 'numeric' })}</h3>
              <button className="clinic-btn-small" onClick={handleNextMonth}>Next Month →</button>
            </div>
            <div className="calendar-grid">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                <div key={day} className="calendar-day-name">{day}</div>
              ))}
              {renderCalendar(myBlocks, selectedDate, setSelectedDate)}
            </div>
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "15px" }}>
            <h3>Details for {selectedDate}</h3>
            <button className="clinic-btn-primary" onClick={() => setShowAddForm(!showAddForm)}>
              {showAddForm ? "✕ Cancel" : "+ Block Time"}
            </button>
          </div>

          {/* Block Time Form */}
          {showAddForm && (
            <div className="manage-box" style={{ marginBottom: "20px" }}>
              <h3 style={{ marginBottom: "12px" }}>Block Availability</h3>
              {formError && <p style={{ color: "#e74c3c", marginBottom: "10px", fontSize: "14px", fontWeight: "bold" }}>{formError}</p>}
              <form onSubmit={handleBlockSubmit}>
                <div className="manage-form">
                  <div className="form-group-half">
                    <label>Date *</label>
                    <input type="date" value={formData.date} onChange={(e) => setFormData({ ...formData, date: e.target.value })} required />
                  </div>
                  <div className="form-group-half">
                    <label>Reason *</label>
                    <select value={formData.reason} onChange={(e) => setFormData({ ...formData, reason: e.target.value })} required >
                      <option value="">Select Reason</option>
                      <option value="Sick Leave">Sick Leave</option>
                      <option value="Personal">Personal</option>
                      <option value="Vacation">Vacation</option>
                      <option value="Training">Training</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div className="form-group-half">
                    <label>Start Time *</label>
                    <input type="time" value={formData.startTime} onChange={(e) => setFormData({ ...formData, startTime: e.target.value })} required />
                  </div>
                  <div className="form-group-half">
                    <label>End Time *</label>
                    <input type="time" value={formData.endTime} onChange={(e) => setFormData({ ...formData, endTime: e.target.value })} required />
                  </div>
                  <div className="form-group-full">
                    <label>Notes (optional)</label>
                    <textarea value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} rows="2" placeholder="Any additional details..." />
                  </div>
                </div>
                <div style={{ display: "flex", gap: "10px", marginTop: "12px" }}>
                  <button type="submit" className="save-btn">Save Block</button>
                  <button type="button" className="cancel-btn" onClick={() => { setShowAddForm(false); setFormError(""); }}>Cancel</button>
                </div>
              </form>
            </div>
          )}

          {/* Details Table */}
          {filteredMyBlocks.length === 0 ? (
            <div className="manage-box" style={{ textAlign: "center", padding: "30px", color: "#888" }}>
              <p>No availability blocks for {selectedDate}.</p>
            </div>
          ) : (
            <table className="clinic-table">
              <thead>
                <tr><th>Time Range</th><th>Reason</th><th>Notes</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {filteredMyBlocks.map((block) => (
                  <tr key={block.id}>
                    <td>{block.startTime} – {block.endTime}</td>
                    <td><span className="status-badge status-pending">{block.reason}</span></td>
                    <td>{block.notes || "—"}</td>
                    <td><button className="cancel-btn" style={{ fontSize: "12px", padding: "4px 10px" }} onClick={() => handleCancelBlock(block.id)}>Cancel</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* ============ TAB 2: STAFF OVERVIEW ============ */}
      {activeTab === "StaffSchedules" && (
        <div>
          <div style={{ marginBottom: "15px" }}>
            <label style={{ fontSize: "14px", fontWeight: "bold", color: "#3c0094", marginRight: "10px" }}>Filter by Staff Member:</label>
            <select
              value={selectedStaffId}
              onChange={(e) => setSelectedStaffId(e.target.value)}
              className="kpi-filter-select"
              style={{ minWidth: "250px" }}
            >
              <option value="">All Staff</option>
              {allStaff.filter(s => s.id !== currentUser?.uid).map((s) => (
                <option key={s.id} value={s.id}>{s.fullName}</option>
              ))}
            </select>
          </div>

          {/* CALENDAR UI for All Staff */}
          <div className="calendar-container">
            <div className="calendar-header">
              <button className="clinic-btn-small" onClick={handlePrevMonth}>← Prev Month</button>
              <h3>{currentMonth.toLocaleString('default', { month: 'long', year: 'numeric' })}</h3>
              <button className="clinic-btn-small" onClick={handleNextMonth}>Next Month →</button>
            </div>
            <div className="calendar-grid">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                <div key={day} className="calendar-day-name">{day}</div>
              ))}
              {renderCalendar(filteredStaffBlocks, staffFilterDate, setStaffFilterDate)}
            </div>
          </div>

          <h3 style={{ marginBottom: "15px" }}>Staff Details for {staffFilterDate}</h3>
          {selectedDayStaffBlocks.length === 0 ? (
            <div className="manage-box" style={{ textAlign: "center", padding: "30px", color: "#888" }}>
              <p>No availability blocks found on {staffFilterDate}.</p>
            </div>
          ) : (
            <table className="clinic-table">
              <thead>
                <tr><th>Staff Member</th><th>Time Range</th><th>Reason</th><th>Notes</th></tr>
              </thead>
              <tbody>
                {selectedDayStaffBlocks.map((block) => (
                  <tr key={block.id}>
                    <td><strong>{block.staffName}</strong></td>
                    <td>{block.startTime} – {block.endTime}</td>
                    <td><span className="status-badge status-pending">{block.reason}</span></td>
                    <td>{block.notes || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
};

export default StaffSchedule;