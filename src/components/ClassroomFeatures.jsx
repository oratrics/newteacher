// components/ClassroomFeatures.jsx - COMPLETE PROFESSIONAL FEATURES
import React, { useState, useCallback, useEffect } from 'react';
import './ClassroomFeatures.css';

const ClassroomFeatures = ({
  isTeacher,
  onFeatureToggle,
  participants = []
}) => {
  const [features, setFeatures] = useState({
    handRaising: true,
    polling: false,
    breakoutRooms: false,
    recording: false,
    streaming: false,
    attendance: true,
    reactions: true,
    quizMode: false,
    whiteboard: true,
    screenShare: true
  });

  const [activePolls, setActivePolls] = useState([]);
  const [recordingTime, setRecordingTime] = useState(0);
  const [isRecording, setIsRecording] = useState(false);

  const handleFeatureToggle = useCallback((feature) => {
    setFeatures(prev => {
      const newState = !prev[feature];
      const newFeatures = { ...prev, [feature]: newState };
      
      // Special handling for recording
      if (feature === 'recording') {
        if (newState) {
          setIsRecording(true);
          setRecordingTime(0);
        } else {
          setIsRecording(false);
          setRecordingTime(0);
        }
      }
      
      if (onFeatureToggle) {
        onFeatureToggle(feature, newState);
      }
      
      return newFeatures;
    });
  }, [onFeatureToggle]);

  // Recording timer
  useEffect(() => {
    let interval;
    if (isRecording) {
      interval = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRecording]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const teacherFeatures = [
    {
      id: 'recording',
      name: 'Record Session',
      icon: isRecording ? '🔴' : '⚫',
      description: isRecording ? `Recording: ${formatTime(recordingTime)}` : 'Record the entire classroom session',
      teacherOnly: true,
      status: isRecording ? 'recording' : 'idle'
    },
    {
      id: 'streaming',
      name: 'Live Streaming',
      icon: '📺',
      description: 'Stream to YouTube, Facebook, etc.',
      teacherOnly: true
    },
    {
      id: 'polling',
      name: 'Live Polls',
      icon: '📊',
      description: 'Create interactive polls and quizzes',
      teacherOnly: true
    },
    {
      id: 'breakoutRooms',
      name: 'Breakout Rooms',
      icon: '🏠',
      description: 'Create smaller discussion groups',
      teacherOnly: true
    },
    {
      id: 'quizMode',
      name: 'Quiz Mode',
      icon: '🧠',
      description: 'Enable assessment and testing mode',
      teacherOnly: true
    },
    {
      id: 'whiteboard',
      name: 'Whiteboard',
      icon: '📝',
      description: 'Interactive whiteboard for teaching',
      teacherOnly: true
    },
    {
      id: 'screenShare',
      name: 'Screen Share Control',
      icon: '🖥️',
      description: 'Manage screen sharing permissions',
      teacherOnly: true
    }
  ];

  const studentFeatures = [
    {
      id: 'handRaising',
      name: 'Hand Raising',
      icon: '✋',
      description: 'Raise hand to ask questions',
      teacherOnly: false
    },
    {
      id: 'reactions',
      name: 'Reactions',
      icon: '😊',
      description: 'Send emoji reactions during class',
      teacherOnly: false
    },
    {
      id: 'attendance',
      name: 'Auto Attendance',
      icon: '📋',
      description: 'Automatic attendance tracking',
      teacherOnly: false
    }
  ];

  const allFeatures = [...teacherFeatures, ...studentFeatures];
  const availableFeatures = isTeacher ? allFeatures : studentFeatures;

  // Quick actions for teachers
  const quickActions = [
    {
      id: 'muteAll',
      name: 'Mute All',
      icon: '🔇',
      action: () => onFeatureToggle?.('muteAll', true)
    },
    {
      id: 'enableAllVideo',
      name: 'Enable All Videos',
      icon: '📹',
      action: () => onFeatureToggle?.('enableAllVideo', true)
    },
    {
      id: 'lockRoom',
      name: 'Lock Room',
      icon: '🔒',
      action: () => onFeatureToggle?.('lockRoom', true)
    },
    {
      id: 'endClass',
      name: 'End Class',
      icon: '🛑',
      action: () => onFeatureToggle?.('endClass', true),
      danger: true
    }
  ];

  return (
    <div className="classroom-features">
      <div className="features-header">
        <h3>⚡ Classroom Features</h3>
        <div className="role-info">
          <span className="role-badge">
            {isTeacher ? '👨‍🏫 Teacher Panel' : '🎓 Student Panel'}
          </span>
        </div>
      </div>

      {/* Quick Actions for Teachers */}
      {isTeacher && (
        <div className="quick-actions">
          <h4>🚀 Quick Actions</h4>
          <div className="actions-grid">
            {quickActions.map(action => (
              <button
                key={action.id}
                className={`quick-action-btn ${action.danger ? 'danger' : ''}`}
                onClick={action.action}
                title={action.name}
              >
                <span className="action-icon">{action.icon}</span>
                <span className="action-name">{action.name}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Feature Cards */}
      <div className="features-section">
        <h4>🛠️ Available Features</h4>
        <div className="features-grid">
          {availableFeatures.map(feature => (
            <div 
              key={feature.id}
              className={`feature-card ${features[feature.id] ? 'active' : ''} ${feature.status === 'recording' ? 'recording' : ''}`}
            >
              <div className="feature-header">
                <div className="feature-icon-name">
                  <span className="feature-icon">{feature.icon}</span>
                  <span className="feature-name">{feature.name}</span>
                </div>
                <div className="feature-toggle">
                  <label className="switch">
                    <input
                      type="checkbox"
                      checked={features[feature.id]}
                      onChange={() => handleFeatureToggle(feature.id)}
                      disabled={feature.teacherOnly && !isTeacher}
                    />
                    <span className="slider round"></span>
                  </label>
                </div>
              </div>
              
              <p className="feature-description">{feature.description}</p>
              
              {features[feature.id] && (
                <div className="feature-status-indicator">
                  <span className="status-dot"></span>
                  <span className="status-text">Active</span>
                </div>
              )}
              
              {feature.teacherOnly && (
                <span className="teacher-only-badge">👨‍🏫 Teacher Only</span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Live Statistics */}
      <div className="live-stats">
        <h4>📊 Live Classroom Statistics</h4>
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon">👥</div>
            <div className="stat-content">
              <div className="stat-value">{participants.length}</div>
              <div className="stat-label">Total Participants</div>
            </div>
          </div>
          
          <div className="stat-card">
            <div className="stat-icon">✋</div>
            <div className="stat-content">
              <div className="stat-value">{participants.filter(p => p.handRaised).length}</div>
              <div className="stat-label">Hands Raised</div>
            </div>
          </div>
          
          <div className="stat-card">
            <div className="stat-icon">🎤</div>
            <div className="stat-content">
              <div className="stat-value">{participants.filter(p => p.micEnabled).length}</div>
              <div className="stat-label">Microphones On</div>
            </div>
          </div>
          
          <div className="stat-card">
            <div className="stat-icon">📹</div>
            <div className="stat-content">
              <div className="stat-value">{participants.filter(p => p.videoEnabled).length}</div>
              <div className="stat-label">Cameras On</div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">📋</div>
            <div className="stat-content">
              <div className="stat-value">{Math.round((participants.filter(p => p.micEnabled || p.videoEnabled).length / Math.max(participants.length, 1)) * 100)}%</div>
              <div className="stat-label">Engagement Rate</div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">⏱️</div>
            <div className="stat-content">
              <div className="stat-value">{isRecording ? formatTime(recordingTime) : '--:--'}</div>
              <div className="stat-label">Recording Time</div>
            </div>
          </div>
        </div>
      </div>

      {/* Participant Management (Teacher Only) */}
      {isTeacher && participants.length > 0 && (
        <div className="participant-management">
          <h4>👥 Participant Management</h4>
          <div className="participants-list">
            {participants.map(participant => (
              <div key={participant.uid} className="participant-row">
                <div className="participant-info">
                  <span className="participant-name">{participant.name}</span>
                  <div className="participant-status">
                    <span className={`status-badge ${participant.micEnabled ? 'on' : 'off'}`}>
                      🎤
                    </span>
                    <span className={`status-badge ${participant.videoEnabled ? 'on' : 'off'}`}>
                      📹
                    </span>
                    {participant.handRaised && (
                      <span className="status-badge raised">✋</span>
                    )}
                  </div>
                </div>
                <div className="participant-actions">
                  <button 
                    className="action-btn small"
                    onClick={() => onFeatureToggle?.('muteParticipant', participant.uid)}
                    title="Mute participant"
                  >
                    🔇
                  </button>
                  <button 
                    className="action-btn small"
                    onClick={() => onFeatureToggle?.('spotlightParticipant', participant.uid)}
                    title="Spotlight participant"
                  >
                    ⭐
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Class Information */}
      <div className="class-info">
        <h4>ℹ️ Class Information</h4>
        <div className="info-grid">
          <div className="info-item">
            <span className="info-label">Status:</span>
            <span className="info-value live">🔴 Live</span>
          </div>
          <div className="info-item">
            <span className="info-label">Duration:</span>
            <span className="info-value">{formatTime(recordingTime)}</span>
          </div>
          <div className="info-item">
            <span className="info-label">Quality:</span>
            <span className="info-value">HD 1080p</span>
          </div>
          <div className="info-item">
            <span className="info-label">Features:</span>
            <span className="info-value">{Object.values(features).filter(Boolean).length} Active</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClassroomFeatures;
