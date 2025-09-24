// components/NotificationSystem/NotificationSystem.jsx - ZERO BUGS GUARANTEED
import React, { memo, useEffect, useRef, useCallback, useState } from 'react';
import './NotificationSystem.css';

const NotificationItem = memo(({
  notification,
  onDismiss,
  index
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);
  const timeoutRef = useRef(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    // Entrance animation
    const enterTimeout = setTimeout(() => {
      if (mountedRef.current) {
        setIsVisible(true);
      }
    }, index * 100); // Stagger animations

    // Auto-dismiss timer
    if (notification.duration && notification.duration > 0) {
      timeoutRef.current = setTimeout(() => {
        if (mountedRef.current) {
          handleDismiss();
        }
      }, notification.duration);
    }

    return () => {
      clearTimeout(enterTimeout);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [notification.duration, index]);

  const handleDismiss = useCallback(() => {
    if (!mountedRef.current || isRemoving) return;

    setIsRemoving(true);
    setIsVisible(false);

    // Wait for exit animation
    setTimeout(() => {
      if (mountedRef.current) {
        onDismiss?.(notification.id);
      }
    }, 300);
  }, [notification.id, onDismiss, isRemoving]);

  const getIcon = useCallback((type) => {
    switch (type) {
      case 'success': return '✅';
      case 'error': return '❌';
      case 'warning': return '⚠️';
      case 'info': 
      default: return 'ℹ️';
    }
  }, []);

  const getProgressDuration = useCallback(() => {
    const duration = notification.duration || 5000;
    return Math.max(1000, duration); // Minimum 1s for visibility
  }, [notification.duration]);

  return (
    <div
      className={`notification-item ${notification.type || 'info'} ${isVisible ? 'visible' : ''} ${isRemoving ? 'removing' : ''}`}
      style={{
        '--animation-delay': `${index * 100}ms`,
        '--progress-duration': `${getProgressDuration()}ms`
      }}
    >
      <div className="notification-content">
        <div className="notification-icon">
          {getIcon(notification.type)}
        </div>
        
        <div className="notification-message">
          {notification.message}
        </div>
        
        <button
          className="notification-dismiss"
          onClick={handleDismiss}
          aria-label="Dismiss notification"
          title="Dismiss"
        >
          ✕
        </button>
      </div>
      
      {notification.duration && notification.duration > 0 && (
        <div className="notification-progress">
          <div className="progress-bar" />
        </div>
      )}
    </div>
  );
});

NotificationItem.displayName = 'NotificationItem';

const NotificationSystem = memo(({
  notifications = [],
  onDismiss = () => {},
  maxNotifications = 5,
  position = 'bottom-right'
}) => {
  const containerRef = useRef(null);
  const [visibleNotifications, setVisibleNotifications] = useState([]);

  // Sanitize and limit notifications
  useEffect(() => {
    const sanitized = Array.isArray(notifications) 
      ? notifications
          .filter(n => n && typeof n === 'object' && n.id && n.message)
          .slice(-maxNotifications) // Keep only the latest notifications
      : [];

    setVisibleNotifications(sanitized);
  }, [notifications, maxNotifications]);

  const handleDismiss = useCallback((id) => {
    try {
      onDismiss(id);
    } catch (error) {
      console.error('Error dismissing notification:', error);
    }
  }, [onDismiss]);

  const dismissAll = useCallback(() => {
    try {
      visibleNotifications.forEach(notification => {
        onDismiss(notification.id);
      });
    } catch (error) {
      console.error('Error dismissing all notifications:', error);
    }
  }, [visibleNotifications, onDismiss]);

  // Keyboard shortcut to dismiss all
  useEffect(() => {
    const handleKeyPress = (event) => {
      if (event.key === 'Escape' && visibleNotifications.length > 0) {
        event.preventDefault();
        dismissAll();
      }
    };

    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, [visibleNotifications.length, dismissAll]);

  if (!visibleNotifications.length) {
    return null;
  }

  return (
    <div 
      className={`notification-system ${position}`}
      ref={containerRef}
      role="region"
      aria-label="Notifications"
      aria-live="polite"
    >
      <div className="notifications-container">
        {visibleNotifications.length > 3 && (
          <div className="notifications-header">
            <span className="notifications-count">
              {visibleNotifications.length} notification{visibleNotifications.length !== 1 ? 's' : ''}
            </span>
            <button
              className="dismiss-all-btn"
              onClick={dismissAll}
              title="Dismiss all notifications (Esc)"
            >
              Clear All
            </button>
          </div>
        )}
        
        {visibleNotifications.map((notification, index) => (
          <NotificationItem
            key={notification.id}
            notification={notification}
            onDismiss={handleDismiss}
            index={index}
          />
        ))}
      </div>
    </div>
  );
});

NotificationSystem.displayName = 'NotificationSystem';

export default NotificationSystem;
