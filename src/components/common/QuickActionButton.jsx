// components/ui/QuickActionButton.jsx
import React from 'react';
import { Link } from 'react-router-dom';

const QuickActionButton = ({ icon: Icon, label, href = '#', color = 'blue' }) => {
  const colors = {
    blue: 'bg-blue-500 hover:bg-blue-600 text-white',
    green: 'bg-green-500 hover:bg-green-600 text-white',
    red: 'bg-red-500 hover:bg-red-600 text-white',
    yellow: 'bg-yellow-400 hover:bg-yellow-500 text-white',
  };

  return (
    <Link
      to={href}
      className={`flex items-center space-x-2 px-4 py-3 rounded-xl shadow-md transition-all duration-200 ${colors[color] || colors.blue}`}
    >
      {Icon && <Icon className="h-6 w-6" />}
      <span className="font-medium">{label}</span>
    </Link>
  );
};

export default QuickActionButton;
