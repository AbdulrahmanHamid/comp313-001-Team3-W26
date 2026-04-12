// export default StaffAIChatBotPage;

import React, { useEffect, useMemo, useState } from "react";
import StaffAIChatbot from "./StaffAIChatBot";
import { listenToTasks } from "../../services/tasksService";
import { listenToAllAppointments } from "../../services/appointmentsService";
import { listenToStaff } from "../../services/usersService";
import { useAuth } from "../../contexts/AuthContext";

const StaffAIChatBotPage = () => {
  const { currentUser } = useAuth();

  const [tasks, setTasks] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [staffList, setStaffList] = useState([]);

  const today = new Date().toISOString().split("T")[0];

  useEffect(() => {
    const unsubTasks = listenToTasks((data) => {
      setTasks(data || []);
    });

    const unsubAppointments = listenToAllAppointments((data) => {
      setAppointments(data || []);
    });

    const unsubStaff = listenToStaff((data) => {
      setStaffList(data || []);
    });

    return () => {
      if (typeof unsubTasks === "function") unsubTasks();
      if (typeof unsubAppointments === "function") unsubAppointments();
      if (typeof unsubStaff === "function") unsubStaff();
    };
  }, []);

  const currentStaffFullName = useMemo(() => {
    const matchedStaff = staffList.find(
      (staff) =>
        staff.email &&
        currentUser?.email &&
        staff.email.toLowerCase() === currentUser.email.toLowerCase()
    );

    return (
      matchedStaff?.fullName ||
      currentUser?.displayName ||
      currentUser?.email ||
      "Staff Member"
    );
  }, [staffList, currentUser]);

  const staffData = useMemo(() => {
    return {
      tasks,
      appointments,
      currentStaffName: currentStaffFullName
    };
  }, [tasks, appointments, currentStaffFullName]);

  return (
    <div className="manager-page">
      <h2>Staff AI Assistant</h2>
      <p>Ask questions about your tasks, priorities, and daily work.</p>

      <StaffAIChatbot
        staffData={staffData}
        selectedStaff={currentStaffFullName}
        selectedDate={today}
      />
    </div>
  );
};

export default StaffAIChatBotPage;