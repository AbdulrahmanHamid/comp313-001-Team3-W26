import React, { useEffect, useState, useRef } from "react";
import { getKPITrends } from "../../services/managerService";
import Chart from "chart.js/auto";
import ChartDataLabels from "chartjs-plugin-datalabels";
import "../../styles/ManagerDashboard.css";

const ManagerKpi = () => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState("Trends");

    const trendChartRef = useRef(null);
    const distChartRef = useRef(null);
    const trendInstance = useRef(null);
    const distInstance = useRef(null);

    useEffect(() => {
        const fetchData = async () => {
            const result = await getKPITrends();
            setData(result);
            setLoading(false);
        };
        fetchData();
    }, []);

    useEffect(() => {
        if (!data) return;

        if (activeTab === "Trends" && trendChartRef.current) {
            if (trendInstance.current) trendInstance.current.destroy();
            const ctx = trendChartRef.current.getContext("2d");
            trendInstance.current = new Chart(ctx, {
                type: "line",
                data: {
                    labels: Object.keys(data.trendData),
                    datasets: [{
                        label: "Appointments (Last 7 Days)",
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

    if (loading) return <div className="manager-main"><p>Loading Analytics...</p></div>;

    return (
        <div className="manager-page">
            <div className="page-header">
                <h2>📈 KPI Drilldowns</h2>
                <button className="btn-pill btn-purple" onClick={handleExport}>⬇ Export Data (CSV)</button>
            </div>
            <div className="tabs">
                <button className={`tab-btn ${activeTab === "Trends" ? "active" : ""}`} onClick={() => setActiveTab("Trends")}>
                    Weekly Trends
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