// components/common/ProgressBar.jsx
import React from 'react';

const ProgressBar = ({ percentage, color = 'blue', height = 'h-3', showLabel = false }) => {
  const colorClasses = {
    blue: 'bg-blue-600',
    green: 'bg-green-600',
    yellow: 'bg-yellow-600',
    red: 'bg-red-600'
  };

  return (
    <div className="w-full">
      <div className={`w-full bg-gray-200 rounded-full ${height}`}>
        <div
          className={`${height} ${colorClasses[color]} rounded-full transition-all duration-300`}
          style={{ width: `${Math.min(percentage, 100)}%` }}
        ></div>
      </div>
      {showLabel && (
        <div className="flex justify-between text-sm text-gray-600 mt-1">
          <span>{percentage}%</span>
          <span>100%</span>
        </div>
      )}
    </div>
  );
};

export default ProgressBar;
