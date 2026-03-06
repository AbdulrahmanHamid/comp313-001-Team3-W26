import React, { useEffect, useMemo, useState } from "react";
import jsPDF from "jspdf";
import { listenToAppointmentsByDate } from "../../services/appointmentsService";
import { listenToTasksByDate } from "../../services/tasksService";

const todayLocal = () => new Date().toLocaleDateString("en-CA"); 

export default function DailyWrapUpPage() {
  const [date, setDate] = useState(todayLocal());
  const [appointments, setAppointments] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [warning, setWarning] = useState("");

  useEffect(() => {
    const unsubA = listenToAppointmentsByDate(date, setAppointments);
    const unsubT = listenToTasksByDate(date, setTasks);
    return () => { unsubA(); unsubT(); };
  }, [date]);

  const completed = useMemo(
    () => tasks.filter((t) => (t.status || "").toLowerCase() === "completed"),
    [tasks]
  );
  const pending = useMemo(
    () => tasks.filter((t) => (t.status || "").toLowerCase() !== "completed"),
    [tasks]
  );

  const noActivity = appointments.length === 0 && tasks.length === 0;

  useEffect(() => {
    setWarning(noActivity ? "No activity found for the selected date." : "");
  }, [noActivity]);

  const exportPdf = () => {
    if (noActivity) {
      setWarning("No activity to export for the selected date.");
      return;
    }

    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text("Dentara — Daily Wrap-Up", 14, 18);
    doc.setFontSize(11);
    doc.text(`Date: ${date}`, 14, 26);

    let y = 36;

    // Appointments
    doc.setFontSize(13);
    doc.text(`Appointments (${appointments.length})`, 14, y);
    y += 8;

    doc.setFontSize(10);
    if (appointments.length === 0) {
      doc.text("No appointments.", 14, y);
      y += 6;
    } else {
      appointments
        .slice()
        .sort((a, b) => (a.time || "").localeCompare(b.time || ""))
        .forEach((a) => {
          const line = `• ${a.time || ""} — ${a.patientName || ""} — ${a.reason || ""} (${a.status || ""})`;
          doc.text(line.slice(0, 110), 14, y);
          y += 6;
          if (y > 280) { doc.addPage(); y = 20; }
        });
    }

    y += 6;

    // Pending tasks
    doc.setFontSize(13);
    doc.text(`Tasks — Pending (${pending.length})`, 14, y);
    y += 8;

    doc.setFontSize(10);
    if (pending.length === 0) {
      doc.text("No pending tasks.", 14, y);
      y += 6;
    } else {
      pending.forEach((t) => {
        doc.text(`• ${t.task || ""}`.slice(0, 110), 14, y);
        y += 6;
        if (y > 280) { doc.addPage(); y = 20; }
        });
    }

    y += 6;

    // Completed tasks
    doc.setFontSize(13);
    doc.text(`Tasks — Completed (${completed.length})`, 14, y);
    y += 8;

    doc.setFontSize(10);
    if (completed.length === 0) {
      doc.text("No completed tasks.", 14, y);
    } else {
      completed.forEach((t) => {
        doc.text(`• ${t.title || t.taskName || ""}`.slice(0, 110), 14, y);
        y += 6;
        if (y > 280) { doc.addPage(); y = 20; }
      });
    }

    doc.save(`Dentara_Daily_WrapUp_${date}.pdf`);
  };

  return (
    <div className="clinic-content-box">
      <div className="clinic-page-header">
        <h2>🧾 Daily Wrap-Up</h2>
        <button className="clinic-btn-primary" onClick={exportPdf}>
          Export PDF
        </button>
      </div>

      <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
        <label>
          Date:{" "}
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </label>
      </div>

      {warning && (
        <p style={{ marginTop: 12, padding: 10, background: "#fff3cd", borderRadius: 8 }}>
          {warning}
        </p>
      )}

      <hr />

      <h3>Appointments</h3>
      {appointments.length === 0 ? <p>No appointments.</p> : (
        <table className="clinic-table">
          <thead>
            <tr>
              <th>Time</th><th>Patient</th><th>Doctor</th><th>Reason</th><th>Status</th>
            </tr>
          </thead>
          <tbody>
            {appointments.map((a) => (
              <tr key={a.id}>
                <td>{a.time}</td>
                <td>{a.patientName}</td>
                <td>{a.doctorName || "N/A"}</td>
                <td>{a.reason}</td>
                <td>{a.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <h3 style={{ marginTop: 16 }}>Tasks</h3>

      <h4>Pending</h4>
        {pending.length === 0 ? <p>No pending tasks.</p> : (
        <ul>{pending.map(t => <li key={t.id}>{t.task}</li>)}</ul>
        )}

        <h4>Completed</h4>
        {completed.length === 0 ? <p>No completed tasks.</p> : (
        <ul>{completed.map(t => <li key={t.id}>{t.task}</li>)}</ul>
        )}
    </div>
  );
}