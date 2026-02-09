import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { listenToAllPatients, addNewPatient } from "../../services/doctorService";
import "../../styles/DoctorDashboard.css";
import "../../styles/DoctorPatients.css";

const DoctorPatientsList = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [allPatients, setAllPatients] = useState([]);
  const [doctorPatients, setDoctorPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    age: "",
    phone: "",
    email: "",
    condition: ""
  });

  useEffect(() => {
    // Listen to all patients
    const unsubscribe = listenToAllPatients((patientsList) => {
      // Filter patients by current doctor's ID
      const filtered = patientsList.filter(p => p.doctorId === currentUser?.uid);
      
      // Sort by lastName
      filtered.sort((a, b) => {
        const lastNameA = (a.lastName || "").toLowerCase();
        const lastNameB = (b.lastName || "").toLowerCase();
        return lastNameA.localeCompare(lastNameB);
      });

      setAllPatients(patientsList); // Keep all for reference
      setDoctorPatients(filtered);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [currentUser]);

  const handleAddPatient = async (e) => {
    e.preventDefault();

    if (!formData.firstName || !formData.lastName || !formData.phone) {
      alert("Please fill in required fields (First Name, Last Name, Phone)");
      return;
    }

    try {
      await addNewPatient({
        ...formData,
        age: parseInt(formData.age) || 0,
        doctorId: currentUser.uid,
        doctorName: currentUser.displayName || "Doctor"
      });

      alert("Patient added successfully!");
      setShowAddForm(false);
      setFormData({
        firstName: "",
        lastName: "",
        age: "",
        phone: "",
        email: "",
        condition: ""
      });
    } catch (error) {
      console.error("Error adding patient:", error);
      alert("Failed to add patient");
    }
  };

  const filteredPatients = doctorPatients.filter(patient => {
    const fullName = `${patient.firstName} ${patient.lastName}`.toLowerCase();
    return fullName.includes(searchTerm.toLowerCase());
  });

  if (loading) {
    return (
      <div className="doctor-patient-list">
        <p>Loading patients...</p>
      </div>
    );
  }

  return (
    <div className="doctor-patient-list">
      <h2 className="page-title">👥 My Patients</h2>

      <div className="search-action-bar">
        <input
          type="text"
          placeholder="Search patients by name..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
        />
        <button
          className="action-btn"
          onClick={() => setShowAddForm(!showAddForm)}
        >
          {showAddForm ? "❌ Cancel" : "🆕 Add New Patient"}
        </button>
      </div>

      {showAddForm && (
        <div className="add-patient-form-container">
          <h3>Add New Patient</h3>
          <form onSubmit={handleAddPatient} className="add-patient-form">
            <div className="form-row">
              <div className="form-field">
                <label>First Name *</label>
                <input
                  type="text"
                  value={formData.firstName}
                  onChange={(e) =>
                    setFormData({ ...formData, firstName: e.target.value })
                  }
                  required
                />
              </div>
              <div className="form-field">
                <label>Last Name *</label>
                <input
                  type="text"
                  value={formData.lastName}
                  onChange={(e) =>
                    setFormData({ ...formData, lastName: e.target.value })
                  }
                  required
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-field">
                <label>Age</label>
                <input
                  type="number"
                  value={formData.age}
                  onChange={(e) =>
                    setFormData({ ...formData, age: e.target.value })
                  }
                />
              </div>
              <div className="form-field">
                <label>Phone *</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData({ ...formData, phone: e.target.value })
                  }
                  required
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-field">
                <label>Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                />
              </div>
              <div className="form-field">
                <label>Condition</label>
                <input
                  type="text"
                  value={formData.condition}
                  onChange={(e) =>
                    setFormData({ ...formData, condition: e.target.value })
                  }
                  placeholder="e.g., Routine Check-up"
                />
              </div>
            </div>

            <button type="submit" className="submit-btn">
              Add Patient
            </button>
          </form>
        </div>
      )}

      {filteredPatients.length === 0 ? (
        <p style={{ textAlign: "center", color: "#999", padding: "20px" }}>
          {doctorPatients.length === 0
            ? "No patients yet. Add a new patient to get started!"
            : "No patients found matching your search"}
        </p>
      ) : (
        <table className="history-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Age</th>
              <th>Phone</th>
              <th>Condition</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredPatients.map((p) => (
              <tr key={p.id}>
                <td>
                  {p.firstName} {p.lastName}
                </td>
                <td>{p.age || "-"}</td>
                <td>{p.phone || "-"}</td>
                <td>{p.condition || "-"}</td>
                <td>
                  <button
                    className="table-btn"
                    onClick={() => navigate(`/doctor-dashboard/patients/${p.id}`)}
                  >
                    View Details
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default DoctorPatientsList;
