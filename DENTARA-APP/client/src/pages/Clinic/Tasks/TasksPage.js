import React from "react";
import { NavLink, Outlet } from "react-router-dom";

const TasksPage = () => {
  return (
    <div>
      <h2>Tasks</h2>

      <div className="subnav-buttons">
        <NavLink to="summary" className="subnav-btn">
          Task Summary
        </NavLink>
        <NavLink to="list" className="subnav-btn">
          Task List
        </NavLink>
      </div>

      {/* Children now fetch tasks DIRECTLY from Firebase */}
      <Outlet />
    </div>
  );
};

export default TasksPage;
