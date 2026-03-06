import React, { useEffect, useState } from "react";
import {
  listenToTasks,
  addTask,
  updateTaskStatus,
  updateTask
} from "../../../services/tasksService";
import { listenToStaff } from "../../../services/usersService";
import { useAuth } from "../../../contexts/AuthContext";
import "../../../styles/Tasks.css";

const TaskList = () => {
  const [tasks, setTasks] = useState([]);
  const [staffList, setStaffList] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const { currentUser } = useAuth();

  // Search + filter
  const [searchTerm, setSearchTerm] = useState("");
  // Default to "Pending"
  const [statusFilter, setStatusFilter] = useState("Pending");

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
    const unsubscribeTasks = listenToTasks((updatedTasks) => {
      setTasks(updatedTasks);
    });

    const unsubscribeStaff = listenToStaff((staff) => {
      setStaffList(staff);
    });

    return () => {
      unsubscribeTasks();
      unsubscribeStaff();
    };
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

  // 🔵 Take over a task
  const handleTakeOverTask = async (taskId) => {
    try {
      // Find the logged-in user in the staff list to get their Full Name instead of email
      const staffMember = staffList.find((s) => s.email === currentUser?.email);
      const claimName = staffMember ? staffMember.fullName : (currentUser?.email || "Staff Member");
      
      await updateTask(taskId, { assignedTo: claimName });
    } catch (e) {
      alert("Error assigning task");
    }
  };

  // 🔵 Apply search + status filter
  const filteredTasks = tasks
    .filter((t) =>
      t.task.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .filter((t) => {
      if (statusFilter === "All") return t.status !== "Completed";
      return t.status === statusFilter;
    });

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
          <option value="All">All (Active)</option>
          <option value="Pending">Pending</option>
          <option value="Completed">Completed</option>
        </select>
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
          {filteredTasks.length === 0 ? (
            <tr>
              <td colSpan="6" className="empty-state">
                No tasks found in this view.
              </td>
            </tr>
          ) : (
            filteredTasks.map((t) => (
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
                  <div className="recall-actions">
                    <button
                      className="small-btn"
                      onClick={() => handleStatusToggle(t.id, t.status)}
                    >
                      {t.status === "Completed" ? "↺ Reopen" : "✔ Complete"}
                    </button>

                    {t.status !== "Completed" && (
                      <button
                        className="small-btn clinic-btn-back"
                        onClick={() => handleTakeOverTask(t.id)}
                      >
                        Do this task
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))
          )}
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

            <select
              value={newTask.assignedTo}
              onChange={(e) =>
                setNewTask({ ...newTask, assignedTo: e.target.value })
              }
            >
              <option value="">Unassigned</option>
              {staffList.map((staff) => (
                <option key={staff.id} value={staff.fullName}>
                  {staff.fullName}
                </option>
              ))}
            </select>

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