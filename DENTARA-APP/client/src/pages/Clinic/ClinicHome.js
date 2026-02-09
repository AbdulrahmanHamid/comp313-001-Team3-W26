import React, { useEffect, useState } from "react";
import { listenToTasks, updateTaskStatus } from "../../services/tasksService";
import { listenToAllAppointments } from "../../services/appointmentsService";
import { useNavigate } from "react-router-dom";
import "../../styles/ClinicDashboard.css";

const ClinicHome = () => {
  const navigate = useNavigate();
  const [tasks, setTasks] = useState([]);
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
      const todayStr = new Date().toISOString().split('T')[0];
      const count = allAppts.filter(a => a.date === todayStr && a.status === "No-Show").length;
      setNoShowCount(count);
    });
    return () => unsubscribe();
  }, []);

  const handleToggleTask = async (id) => {
    await updateTaskStatus(id, "Completed");
  };
  return (
    <div className="clinic-home-container">
      <div className="clinic-cards">
        <div className="card"><h4>Daily Production</h4><p>$-- (Coming Soon)</p></div>
        <div className="card"><h4>Collections</h4><p>$-- (Coming Soon)</p></div>
      </div>

      <div className="clinic-content">
          <div className="schedule-box">
          <h3>TODAY’S SCHEDULE</h3>
          <div className="placeholder-content">
            <span className="placeholder-icon">📅</span>
            <p><strong>Schedule View</strong></p>
            <p className="placeholder-subtext">Coming in Release 2.0</p>
            <button className="clinic-btn-small" onClick={() => navigate('/staff-dashboard/appointments')}>
                Go to Appointment List
            </button>
          </div>
        </div>

        <div className="tasks-box">
          <h3>
            TASKS 
            <span className="urgency-toggle" onClick={() => setSortAsc(!sortAsc)} title="Toggle Sort">
                Urgency {sortAsc ? "↑" : "↓"}
            </span>
          </h3>
          
          {loadingTasks ? <p>Loading...</p> : tasks.length === 0 ? (
            <div className="empty-state">
                <p>✅ All caught up!</p>
                <button className="text-btn" onClick={() => navigate('/staff-dashboard/tasks')}>View All Tasks</button>
            </div>
          ) : (
            <ul className="task-list widget-list">
              {tasks.map(t => (
                <li key={t.id} className={`task-item ${t.priority === 'High' ? 'border-red' : ''}`}>
                  <label className="checkbox-label">
                    <input type="checkbox" onChange={() => handleToggleTask(t.id)} /> 
                    <span className="task-text">{t.task}</span>
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
            ? `⚠️ Alert: ${noShowCount} Patient(s) marked as No-Show today.` 
            : "✅ No missed check-ins or no-shows recorded today."}
      </div>
    </div>
  );
};

export default ClinicHome;