import React from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { FiLogOut, FiHome, FiCalendar, FiUsers, FiMessageCircle } from 'react-icons/fi'; 
import '../../styles/DoctorDashboard.css';


const DoctorDashboard = () => {
  const { logout } = useAuth();

  return (
    <div className="doctor-layout">
      {/* Header */}
      <header className="doctor-header">
        <h1>👨‍⚕️ Doctor Dashboard</h1>
      </header>

      <div className="doctor-body">
        {/* Sidebar */}
        <aside className="doctor-sidebar">
          <nav>
            <ul>
              <li>
                <NavLink to="/doctor-dashboard/home" className="nav-link">
                  <FiHome className="nav-icon" /> Home
                </NavLink>
              </li>
              <li>
                <NavLink to="/doctor-dashboard/schedule" className="nav-link">
                  <FiCalendar className="nav-icon" /> Schedule
                </NavLink>
              </li>
              <li>
                <NavLink to="/doctor-dashboard/patients" className="nav-link">
                  <FiUsers className="nav-icon" /> Patients
                </NavLink>
              </li>

              <li>
            <NavLink to="/doctor-dashboard/doctor-ai-chat" className="nav-link">
              <FiMessageCircle className="nav-icon" /> AI Assistant
            </NavLink>
            </li>
            </ul>
          </nav>

          {/* Logout button with icon */}
          <button className="signout-btn" onClick={logout}>
            <FiLogOut className="logout-icon" />
            Sign Out
          </button>
        </aside>

        {/* Main Content Area */}
        <main className="doctor-main">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default DoctorDashboard;
