import React, { useEffect, useState } from "react";
import { listenToTasks, updateTaskStatus } from "../../services/tasksService";
import { listenToAllAppointments } from "../../services/appointmentsService";
import { useNavigate } from "react-router-dom";
import { getTodayLocal } from "../../utils/dateUtils";
import { useAuth } from "../../contexts/AuthContext";
import "../../styles/ClinicDashboard.css";

const ClinicHome = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [todayAppts, setTodayAppts] = useState([]);
  const [loadingTasks, setLoadingTasks] = useState(true);
  const [sortAsc, setSortAsc] = useState(false);
  const [noShowCount, setNoShowCount] = useState(0);

  useEffect(() => {
    const unsubscribe = listenToTasks((allTasks) => {
      const pending = allTasks.filter(t => t.status === "Pending");
      const priorityVal = { "High": 3, "Medium": 2, "Low": 1 };
      
      pending.sort((a, b) => {
        const valA = priorityVal[a.priority] || 0;
        const valB = priorityVal[b.priority] || 0;
        return sortAsc ? valA - valB : valB - valA;
      });

      setTasks(pending.slice(0, 5));
      setLoadingTasks(false);
    });
    return () => unsubscribe();
  }, [sortAsc]);

  useEffect(() => {
    const unsubscribe = listenToAllAppointments((allAppts) => {
      const todayStr = getTodayLocal();
      
      const count = allAppts.filter(a => a.date === todayStr && a.status === "No-Show").length;
      setNoShowCount(count);

      const todays = allAppts.filter(a => a.date === todayStr);
      todays.sort((a, b) => (a.time || "").localeCompare(b.time || ""));
      setTodayAppts(todays);
    });
    return () => unsubscribe();
  }, []);

  const handleToggleTask = async (id) => {
    await updateTaskStatus(id, "Completed");
  };
  
  return (
    <div className="clinic-home-container">
      
      <h2 style={{ color: "#3c0094", margin: "0 0 20px 0" }}>Welcome back, {currentUser?.email}</h2>

      <div className="clinic-content">
        <div className="schedule-box">
          <h3>TODAY’S SCHEDULE</h3>
          
          {todayAppts.length === 0 ? (
            <div className="empty-state">
              <p>No appointments today.</p>
            </div>
          ) : (
            <ul className="task-list widget-list">
              {todayAppts.map(apt => (
                <li key={apt.id} className="task-item">
                  <strong>{apt.time || "No Time"}</strong> — {apt.patientName} <br/>
                  <small style={{ color: "#666" }}>
                    {apt.reason} (Dr. {apt.doctorName || "N/A"}) • <span className={`status-badge status-${(apt.status || "pending").toLowerCase().replace(" ", "-")}`}>{apt.status}</span>
                  </small>
                </li>
              ))}
            </ul>
          )}

          <button className="clinic-btn-small" onClick={() => navigate('/staff-dashboard/appointments')} style={{ marginTop: "15px" }}>
              Go to Appointment List
          </button>
        </div>

        <div className="tasks-box">
          <h3>
            MY TASKS 
            <span className="urgency-toggle" onClick={() => setSortAsc(!sortAsc)} title="Toggle Sort">
                Urgency {sortAsc ? "(Asc)" : "(Desc)"}
            </span>
          </h3>
          
          {loadingTasks ? <p>Loading...</p> : tasks.length === 0 ? (
            <div className="empty-state">
                <p>All caught up!</p>
                <button className="text-btn" onClick={() => navigate('/staff-dashboard/tasks')}>View All Tasks</button>
            </div>
          ) : (
            <ul className="task-list widget-list">
              {tasks.map(t => (
                <li key={t.id} className={`task-item ${t.priority === 'High' ? 'border-red' : ''}`}>
                  <label className="checkbox-label" style={{ display: "flex", alignItems: "center" }}>
                    <input type="checkbox" onChange={() => handleToggleTask(t.id)} /> 
                    {/* AC TEST M7-2: Clicking the task navigates to the relevant feature */}
                    <span 
                        className="task-text" 
                        onClick={() => navigate('/staff-dashboard/tasks')}
                        style={{ cursor: "pointer", color: "#3c0094", textDecoration: "underline", marginLeft: "8px" }}
                    >
                        {t.task}
                    </span>
                    {t.priority === 'High' && <span className="badge-urgent">URGENT</span>}
                  </label>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className={`alert-bar ${noShowCount > 0 ? "alert-urgent" : "alert-none"}`}>
        {noShowCount > 0 
            ? `Alert: ${noShowCount} Patient(s) marked as No-Show today.` 
            : "No missed check-ins or no-shows recorded today."}
      </div>
    </div>
  );
};

export default ClinicHome;