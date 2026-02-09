import React, { useEffect, useState } from "react";
import {
  listenToTasks,
  addTask,
  updateTaskStatus,
} from "../../../services/tasksService";
import "../../../styles/Tasks.css";

const TaskList = () => {
  const [tasks, setTasks] = useState([]);
  const [showModal, setShowModal] = useState(false);

  // Search + filter
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  // New task form
  const [newTask, setNewTask] = useState({
    task: "",
    assignedTo: "",
    priority: "Medium",
    dueDate: "",
    notes: "",
  });

  // 🔵 BACKEND SYNC — Your Assigned Iteration 1 Task
  useEffect(() => {
    const unsubscribe = listenToTasks((updatedTasks) => {
      setTasks(updatedTasks);
    });

    return () => unsubscribe();
  }, []);

  // 🔵 Add task
  const handleAddTask = async () => {
    if (!newTask.task) return alert("Task name is required!");

    await addTask(newTask);
    setShowModal(false);

    setNewTask({
      task: "",
      assignedTo: "",
      priority: "Medium",
      dueDate: "",
      notes: "",
    });
  };

  // 🔵 Toggle status
  const handleStatusToggle = async (id, current) => {
    await updateTaskStatus(
      id,
      current === "Completed" ? "Pending" : "Completed"
    );
  };

  // 🔵 Apply search + status filter
  const filteredTasks = tasks
    .filter((t) =>
      t.task.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .filter((t) =>
      statusFilter === "All" ? true : t.status === statusFilter
    );

  return (
    <div className="tab-content">

      {/* Header */}
      <div className="task-header">
        <h3>Task List</h3>
        <button className="green-btn" onClick={() => setShowModal(true)}>
          + Add New Task
        </button>
      </div>

      {/* Search + Filter */}
      <div className="task-search">
        <input
          type="text"
          placeholder="Search tasks..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="All">All</option>
          <option value="Pending">Pending</option>
          <option value="Completed">Completed</option>
        </select>
      </div>

      {/* Summary Cards */}
      <div className="task-cards-container">
        <div className="task-card blue">
          <h4>Total Tasks</h4>
          <p>{tasks.length}</p>
        </div>

        <div className="task-card orange">
          <h4>Pending</h4>
          <p>{tasks.filter((t) => t.status === "Pending").length}</p>
        </div>

        <div className="task-card green">
          <h4>Completed</h4>
          <p>{tasks.filter((t) => t.status === "Completed").length}</p>
        </div>

        <div className="task-card red">
          <h4>High Priority</h4>
          <p>{tasks.filter((t) => t.priority === "High").length}</p>
        </div>
      </div>

      {/* Task Table */}
      <table className="module-table">
        <thead>
          <tr>
            <th>Task</th>
            <th>Assigned</th>
            <th>Priority</th>
            <th>Due</th>
            <th>Status</th>
            <th>Action</th>
          </tr>
        </thead>

        <tbody>
          {filteredTasks.map((t) => (
            <tr key={t.id}>
              <td>{t.task}</td>
              <td>{t.assignedTo || "—"}</td>

              <td>
                <span className={`priority ${t.priority.toLowerCase()}`}>
                  {t.priority}
                </span>
              </td>

              <td>{t.dueDate || "—"}</td>

              <td>
                <span className={`status-tag ${t.status.toLowerCase()}`}>
                  {t.status}
                </span>
              </td>

              <td>
                <button
                  className="small-btn"
                  onClick={() => handleStatusToggle(t.id, t.status)}
                >
                  {t.status === "Completed" ? "↺ Reopen" : "✔ Complete"}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Add Task Modal */}
      {showModal && (
        <div className="task-modal">
          <div className="modal-content">
            <h3>Add New Task</h3>

            <input
              placeholder="Task Name"
              value={newTask.task}
              onChange={(e) =>
                setNewTask({ ...newTask, task: e.target.value })
              }
            />

            <select
              value={newTask.priority}
              onChange={(e) =>
                setNewTask({ ...newTask, priority: e.target.value })
              }
            >
              <option>High</option>
              <option>Medium</option>
              <option>Low</option>
            </select>

            <input
              type="date"
              value={newTask.dueDate}
              onChange={(e) =>
                setNewTask({ ...newTask, dueDate: e.target.value })
              }
            />

            <input
              placeholder="Assigned To (Optional)"
              value={newTask.assignedTo}
              onChange={(e) =>
                setNewTask({ ...newTask, assignedTo: e.target.value })
              }
            />

            <textarea
              placeholder="Notes (Optional)"
              value={newTask.notes}
              onChange={(e) =>
                setNewTask({ ...newTask, notes: e.target.value })
              }
            />

            <button className="green-btn" onClick={handleAddTask}>
              Save Task
            </button>
            <button
              className="cancel-btn"
              onClick={() => setShowModal(false)}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default TaskList;

