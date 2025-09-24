// components/ConnectionStatus/ConnectionStatus.jsx - BULLETPROOF
import React, { memo, useMemo, useCallback } from 'react';
import './ConnectionStatus.css';

const ConnectionStatus = memo(({
  status = 'disconnected',
  quality = 'unknown',
  participantsCount = 1,
  sessionTime = 0,
  isRecording = false,
  recordingStartTime = null,
  onFullscreenToggle = () => {},
  onLeave = () => {},
  isFullscreen = false,
  formatTime = (seconds) => `${Math.floor(seconds / 60)}:${(seconds % 60).toString().padStart(2, '0')}`,
  memoryWarning = false
}) => {
  const statusConfig = useMemo(() => {
    switch (status) {
      case 'connected':
        return {
          color: '#10b981',
          icon: '🟢',
          text: 'Connected',
          className: 'status-connected'
        };
      case 'connecting':
        return {
          color: '#f59e0b',
          icon: '🟡',
          text: 'Connecting...',
          className: 'status-connecting'
        };
      case 'reconnecting':
        return {
          color: '#f59e0b',
          icon: '🔄',
          text: 'Reconnecting...',
          className: 'status-reconnecting'
        };
      case 'failed':
        return {
          color: '#ef4444',
          icon: '🔴',
          text: 'Connection Failed',
          className: 'status-failed'
        };
      default:
        return {
          color: '#6b7280',
          icon: '⚪',
          text: 'Disconnected',
          className: 'status-disconnected'
        };
    }
  }, [status]);

  const qualityConfig = useMemo(() => {
    switch (quality) {
      case 'excellent':
        return { bars: 4, color: '#10b981', text: 'Excellent' };
      case 'good':
        return { bars: 3, color: '#3b82f6', text: 'Good' };
      case 'poor':
        return { bars: 2, color: '#f59e0b', text: 'Poor' };
      case 'bad':
        return { bars: 1, color: '#ef4444', text: 'Bad' };
      default:
        return { bars: 0, color: '#6b7280', text: 'Unknown' };
    }
  }, [quality]);

  const recordingDuration = useMemo(() => {
    if (!isRecording || !recordingStartTime) return 0;
    return Math.floor((Date.now() - recordingStartTime) / 1000);
  }, [isRecording, recordingStartTime]);

  const handleFullscreenToggle = useCallback(async () => {
    try {
      await onFullscreenToggle();
    } catch (error) {
      console.error('Fullscreen toggle error:', error);
    }
  }, [onFullscreenToggle]);

  const handleLeave = useCallback(async () => {
    try {
      await onLeave();
    } catch (error) {
      console.error('Leave error:', error);
    }
  }, [onLeave]);

  return (
    <header className="connection-status-header">
      <div className="status-left">
        <div className="brand-section">
          <h1 className="classroom-title">Live Classroom</h1>
        </div>
        
        <div className="connection-section">
          <div className={`status-indicator ${statusConfig.className}`}>
            <span className="status-icon">{statusConfig.icon}</span>
            <span className="status-text">{statusConfig.text}</span>
            <div 
              className="status-dot" 
              style={{ backgroundColor: statusConfig.color }}
            />
          </div>
          
          <div className="quality-indicator">
            <div className="signal-bars">
              {[1, 2, 3, 4].map(bar => (
                <div
                  key={bar}
                  className={`signal-bar ${bar <= qualityConfig.bars ? 'active' : ''}`}
                  style={{ 
                    backgroundColor: bar <= qualityConfig.bars ? qualityConfig.color : '#374151'
                  }}
                />
              ))}
            </div>
            <span className="quality-text">{qualityConfig.text}</span>
          </div>
          
          <div className="session-info">
            <div className="session-time">
              <span className="time-icon">⏱️</span>
              <span className="time-text">{formatTime(sessionTime)}</span>
            </div>
            
            <div className="participants-count">
              <span className="participants-icon">👥</span>
              <span className="participants-text">
                {participantsCount} participant{participantsCount !== 1 ? 's' : ''}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="status-center">
        {isRecording && (
          <div className="recording-indicator">
            <div className="recording-pulse" />
            <span className="recording-text">
              REC {formatTime(recordingDuration)}
            </span>
          </div>
        )}
        
        {memoryWarning && (
          <div className="memory-warning">
            <span className="warning-icon">⚠️</span>
            <span className="warning-text">High memory usage</span>
          </div>
        )}
      </div>

      <div className="status-right">
        <button
          className="header-action-btn fullscreen-btn"
          onClick={handleFullscreenToggle}
          title={`${isFullscreen ? 'Exit' : 'Enter'} fullscreen (F)`}
          aria-label={`${isFullscreen ? 'Exit' : 'Enter'} fullscreen mode`}
        >
          <span className="btn-icon">{isFullscreen ? '🗗' : '🗖'}</span>
          <span className="btn-text">{isFullscreen ? 'Exit' : 'Fullscreen'}</span>
        </button>
        
        <button
          className="header-action-btn leave-btn"
          onClick={handleLeave}
          title="Leave classroom (Esc)"
          aria-label="Leave classroom"
        >
          <span className="btn-icon">🚪</span>
          <span className="btn-text">Leave</span>
        </button>
      </div>
    </header>
  );
});

ConnectionStatus.displayName = 'ConnectionStatus';

export default ConnectionStatus;
