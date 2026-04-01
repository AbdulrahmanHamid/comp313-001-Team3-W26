import React, { useMemo, useState } from "react";
import { generateAIResponse } from "../../services/aiService";

const AIChatbot = ({ dashboardData, selectedDoctor, startDate, endDate }) => {
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      text: "Hello. I can answer questions about the dashboard data, such as appointment trends, status breakdowns, and provider activity."
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

  const handleAsk = async () => {
    if (!question.trim()) return;

    const userMessage = { role: "user", text: question };
    setMessages((prev) => [...prev, userMessage]);
    setLoading(true);

    const response = await generateAIResponse(question, dataContext);

    setMessages((prev) => [...prev, { role: "assistant", text: response }]);

    setQuestion("");
    setLoading(false);
  };

  return (
    <div className="ai-chatbot-box">
      <div className="ai-chatbot-header">
        <h3>AI Dashboard Assistant</h3>
      </div>

      <div className="ai-chatbot-messages">
        {messages.map((msg, index) => (
          <div key={index} className={`ai-message ${msg.role}`}>
            {msg.text}
          </div>
        ))}
        {loading && (
          <div className="ai-message assistant">Analyzing dashboard data...</div>
        )}
      </div>

      <div className="ai-chatbot-input">
        <input
          type="text"
          placeholder="Ask about trends, status, provider performance..."
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleAsk()}
        />
        <button onClick={handleAsk} disabled={loading}>
          Ask
        </button>
      </div>
    </div>
  );
};

export default AIChatbot;