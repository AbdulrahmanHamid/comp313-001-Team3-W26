import React, { useState, useEffect } from "react";
import { listenToAllAppointments } from "../../../services/appointmentsService";
import ManageAppointments from "./ManageAppointments";
import FilterBar from "../../../components/FilterBar";
import "../../../styles/ClinicDashboard.css";

const AppointmentsPage = () => {
  const [appointments, setAppointments] = useState([]);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [filters, setFilters] = useState({ status: "All", date: "All", sort: "Date" });
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const unsub = listenToAllAppointments(setAppointments);
    return unsub;
  }, []);

  const handleFilterChange = (filterName, value) => {
    setFilters({ ...filters, [filterName]: value });
  };

  const today = new Date().toISOString().split("T")[0];

  let filtered = appointments
    .filter((apt) => filters.status === "All" || apt.status === filters.status)
    .filter((apt) => {
      if (filters.date === "All Dates") return true;
      if (filters.date === "Past") return apt.date < today;
      if (filters.date === "Today") return apt.date === today;
      if (filters.date === "Upcoming") return apt.date > today;
      return true;
    })
    .filter((apt) => {
      const s = searchTerm.toLowerCase();
      return (
        apt.patientName?.toLowerCase().includes(s) ||
        apt.doctorName?.toLowerCase().includes(s) ||
        apt.reason?.toLowerCase().includes(s)
      );
    });

  filtered.sort((a, b) => {
    if (filters.sort === "Date") return new Date(a.date) - new Date(b.date);
    if (filters.sort === "Patient Name") return (a.patientName || "").localeCompare(b.patientName || "");
    if (filters.sort === "Doctor Name") return (a.doctorName || "").localeCompare(b.doctorName || "");
    if (filters.sort === "Status") return (a.status || "").localeCompare(b.status || "");
    return 0;
  });

  const filterOptions = [
    {
      id: "date",
      label: "Date",
      value: filters.date,
      options: ["All Dates", "Past", "Today", "Upcoming"],
      placeholder: "Search by patient, doctor, or reason...",
    },
    {
      id: "status",
      label: "Status",
      value: filters.status,
      options: ["All", "Pending", "Confirmed", "Checked-in", "Completed", "Cancelled", "No-Show"],
    },
    {
      id: "sort",
      label: "Sort by",
      value: filters.sort,
      options: ["Date", "Patient Name", "Doctor Name", "Status"],
    },
  ];

  return (
    <div className="clinic-content-box">
      <div className="clinic-page-header">
        <h2>📅 Appointment Centre</h2>
        <button
          className="clinic-btn-primary"
          onClick={() => {
            setSelectedAppointment(null);
            setShowForm(true);
          }}
        >
          ➕ Add New
        </button>
      </div>

      <FilterBar
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        filters={filterOptions}
        onFilterChange={handleFilterChange}
      />

      {filtered.length === 0 ? (
        <p style={{ textAlign: "center", padding: "20px", color: "#666" }}>
          No appointments found
        </p>
      ) : (
        <table className="clinic-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Time</th>
              <th>Patient</th>
              <th>Doctor</th>
              <th>Reason</th>
              <th>Room</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((apt) => (
              <tr key={apt.id}>
                <td>{apt.date}</td>
                <td>{apt.time}</td>
                <td>{apt.patientName}</td>
                <td>{apt.doctorName || "N/A"}</td>
                <td>{apt.reason}</td>
                <td>{apt.room || "-"}</td>
                <td>
                  <span
                    className={`status-badge status-${(apt.status || "pending")
                      .toLowerCase()
                      .replace(" ", "-")}`}
                  >
                    {apt.status}
                  </span>
                </td>
                <td>
                  <button
                    className="clinic-btn-small"
                    onClick={() => {
                      setSelectedAppointment(apt);
                      setShowForm(true);
                    }}
                  >
                    Manage
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {showForm && (
        <ManageAppointments
          appointment={selectedAppointment}
          onClose={() => setShowForm(false)}
        />
      )}
    </div>
  );
};

export default AppointmentsPage;
