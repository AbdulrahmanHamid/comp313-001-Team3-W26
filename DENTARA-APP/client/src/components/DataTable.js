import React from "react";

const DataTable = ({ columns, rows, actions, emptyMessage }) => {
  const normalizeKey = (col) => col.toLowerCase().replace(/\s+/g, "").replace(/[-_]/g, "");

  return (
    <div>
      {rows.length === 0 ? (
        <p style={{ textAlign: "center", padding: "20px", color: "#666" }}>
          {emptyMessage}
        </p>
      ) : (
        <table className="clinic-table">
          <thead>
            <tr>
              {columns.map((col) => (
                <th key={col}>{col}</th>
              ))}
              {actions && <th>Actions</th>}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id}>
                {columns.map((col) => (
                  <td key={`${row.id}-${col}`}>
                    {row[col] || "-"}
                  </td>
                ))}
                {actions && (
                  <td>
                    {actions(row).map((action, idx) => (
                      <button
                        key={idx}
                        className="clinic-btn-small"
                        onClick={() => action.onClick(row)}
                        style={action.style}
                      >
                        {action.label}
                      </button>
                    ))}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default DataTable;
