import React, { useState, useEffect, useMemo, useRef } from "react";
import { listenToAllPatients } from "../../services/patientsService";
import { addCommunicationLog, listenToAllCommunications, updateCommunicationStatus } from "../../services/communicationsService";
import { createNotification } from "../../services/notificationsService"; 
import { useAuth } from "../../contexts/AuthContext";
import DataTable from "../../components/DataTable";
import "../../styles/ClinicDashboard.css";

const CommunicationsLog = () => {
  const { currentUser } = useAuth();
  const [patients, setPatients] = useState([]);
  const [logs, setLogs] = useState([]);
  
  // Search and Filter states
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("All");
  
  // Default is now "Needs Follow-up"
  const [followUpFilter, setFollowUpFilter] = useState("Needs Follow-up"); 

  // Form states
  const [showForm, setShowForm] = useState(false);
  const [patientSearchStr, setPatientSearchStr] = useState("");
  const [showDropdown, setShowDropdown] = useState(false); 
  
  // ENHANCEMENT: Added targetDate and assignTo fields
  const [formData, setFormData] = useState({
    type: "Inbound Call",
    notes: "",
    requiresFollowUp: false,
    targetDate: "",
    assignTo: "Staff"
  });

  // Reference for smooth scrolling
  const formRef = useRef(null);

  useEffect(() => {
    const unsubPatients = listenToAllPatients((list) => {
      // Create a clean full name for searching
      const formatted = list.map(p => ({
        ...p,
        fullName: p.firstName && p.lastName ? `${p.firstName} ${p.lastName}` : (p.name || p.patientName || "Unknown")
      }));
      setPatients(formatted);
    });

    const unsubLogs = listenToAllCommunications(setLogs);

    return () => {
      unsubPatients();
      unsubLogs();
    };
  }, []);

  // Handle opening form and scrolling
  const handleOpenForm = () => {
    setShowForm(true);
    // Delay slightly to allow the form to render in the DOM before scrolling
    setTimeout(() => {
      formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  };

  const handleSaveLog = async (e) => {
    e.preventDefault();
    
    // Find the actual patient ID from the text input
    const selectedPatient = patients.find(p => p.fullName === patientSearchStr);
    
    if (!selectedPatient) {
      alert("Please select a valid patient from the list.");
      return;
    }

    if (!formData.notes.trim()) {
      alert("Notes cannot be empty.");
      return;
    }

    if (formData.requiresFollowUp && !formData.targetDate) {
      alert("Please select a target date for the follow-up.");
      return;
    }

    try {
      await addCommunicationLog({
        patientId: selectedPatient.id,
        patientName: selectedPatient.fullName,
        type: formData.type,
        notes: formData.notes,
        requiresFollowUp: formData.requiresFollowUp,
        followUpResolved: false,
        loggedBy: currentUser?.email || "Staff",
        // ENHANCEMENT: Save the new fields to Firestore
        targetDate: formData.requiresFollowUp ? formData.targetDate : null,
        assignTo: formData.requiresFollowUp ? formData.assignTo : null,
      });

      // ENHANCEMENT: Trigger notification with target date and assignment
      if (formData.requiresFollowUp) {
        await createNotification({
          title: `Follow-up: ${formData.type}`,
          message: `Assigned to ${formData.assignTo}: Follow-up required for ${selectedPatient.fullName}.`,
          link: `/staff-dashboard/messages`,
          type: "reminder",
          targetDate: formData.targetDate,
          assignTo: formData.assignTo
        });
      }

      alert("Communication logged successfully.");
      setShowForm(false);
      setPatientSearchStr("");
      setFormData({ type: "Inbound Call", notes: "", requiresFollowUp: false, targetDate: "", assignTo: "Staff" });
    } catch (error) {
      alert("Error saving log.");
    }
  };

  const handleResolve = async (logId) => {
    await updateCommunicationStatus(logId, true);
  };

  // Filter Logic 
  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      // 1. Text Search
      const searchMatch = log.patientName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          log.notes.toLowerCase().includes(searchTerm.toLowerCase());
      
      // 2. Type Filter
      const typeMatch = typeFilter === "All" || log.type === typeFilter;
      
      // 3. Follow Up Filter
      let followUpMatch = true;
      if (followUpFilter === "Needs Follow-up") followUpMatch = log.requiresFollowUp && !log.followUpResolved;
      if (followUpFilter === "Resolved") followUpMatch = log.requiresFollowUp && log.followUpResolved;
      
      return searchMatch && typeMatch && followUpMatch;
    });
  }, [logs, searchTerm, typeFilter, followUpFilter]);

  // Dropdown list filtering based on typing
  const filteredPatientsForDropdown = patients.filter(p =>
    p.fullName.toLowerCase().includes(patientSearchStr.toLowerCase())
  );

  const tableRows = filteredLogs.map((log) => ({
    id: log.id,
    _rawLog: log,
    "Date/Time": new Date(log.createdAt).toLocaleString(),
    "Patient": log.patientName,
    "Type": <span className="status-badge" style={{ backgroundColor: "#e9e6ff", color: "#3c0094" }}>{log.type}</span>,
    "Notes": log.notes,
    "Status": log.requiresFollowUp ? (
      <span className={log.followUpResolved ? "status-contacted" : "status-not-contacted"}>
        {log.followUpResolved ? "Resolved" : `Follow-up on ${log.targetDate || "N/A"}`}
      </span>
    ) : (
      <span style={{ color: "#888" }}>Info Only</span>
    )
  }));

  const tableActions = (row) => {
    const actions = [];
    if (row._rawLog.requiresFollowUp && !row._rawLog.followUpResolved) {
      actions.push({
        label: "Mark Resolved",
        onClick: () => handleResolve(row.id),
      });
    }
    return actions;
  };

  return (
    <div className="clinic-content-box">
      <div className="clinic-page-header">
        <h2>Call & Message Log</h2>
        <button className="clinic-btn-primary" onClick={handleOpenForm}>
          Add Log Communication
        </button>
      </div>

      <div className="search-filter-container">
        <input
          type="text"
          placeholder="Search logs by patient or keyword..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="clinic-search-input"
        />
        
        <div className="filter-controls">
          <div className="filter-group">
            <label>Type:</label>
            <select className="filter-select" value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
              <option value="All">All Types</option>
              <option value="Inbound Call">Inbound Call</option>
              <option value="Outbound Call">Outbound Call</option>
              <option value="SMS / Text">SMS / Text</option>
              <option value="Email">Email</option>
            </select>
          </div>

          <div className="filter-group">
            <label>Status:</label>
            <select className="filter-select" value={followUpFilter} onChange={(e) => setFollowUpFilter(e.target.value)}>
              <option value="All">All Logs</option>
              <option value="Needs Follow-up">Needs Follow-up</option>
              <option value="Resolved">Resolved Follow-ups</option>
            </select>
          </div>
        </div>
      </div>

      <DataTable
        columns={["Date/Time", "Patient", "Type", "Notes", "Status"]}
        rows={tableRows}
        actions={tableActions}
        emptyMessage={followUpFilter === "Needs Follow-up" ? "No pending follow-ups right now." : "No communication logs match your search."}
      />

      {/* NEW LOG FORM MODAL */}
      {showForm && (
        <div className="manage-box" ref={formRef}>
          <div className="manage-header">
            <h3>New Communication Log</h3>
            <button className="close-btn" onClick={() => setShowForm(false)}>Close</button>
          </div>
          
          <form onSubmit={handleSaveLog}>
            <div className="manage-form">
              
              <div className="form-group-full" style={{ position: "relative" }}>
                <label>Patient Name (Type to search)</label>
                <input 
                  value={patientSearchStr} 
                  onChange={(e) => {
                    setPatientSearchStr(e.target.value);
                    setShowDropdown(true);
                  }} 
                  onFocus={() => setShowDropdown(true)}
                  onBlur={() => setTimeout(() => setShowDropdown(false), 200)} 
                  placeholder="Start typing patient name..."
                  className="form-input"
                  required 
                  autoComplete="off"
                />
                
                {showDropdown && patientSearchStr && (
                  <ul className="custom-dropdown">
                    {filteredPatientsForDropdown.length > 0 ? (
                      filteredPatientsForDropdown.map(p => (
                        <li 
                          key={p.id} 
                          onClick={() => {
                            setPatientSearchStr(p.fullName);
                            setShowDropdown(false);
                          }}
                        >
                          {p.fullName}
                        </li>
                      ))
                    ) : (
                      <li className="no-results">No patients found...</li>
                    )}
                  </ul>
                )}
              </div>

              <div className="form-group-full">
                <label>Communication Type</label>
                <select 
                  className="form-input" 
                  value={formData.type} 
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                >
                  <option value="Inbound Call">Inbound Call</option>
                  <option value="Outbound Call">Outbound Call</option>
                  <option value="SMS / Text">SMS / Text</option>
                  <option value="Email">Email</option>
                </select>
              </div>

              <div className="form-group-full">
                <label>Summary / Notes</label>
                <textarea 
                  className="form-input" 
                  rows="3" 
                  placeholder="What was discussed?"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  required
                />
              </div>

              <div className="form-group-full">
                <label className="checkbox-align-label">
                  <input 
                    type="checkbox" 
                    checked={formData.requiresFollowUp}
                    onChange={(e) => setFormData({ ...formData, requiresFollowUp: e.target.checked })}
                  />
                  Requires Follow-up Action
                </label>
              </div>

              {/* ENHANCEMENT: Target Date and AssignTo fields show conditionally */}
              {formData.requiresFollowUp && (
                <>
                  <div className="form-group-half">
                    <label>Target Date for Follow-up *</label>
                    <input 
                      type="date"
                      className="form-input"
                      value={formData.targetDate}
                      onChange={(e) => setFormData({ ...formData, targetDate: e.target.value })}
                      required={formData.requiresFollowUp}
                    />
                  </div>
                  <div className="form-group-half">
                    <label>Assign Follow-up To</label>
                    <select 
                      className="form-input"
                      value={formData.assignTo}
                      onChange={(e) => setFormData({ ...formData, assignTo: e.target.value })}
                    >
                      <option value="Staff">General Staff</option>
                      <option value="Manager">Clinic Manager</option>
                      <option value="Doctor">Doctor</option>
                    </select>
                  </div>
                </>
              )}

            </div>
            
            <div className="manage-actions">
              <button type="submit" className="save-btn">Save Log</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default CommunicationsLog;