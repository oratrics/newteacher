// components/layout/TeacherLayout.jsx
import React, { useState } from 'react';
import { Outlet, useLocation, Link } from 'react-router-dom';
import { 
  HomeIcon,
  CalendarIcon,
  UserGroupIcon,
  AcademicCapIcon,
  CogIcon,
  BellIcon,
  Bars3Icon as MenuIcon,
  XMarkIcon,
  ArrowRightOnRectangleIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '../../contexts/AuthContext';
import UserDropdown from './UserDropdown';
import './TeacherLayout.css';

const TeacherLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, logout } = useAuth();
  const location = useLocation();

  const navigation = [
    { name: 'Dashboard', href: '/teacher', icon: HomeIcon },
    { name: 'Classes', href: '/teacher/classes', icon: CalendarIcon },
    { name: 'Students', href: '/teacher/students', icon: UserGroupIcon },
        { name: 'Homework', href: '/teacher/homework', icon: AcademicCapIcon },
    { name: 'Attendance', href: '/teacher/attendance', icon: AcademicCapIcon },

    { name: 'Courses', href: '/teacher/courses', icon: AcademicCapIcon },
    { name: 'Settings', href: '/teacher/profile', icon: CogIcon },
  ];

  const isActive = (path) => {
    if (path === '/teacher') {
      return location.pathname === '/teacher';
    }
    return location.pathname.startsWith(path);
  };

  return (
    <div className="teacher-layout">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="mobile-overlay" onClick={() => setSidebarOpen(false)}>
          <div className="mobile-overlay-bg" />
        </div>
      )}

      {/* Sidebar */}
      <div className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        {/* Sidebar Header */}
        <div className="sidebar-header">
          <div className="sidebar-logo">
            <AcademicCapIcon className="sidebar-logo-icon" />
            <span className="sidebar-logo-text">EduTeach</span>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="sidebar-close-btn"
          >
            <XMarkIcon />
          </button>
        </div>

        {/* User Info */}
        <div className="user-info">
          <div className="user-info-content">
            <div className="user-avatar">
              {user?.avatar ? (
                <img 
                  src={user.avatar} 
                  alt={user.name}
                />
              ) : (
                <div className="user-avatar-placeholder">
                  <span>{user?.name?.charAt(0) || 'T'}</span>
                </div>
              )}
            </div>
            <div className="user-details">
              <p className="user-name">{user?.name}</p>
              <p className="user-id">ID: {user?.uniqueId}</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="sidebar-nav">
          <ul className="nav-list">
            {navigation.map((item) => {
              const Icon = item.icon;
              return (
                <li key={item.name} className="nav-item">
                  <Link
                    to={item.href}
                    onClick={() => setSidebarOpen(false)}
                    className={`nav-link ${isActive(item.href) ? 'active' : ''}`}
                  >
                    <Icon className="nav-icon" />
                    {item.name}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Logout Button */}
        <div className="logout-container">
          <button onClick={logout} className="logout-btn">
            <ArrowRightOnRectangleIcon />
            Logout
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className="main-content">
        {/* Top navigation */}
        <header className="top-header">
          <div className="header-content">
            <button
              onClick={() => setSidebarOpen(true)}
              className="mobile-menu-btn"
            >
              <MenuIcon />
            </button>

            <div className="header-actions">
              {/* Notifications */}
              <button className="notification-btn">
                <BellIcon />
                <span className="notification-badge" />
              </button>

              {/* User Menu */}
              <UserDropdown user={user} />
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="page-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default TeacherLayout;
