import React, { useEffect, useState } from "react";
import { listenToTasks } from "../../../services/tasksService";
import { getTodayLocal } from "../../../utils/dateUtils";
import "../../../styles/Tasks.css";

const TaskSummary = () => {
  const [tasks, setTasks] = useState([]);

  // 🔵 Sync tasks from Firebase (same as TaskList)
  useEffect(() => {
    const unsubscribe = listenToTasks((updatedTasks) => {
      setTasks(updatedTasks);
    });

    return () => unsubscribe();
  }, []);

  const getMetrics = (filteredList) => {
    const total = filteredList.length;
    const pending = filteredList.filter((t) => t.status === "Pending").length;
    const completed = filteredList.filter((t) => t.status === "Completed").length;
    const highPriority = filteredList.filter((t) => t.priority === "High").length;
    return { total, pending, completed, highPriority };
  };

  const calculateMetricsForPeriod = (daysBack) => {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysBack);

    const filtered = tasks.filter((t) => {
      const taskDateStr = t.dueDate || t.createdAt; 
      if (!taskDateStr) return false;
      const taskDate = new Date(taskDateStr);
      return taskDate >= cutoffDate;
    });

    return getMetrics(filtered);
  };

  const getTodayMetrics = () => {
    const todayStr = getTodayLocal();
    const filtered = tasks.filter((t) => {
      const taskDateStr = t.dueDate || t.createdAt;
      if (!taskDateStr) return false;
      return taskDateStr.startsWith(todayStr); 
    });
    return getMetrics(filtered);
  };

  const periods = [
    { title: "Today's Summary", metrics: getTodayMetrics() },
    { title: "Last 7 Days Summary", metrics: calculateMetricsForPeriod(7) },
    { title: "Last Month Summary", metrics: calculateMetricsForPeriod(30) },
    { title: "Last 6 Months Summary", metrics: calculateMetricsForPeriod(180) },
    { title: "Last Year Summary", metrics: calculateMetricsForPeriod(365) },
  ];

  return (
    <div className="tab-content task-summary-section">
      {periods.map((period, index) => (
        <div key={index} style={{ marginBottom: "35px" }}>
          <h3>{period.title}</h3>

          <div className="summary-items">
            <div className="summary-card">Total: {period.metrics.total}</div>
            <div className="summary-card pending">Pending: {period.metrics.pending}</div>
            <div className="summary-card completed">Completed: {period.metrics.completed}</div>
            <div className="summary-card high">High Priority: {period.metrics.highPriority}</div>
          </div>

          <div className="summary-progress" style={{ marginTop: "15px" }}>
            <div
              className="bar"
              style={{ width: `${period.metrics.total ? (period.metrics.completed / period.metrics.total) * 100 : 0}%` }}
            ></div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default TaskSummary;