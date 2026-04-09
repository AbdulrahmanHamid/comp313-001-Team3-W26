// import React, { useMemo, useState } from "react";
// import { generateAIResponse, STAFF_SYSTEM_CONTEXT } from "../../services/aiService";


// const SUGGESTED_QUESTIONS = [
//   "What are my tasks for today?",
//   "Which tasks are still pending?",
//   "Do I have any overdue tasks?",
//   "What is my highest priority task right now?",
//   "Which appointments need follow-up?",
//   "Summarize my work for today."
// ];

// const StaffAIChatbot = ({ staffData, selectedStaff, selectedDate }) => {
//   const [question, setQuestion] = useState("");
//   const [messages, setMessages] = useState([
//     {
//       role: "assistant",
//       text: "Hello. I can help you review your daily tasks, pending work, priorities, and follow-ups. You can click a suggested question or type your own."
//     }
//   ]);
//   const [loading, setLoading] = useState(false);

//   const dataContext = useMemo(() => {
//     if (!staffData) {
//       return `
// Dashboard Name: Dentara Staff Dashboard

// Context:
// No staff task data is currently available.

// Instructions:
// - Answer only from the provided context.
// - If data is missing, clearly say that task data is not available.
// - Keep the answer short, clear, and useful for clinic staff.
// `;
//     }

//     const taskList = Array.isArray(staffData.tasks) ? staffData.tasks : [];
//     const appointmentList = Array.isArray(staffData.appointments) ? staffData.appointments : [];
//     const summary = staffData.summary || {};

//     const currentStaff = selectedStaff || "Current Staff Member";
//     const currentDate = selectedDate || "Today";

//     const sampleTasks = taskList.slice(0, 20).map((task) => ({
//       id: task.id,
//       title: task.title,
//       status: task.status,
//       priority: task.priority,
//       dueDate: task.dueDate,
//       assignedTo: task.assignedTo
//     }));

//     const sampleAppointments = appointmentList.slice(0, 10).map((appt) => ({
//       id: appt.id,
//       patientName: appt.patientName,
//       date: appt.date,
//       time: appt.time,
//       status: appt.status,
//       followUpRequired: appt.followUpRequired
//     }));

//     return `
// Dashboard Name: Dentara Staff Dashboard

// Applied Filters:
// - Staff Member: ${currentStaff}
// - Date: ${currentDate}

// Task Summary:
// ${JSON.stringify(summary, null, 2)}

// Task Records:
// ${JSON.stringify(sampleTasks, null, 2)}

// Appointment Follow-up Records:
// ${JSON.stringify(sampleAppointments, null, 2)}

// Instructions:
// - Answer only from this staff dashboard context.
// - Focus on daily tasks, pending items, overdue work, priorities, and follow-ups.
// - Always complete the answer in full sentences.
// - Do not stop mid-sentence.
// - Do not invent data.
// - If task data is limited, clearly say so.
// - Keep answers concise and practical for clinic staff.
// `;
//   }, [staffData, selectedStaff, selectedDate]);

//   const askQuestion = async (inputQuestion) => {
//     if (!inputQuestion.trim() || loading) return;

//     setMessages((prev) => [...prev, { role: "user", text: inputQuestion }]);
//     setLoading(true);

//     try {
//       const response = await generateAIResponse(
//         inputQuestion,
//         dataContext,
//         STAFF_SYSTEM_CONTEXT
//       );

//       setMessages((prev) => [
//         ...prev,
//         { role: "assistant", text: response || "No response generated." }
//       ]);
//     } catch (error) {
//       console.error("Error asking staff AI:", error);
//       setMessages((prev) => [
//         ...prev,
//         {
//           role: "assistant",
//           text: "Sorry, I could not process your request right now."
//         }
//       ]);
//     } finally {
//       setQuestion("");
//       setLoading(false);
//     }
//   };

//   const handleAsk = () => {
//     askQuestion(question);
//   };

//   const handleSuggestedQuestion = (q) => {
//     askQuestion(q);
//   };

//   return (
//     <div className="ai-chatbot-box">
//       <div className="ai-chatbot-header">
//         <h3>Staff AI Assistant</h3>
//       </div>

//       <div className="ai-chatbot-suggestions">
//         {SUGGESTED_QUESTIONS.map((q, index) => (
//           <button
//             key={index}
//             type="button"
//             className="suggestion-btn"
//             onClick={() => handleSuggestedQuestion(q)}
//             disabled={loading}
//           >
//             {q}
//           </button>
//         ))}
//       </div>

//       <div className="ai-chatbot-messages">
//         {messages.map((msg, index) => (
//           <div key={index} className={`ai-message ${msg.role}`}>
//             {msg.text}
//           </div>
//         ))}

//         {loading && (
//           <div className="ai-message assistant typing">
//             <div className="typing-bubble">
//               <span></span>
//               <span></span>
//               <span></span>
//             </div>
//           </div>
//         )}
//       </div>

//       <div className="ai-chatbot-input">
//         <input
//           type="text"
//           placeholder="Ask about your daily tasks, priorities, or follow-ups..."
//           value={question}
//           onChange={(e) => setQuestion(e.target.value)}
//           onKeyDown={(e) => e.key === "Enter" && handleAsk()}
//           disabled={loading}
//         />
//         <button onClick={handleAsk} disabled={loading || !question.trim()}>
//           Ask
//         </button>
//       </div>
//     </div>
//   );
// };

// export default StaffAIChatbot;

import React, { useMemo, useState } from "react";
import { generateAIResponse, STAFF_SYSTEM_CONTEXT } from "../../services/aiService";
import { useAuth } from "../../contexts/AuthContext";
//import "./AIChatbot.css";

const SUGGESTED_QUESTIONS = [
  "What are my tasks for today?",
  "Which tasks are still pending?",
  "Do I have any overdue tasks?",
  "What is my highest priority task right now?",
  "Which appointments need follow-up?",
  "Summarize my work for today."
];

const StaffAIChatbot = ({ staffData, selectedStaff, selectedDate }) => {
  const { currentUser } = useAuth();

  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      text: "Hello. I can help you review your daily tasks, pending work, priorities, and follow-ups. You can click a suggested question or type your own."
    }
  ]);
  const [loading, setLoading] = useState(false);

  const dataContext = useMemo(() => {
    if (!staffData) {
      return `
Dashboard Name: Dentara Staff Dashboard

Context:
No staff task data is currently available.

Instructions:
- Answer only from the provided context.
- If data is missing, clearly say that task data is not available.
- Keep the answer short, clear, and useful for clinic staff.
`;
    }

    const today = new Date().toISOString().split("T")[0];

    const taskList = Array.isArray(staffData.tasks) ? staffData.tasks : [];
    const appointmentList = Array.isArray(staffData.appointments) ? staffData.appointments : [];

    const currentStaff =
      selectedStaff ||
      staffData.currentStaffName ||
      currentUser?.displayName ||
      currentUser?.email ||
      "Current Staff Member";

    const currentDate = selectedDate || today;

    const myTasks = taskList.filter((task) => {
      if (!task.assignedTo) return false;
      return task.assignedTo.toLowerCase() === currentStaff.toLowerCase();
    });

    const myPendingTasks = myTasks.filter((task) => task.status === "Pending");

    const myCompletedTasks = myTasks.filter((task) => task.status === "Completed");

    const myOverdueTasks = myTasks.filter((task) => {
      if (!task.dueDate) return false;
      return task.dueDate < currentDate && task.status !== "Completed";
    });

    const myTodayTasks = myTasks.filter((task) => task.dueDate === currentDate);

    const myHighPriorityTasks = myTasks.filter(
      (task) => task.priority === "High" && task.status !== "Completed"
    );

    const followUpAppointments = appointmentList.filter((appt) => {
      const assignedMatch =
        !appt.assignedTo ||
        appt.assignedTo.toLowerCase() === currentStaff.toLowerCase();

      return appt.followUpRequired === true && assignedMatch;
    });

    const summary = {
      currentStaff,
      totalAssignedTasks: myTasks.length,
      tasksDueToday: myTodayTasks.length,
      pendingTasks: myPendingTasks.length,
      completedTasks: myCompletedTasks.length,
      overdueTasks: myOverdueTasks.length,
      highPriorityOpenTasks: myHighPriorityTasks.length,
      followUpAppointments: followUpAppointments.length
    };

    const sampleTasks = myTasks.slice(0, 20).map((task) => ({
      id: task.id,
      task: task.task,
      assignedTo: task.assignedTo || "",
      priority: task.priority || "",
      dueDate: task.dueDate || "",
      status: task.status || "",
      notes: task.notes || ""
    }));

    const sampleAppointments = followUpAppointments.slice(0, 10).map((appt) => ({
      id: appt.id,
      patientName: appt.patientName || "",
      date: appt.date || "",
      time: appt.time || "",
      status: appt.status || "",
      followUpRequired: appt.followUpRequired || false
    }));

    return `
Dashboard Name: Dentara Staff Dashboard

Applied Filters:
- Staff Member: ${currentStaff}
- Date: ${currentDate}

Task Summary:
${JSON.stringify(summary, null, 2)}

My Task Records:
${JSON.stringify(sampleTasks, null, 2)}

My Follow-up Appointment Records:
${JSON.stringify(sampleAppointments, null, 2)}

Instructions:
- Answer only from this staff dashboard context.
- Focus only on the current staff member.
- Use the task field as the task name.
- If there are no tasks for today, say that first, then mention pending or overdue tasks if they exist.
- When asked about priority, identify the highest priority open task. High is above Medium, and Medium is above Low.
- Do not use markdown or bullet points.
- Do not invent data.
- Keep answers concise and practical for clinic staff.
`;
  }, [staffData, selectedStaff, selectedDate, currentUser]);

  const askQuestion = async (inputQuestion) => {
    if (!inputQuestion.trim() || loading) return;

    setMessages((prev) => [...prev, { role: "user", text: inputQuestion }]);
    setLoading(true);

    try {
      const response = await generateAIResponse(
        inputQuestion,
        dataContext,
        STAFF_SYSTEM_CONTEXT
      );

      setMessages((prev) => [
        ...prev,
        { role: "assistant", text: response || "No response generated." }
      ]);
    } catch (error) {
      console.error("Error asking staff AI:", error);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          text: "Sorry, I could not process your request right now."
        }
      ]);
    } finally {
      setQuestion("");
      setLoading(false);
    }
  };

  const handleAsk = () => {
    askQuestion(question);
  };

  const handleSuggestedQuestion = (q) => {
    askQuestion(q);
  };

  return (
    <div className="ai-chatbot-box">
      <div className="ai-chatbot-header">
        <h3>Staff AI Assistant</h3>
      </div>

      <div className="ai-chatbot-suggestions">
        {SUGGESTED_QUESTIONS.map((q, index) => (
          <button
            key={index}
            type="button"
            className="suggestion-btn"
            onClick={() => handleSuggestedQuestion(q)}
            disabled={loading}
          >
            {q}
          </button>
        ))}
      </div>

      <div className="ai-chatbot-messages">
        {messages.map((msg, index) => (
          <div key={index} className={`ai-message ${msg.role}`}>
            {msg.text}
          </div>
        ))}

        {loading && (
          <div className="ai-message assistant typing">
            <div className="typing-bubble">
              <span></span>
              <span></span>
              <span></span>
            </div>
          </div>
        )}
      </div>

      <div className="ai-chatbot-input">
        <input
          type="text"
          placeholder="Ask about your daily tasks, priorities, or follow-ups..."
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleAsk()}
          disabled={loading}
        />
        <button onClick={handleAsk} disabled={loading || !question.trim()}>
          Ask
        </button>
      </div>
    </div>
  );
};

export default StaffAIChatbot;