import React from "react";
import { NavLink, useNavigate, Outlet } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import {
  FiHome,
  FiClipboard,
  FiPhoneCall,
  FiLogOut,
  FiList,
  FiCalendar,
  FiUsers,
} from "react-icons/fi";
import "../../styles/ClinicDashboard.css";

const ClinicDashboard = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="clinic-layout">
      {/* Header */}
      <header className="clinic-header">
        <h1>CLINIC DASHBOARD</h1>

        <div className="clinic-header-buttons">
          <button className="kpi-btn" onClick={() => navigate("kpis")}>
            KPI Tiles
          </button>

          {/* <button 
            className="wrapup-btn active" 
            onClick={() => alert("Coming in the next release, 2.0.")}
          >
            Daily Wrap-Up
          </button> */}

        <button
        className="wrapup-btn"
        onClick={() => navigate("wrapup")}
      >
  Daily Wrap-Up
</button>
        </div>
      </header>

      <div className="clinic-body">
        {/* Sidebar */}
        <aside className="clinic-sidebar">
          <nav>
            <ul>
              <li>
                <NavLink to="/staff-dashboard/home">
                  <FiHome /> Home
                </NavLink>
              </li>
              <li>
                <NavLink to="/staff-dashboard/appointments">
                  <FiCalendar /> Appointments
                </NavLink>
              </li>
              <li>
                <NavLink to="/staff-dashboard/tasks">
                  <FiClipboard /> Tasks
                </NavLink>
              </li>
              <li>
                <NavLink to="/staff-dashboard/patients">
                  <FiUsers /> Patients
                </NavLink>
              </li>
              <li>
                <NavLink to="/staff-dashboard/recalls">
                  <FiList /> Recalls
                </NavLink>
              </li>
              <li>
                <NavLink to="/staff-dashboard/no-shows">
                  <FiList /> No-shows
                </NavLink>
              </li>
              <li>
                <NavLink to="/staff-dashboard/messages">
                  <FiPhoneCall /> Call & Message
                </NavLink>
              </li>
              <li>
                <NavLink to="/staff-dashboard/schedule">
                  <FiCalendar /> Schedule
                </NavLink>
              </li>
            </ul>
          </nav>

          <div className="logout-container">
            <button className="signout-btn" onClick={logout}>
              <FiLogOut className="logout-icon" />
              Sign Out
            </button>
          </div>
        </aside>

        {/* Main Content */}
        <main className="clinic-main">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default ClinicDashboard;
