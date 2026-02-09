import React, { useState, useEffect } from "react";
import { listenToGoals, addGoal, updateGoal, deleteGoal } from "../../services/managerService";
import "../../styles/ManagerDashboard.css";

const ManagerGoals = () => {
  const [goals, setGoals] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    title: "",
    target: "",
    current: "0",
    unit: "$",
    deadline: ""
  });

  useEffect(() => {
    const unsubscribe = listenToGoals((list) => {
      setGoals(list);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Open Modal for New Goal
  const openNewGoal = () => {
    setEditingId(null);
    setFormData({ title: "", target: "", current: "0", unit: "$", deadline: "" });
    setShowModal(true);
  };

  // Open Modal for Editing
  const openEditGoal = (goal) => {
    setEditingId(goal.id);
    setFormData({
      title: goal.title,
      target: goal.target,
      current: goal.current,
      unit: goal.unit,
      deadline: goal.deadline
    });
    setShowModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!formData.title || !formData.target || !formData.deadline) return;

    try {
      if (editingId) {
        // UPDATE EXISTING
        await updateGoal(editingId, {
          title: formData.title,
          target: Number(formData.target),
          current: Number(formData.current),
          unit: formData.unit,
          deadline: formData.deadline
        });
        alert("Goal Updated Successfully!");
      } else {
        // CREATE NEW
        await addGoal({
          title: formData.title,
          target: Number(formData.target),
          current: Number(formData.current),
          unit: formData.unit,
          deadline: formData.deadline
        });
        alert("New Goal Set!");
      }
      setShowModal(false);
    } catch (error) {
      alert("Error saving goal: " + error.message);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Delete this goal?")) {
      await deleteGoal(id);
    }
  };

  // Helper to calculate percentage width
  const getProgressWidth = (current, target) => {
    const pct = (current / target) * 100;
    return pct > 100 ? 100 : pct;
  };

  return (
    <div className="manager-page">
      <div className="page-header">
        <h2>🎯 Clinic Goals</h2>
        <button className="btn-pill btn-purple" onClick={openNewGoal}>
          + Set New Goal
        </button>
      </div>

      {loading ? (
        <p>Loading Goals...</p>
      ) : goals.length === 0 ? (
        <div className="empty-state">
          <p>No goals set yet.</p>
        </div>
      ) : (
        <div className="goals-grid">
          {goals.map((goal) => (
            <div key={goal.id} className={`goal-card ${goal.status === "Achieved" ? "achieved" : ""}`}>
              <div className="goal-header">
                <h4>{goal.title}</h4>
                <div style={{display:'flex', gap:'5px'}}>
                   <button className="btn-icon-edit" onClick={() => openEditGoal(goal)}>✎</button>
                   <button className="btn-icon-danger" onClick={() => handleDelete(goal.id)}>🗑</button>
                </div>
              </div>
              
              <div className="goal-numbers">
                <span className="current">
                  {goal.unit === "$" ? "$" : ""}{goal.current}{goal.unit === "%" ? "%" : ""}
                </span>
                <span className="separator">/</span>
                <span className="target">
                  {goal.unit === "$" ? "$" : ""}{goal.target}{goal.unit === "%" ? "%" : ""} {goal.unit !== "$" && goal.unit !== "%" ? goal.unit : ""}
                </span>
              </div>

              <div className="progress-bar-bg">
                <div 
                  className={`progress-bar-fill ${goal.status === "Achieved" ? "fill-success" : ""}`}
                  style={{ width: `${getProgressWidth(goal.current, goal.target)}%` }}
                ></div>
              </div>

              <div className="goal-footer">
                <small>Deadline: {goal.deadline}</small>
                {/* Replaced 'Update Progress' link with the main Edit button in header */}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Shared Modal for Create & Edit */}
      {showModal && (
        <div className="manage-box">
          <div className="manage-header">
            <h3>{editingId ? "Edit Goal Details" : "Set New Goal"}</h3>
            <button className="close-btn" onClick={() => setShowModal(false)}>✖</button>
          </div>
          <form onSubmit={handleSave} className="manage-form">
            <div className="form-group-full">
              <label>Goal Title</label>
              <input 
                className="form-input" 
                value={formData.title}
                onChange={e => setFormData({...formData, title: e.target.value})}
                required
              />
            </div>
            
            <div className="form-group-half">
              <label>Current Progress</label>
              <input 
                className="form-input" 
                type="number" 
                value={formData.current}
                onChange={e => setFormData({...formData, current: e.target.value})}
                required
              />
            </div>

            <div className="form-group-half">
              <label>Target Value</label>
              <input 
                className="form-input" 
                type="number" 
                value={formData.target}
                onChange={e => setFormData({...formData, target: e.target.value})}
                required
              />
            </div>

            <div className="form-group-half">
              <label>Unit</label>
              <select 
                className="form-input"
                value={formData.unit}
                onChange={e => setFormData({...formData, unit: e.target.value})}
              >
                <option value="$">Currency ($)</option>
                <option value="Patients">Patients</option>
                <option value="%">Percentage (%)</option>
                <option value="Appts">Appointments</option>
              </select>
            </div>

            <div className="form-group-half">
              <label>Deadline</label>
              <input 
                className="form-input" 
                type="date" 
                value={formData.deadline}
                onChange={e => setFormData({...formData, deadline: e.target.value})}
                required
              />
            </div>

            <button className="save-btn" type="submit">
                {editingId ? "Update Goal" : "Create Goal"}
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

export default ManagerGoals;