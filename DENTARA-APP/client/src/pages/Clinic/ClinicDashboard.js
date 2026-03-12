import React from "react";
import { NavLink, useNavigate, Outlet } from "react-router-dom"; // React Router tools for navigation and nested routes
import { useAuth } from "../../contexts/AuthContext"; // Custom authentication context
import {
  FiHome,
  FiClipboard,
  FiPhoneCall,
  FiLogOut,
  FiList,
  FiCalendar,
  FiUsers,
} from "react-icons/fi"; // Feather icons used for sidebar menu
import "../../styles/ClinicDashboard.css"; // Dashboard css

// Main layout component for the Clinic Staff Dashboard
const ClinicDashboard = () => {

  // Get logout function from authentication context
  const { logout } = useAuth();

  // Hook used for programmatic navigation
  const navigate = useNavigate();

  return (
    <div className="clinic-layout">
      
      {/* ===== Header Section ===== */}
      <header className="clinic-header">
        <h1>CLINIC DASHBOARD</h1>

        {/* Header action buttons for quick access */}
        <div className="clinic-header-buttons">

          {/* Navigate to KPI tiles page */}
          <button className="kpi-btn" onClick={() => navigate("kpis")}>
            KPI Tiles
          </button>

          {/* Navigate to Daily Wrap-Up page */}
          <button
            className="wrapup-btn"
            onClick={() => navigate("wrapup")}
          >
            Daily Wrap-Up
          </button>

        </div>
      </header>

      <div className="clinic-body">

        {/* ===== Sidebar Navigation ===== */}
        <aside className="clinic-sidebar">
          <nav>
            <ul>

              {/* Dashboard home page */}
              <li>
                <NavLink to="/staff-dashboard/home">
                  <FiHome /> Home
                </NavLink>
              </li>

              {/* Appointment management page */}
              <li>
                <NavLink to="/staff-dashboard/appointments">
                  <FiCalendar /> Appointments
                </NavLink>
              </li>

              {/* Task management page */}
              <li>
                <NavLink to="/staff-dashboard/tasks">
                  <FiClipboard /> Tasks
                </NavLink>
              </li>

              {/* Patient list and patient information */}
              <li>
                <NavLink to="/staff-dashboard/patients">
                  <FiUsers /> Patients
                </NavLink>
              </li>

              {/* Patient recall reminders */}
              <li>
                <NavLink to="/staff-dashboard/recalls">
                  <FiList /> Recalls
                </NavLink>
              </li>

              {/* Track patients who missed appointments */}
              <li>
                <NavLink to="/staff-dashboard/no-shows">
                  <FiList /> No-shows
                </NavLink>
              </li>

              {/* Communication module (calls & messages) */}
              <li>
                <NavLink to="/staff-dashboard/messages">
                  <FiPhoneCall /> Call & Message
                </NavLink>
              </li>

              {/* Staff scheduling view */}
              <li>
                <NavLink to="/staff-dashboard/schedule">
                  <FiCalendar /> Schedule
                </NavLink>
              </li>

            </ul>
          </nav>

          {/* ===== Logout Section ===== */}
          <div className="logout-container">
            <button className="signout-btn" onClick={logout}>
              <FiLogOut className="logout-icon" />
              Sign Out
            </button>
          </div>
        </aside>

        {/* ===== Main Content Area ===== */}
        {/* Outlet renders nested routes like Home, Appointments, Tasks etc. */}
        <main className="clinic-main">
          <Outlet />
        </main>

      </div>
    </div>
  );
};

export default ClinicDashboard;