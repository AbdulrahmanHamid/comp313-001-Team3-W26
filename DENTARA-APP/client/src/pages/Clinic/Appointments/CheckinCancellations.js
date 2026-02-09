import React, { useEffect, useState } from "react";
import { listenToCheckinCancellations } from "../../../services/appointmentsService";

const CheckinCancellations = () => {
  const [list, setList] = useState([]);

  useEffect(() => {
    const unsub = listenToCheckinCancellations((data) => setList(data));
    return () => unsub();
  }, []);

  return (
    <div className="checkin-page">
      <h2>Check-ins / Cancellations / No-Shows</h2>

      {list.length === 0 ? (
        <p>No check-in or cancellations today.</p>
      ) : (
        <table className="clinic-table">
          <thead>
            <tr>
              <th>Patient</th>
              <th>Time</th>
              <th>Status</th>
            </tr>
          </thead>

          <tbody>
            {list.map((a) => (
              <tr key={a.id}>
                <td>{a.patientName}</td>
                <td>{a.time}</td>
                <td>{a.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default CheckinCancellations;
