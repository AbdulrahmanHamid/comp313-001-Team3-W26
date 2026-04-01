import React, { useEffect, useState } from "react";
import AIChatbot from "./AIChatBot";
import { listenToFilteredKPITrends } from "../../services/managerService";

const AIChatBotPage = () => {
  const [data, setData] = useState(null);

  useEffect(() => {
    const unsub = listenToFilteredKPITrends({}, (result) => {
      setData(result);
    });

    return () => unsub();
  }, []);

  return (
    <div className="manager-page">
      <h2>AI Assistant</h2>
      <p>Ask questions about clinic performance, appointments, and operations.</p>

      <AIChatbot
        dashboardData={data}
        selectedDoctor=""
        startDate=""
        endDate=""
      />
    </div>
  );
};

export default AIChatBotPage;