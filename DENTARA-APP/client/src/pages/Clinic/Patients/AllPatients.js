import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { listenToAllPatients, updatePatient } from "../../../services/patientsService";
import { listenToDoctors } from "../../../services/usersService";
import DataTable from "../../../components/DataTable";
import "../../../styles/ClinicDashboard.css";

const AllPatients = () => {
  const navigate = useNavigate();
  const [patients, setPatients] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [formData, setFormData] = useState({
    firstName: "", lastName: "", age: "", phone: "", email: "", condition: "", doctorId: "", doctorName: "",
  });

  useEffect(() => {
    listenToDoctors(setDoctors);
    const unsub = listenToAllPatients((list) => {
      setPatients(list.sort((a, b) => (a.lastName || "").localeCompare(b.lastName || "")));
    });
    return unsub;
  }, []);

  const getDoctorName = (doctorId) => doctors.find((d) => d.id === doctorId)?.fullName || "Not Assigned";

  const handleEdit = (rawPatient) => {
    setSelectedPatient(rawPatient);
    
    // Safety Fallback: If patient only has "name", split it into first and last name
    const nameParts = (rawPatient.name || rawPatient.patientName || "").split(" ");
    const fName = rawPatient.firstName || nameParts[0] || "";
    const lName = rawPatient.lastName || nameParts.slice(1).join(" ") || "";

    setFormData({
      firstName: fName,
      lastName: lName,
      age: rawPatient.age || "",
      phone: rawPatient.phone || "",
      email: rawPatient.email || "",
      condition: rawPatient.condition || "",
      doctorId: rawPatient.doctorId || "",
      doctorName: rawPatient.doctorName || ""
    });
    setShowForm(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!formData.firstName || !formData.lastName || !formData.phone || !formData.doctorId) {
      alert("Fill all required fields!");
      return;
    }
    try {
      await updatePatient(selectedPatient.id, formData);
      alert("✅ Patient updated!");
      setShowForm(false);
    } catch (error) {
      alert("❌ Error: " + error.message);
    }
  };

  const filtered = patients.filter((p) =>
    `${p.firstName} ${p.lastName}`.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Attach raw patient object to the mapped row so actions have full context
  const tableRows = filtered.map((p) => ({
    id: p.id,
    _rawPatient: p,
    "Name": `${p.firstName} ${p.lastName}`,
    "Age": p.age || "-",
    "Phone": p.phone || "-",
    "Primary Doctor": getDoctorName(p.doctorId),
    "Condition": p.condition || "-",
  }));

  // Actions now extract the _rawPatient
  const tableActions = (row) => [
    { label: "Manage", onClick: () => handleEdit(row._rawPatient) },
    { label: "View", onClick: () => navigate(`/staff-dashboard/patients/details/${row.id}`) },
  ];

  return (
    <div className="clinic-content-box">
      <div className="clinic-page-header">
        <button className="clinic-btn-back" onClick={() => navigate("/staff-dashboard/patients")}>← Back</button>
        <h2>📋 All Patients</h2>
      </div>

      <div className="search-add-bar">
        <input
          type="text"
          placeholder="Search by name..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="clinic-search-input"
        />
      </div>

      <DataTable
        columns={["Name", "Age", "Phone", "Primary Doctor", "Condition"]}
        rows={tableRows}
        actions={tableActions}
        emptyMessage="No patients found"
      />

      {showForm && (
        <div className="manage-box">
          <div className="manage-header">
            <h3>✏️ Edit Patient</h3>
            <button className="close-btn" onClick={() => setShowForm(false)}>✖</button>
          </div>
          <form onSubmit={handleSave}>
            <div className="manage-form">
              <input type="text" placeholder="First Name" value={formData.firstName} onChange={(e) => setFormData({ ...formData, firstName: e.target.value })} required />
              <input type="text" placeholder="Last Name" value={formData.lastName} onChange={(e) => setFormData({ ...formData, lastName: e.target.value })} required />
              <input type="number" placeholder="Age" value={formData.age} onChange={(e) => setFormData({ ...formData, age: e.target.value })} />
              <input type="tel" placeholder="Phone" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} required />
              <input type="email" placeholder="Email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
              <select value={formData.doctorId} onChange={(e) => setFormData({ ...formData, doctorId: e.target.value, doctorName: doctors.find((d) => d.id === e.target.value)?.fullName || "" })} required>
                <option value="">Select Doctor</option>
                {doctors.map((d) => <option key={d.id} value={d.id}>{d.fullName}</option>)}
              </select>
              <input type="text" placeholder="Condition" value={formData.condition} onChange={(e) => setFormData({ ...formData, condition: e.target.value })} />
            </div>
            <div className="manage-actions">
              <button type="submit" className="save-btn">💾 Save Changes</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default AllPatients;