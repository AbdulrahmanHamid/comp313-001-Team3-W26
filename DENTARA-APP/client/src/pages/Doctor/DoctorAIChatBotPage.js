import React from "react";
import DoctorAIChatBot from "./DoctorAIChatBot";
import '../../styles/DoctorDashboard.css';
const DoctorAIChatBotPage = () => {
  return (
    <div className="doctor-ai-page">
      <h2>Doctor AI Assistant</h2>
      <p>
        Ask questions about your appointments, daily schedule, and assigned patients.
      </p>

      <DoctorAIChatBot />
    </div>
  );
};

export default DoctorAIChatBotPage;