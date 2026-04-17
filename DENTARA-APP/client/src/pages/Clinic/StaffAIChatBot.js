
// export default StaffAIChatbot;

import React, { useMemo, useState } from "react";
import { generateAIResponse, STAFF_SYSTEM_CONTEXT } from "../../services/aiService";
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
    const currentDate = selectedDate || today;
    const currentStaff =
      selectedStaff ||
      staffData.currentStaffName ||
      "Staff Member";

    const taskList = Array.isArray(staffData.tasks) ? staffData.tasks : [];
    const appointmentList = Array.isArray(staffData.appointments)
      ? staffData.appointments
      : [];

    const normalize = (value) => (value || "").toString().trim().toLowerCase();

    const myTasks = taskList.filter((task) => {
      if (!task.assignedTo) return false;
      return normalize(task.assignedTo) === normalize(currentStaff);
    });

    const myPendingTasks = myTasks.filter(
      (task) => normalize(task.status) === "pending"
    );

    const myCompletedTasks = myTasks.filter(
      (task) => normalize(task.status) === "completed"
    );

    const myOverdueTasks = myTasks.filter((task) => {
      if (!task.dueDate) return false;
      return task.dueDate < currentDate && normalize(task.status) !== "completed";
    });

    const myTodayTasks = myTasks.filter((task) => task.dueDate === currentDate);

    const openTasks = myTasks.filter(
      (task) => normalize(task.status) !== "completed"
    );

    const priorityRank = {
      high: 3,
      medium: 2,
      low: 1
    };

    const sortedOpenTasks = [...openTasks].sort((a, b) => {
      const priorityDiff =
        (priorityRank[normalize(b.priority)] || 0) -
        (priorityRank[normalize(a.priority)] || 0);

      if (priorityDiff !== 0) return priorityDiff;

      const dueA = a.dueDate || "9999-12-31";
      const dueB = b.dueDate || "9999-12-31";
      return dueA.localeCompare(dueB);
    });

    const topPriorityTask = sortedOpenTasks[0] || null;

    const followUpAppointments = appointmentList.filter((appt) => {
      const followUp = appt.followUpRequired === true;
      const assignedToMatches =
        !appt.assignedTo ||
        normalize(appt.assignedTo) === normalize(currentStaff);

      return followUp && assignedToMatches;
    });

    const summary = {
      currentStaff,
      totalAssignedTasks: myTasks.length,
      tasksDueToday: myTodayTasks.length,
      pendingTasks: myPendingTasks.length,
      completedTasks: myCompletedTasks.length,
      overdueTasks: myOverdueTasks.length,
      followUpAppointments: followUpAppointments.length,
      highestPriorityTask: topPriorityTask
        ? {
            task: topPriorityTask.task || "",
            priority: topPriorityTask.priority || "",
            dueDate: topPriorityTask.dueDate || "",
            status: topPriorityTask.status || ""
          }
        : null
    };

    const sampleTasks = myTasks.slice(0, 20).map((task) => ({
      id: task.id,
      task: task.task || "",
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
- Use the "task" field as the task name.
- If there are no tasks due today, say that clearly first.
- Then also mention pending tasks, overdue tasks, and follow-up appointments if they exist.
- When asked about highest priority, choose from open tasks only.
- Priority order is High, then Medium, then Low.
- If multiple tasks share the same priority, prefer the earlier due date.
- Do not use markdown, bullet points, or asterisks.
- Do not invent data.
- Keep answers concise, practical, and complete.
`;
  }, [staffData, selectedStaff, selectedDate]);

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