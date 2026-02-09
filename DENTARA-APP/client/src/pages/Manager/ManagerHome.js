import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getClinicKPIs, listenToAllAlerts } from "../../services/managerService";
import "../../styles/ManagerDashboard.css";

const ManagerHome = () => {
  const navigate = useNavigate();
  const [kpis, setKpis] = useState(null);
  const [recentAlerts, setRecentAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // KPIs
    const fetchKPIs = async () => {
      const kpiData = await getClinicKPIs();
      setKpis(kpiData);
      setLoading(false);
    };
    const unsubAlerts = listenToAllAlerts((list) => {
      // Filter for only open/urgent alerts and take the top 3 for the dashboard
      const urgent = list
        .filter(a => a.status !== "Resolved")
        .slice(0, 3);
      setRecentAlerts(urgent);
    });

    fetchKPIs();
    return () => unsubAlerts();
  }, []);

  if (loading) return <div className="manager-main"><p>Loading Dashboard...</p></div>;

  return (
    <div className="manager-home">

      {/*CLINIC KPIs OVERVIEW */}
      <section className="kpi-summary">
        <h3>Clinic Performance Overview</h3>
        <div className="kpi-grid">
          <div className="kpi-card">
            <h4>Total Appointments</h4>
            <p className="kpi-number">{kpis?.total || 0}</p>
          </div>
          <div className="kpi-card">
            <h4>Completed</h4>
            <p className="kpi-number" style={{ color: "#22c55e" }}>{kpis?.completed || 0}</p>
          </div>
          <div className="kpi-card">
            <h4>Efficiency Rate</h4>
            <p className="kpi-number" style={{ color: "#7e5cfb" }}>{kpis?.efficiency || 0}%</p>
          </div>
          <div className="kpi-card">
            <h4>No-Shows</h4>
            <p className="kpi-number" style={{ color: "#ff4444" }}>{kpis?.noShows || 0}</p>
          </div>
        </div>
      </section>

      <div className="middle-panels">

        {/* M1.2: QUICK ALERTS FEED */}
        <section className="alerts">
          <div className="section-header">
            <h3>⚠️ Urgent Alerts</h3>
            <button className="btn-sm btn-outline" onClick={() => navigate('/manager-dashboard/alerts')}>
              View All
            </button>
          </div>

          {recentAlerts.length === 0 ? (
            <p className="no-data">No urgent alerts pending.</p>
          ) : (
            recentAlerts.map(alert => (
              <div key={alert.id} className={`alert-card ${alert.priority === 'High' ? 'alert-high' : ''}`}>
                <div className="alert-header">
                  <strong>{alert.patientName}</strong>
                  <span className={`priority-tag ${alert.priority.toLowerCase()}`}>{alert.priority}</span>
                </div>
                <p className="alert-message">{alert.message}</p>
                <small>Assigned to: {alert.doctorName}</small>
              </div>
            ))
          )}
        </section>

        {/* KPI Trends Placeholder (M5 Drilldowns will go here in future) */}
        <section className="schedule">
          <h3>Weekly Trends</h3>
          <div className="chart-placeholder">
            <p style={{ color: "#666" }}>Chart visualization coming in Report Update</p>
          </div>
        </section>
      </div>

      {/* QUICK ACTIONS */}
      <section className="quick-actions">
        <h3>Quick Actions</h3>
        <div className="quick-buttons">
          <button className="kpi-button" onClick={() => navigate('/manager-dashboard/alerts')}>
            + Assign Alert
          </button>
          <button className="kpi-button" onClick={() => navigate('/manager-dashboard/dataCenter')}>
            Data Center
          </button>
        </div>
      </section>
    </div>
  );
};

export default ManagerHome;