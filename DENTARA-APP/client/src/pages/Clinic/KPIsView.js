import React, { useState, useEffect, useMemo } from "react";
import { listenToAllAppointments } from "../../services/appointmentsService";
import { listenToTasks } from "../../services/tasksService";
import { listenToAllPatients } from "../../services/patientsService";
import { getTodayLocal, formatDateLocal } from "../../utils/dateUtils";
import { Line, Doughnut } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from "chart.js";
import "../../styles/ClinicDashboard.css";

// Register Chart.js elements
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, ArcElement, Title, Tooltip, Legend, Filler);

const KPIsView = () => {
  // 🔵 Data States
  const [appointments, setAppointments] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [patients, setPatients] = useState([]);
  
  // 🔵 UI States
  const [timeFilter, setTimeFilter] = useState("7days"); // Options: today, 7days, 30days, year

  // 🔵 Fetch all data on mount
  useEffect(() => {
    const unsubAppts = listenToAllAppointments(setAppointments);
    const unsubTasks = listenToTasks(setTasks);
    const unsubPatients = listenToAllPatients(setPatients);

    return () => {
      unsubAppts();
      unsubTasks();
      unsubPatients();
    };
  }, []);

  // 🔵 Date Range Calculator (Bug-Free local dates)
  const dateRange = useMemo(() => {
    const today = new Date();
    let startDate = new Date();

    if (timeFilter === "today") startDate.setDate(today.getDate());
    else if (timeFilter === "7days") startDate.setDate(today.getDate() - 6);
    else if (timeFilter === "30days") startDate.setDate(today.getDate() - 29);
    else if (timeFilter === "year") startDate.setFullYear(today.getFullYear() - 1);

    return {
      startStr: formatDateLocal(startDate),
      endStr: getTodayLocal()
    };
  }, [timeFilter]);

  // 🔵 Filtered Data based on Date Range
  const filteredData = useMemo(() => {
    const { startStr, endStr } = dateRange;

    // Filter Appointments
    const appts = appointments.filter(a => a.date >= startStr && a.date <= endStr);
    
    // Filter Tasks (Using createdAt or dueDate)
    const activeTasks = tasks.filter(t => {
      const taskDate = (t.createdAt || "").split("T")[0];
      return taskDate >= startStr && taskDate <= endStr;
    });

    // Filter New Patients
    const newPatients = patients.filter(p => {
      const pDate = (p.createdAt || "").split("T")[0];
      return pDate >= startStr && pDate <= endStr;
    });

    return { appts, activeTasks, newPatients };
  }, [appointments, tasks, patients, dateRange]);

  // 🔵 Calculate Core Metrics
  const metrics = useMemo(() => {
    const { appts, activeTasks, newPatients } = filteredData;

    const completedAppts = appts.filter(a => a.status === "Completed").length;
    const noShows = appts.filter(a => a.status === "No-Show").length;
    const cancelled = appts.filter(a => a.status === "Cancelled").length;
    
    // Proxy for production: Assume avg $150 per completed appointment for the demo
    const estimatedProduction = completedAppts * 150;

    const completedTasks = activeTasks.filter(t => t.status === "Completed").length;
    const taskCompletionRate = activeTasks.length > 0 
      ? Math.round((completedTasks / activeTasks.length) * 100) 
      : 0;

    return {
      totalAppts: appts.length,
      completedAppts,
      noShows,
      cancelled,
      estimatedProduction,
      newPatientsCount: newPatients.length,
      taskCompletionRate
    };
  }, [filteredData]);

  // 🔵 Chart Data Generation
  const chartData = useMemo(() => {
    const { appts } = filteredData;
    const { startStr, endStr } = dateRange;

    // 1. Line Chart: Appointments over the selected period
    const dateMap = {};
    let currDate = new Date(startStr);
    const end = new Date(endStr);
    
    // Initialize empty dates
    while (currDate <= end) {
      dateMap[formatDateLocal(currDate)] = 0;
      currDate.setDate(currDate.getDate() + 1);
    }
    
    // Populate counts
    appts.forEach(a => {
      if (dateMap[a.date] !== undefined) {
        dateMap[a.date] += 1;
      }
    });

    const trendLabels = Object.keys(dateMap);
    const trendValues = Object.values(dateMap);

    // 2. Doughnut Chart: Status Breakdown
    const statusCounts = {
      "Pending/Confirmed": appts.filter(a => a.status === "Pending" || a.status === "Confirmed").length,
      "Completed": appts.filter(a => a.status === "Completed").length,
      "No-Show/Cancelled": appts.filter(a => a.status === "No-Show" || a.status === "Cancelled").length,
    };

    return {
      trend: {
        labels: trendLabels,
        datasets: [{
          label: "Total Appointments",
          data: trendValues,
          borderColor: "#7e5cfb",
          backgroundColor: "rgba(126, 92, 251, 0.1)",
          fill: true,
          tension: 0.3
        }]
      },
      breakdown: {
        labels: Object.keys(statusCounts),
        datasets: [{
          data: Object.values(statusCounts),
          backgroundColor: ["#f1c40f", "#22c55e", "#ff4444"],
          borderWidth: 0
        }]
      }
    };
  }, [filteredData, dateRange]);

  return (
    <div className="clinic-content-box kpi-dashboard">
      <div className="clinic-page-header">
        <h2>📊 Clinic Performance & KPIs</h2>
        
        <div className="kpi-filter-bar">
          <label>Date Range: </label>
          <select 
            className="kpi-filter-select"
            value={timeFilter}
            onChange={(e) => setTimeFilter(e.target.value)}
          >
            <option value="today">Today</option>
            <option value="7days">Last 7 Days</option>
            <option value="30days">Last 30 Days</option>
            <option value="year">Past Year</option>
          </select>
        </div>
      </div>

      <hr className="kpi-divider" />

      {/* TOP ROW: Quick Stat Cards */}
      <div className="kpi-grid-top">
        <div className="kpi-stat-card">
          <h4>Estimated Production</h4>
          <div className="kpi-stat-value text-purple">
            ${metrics.estimatedProduction.toLocaleString()}
          </div>
          <small>Based on completed appts</small>
        </div>

        <div className="kpi-stat-card">
          <h4>Total Appointments</h4>
          <div className="kpi-stat-value">{metrics.totalAppts}</div>
          <small>{metrics.noShows} No-Shows | {metrics.cancelled} Cancelled</small>
        </div>

        <div className="kpi-stat-card">
          <h4>New Patients</h4>
          <div className="kpi-stat-value text-green">{metrics.newPatientsCount}</div>
          <small>Registered in period</small>
        </div>

        <div className="kpi-stat-card">
          <h4>Task Completion</h4>
          <div className="kpi-stat-value text-orange">{metrics.taskCompletionRate}%</div>
          <small>Staff efficiency rate</small>
        </div>
      </div>

      {/* MIDDLE ROW: Charts */}
      <div className="kpi-charts-grid">
        <div className="kpi-chart-box">
          <h3>Appointment Volume Trend</h3>
          <div className="chart-wrapper line-chart">
            <Line 
              data={chartData.trend} 
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } }
              }} 
            />
          </div>
        </div>

        <div className="kpi-chart-box">
          <h3>Status Breakdown</h3>
          <div className="chart-wrapper doughnut-chart">
            <Doughnut 
              data={chartData.breakdown} 
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { position: "bottom" } }
              }} 
            />
          </div>
        </div>
      </div>

    </div>
  );
};

export default KPIsView;