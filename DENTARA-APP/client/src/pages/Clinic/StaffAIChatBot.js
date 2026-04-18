// export default StaffAIChatbot;

import React, { useMemo, useState, useEffect } from "react";
import { generateAIResponse, STAFF_SYSTEM_CONTEXT } from "../../services/aiService";
import { db } from "../../firebase/firebaseConfig";
import { collection, onSnapshot } from "firebase/firestore";
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
  const [allPatients, setAllPatients] = useState([]);
  const [allAppointments, setAllAppointments] = useState([]);

  // Fetch full patient and appointment databases to calculate historical recalls
  useEffect(() => {
    const unsubPatients = onSnapshot(collection(db, "patients"), (snapshot) => {
      const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setAllPatients(list);
    });

    const unsubAppts = onSnapshot(collection(db, "appointments"), (snapshot) => {
      const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setAllAppointments(list);
    });

    return () => {
      unsubPatients();
      unsubAppts();
    };
  }, []);

  const dataContext = useMemo(() => {
    if (!staffData) {
      return `
Dashboard Name: Dentara Staff Dashboard

Context:
No staff task data is currently available.

Instructions:
- Answer only from the provided context.
- If data is not available, politely explain that task data is currently empty.
- Keep the answer short, clear, and useful for clinic staff.
- Do not use emojis.
- Never say the phrase "Data is missing."
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

    // EXACT Match of RecallList.js Overdue Logic
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    const now = new Date();

    const processedPatients = (Array.isArray(allPatients) ? allPatients : []).map(p => {
        const name = p.firstName && p.lastName ? `${p.firstName} ${p.lastName}` : (p.fullName || p.name || p.patientName || "Unknown Patient");
        
        const patientAppts = (Array.isArray(allAppointments) ? allAppointments : []).filter(
            (a) => a.patientId === p.id || a.patientName === (p.name || p.patientName)
        );

        let latestPastApptDate = null;
        patientAppts.forEach((a) => {
            const apptDateStr = a.date || a.appointmentDate; 
            if (apptDateStr) {
                const apptDate = new Date(apptDateStr);
                if (!isNaN(apptDate) && apptDate < now) {
                    if (!latestPastApptDate || apptDate > latestPastApptDate) {
                        latestPastApptDate = apptDate;
                    }
                }
            }
        });

        // Exact fallback logic from your RecallList.js
        const trueLastVisit = latestPastApptDate || (p.lastVisit ? new Date(p.lastVisit) : new Date(p.createdAt));
        const isOverdue = trueLastVisit < sixMonthsAgo;

        return {
            name,
            phone: p.phone || p.phoneNumber || p.contact || "No phone listed",
            isOverdueForRecall: isOverdue
        };
    });

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

Processed Patient Records:
${JSON.stringify(processedPatients, null, 2)}

Instructions:
- Answer only from this staff dashboard context.
- Test 1: If asked about patients overdue for recall, look at the Processed Patient Records and list the names of ANY patients where "isOverdueForRecall" is true. If none are true, confirm that no one is overdue.
- Test 2: If asked about high-priority tasks, filter the Task Records and display only the pending tasks marked as High urgency.
- Test 3: If asked how to mark a task as complete, provide navigational instructions: Tell the user to navigate to the "Tasks" section from the sidebar menu, locate the specific task in the list, and click the checkbox or the Complete button next to it.
- Test 4: If asked for a patient's phone number, search the Processed Patient Records for their name and return the associated phone number field.
- Keep answers concise, practical, and complete.
- Do not use emojis, markdown formatting, asterisks, or bullet points.
- Never use the phrase "Data is missing." If you cannot find a requested item, state clearly that it is not present in the current clinic database.
`;
  }, [staffData, selectedStaff, selectedDate, allPatients, allAppointments]);

  const askQuestion = async (inputQuestion) => {
    if (!inputQuestion.trim() || loading) return;

    // Build chat history string to send to Gemini
    const chatHistory = messages.map(m => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.text}`).join('\n');
    const enrichedPrompt = `Chat History:\n${chatHistory}\n\nUser's new question: ${inputQuestion}`;

    setMessages((prev) => [...prev, { role: "user", text: inputQuestion }]);
    setLoading(true);

    try {
      const response = await generateAIResponse(
        enrichedPrompt,
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