import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { listenToDoctorTodayAppointments, listenToDoctorAlerts, acknowledgeAlert, getDoctorInfo } from '../../services/doctorService';
import '../../styles/DoctorDashboard.css';

const DoctorHome = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [doctorName, setDoctorName] = useState('');
  const [stats, setStats] = useState({
    completed: 0,
    pending: 0,
    noShows: 0,
    total: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUser) return;

    getDoctorInfo(currentUser.uid).then((info) => {
      if (info) setDoctorName(info.fullName);
    });

    const unsubscribeAppointments = listenToDoctorTodayAppointments(
      currentUser.uid,
      (appointmentsList) => {
        setAppointments(appointmentsList);

        const completed = appointmentsList.filter(a => a.status === 'Completed').length;
        const pending = appointmentsList.filter(a => a.status === 'Pending' || a.status === 'Confirmed').length;
        const noShows = appointmentsList.filter(a => a.status === 'Cancelled' || a.status === 'No-Show').length;

        setStats({
          completed,
          pending,
          noShows,
          total: appointmentsList.length
        });

        setLoading(false);
      }
    );

    const unsubscribeAlerts = listenToDoctorAlerts(
      currentUser.uid,
      (alertsList) => {
        setAlerts(alertsList);
      }
    );

    return () => {
      unsubscribeAppointments();
      unsubscribeAlerts();
    };
  }, [currentUser]);

  const handleAcknowledgeAlert = async (alertId) => {
    try {
      await acknowledgeAlert(alertId);
    } catch (error) {
      console.error('Error acknowledging alert:', error);
    }
  };

  const handleViewPatient = (patientId) => {
    navigate(`/doctor-dashboard/patients/${patientId}`);
  };

  if (loading) {
    return <div className="doctor-home"><p>Loading dashboard...</p></div>;
  }

  return (
    <div className="doctor-home">
      <section className="kpi-summary">
        <h3>Today's KPIs Summary</h3>
        <p>
          <strong>Completed:</strong> {stats.completed} |
          <strong> Pending:</strong> {stats.pending} |
          <strong> No-Shows/Cancelled:</strong> {stats.noShows}
        </p>
        <p><strong>Total Appointments:</strong> {stats.total}</p>
        <button className="kpi-button" onClick={() => navigate('/doctor-dashboard/kpis')}>
          📊 View Daily KPI Report
        </button>
      </section>

      <div className="middle-panels">
        <section className="schedule">
          <h3>📅 Today's Schedule (Latest 8)</h3>
          {appointments.length === 0 ? (
            <p>No appointments scheduled for today</p>
          ) : (
            <table className="schedule-table">
              <thead>
                <tr>
                  <th>Time</th>
                  <th>Patient</th>
                  <th>Reason</th>
                  <th>Room</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {appointments.slice(0, 8).map(apt => (
                  <tr key={apt.id}>
                    <td>{apt.time}</td>
                    <td>{apt.patientName}</td>
                    <td>{apt.reason}</td>
                    <td>{apt.room || '-'}</td>
                    <td>
                      <span className={`status-badge status-${apt.status.toLowerCase().replace(' ', '-')}`}>
                        {apt.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>

        <section className="alerts">
          <h3>⚠️ Alerts & Urgent Cases</h3>
          {alerts.length === 0 ? (
            <p>No pending alerts</p>
          ) : (
            <div>
              {alerts.map(alert => (
                <div key={alert.id} className={`alert-card ${alert.priority === 'High' ? 'alert-high' : ''}`}>
                  <p className="alert-patient"><strong>{alert.patientName}</strong></p>
                  <p className="alert-message">{alert.message}</p>
                  <p className="alert-priority">Priority: {alert.priority}</p>
                  <div className="alert-actions">
                    <button
                      className="acknowledge-btn"
                      onClick={() => handleAcknowledgeAlert(alert.id)}
                    >
                      Acknowledge
                    </button>
                    <button
                      className="view-btn"
                      onClick={() => handleViewPatient(alert.patientId)}
                    >
                      View Patient
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      <section className="quick-actions">
        <h3>Quick Actions</h3>
        <div className="quick-buttons">
          <button className="action-btn" onClick={() => navigate('/doctor-dashboard/schedule')}>
            📅 Schedule
          </button>
          <button className="action-btn" onClick={() => navigate('/doctor-dashboard/patients')}>
            👥 Patients
          </button>
        </div>
      </section>
    </div>
  );
};

export default DoctorHome;
