import React from "react";

const FilterBar = ({ searchTerm, setSearchTerm, filters, onFilterChange }) => {
  return (
    <div className="search-filter-container">
      <input
        type="text"
        placeholder={filters[0]?.placeholder || "Search..."}
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="clinic-search-input"
      />
      <div className="filter-controls">
        {filters.map((filter) => (
          <div key={filter.id} className="filter-group">
            <label htmlFor={filter.id}>{filter.label}:</label>
            <select
              id={filter.id}
              value={filter.value}
              onChange={(e) => onFilterChange(filter.id, e.target.value)}
              className="filter-select"
            >
              {filter.options.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>
        ))}
      </div>
    </div>
  );
};

export default FilterBar;
