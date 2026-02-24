import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import './App.css';

// Main routing and role-based dashboard setup

import Home from './pages/Home/Home';
import Login from './pages/Home/Login';
import Signup from './pages/Home/Signup';
import UserProfile from './pages/Home/UserProfile';

// doctor pages
import DoctorDashboard from './pages/Doctor/DoctorDashboard';
import DoctorHome from './pages/Doctor/DoctorHome';
import DoctorSchedule from './pages/Doctor/DoctorSchedule';
import DoctorKPIsView from "./pages/Doctor/DoctorKPIsView";
import DoctorPatientDetails from "./pages/Doctor/DoctorPatientDetails";
import DoctorPatientsList from "./pages/Doctor/DoctorPatientsList";

//clinic pages
import ClinicDashboard from './pages/Clinic/ClinicDashboard';
import ClinicHome from './pages/Clinic/ClinicHome';
import KPIsView from "./pages/Clinic/KPIsView";
import NoShowList from "./pages/Clinic/NoShowList";
import AppointmentsPage from "./pages/Clinic/Appointments/AppointmentsPage";
import ManageAppointments from "./pages/Clinic/Appointments/ManageAppointments";
import CheckinCancellations from "./pages/Clinic/Appointments/CheckinCancellations";
import TasksPage from "./pages/Clinic/Tasks/TasksPage";
import TaskSummary from "./pages/Clinic/Tasks/TaskSummary";
import TaskList from "./pages/Clinic/Tasks/TaskList";
import PatientsPage from "./pages/Clinic/Patients/PatientsPage";
import DoctorPatientsPage from "./pages/Clinic/Patients/DoctorPatients";
import AllPatientsPage from "./pages/Clinic/Patients/AllPatients";
import PatientDetailsPage from "./pages/Clinic/Patients/PatientDetails";
import DailyWrapUpPage from './pages/Clinic/DailyWrapUp';

//manager pages
import ManagerDashboard from './pages/Manager/ManagerDashboard';
import ManagerHome from './pages/Manager/ManagerHome';
import ManagerAlerts from './pages/Manager/ManagerAlerts';
import DataCenter from './pages/Manager/DataCenter';
import ManagerKpi from './pages/Manager/ManagerKpi';
import ManagerGoals from './pages/Manager/ManagerGoals';


const ProtectedRoute = ({ children, allowedRoles }) => {
    const { currentUser, userRole } = useAuth();

    if (!currentUser) {
        return <Navigate to="/login" />;
    }

    if (allowedRoles && !allowedRoles.includes(userRole)) {
        return <Navigate to="/login" />;
    }

    return children;
};

function App() {
    return (
        <Router>
            <AuthProvider>
                <Routes>
                    {/* Public Routes */}
                    <Route path="/" element={<Home />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/signup" element={<Signup />} />

                    <Route
                        path="/complete-profile"
                        element={
                            <ProtectedRoute allowedRoles={['staff', 'doctor', 'manager']}>
                                <UserProfile />
                            </ProtectedRoute>
                        }
                    />

                    {/* Staff Dashboard */}
                    <Route
                        path="/staff-dashboard"
                        element={
                            <ProtectedRoute allowedRoles={['staff']}>
                                <ClinicDashboard />
                            </ProtectedRoute>
                        }
                    >
                        <Route index element={<ClinicHome />} />
                        <Route path="home" element={<ClinicHome />} />

                        <Route path="appointments" element={<AppointmentsPage />}>
                            <Route index element={<Navigate to="manage" replace />} />
                            <Route path="manage" element={<ManageAppointments />} />
                            <Route path="checkin" element={<CheckinCancellations />} />
                        </Route>

                        <Route path="tasks" element={<TasksPage />}>
                            <Route index element={<Navigate to="summary" replace />} />
                            <Route path="summary" element={<TaskSummary />} />
                            <Route path="list" element={<TaskList />} />
                        </Route>

                        <Route path="patients" element={<PatientsPage />} />
                        <Route path="patients/doctor/:doctorId" element={<DoctorPatientsPage />} />
                        <Route path="patients/all" element={<AllPatientsPage />} />
                        <Route path="patients/details/:patientId" element={<PatientDetailsPage />} />

                        <Route path="no-shows" element={<NoShowList />} />
                        <Route path="kpis" element={<KPIsView />} />
                        <Route path="messages" element={<div>Messages (Coming Soon)</div>} />
                        <Route path="recalls" element={<div>Recalls (Coming Soon)</div>} />
                        <Route path="schedule" element={<div>Schedule (Coming Soon)</div>} />
                         <Route path="wrapup" element={<DailyWrapUpPage />} />
                    </Route>

                    {/* Doctor Dashboard  */}
                    <Route
                        path="/doctor-dashboard"
                        element={
                            <ProtectedRoute allowedRoles={['doctor']}>
                                <DoctorDashboard />
                            </ProtectedRoute>
                        }
                    >
                        <Route index element={<Navigate to="home" replace />} />
                        <Route path="home" element={<DoctorHome />} />
                        <Route path="schedule" element={<DoctorSchedule />} />
                        <Route path="kpis" element={<DoctorKPIsView />} />
                        <Route path="patients" element={<DoctorPatientsList />} />
                        <Route path="patients/:patientId" element={<DoctorPatientDetails />} />
                    </Route>

                    {/* Manager Dashboard*/}
                    <Route
                        path="/manager-dashboard"
                        element={
                            <ProtectedRoute allowedRoles={['manager']}>
                                <ManagerDashboard />
                            </ProtectedRoute>
                        }
                    >
                        <Route index element={<Navigate to="home" replace />} />
                        <Route path="home" element={<ManagerHome />} />
                        <Route path="alerts" element={<ManagerAlerts />} />
                        <Route path="dataCenter" element={<DataCenter />} />
                        <Route path="managerKpi" element={<ManagerKpi/>} />
                        <Route path="goals" element={<ManagerGoals/>} />
                    </Route>

                </Routes>
            </AuthProvider>
        </Router>
    );
}

export default App;