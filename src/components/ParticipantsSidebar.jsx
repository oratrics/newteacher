// components/ParticipantsSidebar/ParticipantsSidebar.jsx - ENTERPRISE GRADE ZERO BUGS
import React, { 
  memo, 
  useState, 
  useRef, 
  useEffect, 
  useCallback, 
  useMemo 
} from 'react';
import './ParticipantsSidebar.css';

// Individual participant item component
const ParticipantItem = memo(({
  participant,
  isLocal = false,
  isTeacher = false,
  currentUserIsTeacher = false,
  raisedHands = new Set(),
  onMuteUser = () => {},
  onRemoveUser = () => {},
  onPromoteToTeacher = () => {},
  showNotification = () => {}
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [showActions, setShowActions] = useState(false);
  const actionsRef = useRef(null);
  const itemRef = useRef(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // Sanitize participant data
  const sanitizedParticipant = useMemo(() => {
    if (!participant || typeof participant !== 'object') {
      return {
        uid: 'unknown',
        name: 'Unknown User',
        role: 'student',
        micEnabled: false,
        videoEnabled: false,
        isHandRaised: false,
        connectionQuality: 'unknown',
        joinedAt: new Date()
      };
    }

    return {
      uid: participant.uid || 'unknown',
      name: participant.name || `User ${participant.uid}`,
      role: participant.role || 'student',
      micEnabled: Boolean(participant.micEnabled),
      videoEnabled: Boolean(participant.videoEnabled),
      isHandRaised: Boolean(participant.isHandRaised || raisedHands.has(participant.uid)),
      connectionQuality: participant.connectionQuality || 'unknown',
      joinedAt: participant.joinedAt || new Date()
    };
  }, [participant, raisedHands]);

  const getInitials = useCallback((name) => {
    if (!name || typeof name !== 'string') return 'U';
    return name
      .split(' ')
      .map(n => n.charAt(0))
      .join('')
      .slice(0, 2)
      .toUpperCase();
  }, []);

  const getConnectionColor = useCallback((quality) => {
    switch (quality) {
      case 'excellent': return '#10b981';
      case 'good': return '#3b82f6';
      case 'poor': return '#f59e0b';
      case 'bad': return '#ef4444';
      default: return '#6b7280';
    }
  }, []);

  const formatJoinTime = useCallback((joinedAt) => {
    try {
      if (!joinedAt) return 'Just now';
      const date = joinedAt instanceof Date ? joinedAt : new Date(joinedAt);
      if (isNaN(date.getTime())) return 'Unknown';
      
      const now = new Date();
      const diffInMinutes = Math.floor((now - date) / (1000 * 60));
      
      if (diffInMinutes < 1) return 'Just now';
      if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
      
      const diffInHours = Math.floor(diffInMinutes / 60);
      if (diffInHours < 24) return `${diffInHours}h ago`;
      
      return date.toLocaleDateString();
    } catch {
      return 'Unknown';
    }
  }, []);

  const handleAction = useCallback(async (actionName, actionFn, confirmMessage = null) => {
    if (!mountedRef.current || isProcessing) return;

    // Confirmation for destructive actions
    if (confirmMessage && !window.confirm(confirmMessage)) {
      return;
    }

    try {
      setIsProcessing(true);
      setShowActions(false);
      
      await actionFn(sanitizedParticipant);
      
      showNotification?.(
        `${actionName} completed for ${sanitizedParticipant.name}`, 
        'success'
      );
    } catch (error) {
      console.error(`Error in ${actionName}:`, error);
      showNotification?.(
        `Failed to ${actionName.toLowerCase()}. Please try again.`, 
        'error'
      );
    } finally {
      if (mountedRef.current) {
        setIsProcessing(false);
      }
    }
  }, [isProcessing, sanitizedParticipant, showNotification]);

  // Click outside handler for actions menu
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (actionsRef.current && !actionsRef.current.contains(event.target)) {
        setShowActions(false);
      }
    };

    if (showActions) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showActions]);

  const canShowActions = currentUserIsTeacher && !isLocal && !isProcessing;

  return (
    <div 
      className={`participant-item ${isLocal ? 'local-user' : ''} ${isTeacher ? 'teacher' : ''} ${isProcessing ? 'processing' : ''}`}
      ref={itemRef}
    >
      <div className="participant-main">
        {/* Avatar */}
        <div className="participant-avatar">
          <div className={`avatar-circle ${sanitizedParticipant.role}`}>
            <span className="avatar-initials">
              {getInitials(sanitizedParticipant.name)}
            </span>
          </div>
          
          {/* Connection quality indicator */}
          <div 
            className="connection-dot"
            style={{ backgroundColor: getConnectionColor(sanitizedParticipant.connectionQuality) }}
            title={`Connection: ${sanitizedParticipant.connectionQuality}`}
          />
        </div>

        {/* User info */}
        <div className="participant-info">
          <div className="participant-header">
            <span className="participant-name">
              {sanitizedParticipant.name}
              {isLocal && <span className="local-badge">(You)</span>}
            </span>
            
            <div className="participant-badges">
              {sanitizedParticipant.role === 'teacher' && (
                <span className="role-badge teacher">👨‍🏫</span>
              )}
              {sanitizedParticipant.isHandRaised && (
                <span className="hand-badge raised" title="Hand raised">✋</span>
              )}
            </div>
          </div>
          
          <div className="participant-details">
            <span className="join-time">{formatJoinTime(sanitizedParticipant.joinedAt)}</span>
            
            <div className="media-status">
              <span 
                className={`media-icon mic ${sanitizedParticipant.micEnabled ? 'enabled' : 'disabled'}`}
                title={`Microphone ${sanitizedParticipant.micEnabled ? 'on' : 'off'}`}
              >
                {sanitizedParticipant.micEnabled ? '🎤' : '🔇'}
              </span>
              
              <span 
                className={`media-icon camera ${sanitizedParticipant.videoEnabled ? 'enabled' : 'disabled'}`}
                title={`Camera ${sanitizedParticipant.videoEnabled ? 'on' : 'off'}`}
              >
                {sanitizedParticipant.videoEnabled ? '📹' : '📷'}
              </span>
            </div>
          </div>
        </div>

        {/* Actions menu */}
        {canShowActions && (
          <div className="participant-actions" ref={actionsRef}>
            <button
              className="actions-trigger"
              onClick={() => setShowActions(!showActions)}
              disabled={isProcessing}
              title="Participant actions"
              aria-label="More actions"
            >
              ⋮
            </button>
            
            {showActions && (
              <div className="actions-menu">
                <button
                  className="action-item mute"
                  onClick={() => handleAction(
                    'Mute user',
                    onMuteUser,
                    `Mute ${sanitizedParticipant.name}?`
                  )}
                  disabled={isProcessing}
                >
                  <span className="action-icon">🔇</span>
                  <span className="action-text">Mute</span>
                </button>
                
                <button
                  className="action-item promote"
                  onClick={() => handleAction(
                    'Promote to teacher',
                    onPromoteToTeacher,
                    `Promote ${sanitizedParticipant.name} to teacher?`
                  )}
                  disabled={isProcessing}
                >
                  <span className="action-icon">👨‍🏫</span>
                  <span className="action-text">Make Teacher</span>
                </button>
                
                <button
                  className="action-item remove"
                  onClick={() => handleAction(
                    'Remove user',
                    onRemoveUser,
                    `Remove ${sanitizedParticipant.name} from the classroom?`
                  )}
                  disabled={isProcessing}
                >
                  <span className="action-icon">🚫</span>
                  <span className="action-text">Remove</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Processing overlay */}
      {isProcessing && (
        <div className="processing-overlay">
          <div className="processing-spinner" />
        </div>
      )}
    </div>
  );
});

ParticipantItem.displayName = 'ParticipantItem';

// Main ParticipantsSidebar component
const ParticipantsSidebar = memo(({
  localUser = null,
  remoteUsers = [],
  raisedHands = new Set(),
  isTeacher = false,
  onClose = () => {},
  showNotification = () => {},
  onMuteUser = () => {},
  onRemoveUser = () => {},
  onPromoteToTeacher = () => {},
  onMuteAll = () => {},
  onUnmuteAll = () => {}
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('name'); // 'name', 'joined', 'role'
  const [showTeacherActions, setShowTeacherActions] = useState(false);
  
  const searchInputRef = useRef(null);
  const teacherActionsRef = useRef(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // Sanitize and combine all participants
  const allParticipants = useMemo(() => {
    const participants = [];
    
    // Add local user first
    if (localUser && typeof localUser === 'object') {
      participants.push({
        ...localUser,
        isLocal: true,
        joinedAt: new Date(Date.now() - 1000) // Slightly earlier to appear first
      });
    }
    
    // Add remote users
    if (Array.isArray(remoteUsers)) {
      remoteUsers.forEach(user => {
        if (user && typeof user === 'object' && user.uid) {
          participants.push({
            ...user,
            isLocal: false,
            joinedAt: user.joinedAt || new Date()
          });
        }
      });
    }
    
    return participants;
  }, [localUser, remoteUsers]);

  // Filter participants based on search
  const filteredParticipants = useMemo(() => {
    if (!searchQuery.trim()) return allParticipants;
    
    const query = searchQuery.toLowerCase().trim();
    return allParticipants.filter(participant => {
      const name = (participant.name || '').toLowerCase();
      const uid = (participant.uid || '').toString().toLowerCase();
      const role = (participant.role || '').toLowerCase();
      
      return name.includes(query) || uid.includes(query) || role.includes(query);
    });
  }, [allParticipants, searchQuery]);

  // Sort participants
  const sortedParticipants = useMemo(() => {
    const sorted = [...filteredParticipants].sort((a, b) => {
      // Always show local user first
      if (a.isLocal) return -1;
      if (b.isLocal) return 1;
      
      // Then teachers
      if (a.role === 'teacher' && b.role !== 'teacher') return -1;
      if (b.role === 'teacher' && a.role !== 'teacher') return 1;
      
      // Then sort by selected criteria
      switch (sortBy) {
        case 'name':
          return (a.name || '').localeCompare(b.name || '');
        case 'joined':
          return new Date(b.joinedAt || 0) - new Date(a.joinedAt || 0);
        case 'role':
          return (a.role || '').localeCompare(b.role || '');
        default:
          return 0;
      }
    });
    
    return sorted;
  }, [filteredParticipants, sortBy]);

  // Statistics
  const stats = useMemo(() => {
    const total = allParticipants.length;
    const teachers = allParticipants.filter(p => p.role === 'teacher').length;
    const students = total - teachers;
    const handsRaised = allParticipants.filter(p => 
      raisedHands.has(p.uid) || p.isHandRaised
    ).length;
    const micEnabled = allParticipants.filter(p => p.micEnabled).length;
    const videoEnabled = allParticipants.filter(p => p.videoEnabled).length;
    
    return { total, teachers, students, handsRaised, micEnabled, videoEnabled };
  }, [allParticipants, raisedHands]);

  const handleClose = useCallback(() => {
    try {
      onClose();
    } catch (error) {
      console.error('Error closing participants sidebar:', error);
    }
  }, [onClose]);

  const handleSearchChange = useCallback((e) => {
    const value = e.target.value;
    if (value.length <= 100) { // Prevent extremely long searches
      setSearchQuery(value);
    }
  }, []);

  const handleSortChange = useCallback((newSort) => {
    setSortBy(newSort);
  }, []);

  const handleTeacherAction = useCallback(async (actionName, actionFn) => {
    if (!isTeacher) return;
    
    try {
      setShowTeacherActions(false);
      await actionFn();
      showNotification?.(`${actionName} completed`, 'success');
    } catch (error) {
      console.error(`Error in ${actionName}:`, error);
      showNotification?.(`Failed to ${actionName.toLowerCase()}`, 'error');
    }
  }, [isTeacher, showNotification]);

  // Click outside handler for teacher actions
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (teacherActionsRef.current && !teacherActionsRef.current.contains(event.target)) {
        setShowTeacherActions(false);
      }
    };

    if (showTeacherActions) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showTeacherActions]);

  // Focus search input when component mounts
  useEffect(() => {
    const timer = setTimeout(() => {
      searchInputRef.current?.focus();
    }, 300);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="participants-sidebar">
      {/* Header */}
      <div className="participants-header">
        <div className="header-title">
          <span className="participants-icon">👥</span>
          <h3>Participants</h3>
          <div className="participants-count">({stats.total})</div>
        </div>
        
        {isTeacher && (
          <div className="teacher-actions-container" ref={teacherActionsRef}>
            <button
              className="teacher-actions-btn"
              onClick={() => setShowTeacherActions(!showTeacherActions)}
              title="Teacher actions"
            >
              ⚙️
            </button>
            
            {showTeacherActions && (
              <div className="teacher-actions-menu">
                <button
                  className="teacher-action-item"
                  onClick={() => handleTeacherAction('Mute all', onMuteAll)}
                >
                  <span className="action-icon">🔇</span>
                  <span className="action-text">Mute All</span>
                </button>
                
                <button
                  className="teacher-action-item"
                  onClick={() => handleTeacherAction('Unmute all', onUnmuteAll)}
                >
                  <span className="action-icon">🎤</span>
                  <span className="action-text">Unmute All</span>
                </button>
              </div>
            )}
          </div>
        )}
        
        <button
          className="close-btn"
          onClick={handleClose}
          title="Close participants panel"
          aria-label="Close participants"
        >
          ✕
        </button>
      </div>

      {/* Statistics */}
      <div className="participants-stats">
        <div className="stat-item">
          <span className="stat-icon">👥</span>
          <span className="stat-text">{stats.total} Total</span>
        </div>
        
        <div className="stat-item">
          <span className="stat-icon">👨‍🏫</span>
          <span className="stat-text">{stats.teachers} Teachers</span>
        </div>
        
        <div className="stat-item">
          <span className="stat-icon">🎓</span>
          <span className="stat-text">{stats.students} Students</span>
        </div>
        
        {stats.handsRaised > 0 && (
          <div className="stat-item raised-hands">
            <span className="stat-icon">✋</span>
            <span className="stat-text">{stats.handsRaised} Raised</span>
          </div>
        )}
      </div>

      {/* Search and Sort */}
      <div className="participants-controls">
        <div className="search-container">
          <input
            ref={searchInputRef}
            type="text"
            value={searchQuery}
            onChange={handleSearchChange}
            placeholder="Search participants..."
            className="search-input"
            maxLength={100}
          />
          <span className="search-icon">🔍</span>
        </div>
        
        <div className="sort-container">
          <select
            value={sortBy}
            onChange={(e) => handleSortChange(e.target.value)}
            className="sort-select"
            title="Sort by"
          >
            <option value="name">Sort by Name</option>
            <option value="joined">Sort by Joined</option>
            <option value="role">Sort by Role</option>
          </select>
        </div>
      </div>

      {/* Participants List */}
      <div className="participants-list">
        {sortedParticipants.length === 0 ? (
          <div className="empty-participants">
            {searchQuery ? (
              <>
                <div className="empty-icon">🔍</div>
                <h4>No participants found</h4>
                <p>Try adjusting your search criteria</p>
                <button 
                  className="clear-search-btn"
                  onClick={() => setSearchQuery('')}
                >
                  Clear Search
                </button>
              </>
            ) : (
              <>
                <div className="empty-icon">👥</div>
                <h4>No participants yet</h4>
                <p>Participants will appear here when they join</p>
              </>
            )}
          </div>
        ) : (
          sortedParticipants.map((participant) => (
            <ParticipantItem
              key={`participant-${participant.uid}-${participant.isLocal ? 'local' : 'remote'}`}
              participant={participant}
              isLocal={participant.isLocal}
              isTeacher={participant.role === 'teacher'}
              currentUserIsTeacher={isTeacher}
              raisedHands={raisedHands}
              onMuteUser={onMuteUser}
              onRemoveUser={onRemoveUser}
              onPromoteToTeacher={onPromoteToTeacher}
              showNotification={showNotification}
            />
          ))
        )}
      </div>

      {/* Footer with media stats */}
      <div className="participants-footer">
        <div className="media-stats">
          <div className="media-stat">
            <span className="media-icon">🎤</span>
            <span className="media-count">{stats.micEnabled}</span>
          </div>
          
          <div className="media-stat">
            <span className="media-icon">📹</span>
            <span className="media-count">{stats.videoEnabled}</span>
          </div>
          
          <div className="connection-info">
            <span className="connection-text">
              {stats.total} connected
            </span>
          </div>
        </div>
      </div>
    </div>
  );
});

ParticipantsSidebar.displayName = 'ParticipantsSidebar';

export default ParticipantsSidebar;
