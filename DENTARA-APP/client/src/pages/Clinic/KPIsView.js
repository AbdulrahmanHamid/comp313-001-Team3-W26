
// export default KPIsView;
import React, { useEffect, useState, useRef } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../../firebase/firebaseConfig";
import Chart from "chart.js/auto";
import "../../styles/ClinicDashboard.css";

const KPIsView = () => {
  const [stats, setStats] = useState({
    total: 0,
    checkedIn: 0,
    cancelled: 0,
    pending: 0,
  });

  const chartRef = useRef(null);
  const chartInstance = useRef(null);

  useEffect(() => {
    const fetchAppointments = async () => {
      try {
        const apptSnap = await getDocs(collection(db, "appointments"));
        const apptList = apptSnap.docs.map((doc) => doc.data());

        const total = apptList.length;
        const checkedIn = apptList.filter((a) => a.status === "Checked-in").length;
        const cancelled = apptList.filter((a) => a.status === "Cancelled").length;
        const pending = apptList.filter((a) => a.status === "Pending").length;

        setStats({ total, checkedIn, cancelled, pending });

        // Render Chart
        renderChart({ total, checkedIn, cancelled, pending });
      } catch (error) {
        console.error("Error loading stats for chart:", error);
      }
    };

    fetchAppointments();
  }, []);

  // Chart.js Rendering Function
  const renderChart = (data) => {
    if (chartInstance.current) {
      chartInstance.current.destroy();
    }

    const ctx = chartRef.current.getContext("2d");

    chartInstance.current = new Chart(ctx, {
      type: "bar",
      data: {
        labels: ["Total", "Checked-in", "Pending", "Cancelled"],
        datasets: [
          {
            label: "Appointments Overview",
            data: [
              data.total,
              data.checkedIn,
              data.pending,
              data.cancelled,
            ],
            backgroundColor: [
              "#007bff",
              "#28a745",
              "#ffc107",
              "#dc3545",
            ],
          },
        ],
      },
      options: {
        responsive: true,
        plugins: {
          legend: { display: true },
        },
        scales: {
          y: { beginAtZero: true },
        },
      },
    });
  };

  return (
    <div className="clinic-page">
      <h2>Clinic KPIs Dashboard</h2>
      <p>Daily operational performance overview.</p>

      {/* KPI Cards */}
      <div className="clinic-cards">
        <div className="card">Total Appointments: {stats.total}</div>
        <div className="card">Checked-in: {stats.checkedIn}</div>
        <div className="card">Pending: {stats.pending}</div>
        <div className="card">Cancelled: {stats.cancelled}</div>
      </div>

      {/* Chart Section */}
      <div className="chart-area">
        <canvas ref={chartRef} height="120"></canvas>
      </div>
    </div>
  );
};

export default KPIsView;
