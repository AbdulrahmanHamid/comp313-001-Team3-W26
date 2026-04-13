import React, { useEffect, useMemo, useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import {
  listenToDoctorAppointments,
  listenToAllPatients,
  getDoctorInfo
} from "../../services/doctorService";
import { getTodayLocal } from "../../utils/dateUtils";
import {
  generateAIResponse,
  DOCTOR_SYSTEM_CONTEXT,
  buildDoctorDataContext
} from "../../services/aiService";
//import "../../styles/AIChatBot.css";

const SUGGESTED_QUESTIONS = [
  "What is my schedule for today?",
  "Which appointments are pending?",
  "Who are my assigned patients?",
  "Do I have any checked-in patients?",
  "Summarize my appointments for today."
];

const DoctorAIChatBot = () => {
  const { currentUser } = useAuth();

  const [doctorName, setDoctorName] = useState("");
  const [selectedDate] = useState(getTodayLocal());
  const [appointments, setAppointments] = useState([]);
  const [doctorPatients, setDoctorPatients] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [dataLoading, setDataLoading] = useState(true);

  const [messages, setMessages] = useState([
    {
      sender: "bot",
      text: "Hello Doctor. I can help you review your schedule, appointment status, and assigned patients."
    }
  ]);

  useEffect(() => {
    if (!currentUser) return;

    let appointmentsReady = false;
    let patientsReady = false;

    getDoctorInfo(currentUser.uid).then((info) => {
      if (info?.fullName) {
        setDoctorName(info.fullName);
      }
    });

    const unsubscribeAppointments = listenToDoctorAppointments(
      currentUser.uid,
      selectedDate,
      (appointmentsList) => {
        setAppointments(appointmentsList || []);
        appointmentsReady = true;
        if (appointmentsReady && patientsReady) {
          setDataLoading(false);
        }
      }
    );

    const unsubscribePatients = listenToAllPatients((patientsList) => {
      const filteredPatients = (patientsList || []).filter(
        (patient) => patient.doctorId === currentUser.uid
      );
      setDoctorPatients(filteredPatients);
      patientsReady = true;
      if (appointmentsReady && patientsReady) {
        setDataLoading(false);
      }
    });

    return () => {
      if (unsubscribeAppointments) unsubscribeAppointments();
      if (unsubscribePatients) unsubscribePatients();
    };
  }, [currentUser, selectedDate]);

  const dataContext = useMemo(() => {
    return buildDoctorDataContext({
      doctorName,
      selectedDate,
      appointments,
      patients: doctorPatients
    });
  }, [doctorName, selectedDate, appointments, doctorPatients]);

  const handleAskAI = async (questionText) => {
    if (!questionText.trim()) return;

    const userMessage = {
      sender: "user",
      text: questionText
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      const aiReply = await generateAIResponse(
        questionText,
        dataContext,
        DOCTOR_SYSTEM_CONTEXT
      );

      setMessages((prev) => [
        ...prev,
        {
          sender: "bot",
          text: aiReply || "No response generated."
        }
      ]);
    } catch (error) {
      console.error("Doctor AI error:", error);
      setMessages((prev) => [
        ...prev,
        {
          sender: "bot",
          text: "Sorry, I am unable to respond right now."
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    await handleAskAI(input);
  };

  return (
    <div className="ai-chatbot-container">
      <div className="chat-window">
        {messages.map((msg, index) => (
          <div key={index} className={`chat-message ${msg.sender}`}>
            <div className="chat-bubble">{msg.text}</div>
          </div>
        ))}

        {(loading || dataLoading) && (
          <div className="chat-message bot">
            <div className="chat-bubble">
              {dataLoading ? "Loading doctor data..." : "Thinking..."}
            </div>
          </div>
        )}
      </div>

      <div className="suggested-questions">
        {SUGGESTED_QUESTIONS.map((question, index) => (
          <button
            key={index}
            className="suggestion-btn"
            onClick={() => handleAskAI(question)}
            disabled={loading || dataLoading}
          >
            {question}
          </button>
        ))}
      </div>

      <form className="chat-input-row" onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Ask about your schedule or patients..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={loading || dataLoading}
        />
        <button
          type="submit"
          disabled={!input.trim() || loading || dataLoading}
        >
          Send
        </button>
      </form>
    </div>
  );
};

export default DoctorAIChatBot;