import React, { useEffect, useState } from "react";
import { listenToTasks } from "../../../services/tasksService";

const TaskSummary = () => {
  const [tasks, setTasks] = useState([]);

  // 🔵 Sync tasks from Firebase (same as TaskList)
  useEffect(() => {
    const unsubscribe = listenToTasks((updatedTasks) => {
      setTasks(updatedTasks);
    });

    return () => unsubscribe();
  }, []);

  const total = tasks.length;
  const pending = tasks.filter(t => t.status === "Pending").length;
  const completed = tasks.filter(t => t.status === "Completed").length;
  const highPriority = tasks.filter(t => t.priority === "High").length;

  return (
    <div className="tab-content task-summary-section">
      <h3>Today’s Task Summary</h3>

      <div className="summary-items">
        <div className="summary-card">Total: {total}</div>
        <div className="summary-card pending">Pending: {pending}</div>
        <div className="summary-card completed">Completed: {completed}</div>
        <div className="summary-card high">High Priority: {highPriority}</div>
      </div>

      <div className="summary-progress">
        <div
          className="bar"
          style={{ width: `${total ? (completed / total) * 100 : 0}%` }}
        ></div>
      </div>
    </div>
  );
};

export default TaskSummary;
