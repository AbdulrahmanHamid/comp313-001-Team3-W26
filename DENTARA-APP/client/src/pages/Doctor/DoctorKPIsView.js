import React, { useEffect, useState, useRef } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { listenToDoctorAppointments } from "../../services/doctorService";
import { getTodayLocal } from "../../utils/dateUtils";
import Chart from "chart.js/auto";
import "../../styles/DoctorDashboard.css";

const DoctorKPIsView = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const chartRef = useRef(null);
  const chartInstance = useRef(null);

  // Load Appointment Data
  useEffect(() => {
    if (!currentUser) return;

    const today = getTodayLocal();
    const unsubscribe = listenToDoctorAppointments(
      currentUser.uid,
      today,
      (appointmentsList) => {
        const total = appointmentsList.length;
        const completed = appointmentsList.filter(a => a.status === "Completed").length;
        const pending = appointmentsList.filter(a => a.status === "Pending" || a.status === "Confirmed").length;
        const checkedIn = appointmentsList.filter(a => a.status === "Checked-in").length;
        const cancelled = appointmentsList.filter(a => a.status === "Cancelled").length;
        const noShows = appointmentsList.filter(a => a.status === "No-Show").length;

        setStats({
          total,
          completed,
          pending,
          checkedIn,
          cancelled,
          noShows
        });

        setLoading(false);
      }
    );

    return unsubscribe;
  }, [currentUser]);

  // Render Chart AFTER stats load
  useEffect(() => {
    if (loading || !stats) return;       
    if (!chartRef.current) return;       

    // Destroy old chart
    if (chartInstance.current) {
      chartInstance.current.destroy();
      chartInstance.current = null;
    }

    const ctx = chartRef.current.getContext("2d");
    chartInstance.current = new Chart(ctx, {
      type: "bar",
      data: {
        labels: ["Total", "Completed", "Pending", "Checked-in", "Cancelled", "No-Shows"],
        datasets: [
          {
            label: "Daily Appointments Breakdown",
            data: [
              stats.total,
              stats.completed,
              stats.pending,
              stats.checkedIn,
              stats.cancelled,
              stats.noShows,
            ],
            backgroundColor: ["#7e5cfb","#22c55e","#f59e0b","#3b82f6","#dc2626","#ef4444"],
            borderWidth: 1,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: { beginAtZero: true }
        }
      }
    });
  }, [stats, loading]);

  // UI RENDER
  if (loading) {
    return <div className="doctor-home"><p>Loading KPIs...</p></div>;
  }

  return (
    <div className="doctor-home">
      <button className="action-btn" onClick={() => navigate(-1)}>
        ← Back
      </button>

      <h2>📊 Daily KPI Report</h2>
      <p style={{ color: "#666", fontSize: "0.9rem" }}>
        {new Date().toLocaleDateString("en-US", {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric"
        })}
      </p>

      <div className="kpi-grid">
        <div className="kpi-card">
          <h4>📋 Total</h4>
          <p className="kpi-number">{stats.total}</p>
        </div>
        <div className="kpi-card">
          <h4>✅ Completed</h4>
          <p className="kpi-number">{stats.completed}</p>
          <small>{stats.total ? ((stats.completed / stats.total) * 100).toFixed(0) : 0}%</small>
        </div>
        <div className="kpi-card">
          <h4>⏳ Pending</h4>
          <p className="kpi-number">{stats.pending}</p>
        </div>
        <div className="kpi-card">
          <h4>✔ Checked-in</h4>
          <p className="kpi-number">{stats.checkedIn}</p>
        </div>
        <div className="kpi-card">
          <h4>❌ Cancelled</h4>
          <p className="kpi-number">{stats.cancelled}</p>
        </div>
        <div className="kpi-card">
          <h4>🚫 No-Shows</h4>
          <p className="kpi-number">{stats.noShows}</p>
        </div>
      </div>

      <div className="chart-container">
        <canvas ref={chartRef}></canvas>
      </div>
    </div>
  );
};

export default DoctorKPIsView;