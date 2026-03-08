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

  // Tab state
  const [activeTab, setActiveTab] = useState("MySchedule");

  // Current staff info
  const [staffName, setStaffName] = useState("");

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
  const [loading, setLoading] = useState(true);

  // Staff Schedules tab state
  const [allStaff, setAllStaff] = useState([]);
  const [selectedStaffId, setSelectedStaffId] = useState("");
  const [allBlocks, setAllBlocks] = useState([]);
  const [staffFilterDate, setStaffFilterDate] = useState("");

  // Fetch current staff name from Firestore
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

  // Listen to current staff's availability blocks
  useEffect(() => {
    if (!currentUser) return;
    const unsub = listenToStaffAvailability(currentUser.uid, (blocks) => {
      setMyBlocks(blocks);
      setLoading(false);
    });
    return () => unsub();
  }, [currentUser]);

  // Listen to staff list for dropdown
  useEffect(() => {
    const unsub = listenToStaff((list) => setAllStaff(list));
    return () => unsub();
  }, []);

  // Listen to all staff availability (for Staff Schedules tab)
  useEffect(() => {
    const unsub = listenToAllStaffAvailability((blocks) => setAllBlocks(blocks));
    return () => unsub();
  }, []);

  // Filter my blocks by selected date
  const filteredMyBlocks = useMemo(() => {
    if (!selectedDate) return myBlocks;
    return myBlocks.filter((b) => b.date === selectedDate);
  }, [myBlocks, selectedDate]);

  // Stats for selected date
  const stats = useMemo(() => {
    const dayBlocks = filteredMyBlocks;
    const totalBlocks = dayBlocks.length;
    let totalMinutes = 0;
    dayBlocks.forEach((b) => {
      const [sh, sm] = b.startTime.split(":").map(Number);
      const [eh, em] = b.endTime.split(":").map(Number);
      totalMinutes += (eh * 60 + em) - (sh * 60 + sm);
    });
    const totalHours = (totalMinutes / 60).toFixed(1);
    return { totalBlocks, totalHours };
  }, [filteredMyBlocks]);

  // Filter blocks for Staff Schedules tab
  const filteredStaffBlocks = useMemo(() => {
    let filtered = allBlocks;
    if (selectedStaffId) {
      filtered = filtered.filter((b) => b.staffId === selectedStaffId);
    }
    if (staffFilterDate) {
      filtered = filtered.filter((b) => b.date === staffFilterDate);
    }
    return filtered;
  }, [allBlocks, selectedStaffId, staffFilterDate]);

  // Handle block form submission
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

    if (formData.date < getTodayLocal()) {
      setFormError("Cannot block past dates.");
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

  // Handle cancel block
  const handleCancelBlock = async (blockId) => {
    if (!window.confirm("Cancel this availability block?")) return;
    try {
      await cancelAvailabilityBlock(blockId);
    } catch (err) {
      console.error("Error cancelling block:", err);
    }
  };

  if (loading) {
    return <div className="clinic-page"><p>Loading Schedule...</p></div>;
  }

  return (
    <div className="clinic-page">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
        <h2>📅 Staff Schedule</h2>
        <span style={{ color: "#666", fontSize: "14px" }}>Logged in as: <strong>{staffName}</strong></span>
      </div>

      {/* Tabs */}
      <div className="tabs" style={{ marginBottom: "20px" }}>
        <button
          className={`tab-btn ${activeTab === "MySchedule" ? "active" : ""}`}
          onClick={() => setActiveTab("MySchedule")}
        >
          My Schedule
        </button>
        <button
          className={`tab-btn ${activeTab === "StaffSchedules" ? "active" : ""}`}
          onClick={() => setActiveTab("StaffSchedules")}
        >
          Staff Schedules
        </button>
      </div>

      {/* ============ TAB 1: MY SCHEDULE ============ */}
      {activeTab === "MySchedule" && (
        <div>
          {/* Date Picker + Block Button */}
          <div style={{ display: "flex", gap: "12px", alignItems: "center", marginBottom: "16px", flexWrap: "wrap" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <label style={{ fontWeight: "600", fontSize: "14px" }}>Date:</label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                style={{ padding: "8px 12px", borderRadius: "8px", border: "1px solid #ccc", fontSize: "14px" }}
              />
            </div>
            <button
              className="save-btn"
              onClick={() => setShowAddForm(!showAddForm)}
              style={{ marginLeft: "auto" }}
            >
              {showAddForm ? "✕ Cancel" : "+ Block Time"}
            </button>
          </div>

          {/* Summary Stats */}
          <div style={{ display: "flex", gap: "16px", marginBottom: "20px", flexWrap: "wrap" }}>
            <div className="manage-box" style={{ flex: "1", minWidth: "180px", textAlign: "center", padding: "16px" }}>
              <div style={{ fontSize: "28px", fontWeight: "700", color: "#7e5cfb" }}>{stats.totalBlocks}</div>
              <div style={{ fontSize: "13px", color: "#666" }}>Blocked Slots</div>
            </div>
            <div className="manage-box" style={{ flex: "1", minWidth: "180px", textAlign: "center", padding: "16px" }}>
              <div style={{ fontSize: "28px", fontWeight: "700", color: "#e67e22" }}>{stats.totalHours}h</div>
              <div style={{ fontSize: "13px", color: "#666" }}>Hours Blocked</div>
            </div>
            <div className="manage-box" style={{ flex: "1", minWidth: "180px", textAlign: "center", padding: "16px" }}>
              <div style={{ fontSize: "28px", fontWeight: "700", color: "#27ae60" }}>{myBlocks.length}</div>
              <div style={{ fontSize: "13px", color: "#666" }}>Total Active Blocks</div>
            </div>
          </div>

          {/* Block Time Form */}
          {showAddForm && (
            <div className="manage-box" style={{ marginBottom: "20px" }}>
              <h3 style={{ marginBottom: "12px" }}>Block Availability</h3>
              {formError && (
                <p style={{ color: "#e74c3c", marginBottom: "10px", fontSize: "14px" }}>{formError}</p>
              )}
              <form onSubmit={handleBlockSubmit}>
                <div className="manage-form">
                  <div className="form-group-half">
                    <label>Date *</label>
                    <input
                      type="date"
                      value={formData.date}
                      onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                      required
                    />
                  </div>
                  <div className="form-group-half">
                    <label>Reason *</label>
                    <select
                      value={formData.reason}
                      onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                      required
                    >
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
                    <input
                      type="time"
                      value={formData.startTime}
                      onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                      required
                    />
                  </div>
                  <div className="form-group-half">
                    <label>End Time *</label>
                    <input
                      type="time"
                      value={formData.endTime}
                      onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                      required
                    />
                  </div>
                  <div className="form-group-full">
                    <label>Notes (optional)</label>
                    <textarea
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      rows="2"
                      placeholder="Any additional details..."
                    />
                  </div>
                </div>
                <div style={{ display: "flex", gap: "10px", marginTop: "12px" }}>
                  <button type="submit" className="save-btn">Save Block</button>
                  <button type="button" className="cancel-btn" onClick={() => { setShowAddForm(false); setFormError(""); }}>Cancel</button>
                </div>
              </form>
            </div>
          )}

          {/* Blocked Time Slots Table */}
          {filteredMyBlocks.length === 0 ? (
            <div className="manage-box" style={{ textAlign: "center", padding: "40px", color: "#888" }}>
              <p>No availability blocks for {selectedDate}.</p>
              <p style={{ fontSize: "13px" }}>Click "Block Time" to add one.</p>
            </div>
          ) : (
            <table className="clinic-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Time Range</th>
                  <th>Reason</th>
                  <th>Notes</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredMyBlocks.map((block) => (
                  <tr key={block.id}>
                    <td>{block.date}</td>
                    <td>{block.startTime} – {block.endTime}</td>
                    <td>
                      <span className="status-badge status-pending">{block.reason}</span>
                    </td>
                    <td>{block.notes || "—"}</td>
                    <td>
                      <button
                        className="cancel-btn"
                        style={{ fontSize: "12px", padding: "4px 10px" }}
                        onClick={() => handleCancelBlock(block.id)}
                      >
                        Cancel
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* ============ TAB 2: STAFF SCHEDULES (READ-ONLY) ============ */}
      {activeTab === "StaffSchedules" && (
        <div>
          {/* Filters */}
          <div style={{ display: "flex", gap: "12px", alignItems: "center", marginBottom: "20px", flexWrap: "wrap" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
              <label style={{ fontSize: "12px", fontWeight: "600", color: "#555" }}>Staff Member</label>
              <select
                value={selectedStaffId}
                onChange={(e) => setSelectedStaffId(e.target.value)}
                style={{ padding: "8px 12px", borderRadius: "8px", border: "1px solid #ccc", fontSize: "14px", minWidth: "200px" }}
              >
                <option value="">All Staff</option>
                {allStaff
                  .filter((s) => s.id !== currentUser?.uid)
                  .map((s) => (
                    <option key={s.id} value={s.id}>{s.fullName}</option>
                  ))
                }
              </select>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
              <label style={{ fontSize: "12px", fontWeight: "600", color: "#555" }}>Filter by Date</label>
              <input
                type="date"
                value={staffFilterDate}
                onChange={(e) => setStaffFilterDate(e.target.value)}
                style={{ padding: "8px 12px", borderRadius: "8px", border: "1px solid #ccc", fontSize: "14px" }}
              />
            </div>
            {(selectedStaffId || staffFilterDate) && (
              <button
                className="cancel-btn"
                style={{ alignSelf: "flex-end" }}
                onClick={() => { setSelectedStaffId(""); setStaffFilterDate(""); }}
              >
                Clear Filters
              </button>
            )}
          </div>

          {/* Staff Blocks Table */}
          {filteredStaffBlocks.length === 0 ? (
            <div className="manage-box" style={{ textAlign: "center", padding: "40px", color: "#888" }}>
              <p>No availability blocks found{selectedStaffId ? " for this staff member" : ""}{staffFilterDate ? ` on ${staffFilterDate}` : ""}.</p>
            </div>
          ) : (
            <table className="clinic-table">
              <thead>
                <tr>
                  <th>Staff Member</th>
                  <th>Date</th>
                  <th>Time Range</th>
                  <th>Reason</th>
                  <th>Notes</th>
                </tr>
              </thead>
              <tbody>
                {filteredStaffBlocks.map((block) => (
                  <tr key={block.id}>
                    <td><strong>{block.staffName}</strong></td>
                    <td>{block.date}</td>
                    <td>{block.startTime} – {block.endTime}</td>
                    <td>
                      <span className="status-badge status-pending">{block.reason}</span>
                    </td>
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
