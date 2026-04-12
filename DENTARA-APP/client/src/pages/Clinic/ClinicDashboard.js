import React, { useState, useEffect } from "react";
import { Outlet, Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { listenToAllPatients } from "../../services/patientsService";
import { listenToActiveNotifications, markNotificationRead } from "../../services/notificationsService";
import "../../styles/ClinicDashboard.css";

const ClinicDashboard = () => {
    const { logout } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();

    // Notification States
    const [showNotifPanel, setShowNotifPanel] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const [overdueCount, setOverdueCount] = useState(0);

    // Load active notifications and overdue patients (AC Test 1)
    useEffect(() => {
        const unsubNotifs = listenToActiveNotifications(setNotifications);

        const unsubPatients = listenToAllPatients((patients) => {
            const today = new Date();
            const overdue = patients.filter(p => {
                if (!p.lastVisit) return false;
                const lastVisit = new Date(p.lastVisit);
                const monthsDiff = (today.getFullYear() - lastVisit.getFullYear()) * 12 + (today.getMonth() - lastVisit.getMonth());
                return monthsDiff > 6 && (p.status !== "Contacted");
            });
            setOverdueCount(overdue.length);
        });

        return () => {
            unsubNotifs();
            unsubPatients();
        };
    }, []);

    const totalAlerts = notifications.length + (overdueCount > 0 ? 1 : 0);

    const handleLogout = async () => {
        try {
            await logout();
            navigate('/login');
        } catch (error) {
            console.error("Failed to log out", error);
        }
    };

    return (
        <div className="clinic-layout">
            <header className="clinic-header" style={{ position: "relative" }}>
                <div className="clinic-logo"><h1>Dentara <span style={{ fontSize: '2rem', fontWeight: 'normal' }}>| Staff Portal</span> </h1></div>
                <div className="clinic-header-buttons">
                    {/* NOTIFICATION BUTTON */}
                    <div style={{ position: "relative", cursor: "pointer", marginRight: "15px", display: "flex", alignItems: "center" }} onClick={() => setShowNotifPanel(!showNotifPanel)}>
                        <span style={{ fontSize: "1rem", fontWeight: "bold", color: "#3c0094", backgroundColor: "#e9e6ff", padding: "8px 18px", borderRadius: "25px", border: "2px solid #3c0094" }}>
                            Alerts
                        </span>
                        {totalAlerts > 0 && (
                            <span className="notif-badge">{totalAlerts}</span>
                        )}
                    </div>

                    <button className={`kpi-btn ${location.pathname.includes('/kpis') ? 'active' : ''}`} onClick={() => navigate('/staff-dashboard/kpis')}>
                        KPIs
                    </button>
                    <button className={`wrapup-btn ${location.pathname.includes('/wrapup') ? 'active' : ''}`} onClick={() => navigate('/staff-dashboard/wrapup')}>
                        Daily Wrap-up
                    </button>
                </div>

                {/* NOTIFICATION DROPDOWN PANEL */}
                {showNotifPanel && (
                    <div className="notif-panel">
                        <div style={{ padding: "15px", borderBottom: "2px solid #c3f23f", background: "#f8fbe7", borderRadius: "10px 10px 0 0" }}>
                            <h4 style={{ margin: 0, color: "#3c0094" }}>Notifications</h4>
                        </div>
                        
                        <div className="notif-list">
                            {totalAlerts === 0 ? (
                                <p style={{ padding: "15px", textAlign: "center", color: "#888" }}>No new notifications.</p>
                            ) : (
                                <>
                                    {/* System Alert for Overdue Patients (AC Test 1) */}
                                    {overdueCount > 0 && (
                                        <div className="notif-item system-alert">
                                            <strong>System Alert</strong>
                                            <p>{overdueCount} patient(s) are overdue for their 6-month recall.</p>
                                            <button className="clinic-btn-small" onClick={() => { navigate('/staff-dashboard/recalls'); setShowNotifPanel(false); }}>
                                                View Recall List
                                            </button>
                                        </div>
                                    )}

                                    {/* Custom Follow-up Reminders (AC Test 4) */}
                                    {notifications.map(notif => (
                                        <div key={notif.id} className="notif-item">
                                            <strong>{notif.title}</strong>
                                            <p>{notif.message}</p>
                                            <div style={{ display: "flex", gap: "10px", marginTop: "8px" }}>
                                                <button className="clinic-btn-small" style={{ background: "#7e5cfb", color: "white" }} onClick={() => { navigate(notif.link); setShowNotifPanel(false); }}>
                                                    View Details
                                                </button>
                                                {/* Mark as Read (AC Test 3) */}
                                                <button className="clinic-btn-small" style={{ background: "#e0e0e0" }} onClick={() => markNotificationRead(notif.id)}>
                                                    Mark Read
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </>
                            )}
                        </div>
                    </div>
                )}
            </header>

            <div className="clinic-body">
                <nav className="clinic-sidebar">
                    <ul>
                        <li><Link to="/staff-dashboard/home" className={location.pathname.includes('/home') ? 'active' : ''}>Dashboard</Link></li>
                        <li><Link to="/staff-dashboard/appointments" className={location.pathname.includes('/appointments') ? 'active' : ''}>Appointments</Link></li>
                        <li><Link to="/staff-dashboard/tasks" className={location.pathname.includes('/tasks') ? 'active' : ''}>Tasks</Link></li>
                        <li><Link to="/staff-dashboard/patients" className={location.pathname.includes('/patients') ? 'active' : ''}>Patients</Link></li>
                        <li><Link to="/staff-dashboard/no-shows" className={location.pathname.includes('/no-shows') ? 'active' : ''}>No-Shows</Link></li>
                        <li><Link to="/staff-dashboard/messages" className={location.pathname.includes('/messages') ? 'active' : ''}>Call & Message Log</Link></li>
                        <li><Link to="/staff-dashboard/recalls" className={location.pathname.includes('/recalls') ? 'active' : ''}>Recall List</Link></li>
                        <li><Link to="/staff-dashboard/schedule" className={location.pathname.includes('/schedule') ? 'active' : ''}>Staff Schedule</Link></li>
                        <li><Link to="/staff-dashboard/staffchatbot" className={location.pathname.includes('/staffchatbot') ? 'active' : ''}>AI Assistant</Link></li>
                      
                    </ul>
                    <div className="logout-container">
                        <button onClick={handleLogout} className="signout-btn">Sign Out</button>
                    </div>
                </nav>

                <main className="clinic-main">
                    <Outlet />
                </main>
            </div>
        </div>
    );
};

export default ClinicDashboard;