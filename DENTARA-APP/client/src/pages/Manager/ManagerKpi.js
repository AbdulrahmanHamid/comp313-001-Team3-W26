import React, { useEffect, useState, useRef } from "react";
import { listenToFilteredKPITrends } from "../../services/managerService";
import { listenToDoctors } from "../../services/usersService";
import { generateAIResponse } from "../../services/aiService";
import Chart from "chart.js/auto";
import ChartDataLabels from "chartjs-plugin-datalabels";
import "../../styles/ManagerDashboard.css";


const ManagerKpi = () => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState("Trends");

    // M6-2: Filter state
    const [doctors, setDoctors] = useState([]);
    const [selectedDoctor, setSelectedDoctor] = useState("");
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");

    // AI-1: Strategy Report State
    const [aiReport, setAiReport] = useState("");
    const [generatingReport, setGeneratingReport] = useState(false);

    const trendChartRef = useRef(null);
    const distChartRef = useRef(null);
    const trendInstance = useRef(null);
    const distInstance = useRef(null);

    // Load doctor list for provider dropdown
    useEffect(() => {
        const unsub = listenToDoctors((list) => setDoctors(list));
        return () => unsub();
    }, []);

    // M6-2: Real-time listener for filtered KPIs
    useEffect(() => {
        setLoading(true);
        const filters = {};
        if (startDate) filters.startDate = startDate;
        if (endDate) filters.endDate = endDate;
        if (selectedDoctor) filters.doctorId = selectedDoctor;

        const unsub = listenToFilteredKPITrends(filters, (result) => {
            setData(result);
            setLoading(false);
            // Reset report when new data is fetched
            setAiReport(""); 
        });
        
        return () => unsub();
    }, [startDate, endDate, selectedDoctor]); // Automatically refreshes when filters change

    // M6-2: Clear filters handler
    const handleClearFilters = () => {
        setSelectedDoctor("");
        setStartDate("");
        setEndDate("");
    };

    useEffect(() => {
        if (!data || !data.trendData || !data.statusData) return;

        if (activeTab === "Trends" && trendChartRef.current) {
            if (trendInstance.current) trendInstance.current.destroy();
            const ctx = trendChartRef.current.getContext("2d");
            trendInstance.current = new Chart(ctx, {
                type: "line",
                data: {
                    labels: Object.keys(data.trendData),
                    datasets: [{
                        label: "Appointments",
                        data: Object.values(data.trendData),
                        borderColor: "#7c5cce",
                        backgroundColor: "rgba(124, 92, 206, 0.2)",
                        tension: 0.3,
                        fill: true
                    }]
                },
                options: { responsive: true, maintainAspectRatio: false }
            });
        }

        if (activeTab === "Distribution" && distChartRef.current) {
            if (distInstance.current) distInstance.current.destroy();
            const ctx = distChartRef.current.getContext("2d");
            distInstance.current = new Chart(ctx, {
                type: "doughnut",
                data: {
                    labels: Object.keys(data.statusData),
                    datasets: [{
                        label: "Status Distribution",
                        data: Object.values(data.statusData),
                        backgroundColor: ["#FFCE56", "#36A2EB", "#4BC0C0", "#FF6384", "#9966FF"]
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        datalabels: {
                            color: "#000",
                            font: {
                                weight: "bold",
                                size: 14
                            },
                            formatter: (value) => value, 
                        },
                        legend: {
                            position: "bottom"
                        }
                    }
                },
                plugins: [ChartDataLabels]
            });
        }

        return () => {
            if (trendInstance.current) trendInstance.current.destroy();
            if (distInstance.current) distInstance.current.destroy();
        };
    }, [data, activeTab]);

    const handleExport = () => {
        if (!data || !data.rawData) return;
        const headers = ["ID", "Date", "Time", "Doctor", "Patient", "Status"];
        const rows = data.rawData.map(a => [a.id, a.date, a.time, a.doctorName, a.patientName, a.status]);
        const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "clinic_kpi_data.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // AI-1: Generate Report Logic
    const handleGenerateReport = async () => {
        if (!data || !data.rawData || data.rawData.length === 0) {
            alert("No data available to generate a report.");
            return;
        }
        
        setGeneratingReport(true);
        setAiReport("");
        
        try {
            const total = data.rawData.length;
            const statusSummary = Object.entries(data.statusData)
                .map(([status, count]) => `${status}: ${count}`)
                .join(", ");
            
            const prompt = `You are a clinic management AI advisor. Analyze the following appointment data and provide a concise, professional 3-paragraph strategy report for the manager. Do not use emojis in your response. Data summary: Total appointments: ${total}. Status breakdown: ${statusSummary}. Suggest operational improvements based on these numbers.`;
            
            const response = await generateAIResponse(prompt);
            setAiReport(response);
        } catch (error) {
            console.error("Error generating report:", error);
            setAiReport("Failed to generate AI Strategy Report. Please check your connection and try again.");
        }
        setGeneratingReport(false);
    };

    // AI-1: Download Report Logic
    const handleDownloadReport = () => {
        const blob = new Blob([aiReport], { type: "text/plain" });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = `Dentara_Strategy_Report_${new Date().toISOString().split('T')[0]}.txt`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    if (loading) return <div className="manager-main"><p>Loading Analytics...</p></div>;

    if (!data || !data.statusData || !data.rawData) {
        return <div className="manager-main"><p>No data available for the selected filters.</p></div>;
    }

    return (
        <div className="manager-page">
            <div className="page-header">
                <h2>KPI Drilldowns</h2>
                <div style={{ display: "flex", gap: "10px" }}>
                    <button className="btn-pill" onClick={handleGenerateReport} disabled={generatingReport} style={{ background: "#e4f5d2", color: "#00401c", border: "1px solid #78d494" }}>
                        {generatingReport ? "Generating AI..." : "Generate AI Report"}
                    </button>
                    <button className="btn-pill btn-purple" onClick={handleExport}>Export Data (CSV)</button>
                </div>
            </div>

            {/* M6-2: Filter Bar */}
            <div className="manage-box" style={{ display: "flex", flexWrap: "wrap", gap: "12px", alignItems: "center", marginBottom: "16px" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                    <label style={{ fontSize: "12px", fontWeight: "600", color: "#555" }}>Start Date</label>
                    <input
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        style={{ padding: "8px 12px", borderRadius: "8px", border: "1px solid #ccc", fontSize: "14px" }}
                    />
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                    <label style={{ fontSize: "12px", fontWeight: "600", color: "#555" }}>End Date</label>
                    <input
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        style={{ padding: "8px 12px", borderRadius: "8px", border: "1px solid #ccc", fontSize: "14px" }}
                    />
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                    <label style={{ fontSize: "12px", fontWeight: "600", color: "#555" }}>Provider</label>
                    <select
                        value={selectedDoctor}
                        onChange={(e) => setSelectedDoctor(e.target.value)}
                        style={{ padding: "8px 12px", borderRadius: "8px", border: "1px solid #ccc", fontSize: "14px" }}
                    >
                        <option value="">All Providers</option>
                        {doctors.map((doc) => (
                            <option key={doc.id} value={doc.id}>{doc.fullName}</option>
                        ))}
                    </select>
                </div>
                <div style={{ display: "flex", gap: "8px", alignSelf: "flex-end" }}>
                    {/* The Apply button was removed since useEffect handles updates instantly now, 
                        but keeping clear button to easily wipe the form */}
                    <button className="btn-pill" onClick={handleClearFilters} style={{ background: "#e0e0e0", color: "#333" }}>Clear Filters</button>
                </div>
            </div>

            <div className="tabs">
                <button className={`tab-btn ${activeTab === "Trends" ? "active" : ""}`} onClick={() => setActiveTab("Trends")}>
                    Trends (Selected Range)
                </button>
                <button className={`tab-btn ${activeTab === "Distribution" ? "active" : ""}`} onClick={() => setActiveTab("Distribution")}>
                    Status Distribution
                </button>
            </div>
            <div className="manage-box chart-container">
                {activeTab === "Trends" ? (
                    <canvas ref={trendChartRef}></canvas>
                ) : (
                    <div className="chart-wrapper-center">
                        <canvas ref={distChartRef}></canvas>
                    </div>
                )}
            </div>

            {/* AI-1: Strategy Report Display */}
            {(generatingReport || aiReport) && (
                <div className="manage-box" style={{ marginTop: "20px", borderColor: "#78d494", backgroundColor: "#f6fff9" }}>
                    <div className="manage-header">
                        <h3 style={{ color: "#00401c" }}>AI Strategy Report</h3>
                    </div>
                    <div style={{ padding: "10px 0", color: "#333", lineHeight: "1.6", whiteSpace: "pre-wrap" }}>
                        {generatingReport ? (
                            <p>Analyzing current KPI distribution and generating strategic insights...</p>
                        ) : (
                            <>
                                <p>{aiReport}</p>
                                <button className="btn-outline" onClick={handleDownloadReport} style={{ marginTop: "15px", padding: "8px 16px" }}>
                                    Download Report (.txt)
                                </button>
                            </>
                        )}
                    </div>
                </div>
            )}

            <div className="summary-table-container">
                <h3>Summary Statistics</h3>
                <table className="std-table">
                    <thead>
                        <tr><th>Metric</th><th>Count</th></tr>
                    </thead>
                    <tbody>
                        {Object.entries(data.statusData).map(([status, count]) => (
                            <tr key={status}><td>{status}</td><td>{count}</td></tr>
                        ))}
                        <tr className="total-row"><td>Total Appointments</td><td>{data.rawData.length}</td></tr>
                    </tbody>
                </table>
            </div>
        </div>
        
    );
};

export default ManagerKpi;