
// // export default AIChatbot;

// import React, { useMemo, useState } from "react";
// import { generateAIResponse } from "../../services/aiService";
// //import "./AIChatbot.css";

// const SUGGESTED_QUESTIONS = [
//   "What is the appointment trend in the selected period?",
//   "How are appointment statuses distributed?",
//   "Which provider has the highest appointment volume?",
//   "Summarize provider performance.",
//   "Are there any operational concerns in the current data?",
//   "What insights can you give from this dashboard?"
// ];

// const AIChatbot = ({ dashboardData, selectedDoctor, startDate, endDate }) => {
//   const [question, setQuestion] = useState("");
//   const [messages, setMessages] = useState([
//     {
//       role: "assistant",
//       text: "Hello. I can answer questions about appointments, performance, trends, status breakdowns, and provider activity. You can click a suggested question or type your own."
//     }
//   ]);
//   const [loading, setLoading] = useState(false);

//   const dataContext = useMemo(() => {
//     if (!dashboardData) {
//       return `
// Dashboard Name: Dentara Manager Dashboard

// Context:
// No dashboard data is currently available.

// Instructions:
// - Answer only from the provided context.
// - If data is missing, clearly say that more dashboard data is needed.
// - Keep the answer short and professional.
// `;
//     }

//     const hasDetailedKpiData =
//       dashboardData.rawData || dashboardData.statusData || dashboardData.trendData;

//     if (hasDetailedKpiData) {
//       const totalAppointments = Array.isArray(dashboardData.rawData)
//         ? dashboardData.rawData.length
//         : 0;

//       const statusSummary = dashboardData.statusData || {};
//       const trendSummary = dashboardData.trendData || {};

//       const providerName = selectedDoctor || "All Providers";
//       const rangeStart = startDate || "Not specified";
//       const rangeEnd = endDate || "Not specified";

//       const sampleAppointments = (dashboardData.rawData || []).slice(0, 20).map((a) => ({
//         id: a.id,
//         date: a.date,
//         time: a.time,
//         doctorName: a.doctorName,
//         patientName: a.patientName,
//         status: a.status
//       }));

//       return `
// Dashboard Name: Dentara Manager KPI Drilldowns

// Applied Filters:
// - Provider: ${providerName}
// - Start Date: ${rangeStart}
// - End Date: ${rangeEnd}

// Summary:
// - Total Appointments: ${totalAppointments}

// Status Distribution:
// ${JSON.stringify(statusSummary, null, 2)}

// Trend Data:
// ${JSON.stringify(trendSummary, null, 2)}

// Sample Appointment Records:
// ${JSON.stringify(sampleAppointments, null, 2)}

// Instructions:
// - Answer only from this dashboard context.
// - If the data is not enough, say so clearly.
// - Keep answers concise and useful for a manager.
// - Highlight counts, trends, comparisons, and possible operational insights.
// - Do not invent data.
// `;
//     }

//     return `
// Dashboard Name: Dentara Manager Dashboard

// General Dashboard Context:
// ${JSON.stringify(dashboardData, null, 2)}

// Instructions:
// - Answer only from the provided dashboard context.
// - Do not invent appointment totals, trends, or provider counts if they are not present.
// - If detailed KPI data is missing, clearly say that only general dashboard context is available.
// - Keep answers concise and useful for a manager.
// `;
//   }, [dashboardData, selectedDoctor, startDate, endDate]);

//   const askQuestion = async (inputQuestion) => {
//     if (!inputQuestion.trim() || loading) return;

//     const userMessage = { role: "user", text: inputQuestion };
//     setMessages((prev) => [...prev, userMessage]);
//     setLoading(true);

//     try {
//       const response = await generateAIResponse(inputQuestion, dataContext);

//       setMessages((prev) => [
//         ...prev,
//         { role: "assistant", text: response || "No response generated." }
//       ]);
//     } catch (error) {
//       console.error("Error asking AI:", error);
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
//         <h3>AI Dashboard Assistant</h3>
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
//           placeholder="Ask about appointments, trends, performance..."
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

// export default AIChatbot;

import React, { useMemo, useState } from "react";
import { generateAIResponse, MANAGER_SYSTEM_CONTEXT } from "../../services/aiService";
// import "./AIChatbot.css";

const SUGGESTED_QUESTIONS = [
  "What is the appointment trend in the selected period?",
  "How are appointment statuses distributed?",
  "Which provider has the highest appointment volume?",
  "Summarize provider performance.",
  "Are there any operational concerns in the current data?",
  "What insights can you give from this dashboard?"
];

const AIChatbot = ({ dashboardData, selectedDoctor, startDate, endDate }) => {
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      text: "Hello. I can answer questions about appointments, performance, trends, status breakdowns, and provider activity. You can click a suggested question or type your own."
    }
  ]);
  const [loading, setLoading] = useState(false);

  const dataContext = useMemo(() => {
    if (!dashboardData) {
      return `
Dashboard Name: Dentara Manager Dashboard

Context:
No dashboard data is currently available.

Instructions:
- Answer only from the provided context.
- If data is missing, clearly say that more dashboard data is needed.
- Keep the answer short and professional.
`;
    }

    const hasDetailedKpiData =
      dashboardData.rawData || dashboardData.statusData || dashboardData.trendData;

    if (hasDetailedKpiData) {
      const totalAppointments = Array.isArray(dashboardData.rawData)
        ? dashboardData.rawData.length
        : 0;

      const statusSummary = dashboardData.statusData || {};
      const trendSummary = dashboardData.trendData || {};

      const providerName = selectedDoctor || "All Providers";
      const rangeStart = startDate || "Not specified";
      const rangeEnd = endDate || "Not specified";

      const sampleAppointments = (dashboardData.rawData || []).slice(0, 20).map((a) => ({
        id: a.id,
        date: a.date,
        time: a.time,
        doctorName: a.doctorName,
        patientName: a.patientName,
        status: a.status
      }));

      return `
Dashboard Name: Dentara Manager KPI Drilldowns

Applied Filters:
- Provider: ${providerName}
- Start Date: ${rangeStart}
- End Date: ${rangeEnd}

Summary:
- Total Appointments: ${totalAppointments}

Status Distribution:
${JSON.stringify(statusSummary, null, 2)}

Trend Data:
${JSON.stringify(trendSummary, null, 2)}

Sample Appointment Records:
${JSON.stringify(sampleAppointments, null, 2)}

Instructions:
- Answer only from this dashboard context.
- If the data is not enough, say so clearly.
- Keep answers concise and useful for a manager.
- Highlight counts, trends, comparisons, and possible operational insights.
- Do not invent data.
`;
    }

    return `
Dashboard Name: Dentara Manager Dashboard

General Dashboard Context:
${JSON.stringify(dashboardData, null, 2)}

Instructions:
- Answer only from the provided dashboard context.
- Do not invent appointment totals, trends, or provider counts if they are not present.
- If detailed KPI data is missing, clearly say that only general dashboard context is available.
- Keep answers concise and useful for a manager.
`;
  }, [dashboardData, selectedDoctor, startDate, endDate]);

  const askQuestion = async (inputQuestion) => {
    if (!inputQuestion.trim() || loading) return;

    const userMessage = { role: "user", text: inputQuestion };
    setMessages((prev) => [...prev, userMessage]);
    setLoading(true);

    try {
      const response = await generateAIResponse(
        inputQuestion,
        dataContext,
        MANAGER_SYSTEM_CONTEXT
      );

      setMessages((prev) => [
        ...prev,
        { role: "assistant", text: response || "No response generated." }
      ]);
    } catch (error) {
      console.error("Error asking manager AI:", error);
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
        <h3>AI Dashboard Assistant</h3>
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
          placeholder="Ask about appointments, trends, performance..."
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

export default AIChatbot;