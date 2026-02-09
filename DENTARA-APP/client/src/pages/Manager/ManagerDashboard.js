import React from "react";
import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { FiLogOut, FiHome, FiCalendar, FiUsers, FiDatabase, FiAlertTriangle,FiTarget} from "react-icons/fi";

import "../../styles/ManagerDashboard.css";

const ManagerDashboard = () => {
  const { logout } = useAuth();

  return (
    <div className="manager-layout">
      {/* Header */}
      <header className="manager-header">
        <h1>📊 Manager Dashboard</h1>
      </header>

      <div className="manager-body">
        {/* Sidebar */}
        <aside className="manager-sidebar">
          <nav>
            <ul>
              <li>
                <NavLink to="/manager-dashboard/home" className="nav-link">
                  <FiHome className="nav-icon" /> Home
                </NavLink>
              </li>

              <li>
                <NavLink to="/manager-dashboard/alerts" className="nav-link">
                  <FiAlertTriangle className="nav-icon" /> Alerts
                </NavLink>
              </li>

              <li>
                <NavLink to="/manager-dashboard/dataCenter" className="nav-link">
                  <FiDatabase className="nav-icon" /> Data Center
                </NavLink>
              </li>
              <li>
                <NavLink to="/manager-dashboard/goals" className="nav-link">
                  <FiTarget className="nav-icon" /> Goals
                </NavLink>
              </li>

              <li>
                <NavLink to="/manager-dashboard/managerKpi" className="nav-link">
                  <FiCalendar className="nav-icon" /> KPI DrillDowns
                </NavLink>
              </li>

            </ul>
          </nav>

          {/* Logout */}
          <button className="signout-btn" onClick={logout}>
            <FiLogOut className="logout-icon" />
            Sign Out
          </button>
        </aside>

        {/* Main Content */}
        <main className="manager-main">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default ManagerDashboard;