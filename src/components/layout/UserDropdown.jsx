// components/layout/UserDropdown.jsx
import React, { useState, useRef, useEffect } from 'react';
import { 
  UserCircleIcon, 
  CogIcon, 
  ArrowRightOnRectangleIcon,
  ChevronDownIcon
} from '@heroicons/react/24/outline';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const UserDropdown = ({ user }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const { logout } = useAuth();

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="user-dropdown" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="dropdown-trigger"
      >
        <div className="dropdown-user-avatar">
          {user?.avatar ? (
            <img 
              src={user.avatar} 
              alt={user.name}
            />
          ) : (
            <div className="dropdown-avatar-placeholder">
              <span>{user?.name?.charAt(0) || 'T'}</span>
            </div>
          )}
        </div>
        <div className="dropdown-user-info">
          <p className="dropdown-user-name">{user?.name}</p>
          <p className="dropdown-user-email">{user?.email}</p>
        </div>
        <ChevronDownIcon className={`dropdown-chevron ${isOpen ? 'open' : ''}`} />
      </button>

      {isOpen && (
        <div className="dropdown-menu">
          <div className="dropdown-user-section">
            <p className="dropdown-user-name">{user?.name}</p>
            <p className="dropdown-user-email">{user?.email}</p>
            {user?.isDemoTeacher && (
              <span className="dropdown-demo-badge">Demo Teacher</span>
            )}
          </div>

          <Link
            to="/teacher/profile"
            onClick={() => setIsOpen(false)}
            className="dropdown-item"
          >
            <UserCircleIcon />
            View Profile
          </Link>

          <Link
            to="/teacher/settings"
            onClick={() => setIsOpen(false)}
            className="dropdown-item"
          >
            <CogIcon />
            Settings
          </Link>

          <hr className="dropdown-divider" />

          <button
            onClick={() => {
              setIsOpen(false);
              logout();
            }}
            className="dropdown-item logout"
          >
            <ArrowRightOnRectangleIcon />
            Sign out
          </button>
        </div>
      )}
    </div>
  );
};

export default UserDropdown;
