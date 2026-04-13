import React, { useState, useEffect, useRef } from "react";
import { uploadReport, listenToReports, deleteReport, triggerPatientBackup, listenToLatestBackup } from "../../services/managerService";
import { useAuth } from "../../contexts/AuthContext";
import DataTable from "../../components/DataTable";
import "../../styles/ManagerDashboard.css";

const DataCenter = () => {
  const { currentUser } = useAuth();
  
  // Upload & Reports State
  const [reports, setReports] = useState([]);
  const [file, setFile] = useState(null);
  const [title, setTitle] = useState("");
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const fileInputRef = useRef(null);

  // NEW: Backup State (CS-3)
  const [latestBackup, setLatestBackup] = useState(null);
  const [backingUp, setBackingUp] = useState(false);

  // Allowed file types & Max size
  const ALLOWED_TYPES = [
    "application/pdf", 
    "application/msword", 
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "text/csv"
  ];
  const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

  useEffect(() => {
    const unsubReports = listenToReports(setReports);
    const unsubBackup = listenToLatestBackup(setLatestBackup); // Listen for Last Backup Date
    
    return () => {
      unsubReports();
      unsubBackup();
    };
  }, []);

  // Handle File Upload Validation
  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    
    if (!selectedFile) {
      setFile(null);
      return;
    }

    if (!ALLOWED_TYPES.includes(selectedFile.type)) {
      alert("Invalid file type. Please upload only PDF, Word, Excel, or CSV documents.");
      setFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    if (selectedFile.size > MAX_FILE_SIZE) {
      alert(`File is too large (${(selectedFile.size / (1024 * 1024)).toFixed(2)}MB). Maximum size is 10MB.`);
      setFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    setFile(selectedFile);
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file || !title) {
      alert("Please select a file and enter a title");
      return;
    }

    setLoading(true);
    try {
      await uploadReport(file, title, currentUser.email);
      alert("File Uploaded Successfully!");
      setTitle("");
      setFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (error) {
      alert("Upload Failed: " + error.message);
    }
    setLoading(false);
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to permanently delete this report?")) {
      try {
        await deleteReport(id);
      } catch (error) {
        alert("Failed to delete report");
      }
    }
  };

  // Handle Manual Backup Trigger (CS-3)
  const handleManualBackup = async () => {
    if (!window.confirm("This will compile all current patient records and save a backup to the cloud. Proceed?")) return;
    
    setBackingUp(true);
    try {
      await triggerPatientBackup(currentUser.email);
      alert("System Backup Completed Successfully.");
    } catch (error) {
      if (error.message === "EMPTY_DATABASE") {
        // Handling AC Test 3: Empty database
        alert("Backup Aborted: There are no patient records in the database to back up.");
      } else {
        alert("Backup Failed: " + error.message);
      }
    }
    setBackingUp(false);
  };

  // Filter reports based on the search term
  const filteredReports = reports.filter(report => 
    report.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    report.fileName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const columns = ["Title", "File Name", "Type", "Uploaded By", "Date"];
  const rows = filteredReports.map(r => ({
    id: r.id,
    "Title": r.title,
    "File Name": r.fileName,
    "Type": r.type || "Unknown",
    "Uploaded By": r.uploadedBy,
    "Date": new Date(r.uploadedAt).toLocaleDateString(),
    fileUrl: r.fileUrl
  }));

  const actions = (row) => [
    {
      label: "Download",
      onClick: () => window.open(row.fileUrl, "_blank"),
      style: { backgroundColor: "#78d494", color: "#000", marginRight: "10px" }
    },
    {
      label: "Delete",
      onClick: () => handleDelete(row.id),
      style: { backgroundColor: "#ff4444", color: "#fff" }
    }
  ];

  return (
    <div className="manager-page">
      <div className="page-header">
        <h2>Data Center</h2>
      </div>

      {/* NEW: SYSTEM BACKUP SECTION (CS-3) */}
      <div className="manage-box" style={{ borderColor: "#78d494", backgroundColor: "#f6fff9" }}>
        <div className="manage-header">
          <h3 style={{ color: "#00401c" }}>System Data Backup</h3>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "20px" }}>
          <div>
            <p style={{ margin: "0 0 5px 0", color: "#333", fontWeight: "600" }}>Patient Records Backup</p>
            <p style={{ margin: 0, fontSize: "0.9rem", color: "#666" }}>
              Last Backup Date: <strong>{latestBackup ? new Date(latestBackup.timestamp).toLocaleString() : "Never"}</strong>
            </p>
            {latestBackup && (
              <p style={{ margin: "5px 0 0 0", fontSize: "0.85rem", color: "#888" }}>
                Triggered by: {latestBackup.triggeredBy}
              </p>
            )}
          </div>
          
          <div style={{ display: "flex", gap: "10px" }}>
            {latestBackup && (
              <button 
                className="btn-outline" 
                style={{ padding: "10px 20px", borderRadius: "8px", fontWeight: "bold" }}
                onClick={() => window.open(latestBackup.fileUrl, "_blank")}
              >
                Download Latest
              </button>
            )}
            <button 
              className="save-btn" 
              style={{ marginTop: 0, width: "auto", padding: "10px 20px", borderRadius: "8px" }}
              onClick={handleManualBackup}
              disabled={backingUp}
            >
              {backingUp ? "Generating Backup..." : "Trigger Manual Backup"}
            </button>
          </div>
        </div>
      </div>

      {/* UPLOAD SECTION */}
      <div className="manage-box">
        <div className="manage-header">
          <h3>Upload New Report</h3>
        </div>
        <form onSubmit={handleUpload} className="manage-form">
          <div className="form-group-half">
            <label>Report Title</label>
            <input
              className="form-input"
              type="text"
              placeholder="e.g., Monthly Financials Nov 2025"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>
          <div className="form-group-half">
            <label>Select File (CSV, PDF, Excel, Word)</label>
            <input
              className="form-input"
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              required
            />
          </div>
          <div className="manage-actions">
            <button type="submit" className="save-btn" disabled={loading}>
              {loading ? "Uploading..." : "Upload Report"}
            </button>
          </div>
        </form>
      </div>

      {/* REPORTS LIST */}
      <div className="data-list-section">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "15px", flexWrap: "wrap", gap: "10px" }}>
          <h3 style={{ margin: 0 }}>Available Reports</h3>
          
          <input
            type="text"
            placeholder="Search by title or file name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ padding: "8px 15px", borderRadius: "20px", border: "2px solid #78d494", minWidth: "250px", outline: "none" }}
          />
        </div>
        <DataTable
          columns={columns}
          rows={rows}
          actions={actions}
          emptyMessage={searchTerm ? "No reports match your search." : "No reports uploaded yet."}
        />
      </div>
    </div>
  );
};

export default DataCenter;