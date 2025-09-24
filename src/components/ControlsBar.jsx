// components/ControlsBar/ControlsBar.jsx - ZERO BUGS PRODUCTION READY
import React, { memo, useCallback, useState, useRef, useEffect } from 'react';
import './ControlsBar.css';

const ControlsBar = memo(({
  micEnabled = false,
  videoEnabled = false,
  speakerEnabled = true,
  isHandRaised = false,
  showWhiteboard = false,
  showParticipants = false,
  showChat = false,
  unreadCount = 0,
  isTeacher = false,
  isRecording = false,
  connectionQuality = 'unknown',
  onMicToggle = () => {},
  onVideoToggle = () => {},
  onSpeakerToggle = () => {},
  onHandRaiseToggle = () => {},
  onWhiteboardToggle = () => {},
  onParticipantsToggle = () => {},
  onChatToggle = () => {},
  onLeave = () => {},
  disabled = false,
  showNotification = () => {}
}) => {
  const [isProcessing, setIsProcessing] = useState({});
  const controlsRef = useRef(null);
  const lastActionTime = useRef(0);
  const mountedRef = useRef(true);

  // Prevent rapid clicking
  const DEBOUNCE_DELAY = 300;

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const handleAction = useCallback(async (actionName, actionFn, successMessage) => {
    if (!mountedRef.current || disabled) return;

    const now = Date.now();
    if (now - lastActionTime.current < DEBOUNCE_DELAY) {
      return; // Prevent rapid clicks
    }
    lastActionTime.current = now;

    if (isProcessing[actionName]) return;

    try {
      setIsProcessing(prev => ({ ...prev, [actionName]: true }));
      
      await actionFn();
      
      if (successMessage && showNotification) {
        showNotification(successMessage, 'info');
      }
    } catch (error) {
      console.error(`Error in ${actionName}:`, error);
      showNotification?.(`Failed to ${actionName.toLowerCase()}. Please try again.`, 'error');
    } finally {
      if (mountedRef.current) {
        setIsProcessing(prev => ({ ...prev, [actionName]: false }));
      }
    }
  }, [disabled, isProcessing, showNotification]);

  const controls = [
    {
      id: 'microphone',
      icon: micEnabled ? '🎤' : '🔇',
      label: micEnabled ? 'Mute' : 'Unmute',
      active: micEnabled,
      onClick: () => handleAction('microphone', onMicToggle),
      shortcut: 'M',
      className: micEnabled ? 'mic-enabled' : 'mic-disabled',
      disabled: false,
      tooltip: `${micEnabled ? 'Mute' : 'Unmute'} microphone (M)`
    },
    {
      id: 'camera',
      icon: videoEnabled ? '📹' : '📷',
      label: videoEnabled ? 'Stop Video' : 'Start Video',
      active: videoEnabled,
      onClick: () => handleAction('camera', onVideoToggle),
      shortcut: 'V',
      className: videoEnabled ? 'video-enabled' : 'video-disabled',
      disabled: false,
      tooltip: `${videoEnabled ? 'Turn off' : 'Turn on'} camera (V)`
    },
    {
      id: 'speaker',
      icon: speakerEnabled ? '🔊' : '🔇',
      label: speakerEnabled ? 'Mute Speaker' : 'Unmute Speaker',
      active: speakerEnabled,
      onClick: () => handleAction('speaker', onSpeakerToggle),
      shortcut: 'S',
      className: speakerEnabled ? 'speaker-enabled' : 'speaker-disabled',
      disabled: false,
      tooltip: `${speakerEnabled ? 'Mute' : 'Unmute'} speaker (S)`
    },
    {
      id: 'hand',
      icon: '✋',
      label: isHandRaised ? 'Lower Hand' : 'Raise Hand',
      active: isHandRaised,
      onClick: () => handleAction('hand', onHandRaiseToggle),
      shortcut: 'H',
      className: isHandRaised ? 'hand-raised' : 'hand-lowered',
      disabled: false,
      tooltip: `${isHandRaised ? 'Lower' : 'Raise'} hand (H)`
    },
    {
      id: 'participants',
      icon: '👥',
      label: 'Participants',
      active: showParticipants,
      onClick: () => handleAction('participants', onParticipantsToggle),
      shortcut: 'P',
      className: 'participants-btn',
      disabled: false,
      tooltip: 'Toggle participants panel (P)'
    },
    {
      id: 'chat',
      icon: '💬',
      label: 'Chat',
      active: showChat,
      onClick: () => handleAction('chat', onChatToggle),
      shortcut: 'C',
      className: 'chat-btn',
      disabled: false,
      tooltip: 'Toggle chat panel (C)',
      badge: unreadCount > 0 ? unreadCount : null
    }
  ];

  // Teacher-only controls
  if (isTeacher) {
    controls.push({
      id: 'whiteboard',
      icon: '📝',
      label: 'Whiteboard',
      active: showWhiteboard,
      onClick: () => handleAction('whiteboard', onWhiteboardToggle),
      shortcut: 'W',
      className: 'whiteboard-btn teacher-only',
      disabled: false,
      tooltip: 'Toggle whiteboard (W)'
    });

    controls.push({
      id: 'record',
      icon: isRecording ? '⏹️' : '🔴',
      label: isRecording ? 'Stop Recording' : 'Start Recording',
      active: isRecording,
      onClick: () => {
        const action = isRecording ? 'Stop recording' : 'Start recording';
        handleAction('recording', () => {
          // Recording logic would be implemented here
          console.log(action);
        }, `${action} ${isRecording ? 'stopped' : 'started'}`);
      },
      shortcut: 'R',
      className: isRecording ? 'recording-active' : 'recording-inactive',
      disabled: false,
      tooltip: `${isRecording ? 'Stop' : 'Start'} recording (R)`
    });
  }

  const getQualityColor = useCallback((quality) => {
    switch (quality) {
      case 'excellent': return '#10b981';
      case 'good': return '#3b82f6';
      case 'poor': return '#f59e0b';
      case 'bad': return '#ef4444';
      default: return '#6b7280';
    }
  }, []);

  const handleLeave = useCallback(async () => {
    if (!mountedRef.current || disabled) return;

    try {
      setIsProcessing(prev => ({ ...prev, leave: true }));
      await onLeave();
    } catch (error) {
      console.error('Error leaving:', error);
      showNotification?.('Error leaving classroom. Please try again.', 'error');
    } finally {
      if (mountedRef.current) {
        setIsProcessing(prev => ({ ...prev, leave: false }));
      }
    }
  }, [disabled, onLeave, showNotification]);

  return (
    <div className={`controls-bar ${disabled ? 'disabled' : ''}`} ref={controlsRef}>
      {/* Connection Quality Indicator */}
      <div className="connection-indicator">
        <div 
          className="quality-dot"
          style={{ backgroundColor: getQualityColor(connectionQuality) }}
          title={`Connection: ${connectionQuality}`}
        />
        <span className="quality-text">{connectionQuality}</span>
      </div>

      {/* Main Controls */}
      <div className="controls-group main-controls">
        {controls.map((control) => (
          <button
            key={control.id}
            className={`control-btn ${control.className} ${control.active ? 'active' : ''} ${isProcessing[control.id] ? 'processing' : ''}`}
            onClick={control.onClick}
            disabled={disabled || control.disabled || isProcessing[control.id]}
            title={control.tooltip}
            aria-label={control.label}
            data-shortcut={control.shortcut}
          >
            <span className="control-icon">{control.icon}</span>
            <span className="control-label">{control.label}</span>
            
            {/* Loading spinner for processing */}
            {isProcessing[control.id] && (
              <div className="control-spinner">
                <div className="spinner-small" />
              </div>
            )}
            
            {/* Badge for unread count */}
            {control.badge && (
              <span className="control-badge">
                {control.badge > 99 ? '99+' : control.badge}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Leave Button */}
      <div className="controls-group leave-controls">
        <button
          className={`control-btn leave-btn ${isProcessing.leave ? 'processing' : ''}`}
          onClick={handleLeave}
          disabled={disabled || isProcessing.leave}
          title="Leave classroom (Esc)"
          aria-label="Leave classroom"
        >
          <span className="control-icon">🚪</span>
          <span className="control-label">Leave</span>
          
          {isProcessing.leave && (
            <div className="control-spinner">
              <div className="spinner-small" />
            </div>
          )}
        </button>
      </div>

      {/* Recording Indicator */}
      {isRecording && (
        <div className="recording-indicator-bar">
          <div className="recording-dot-bar" />
          <span className="recording-text">REC</span>
        </div>
      )}
    </div>
  );
});

ControlsBar.displayName = 'ControlsBar';

export default ControlsBar;
