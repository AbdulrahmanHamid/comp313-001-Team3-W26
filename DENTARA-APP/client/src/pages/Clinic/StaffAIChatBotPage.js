import React, { useEffect, useState } from "react";
import StaffAIChatbot from "./StaffAIChatBot";
import { listenToTasks } from "../../services/tasksService";
import { listenToAllAppointments } from "../../services/appointmentsService";
import { useAuth } from "../../contexts/AuthContext";

const StaffAIChatBotPage = () => {
  const [tasks, setTasks] = useState([]);
  const [appointments, setAppointments] = useState([]);

  const { currentUser } = useAuth();

  // ✅ Define TODAY
  const today = new Date().toISOString().split("T")[0];

  // ✅ Define STAFF NAME (important)
  const currentStaffFullName =
    currentUser?.displayName || currentUser?.email || "Staff Member";

  useEffect(() => {
    const unsubTasks = listenToTasks(setTasks);
    const unsubAppts = listenToAllAppointments(setAppointments);

    return () => {
      unsubTasks();
      unsubAppts();
    };
  }, []);

  // Build staffData for chatbot
  const staffData = {
    tasks,
    appointments,
    currentStaffName: currentStaffFullName
  };

  return (
    <div className="manager-page">
      <h2>Staff AI Assistant</h2>
      <p>Ask questions about your tasks, priorities, and daily work.</p>

      <StaffAIChatbot
        staffData={staffData}
        selectedStaff={currentStaffFullName}   // ✅ FIXED
        selectedDate={today}                  // ✅ FIXED
      />
    </div>
  );
};

export default StaffAIChatBotPage;