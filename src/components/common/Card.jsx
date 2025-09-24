// components/common/Card.jsx
import React from 'react';

const Card = ({ 
  children, 
  className = '', 
  titleIcon: Icon, 
  titleText,
  subtitle,
  headerActions,
  variant = 'default',
  size = 'default',
  hover = true 
}) => {
  const variants = {
    default: 'bg-white border-blue-100',
    success: 'bg-gradient-to-br from-green-50 to-emerald-50 border-green-200',
    warning: 'bg-gradient-to-br from-yellow-50 to-amber-50 border-yellow-200',
    error: 'bg-gradient-to-br from-red-50 to-pink-50 border-red-200',
    info: 'bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200',
    purple: 'bg-gradient-to-br from-purple-50 to-violet-50 border-purple-200'
  };

  const sizes = {
    sm: 'p-4',
    default: 'p-6',
    lg: 'p-8',
    xl: 'p-10'
  };

  const hoverEffect = hover ? 'transition-all duration-300 transform hover:scale-[1.01] hover:shadow-2xl' : '';

  return (
    <div className={`
      rounded-3xl shadow-xl border
      ${variants[variant]}
      ${sizes[size]}
      ${hoverEffect}
      ${className}
    `}>
      {(titleText || headerActions) && (
        <div className="flex items-center justify-between mb-6">
          <div>
            {titleText && (
              <h2 className="text-2xl font-bold text-gray-800 flex items-center">
                {Icon && <Icon className="mr-3 text-blue-500" size={28} />} 
                {titleText}
              </h2>
            )}
            {subtitle && (
              <p className="text-gray-600 mt-1 text-sm">{subtitle}</p>
            )}
          </div>
          {headerActions && (
            <div className="flex items-center space-x-2">
              {headerActions}
            </div>
          )}
        </div>
      )}
      {children}
    </div>
  );
};

export default Card;
