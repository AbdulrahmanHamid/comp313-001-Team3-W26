import React, { useState, useEffect, useRef } from "react";
import { uploadReport, listenToReports, deleteReport } from "../../services/managerService";
import { useAuth } from "../../contexts/AuthContext";
import DataTable from "../../components/DataTable";
import "../../styles/ManagerDashboard.css";

const DataCenter = () => {
  const { currentUser } = useAuth();
  const [reports, setReports] = useState([]);
  const [file, setFile] = useState(null);
  const [title, setTitle] = useState("");
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    const unsubscribe = listenToReports(setReports);
    return () => unsubscribe();
  }, []);

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file || !title) {
      alert("Please select a file and enter a title");
      return;
    }

    setLoading(true);
    try {
      await uploadReport(file, title, currentUser.email);
      alert("✅ File Uploaded Successfully!");
      setTitle("");
      setFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = ""; // Reset the HTML input
      }

    } catch (error) {
      alert("❌ Upload Failed: " + error.message);
    }
    setLoading(false);
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this report?")) {
      try {
        await deleteReport(id);
      } catch (error) {
        alert("Failed to delete report");
      }
    }
  };

  const columns = ["Title", "File Name", "Type", "Uploaded By", "Date"];
  const rows = reports.map(r => ({
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
      label: "⬇ Download",
      onClick: () => window.open(row.fileUrl, "_blank"),
      style: { backgroundColor: "#78d494", color: "#000", marginRight: "10px" }
    },
    {
      label: "🗑 Delete",
      onClick: () => handleDelete(row.id),
      style: { backgroundColor: "#ff4444", color: "#fff" }
    }
  ];

  return (
    <div className="manager-page">
      <div className="page-header">
        <h2>💾 Data Center</h2>
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
            <label>Select File (CSV, PDF, Excel)</label>
            <input
              className="form-input"
              type="file"
              ref={fileInputRef}
              onChange={(e) => setFile(e.target.files[0])}
              required
            />
          </div>
          <div className="manage-actions">
            <button type="submit" className="save-btn" disabled={loading}>
              {loading ? "Uploading..." : "⬆ Upload Report"}
            </button>
          </div>
        </form>
      </div>

      {/* REPORTS LIST */}
      <div className="data-list-section">
        <h3>📂 Available Reports</h3>
        <DataTable
          columns={columns}
          rows={rows}
          actions={actions}
          emptyMessage="No reports uploaded yet."
        />
      </div>
    </div>
  );
};

export default DataCenter;