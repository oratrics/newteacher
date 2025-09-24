// components/ParticipantsList.jsx
import React, { useState, useMemo } from 'react';
import './ParticipantsList.css';

const ParticipantsList = ({ 
  localUser, 
  remoteUsers, 
  userRole, 
  onClose 
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showMuteAll, setShowMuteAll] = useState(false);

  // Combine all participants
  const allParticipants = useMemo(() => {
    const participants = [
      {
        uid: localUser.uid,
        name: localUser.name,
        role: localUser.role,
        isLocal: true,
        hasAudio: true, // You'd get this from your audio track state
        hasVideo: true, // You'd get this from your video track state
        isScreenSharing: false,
        connectionStatus: 'connected'
      },
      ...remoteUsers.map(user => ({
        uid: user.uid,
        name: `User ${user.uid}`,
        role: 'student', // Default role, you'd determine this from your enrollment data
        isLocal: false,
        hasAudio: user.hasAudio,
        hasVideo: user.hasVideo,
        isScreenSharing: user.hasScreenSharing || false,
        connectionStatus: 'connected'
      }))
    ];

    // Filter by search query
    if (searchQuery.trim()) {
      return participants.filter(p => 
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.role.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    return participants;
  }, [localUser, remoteUsers, searchQuery]);

  // Separate teachers and students
  const teachers = allParticipants.filter(p => p.role === 'teacher');
  const students = allParticipants.filter(p => p.role === 'student');

  const handleMuteAll = () => {
    if (userRole !== 'teacher') return;
    
    // In a real implementation, you'd send a signal to mute all participants
    console.log('Muting all participants');
    setShowMuteAll(false);
  };

  const handleParticipantAction = (participant, action) => {
    if (userRole !== 'teacher' && !participant.isLocal) return;

    switch (action) {
      case 'mute':
        console.log(`Muting participant ${participant.uid}`);
        break;
      case 'remove':
        console.log(`Removing participant ${participant.uid}`);
        break;
      case 'spotlight':
        console.log(`Spotlighting participant ${participant.uid}`);
        break;
      default:
        break;
    }
  };

  return (
    <div className="participants-panel">
      <div className="participants-header">
        <div className="header-content">
          <h3>Participants ({allParticipants.length})</h3>
          <button onClick={onClose} className="close-btn" title="Close">
            ✕
          </button>
        </div>
        
        {/* Search */}
        <div className="search-container">
          <input
            type="text"
            placeholder="Search participants..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
          />
          <span className="search-icon">🔍</span>
        </div>

        {/* Teacher Controls */}
        {userRole === 'teacher' && (
          <div className="teacher-controls">
            <button 
              onClick={() => setShowMuteAll(true)}
              className="control-btn mute-all"
              title="Mute All Participants"
            >
              🔇 Mute All
            </button>
          </div>
        )}
      </div>

      <div className="participants-content">
        {/* Teachers Section */}
        {teachers.length > 0 && (
          <div className="participants-section">
            <div className="section-header">
              <h4>👨‍🏫 Teachers ({teachers.length})</h4>
            </div>
            <div className="participants-list">
              {teachers.map(participant => (
                <ParticipantItem
                  key={participant.uid}
                  participant={participant}
                  userRole={userRole}
                  onAction={handleParticipantAction}
                />
              ))}
            </div>
          </div>
        )}

        {/* Students Section */}
        {students.length > 0 && (
          <div className="participants-section">
            <div className="section-header">
              <h4>👨‍🎓 Students ({students.length})</h4>
            </div>
            <div className="participants-list">
              {students.map(participant => (
                <ParticipantItem
                  key={participant.uid}
                  participant={participant}
                  userRole={userRole}
                  onAction={handleParticipantAction}
                />
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {allParticipants.length === 0 && (
          <div className="empty-participants">
            <div className="empty-content">
              <span className="empty-icon">👥</span>
              <p>No participants found</p>
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery('')}
                  className="clear-search"
                >
                  Clear search
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Mute All Confirmation */}
      {showMuteAll && (
        <div className="confirmation-overlay">
          <div className="confirmation-modal">
            <h4>Mute All Participants?</h4>
            <p>This will mute all participants except you. They can unmute themselves if needed.</p>
            <div className="confirmation-buttons">
              <button 
                onClick={() => setShowMuteAll(false)}
                className="cancel-btn"
              >
                Cancel
              </button>
              <button 
                onClick={handleMuteAll}
                className="confirm-btn"
              >
                Mute All
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Individual Participant Item Component
const ParticipantItem = ({ participant, userRole, onAction }) => {
  const [showActions, setShowActions] = useState(false);

  const canControlParticipant = userRole === 'teacher' && !participant.isLocal;

  return (
    <div className="participant-item">
      <div className="participant-info">
        {/* Avatar */}
        <div className={`participant-avatar ${participant.connectionStatus}`}>
          {participant.hasVideo ? (
            <div className="video-avatar">📹</div>
          ) : (
            <div className="text-avatar">
              {participant.name.charAt(0).toUpperCase()}
            </div>
          )}
          
          {/* Status indicators */}
          <div className="status-indicators">
            {participant.isScreenSharing && (
              <span className="status-badge screen-share" title="Screen Sharing">
                🖥️
              </span>
            )}
            {participant.role === 'teacher' && (
              <span className="status-badge teacher" title="Teacher">
                👨‍🏫
              </span>
            )}
          </div>
        </div>

        {/* Name and status */}
        <div className="participant-details">
          <div className="participant-name">
            {participant.name}
            {participant.isLocal && ' (You)'}
          </div>
          <div className="participant-status">
            <span className={`connection-status ${participant.connectionStatus}`}>
              {participant.connectionStatus}
            </span>
            {participant.role === 'teacher' && (
              <span className="role-badge">Teacher</span>
            )}
          </div>
        </div>
      </div>

      {/* Audio/Video Status */}
      <div className="media-status">
        <button 
          className={`media-btn ${participant.hasAudio ? 'active' : 'inactive'}`}
          title={participant.hasAudio ? 'Audio On' : 'Audio Off'}
          disabled={!participant.isLocal && userRole !== 'teacher'}
        >
          {participant.hasAudio ? '🎤' : '🔇'}
        </button>
        
        <button 
          className={`media-btn ${participant.hasVideo ? 'active' : 'inactive'}`}
          title={participant.hasVideo ? 'Video On' : 'Video Off'}
          disabled={!participant.isLocal && userRole !== 'teacher'}
        >
          {participant.hasVideo ? '📹' : '📷'}
        </button>
      </div>

      {/* Actions Menu */}
      {canControlParticipant && (
        <div className="participant-actions">
          <button 
            className="actions-btn"
            onClick={() => setShowActions(!showActions)}
            title="More Actions"
          >
            ⋮
          </button>

          {showActions && (
            <div className="actions-menu">
              <button 
                onClick={() => {
                  onAction(participant, 'spotlight');
                  setShowActions(false);
                }}
                className="action-item"
              >
                🔍 Spotlight
              </button>
              
              <button 
                onClick={() => {
                  onAction(participant, 'mute');
                  setShowActions(false);
                }}
                className="action-item"
              >
                🔇 Mute
              </button>
              
              <button 
                onClick={() => {
                  onAction(participant, 'remove');
                  setShowActions(false);
                }}
                className="action-item danger"
              >
                🚫 Remove
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ParticipantsList;
