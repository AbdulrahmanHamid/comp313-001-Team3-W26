import React, { useState, useEffect } from "react";
import { listenToAllAlerts, createAlert, updateAlert, resolveAlert, reopenAlert } from "../../services/managerService";
import { listenToDoctors } from "../../services/usersService";
import { listenToAllPatients } from "../../services/patientsService";
import { useAuth } from "../../contexts/AuthContext";
import DataTable from "../../components/DataTable";
import "../../styles/ManagerDashboard.css";

const ManagerAlerts = () => {
  const { currentUser } = useAuth(); 
  const [alerts, setAlerts] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [allPatients, setAllPatients] = useState([]);
  const [filteredPatients, setFilteredPatients] = useState([]);
  
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [filter, setFilter] = useState("All");

  const [form, setForm] = useState({
    patientId: "",
    doctorId: "",
    message: "",
    priority: "Medium"
  });

  useEffect(() => {
    const unsubAlerts = listenToAllAlerts(setAlerts);
    const unsubDoctors = listenToDoctors(setDoctors);
    const unsubPatients = listenToAllPatients((list) => setAllPatients(list));

    return () => {
      unsubAlerts();
      unsubDoctors();
      unsubPatients();
    };
  }, []);
  useEffect(() => {
    if (form.doctorId && allPatients.length > 0) {
        setFilteredPatients(allPatients.filter(p => p.doctorId === form.doctorId));
    } else {
        setFilteredPatients([]);
    }
  }, [form.doctorId, allPatients]);

  const handleDoctorChange = (e) => {
    setForm(prev => ({ ...prev, doctorId: e.target.value, patientId: "" }));
  };

  const openNewAlert = () => {
    setEditingId(null);
    setForm({ patientId: "", doctorId: "", message: "", priority: "Medium" });
    setShowModal(true);
  };

  const openEditAlert = (alertData) => {
    setEditingId(alertData.id);
    setForm({
        patientId: alertData.patientId || "",
        doctorId: alertData.doctorId || "",
        message: alertData.message,
        priority: alertData.priority
    });
    setShowModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.patientId || !form.doctorId || !form.message) {
      alert("Please fill in all fields");
      return;
    }

    const patient = allPatients.find(p => p.id === form.patientId);
    const doctor = doctors.find(d => d.id === form.doctorId);
    const pName = patient ? `${patient.firstName} ${patient.lastName}` : "Unknown";
    const dName = doctor?.fullName || "Unknown";

    const payload = {
        ...form,
        patientName: pName,
        doctorName: dName,
        assignedBy: currentUser.email,
    };

    try {
      if (editingId) {
        await updateAlert(editingId, payload);
        alert("Alert Updated!");
      } else {
        await createAlert(payload);
        alert("Alert Created!");
      }
      setShowModal(false);
    } catch (error) {
      alert("Error saving: " + error.message);
    }
  };

  const filteredAlerts = alerts.filter(a => {
    if (filter === "Open") return a.status !== "Resolved";
    if (filter === "Resolved") return a.status === "Resolved";
    return true;
  });

  const columns = ["Date", "Priority", "Patient", "Message", "Assigned To", "Status"];
  const rows = filteredAlerts.map(a => ({
    id: a.id,
    "Date": new Date(a.createdAt).toLocaleDateString(),
    "Priority": <span className={`priority-tag ${a.priority.toLowerCase()}`}>{a.priority}</span>,
    "Patient": a.patientName,
    "Message": a.message,
    "Assigned To": a.doctorName,
    "Status": <span className={`status-badge status-${a.status?.toLowerCase() || 'open'}`}>{a.status || "Open"}</span>,
    raw: a // Pass full object for edit
  }));

  const actions = (row) => {
    const fullAlert = alerts.find(a => a.id === row.id);
    const isResolved = fullAlert?.status === "Resolved";
    
    return [
      {
        label: "✎ Edit",
        onClick: () => openEditAlert(fullAlert),
        style: { backgroundColor: "#17a2b8", color: "white", marginRight: "5px" }
      },
      {
        label: isResolved ? "↺ Reopen" : "✔ Resolve",
        onClick: async () => {
          if (isResolved) await reopenAlert(row.id);
          else await resolveAlert(row.id);
        },
        style: { 
          backgroundColor: isResolved ? "#f0ad4e" : "#5cb85c", 
          color: "white",
          border: "none" 
        }
      }
    ];
  };

  return (
    <div className="manager-page">
      <div className="page-header">
        <h2>⚠️ Alert Center</h2>
        <button className="btn-pill btn-purple" onClick={openNewAlert}>
          + Assign New Alert
        </button>
      </div>

      <div className="tabs">
        {["All", "Open", "Resolved"].map(type => (
          <button 
            key={type}
            className={`tab-btn ${filter === type ? "active" : ""}`}
            onClick={() => setFilter(type)}
          >
            {type}
          </button>
        ))}
      </div>

      <DataTable 
        columns={columns}
        rows={rows}
        actions={actions}
        emptyMessage="No alerts found."
      />

      {showModal && (
        <div className="manage-box">
          <div className="manage-header">
            <h3>{editingId ? "Edit Alert" : "Assign Alert"}</h3>
            <button className="close-btn" onClick={() => setShowModal(false)}>✖</button>
          </div>
          
          <form onSubmit={handleSave} className="manage-form">
            <div className="form-group-half">
              <label>Assign to Doctor</label>
              <select 
                className="form-input"
                value={form.doctorId}
                onChange={handleDoctorChange}
                required
              >
                <option value="">-- Choose Doctor --</option>
                {doctors.map(d => (
                  <option key={d.id} value={d.id}>{d.fullName}</option>
                ))}
              </select>
            </div>

            <div className="form-group-half">
              <label>Select Patient</label>
              <select 
                className="form-input"
                value={form.patientId}
                onChange={e => setForm({...form, patientId: e.target.value})}
                required
                disabled={!form.doctorId} 
                style={{ backgroundColor: !form.doctorId ? "#f0f0f0" : "white" }}
              >
                <option value="">
                   {!form.doctorId ? "Select Doctor First" : "-- Choose Patient --"}
                </option>
                {filteredPatients.map(p => (
                  <option key={p.id} value={p.id}>{p.firstName} {p.lastName}</option>
                ))}
              </select>
            </div>

            <div className="form-group-full">
              <label>Priority</label>
              <select 
                className="form-input"
                value={form.priority}
                onChange={e => setForm({...form, priority: e.target.value})}
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
              </select>
            </div>

            <div className="form-group-full">
              <label>Message / Instruction</label>
              <input 
                className="form-input"
                type="text"
                value={form.message}
                onChange={e => setForm({...form, message: e.target.value})}
                required
              />
            </div>

            <div className="manage-actions">
              <button type="submit" className="save-btn">
                  {editingId ? "Update Alert" : "Assign Alert"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default ManagerAlerts;