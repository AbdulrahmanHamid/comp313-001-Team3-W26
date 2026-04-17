import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getClinicKPIs, listenToAllAlerts } from "../../services/managerService";
import { generateAIResponse } from "../../services/aiService";
import { db } from "../../firebase/firebaseConfig";
import { collection, addDoc } from "firebase/firestore";
import "../../styles/ManagerDashboard.css";

const ManagerHome = () => {
  const navigate = useNavigate();
  const [kpis, setKpis] = useState(null);
  const [recentAlerts, setRecentAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  // AI-3 Insight State
  const [aiInsight, setAiInsight] = useState("");
  const [insightDetails, setInsightDetails] = useState("");
  const [loadingInsight, setLoadingInsight] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [insightResolved, setInsightResolved] = useState(false);
  const [insightType, setInsightType] = useState(""); 

  useEffect(() => {
    // KPIs
    const fetchKPIs = async () => {
      const kpiData = await getClinicKPIs();
      setKpis(kpiData);
      setLoading(false);

      // AI-3 Revenue Insight Calculation
      if (kpiData && kpiData.total > 0) {
        const cancelRate = (kpiData.cancelled / kpiData.total) * 100;

        // Test 4: Positive Reinforcement for perfect attendance
        if (kpiData.noShows === 0 && kpiData.cancelled === 0) {
            setInsightType("positive");
            setAiInsight("Excellent work. The AI system detects flawless attendance this period. Zero no-shows and zero cancellations means your clinic is operating at maximum revenue capacity and peak efficiency.");
        }
        // Test 1: High Cancellation Check
        else if (cancelRate > 10) {
          setInsightType("warning");
          setLoadingInsight(true);
          try {
            const prompt = `The clinic has a high cancellation rate of ${cancelRate.toFixed(1)}% (${kpiData.cancelled} out of ${kpiData.total} appointments). Write a brief 2-sentence insight explaining the potential revenue impact and suggest one simple strategy to reduce cancellations. Do not use emojis.`;
            const response = await generateAIResponse(prompt);
            setAiInsight(response);

            // Fetch detailed breakdown data for Test 2
            const detailedPrompt = `Provide a detailed breakdown explaining the estimated lost revenue due to ${kpiData.cancelled} cancellations, assuming an average appointment value of $150. List 3 specific corrective actions. Do not use emojis.`;
            const details = await generateAIResponse(detailedPrompt);
            setInsightDetails(details);
          } catch (error) {
            setAiInsight("AI Insight unavailable. High cancellation rate detected. Review scheduling policies.");
            setInsightDetails("Detailed breakdown unavailable.");
          }
          setLoadingInsight(false);
        }
      }
    };
    
    const unsubAlerts = listenToAllAlerts((list) => {
      // Filter for only open/urgent alerts and take the top 3 for the dashboard
      const urgent = list
        .filter(a => a.status !== "Resolved")
        .slice(0, 3);
      setRecentAlerts(urgent);
    });

    fetchKPIs();
    return () => unsubAlerts();
  }, []);

  // Test 3: Resolve Insight and update database
  const handleResolveInsight = async () => {
      try {
          await addDoc(collection(db, "resolvedInsights"), {
              resolvedAt: new Date().toISOString(),
              note: "Manager reviewed and resolved AI cancellation insight"
          });
          setInsightResolved(true);
          setShowDetails(false);
      } catch (error) {
          console.error("Error saving resolution to database:", error);
          setInsightResolved(true);
      }
  };

  if (loading) return <div className="manager-main"><p>Loading Dashboard...</p></div>;

  return (
    <div className="manager-home">

      {/*CLINIC KPIs OVERVIEW */}
      <section className="kpi-summary">
        <h3>Clinic Performance Overview</h3>
        <div className="kpi-grid">
          <div className="kpi-card">
            <h4>Total Appointments</h4>
            <p className="kpi-number">{kpis?.total || 0}</p>
          </div>
          <div className="kpi-card">
            <h4>Completed</h4>
            <p className="kpi-number" style={{ color: "#22c55e" }}>{kpis?.completed || 0}</p>
          </div>
          <div className="kpi-card">
            <h4>Efficiency Rate</h4>
            <p className="kpi-number" style={{ color: "#7e5cfb" }}>{kpis?.efficiency || 0}%</p>
          </div>
          <div className="kpi-card">
            <h4>No-Shows</h4>
            <p className="kpi-number" style={{ color: "#ff4444" }}>{kpis?.noShows || 0}</p>
          </div>
        </div>
      </section>

      {/* AI-3 REVENUE INSIGHT CARD (Interactive for Tests 2, 3, and 4) */}
      {!insightResolved && insightType !== "" && (
        <div 
            className="manage-box" 
            style={{ 
                borderColor: insightType === "positive" ? "#78d494" : "#ffb8b8", 
                backgroundColor: insightType === "positive" ? "#f6fff9" : "#fff5f5", 
                marginBottom: "20px", 
                cursor: insightType === "warning" ? "pointer" : "default" 
            }} 
            onClick={() => insightType === "warning" && !loadingInsight && setShowDetails(!showDetails)}
        >
          <div className="manage-header" style={{ borderBottomColor: insightType === "positive" ? "#47b86d" : "#ff4444" }}>
            <h3 style={{ color: insightType === "positive" ? "#00401c" : "#cc0000", display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ fontSize: "1.2rem", fontWeight: "bold" }}>{insightType === "positive" ? "[SUCCESS]" : "[ALERT]"}</span> AI Revenue Insight
            </h3>
          </div>
          <div style={{ padding: "10px 0", color: "#333", lineHeight: "1.5" }}>
            {loadingInsight ? (
              <p>Loading AI insight...</p>
            ) : (
              <>
                <p style={{ margin: 0, fontWeight: "500" }}>{aiInsight}</p>
                
                {/* Test 2: Detailed Breakdown View */}
                {showDetails && insightType === "warning" && (
                    <div style={{ marginTop: "15px", padding: "15px", backgroundColor: "white", borderRadius: "8px", border: "1px solid #ffb8b8" }}>
                        <h4 style={{ marginTop: 0, color: "#cc0000" }}>Detailed Revenue Breakdown</h4>
                        <p style={{ whiteSpace: "pre-wrap" }}>{insightDetails}</p>
                        
                        {/* Test 3: Resolve Button */}
                        <button 
                            className="save-btn" 
                            onClick={(e) => { e.stopPropagation(); handleResolveInsight(); }}
                            style={{ backgroundColor: "#cc0000", marginTop: "10px" }}
                        >
                            Resolve and Dismiss Insight
                        </button>
                    </div>
                )}
                {insightType === "warning" && !showDetails && (
                    <p style={{ fontSize: "0.85rem", color: "#666", marginTop: "10px", fontStyle: "italic" }}>Click this card to view detailed breakdown and actions.</p>
                )}
              </>
            )}
          </div>
        </div>
      )}

      <div className="middle-panels">

        {/* M1.2: QUICK ALERTS FEED */}
        <section className="alerts">
          <div className="section-header">
            <h3>[URGENT] Alerts</h3>
            <button className="btn-sm btn-outline" onClick={() => navigate('/manager-dashboard/alerts')}>
              View All
            </button>
          </div>

          {recentAlerts.length === 0 ? (
            <p className="no-data">No urgent alerts pending.</p>
          ) : (
            recentAlerts.map(alert => (
              <div key={alert.id} className={`alert-card ${alert.priority === 'High' ? 'alert-high' : ''}`}>
                <div className="alert-header">
                  <strong>{alert.patientName}</strong>
                  <span className={`priority-tag ${alert.priority.toLowerCase()}`}>{alert.priority}</span>
                </div>
                <p className="alert-message">{alert.message}</p>
                <small>Assigned to: {alert.doctorName}</small>
              </div>
            ))
          )}
        </section>

        {/* KPI Trends Placeholder (M5 Drilldowns will go here in future) */}
        <section className="schedule">
          <h3>Weekly Trends</h3>
          <div className="chart-placeholder">
            <p style={{ color: "#666" }}>Chart visualization coming in Report Update</p>
          </div>
        </section>
      </div>

      {/* QUICK ACTIONS */}
      <section className="quick-actions">
        <h3>Quick Actions</h3>
        <div className="quick-buttons">
          <button className="kpi-button" onClick={() => navigate('/manager-dashboard/alerts')}>
            + Assign Alert
          </button>
          <button className="kpi-button" onClick={() => navigate('/manager-dashboard/dataCenter')}>
            Data Center
          </button>
        </div>
      </section>
    </div>
  );
};

export default ManagerHome;