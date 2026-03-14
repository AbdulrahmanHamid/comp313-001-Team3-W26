import React, { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { getFirestore, collection, onSnapshot } from "firebase/firestore";
import { listenToAllPatients, updatePatientRecallStatus } from "../../services/patientsService";

export default function RecallList() {
  const [patients, setPatients] = useState([]);
  const [appointments, setAppointments] = useState([]);
  
  const [filter, setFilter] = useState("Action Required"); 
  const navigate = useNavigate();
  const db = getFirestore();

  // Listen to patient data from Firestore
  useEffect(() => {
    const unsubscribePatients = listenToAllPatients(setPatients);
    return () => unsubscribePatients();
  }, []);

  // Listen to appointments collection in realtime
  useEffect(() => {
    const unsubscribeAppts = onSnapshot(collection(db, "appointments"), (snapshot) => {
      const apptsList = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setAppointments(apptsList);
    });
    return () => unsubscribeAppts();
  }, [db]);


  // Calculate patients who are overdue for recall (more than 6 months)
  const overduePatients = useMemo(() => {
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    return patients.filter((p) => {
      const patientAppts = appointments.filter(
        (a) => a.patientId === p.id || a.patientName === (p.name || p.patientName)
      );

      let latestPastApptDate = null;

      patientAppts.forEach((a) => {
        const apptDateStr = a.date || a.appointmentDate; 
        if (apptDateStr) {
          const apptDate = new Date(apptDateStr);
          if (!isNaN(apptDate) && apptDate < new Date()) {
            if (!latestPastApptDate || apptDate > latestPastApptDate) {
              latestPastApptDate = apptDate;
            }
          }
        }
      });

      const trueLastVisit = latestPastApptDate || (p.lastVisit ? new Date(p.lastVisit) : new Date(p.createdAt));
      p.computedLastVisit = trueLastVisit;

      return trueLastVisit < sixMonthsAgo;
    });
  }, [patients, appointments]);

  const displayedPatients = useMemo(() => {
    return overduePatients.filter((p) => {
      if (filter === "Action Required !") return !p.recallContacted;
      if (filter === "Already Contacted") return p.recallContacted === true;
      return true; 
    });
  }, [overduePatients, filter]);

  const handleToggleContacted = async (patientId, currentStatus) => {
    try {
      await updatePatientRecallStatus(patientId, !currentStatus);
    } catch (error) {
      alert("Failed to update status. Please try again :(");
    }
  };

  return (
    <div className="clinic-content-box">
      <div className="clinic-page-header">
        <h2>📞 Patient Recall List (&gt; 6 Months Overdue)</h2>
      </div>

      <div className="recall-filter-bar">
        <div className="recall-filter-controls">
          <label className="recall-filter-label">Current View:</label>
          <select 
            className="recall-filter-select"
            value={filter} 
            onChange={(e) => setFilter(e.target.value)}
          >
            <option value="Action Required">Action Required (Not Contacted)</option>
            <option value="Already Contacted">History (Already Contacted)</option>
          </select>
        </div>
        
        <div className="recall-filter-count">
          Showing <strong>{displayedPatients.length}</strong> patient(s)
        </div>
      </div>

      <hr />

      {displayedPatients.length === 0 ? (
        <div className="empty-state">
          <h3>🎉 All caught up!</h3>
          <p>No patients match the "{filter}" criteria right now.</p>
        </div>
      ) : (
        <table className="clinic-table">
          <thead>
            <tr>
              <th>Patient Name</th>
              <th>Phone</th>
              <th>True Last Visit</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {displayedPatients.map((p) => (
              <tr key={p.id}>
                <td><strong>{p.name || p.patientName || `${p.firstName} ${p.lastName}`}</strong></td>
                <td>{p.phone || "N/A"}</td>
                <td>
                  {p.computedLastVisit 
                    ? p.computedLastVisit.toLocaleDateString() 
                    : "Unknown"}
                </td>
                <td>
                  <span className={p.recallContacted ? "status-contacted" : "status-not-contacted"}>
                    {p.recallContacted ? "Contacted" : "Not Contacted"}
                  </span>
                </td>
                <td>
                  <div className="recall-actions">
                    <button 
                      className="clinic-btn-secondary clinic-btn-small"
                      onClick={() => navigate(`/staff-dashboard/patients/details/${p.id}`)}
                    >
                      View Details
                    </button>

                    <button 
                      className={p.recallContacted ? "clinic-btn-secondary clinic-btn-small" : "clinic-btn-primary clinic-btn-small"}
                      onClick={() => handleToggleContacted(p.id, p.recallContacted)}
                    >
                      {p.recallContacted ? "Undo (Unmark)" : "Mark Contacted"}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}