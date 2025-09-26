// LiveClassroom.jsx - WORLD'S MOST BEAUTIFUL & ADVANCED VIDEO CONFERENCING
import React, { 
  useState, 
  useRef, 
  useEffect, 
  useCallback, 
  useMemo 
} from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  useRTCClient,
  useJoin,
  useLocalMicrophoneTrack,
  useLocalCameraTrack,
  usePublish,
  useRemoteUsers
} from 'agora-rtc-react';
import AgoraRTC from 'agora-rtc-sdk-ng';
import WhiteboardComponent from './WhiteboardComponent';
import VideoSettingsPanel from './VideoSettingsPanel';
import ClassroomFeatures from './ClassroomFeatures';
import './LiveClassroom.css';

// Agora Configuration
AgoraRTC.setLogLevel(4); // Error level only in production

const LiveClassroom = () => {
  const { classScheduleId } = useParams();
  const navigate = useNavigate();

  // Stable refs for memory safety
  const mountedRef = useRef(true);
  const screenTrackRef = useRef(null);
  const configRef = useRef({
    agoraAppId: '',
    channelName: '',
    token: null,
    uid: null
  });
  const reconnectAttempts = useRef(0);
  const connectionTimerRef = useRef(null);

  // Draggable popup video refs
  const dragRefs = useRef({});
  const isDragging = useRef(false);
  const dragOffset = useRef({ x: 0, y: 0 });

  // User info with enhanced error handling
  const userInfo = useMemo(() => {
    try {
      const stored = localStorage.getItem('teacherUser');
      if (!stored || stored === 'null' || stored === 'undefined') {
        console.warn('No valid user data found');
        return null;
      }
      const parsed = JSON.parse(stored);
      if (!parsed || !parsed._id) {
        console.warn('Invalid user data structure');
        return null;
      }
      return parsed;
    } catch (error) {
      console.error('Failed to parse user info:', error);
      return null;
    }
  }, []);

  // Core application state
  const [connectionState, setConnectionState] = useState('idle');
  const [micEnabled, setMicEnabled] = useState(false);
  const [videoEnabled, setVideoEnabled] = useState(true);
  const [notifications, setNotifications] = useState([]);
  const [connectionError, setConnectionError] = useState(null);

  // Screen sharing state
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [screenTrack, setScreenTrack] = useState(null);

  // Advanced UI state
  const [leftSidebarOpen, setLeftSidebarOpen] = useState(false);
  const [currentLeftPanel, setCurrentLeftPanel] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [viewMode, setViewMode] = useState('gallery');
  const [focusedUser, setFocusedUser] = useState(null);

  // Draggable popup video state
  const [popupVideos, setPopupVideos] = useState([]);
  const [nextPopupId, setNextPopupId] = useState(1);

  // Whiteboard state
  const [showWhiteboard, setShowWhiteboard] = useState(false);

  // Leave confirmation state
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);

  // Settings state
  const [videoSettings, setVideoSettings] = useState({});

  const isTeacher = userInfo?.role === 'teacher';

  // Advanced notification system with queue management
  const showNotification = useCallback((message, type = 'info', duration = 3000) => {
    if (!mountedRef.current || !message) return;

    const id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const notification = { 
      id, 
      message, 
      type, 
      timestamp: new Date(),
      duration 
    };

    setNotifications(prev => {
      const filtered = prev.slice(-3); // Keep max 4 notifications
      return [...filtered, notification];
    });

    const timer = setTimeout(() => {
      if (mountedRef.current) {
        setNotifications(prev => prev.filter(n => n.id !== id));
      }
    }, duration);

    return () => clearTimeout(timer);
  }, []);

  // Agora hooks with enhanced error handling
  const client = useRTCClient();
  const { localMicrophoneTrack, error: micError } = useLocalMicrophoneTrack(micEnabled);
  const { localCameraTrack, error: cameraError } = useLocalCameraTrack(videoEnabled);

  // Safe track publishing with comprehensive error handling
  const tracksToPublish = useMemo(() => {
    const tracks = [];

    try {
      if (localMicrophoneTrack && !micError) {
        tracks.push(localMicrophoneTrack);
      }

      if (isScreenSharing && screenTrack) {
        tracks.push(screenTrack);
      } else if (videoEnabled && localCameraTrack && !cameraError) {
        tracks.push(localCameraTrack);
      }

      return tracks.filter(Boolean);
    } catch (error) {
      console.error('Error preparing tracks:', error);
      return [];
    }
  }, [localMicrophoneTrack, localCameraTrack, screenTrack, isScreenSharing, videoEnabled, micError, cameraError]);

  usePublish(tracksToPublish);
  const remoteUsers = useRemoteUsers();

  // Enhanced join configuration with validation
  const joinConfig = useMemo(() => {
    const config = {
      appid: configRef.current.agoraAppId || null,
      channel: configRef.current.channelName || null,
      token: configRef.current.token || null,
      uid: configRef.current.uid || null
    };

    console.log('Join config prepared:', {
      hasAppId: !!config.appid,
      hasChannel: !!config.channel,
      hasToken: !!config.token,
      uid: config.uid
    });

    return config;
  }, [configRef.current.agoraAppId, configRef.current.channelName]);

  const shouldJoin = Boolean(
    configRef.current.agoraAppId && 
    configRef.current.channelName &&
    mountedRef.current &&
    connectionState !== 'failed' &&
    !isLeaving
  );

  const { isLoading: joining, isConnected, error: joinError } = useJoin(joinConfig, shouldJoin);

  // Robust credentials fetching with enhanced retry logic
  const fetchCredentials = useCallback(async (retryCount = 0) => {
    if (!userInfo || !classScheduleId || !mountedRef.current) {
      console.error('Missing required data for credentials fetch:', {
        hasUserInfo: !!userInfo,
        hasClassScheduleId: !!classScheduleId,
        isMounted: mountedRef.current
      });
      return;
    }

    const maxRetries = 3;
    const retryDelay = Math.pow(2, retryCount) * 1000;

    try {
      console.log(`Fetching credentials (attempt ${retryCount + 1}/${maxRetries + 1})...`);
      setConnectionState('connecting');
      setConnectionError(null);

      const token = localStorage.getItem('teacherToken');
      if (!token) {
        throw new Error('Authentication token not found. Please login again.');
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      const response = await fetch('/api/live/credentials', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'Cache-Control': 'no-cache'
        },
        body: JSON.stringify({ 
          classScheduleId, 
          userId: userInfo._id,
          role: userInfo.role || 'student',
          timestamp: Date.now()
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      console.log('Credentials API response:', {
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries())
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('API Error Response:', errorText);

        if (response.status === 401) {
          throw new Error('Authentication failed. Please login again.');
        } else if (response.status === 404) {
          throw new Error('Classroom not found or has ended.');
        } else if (response.status >= 500) {
          throw new Error('Server error. Please try again later.');
        } else {
          throw new Error(`Request failed: ${response.status} ${response.statusText}`);
        }
      }

      const data = await response.json();
      console.log('Credentials received:', {
        hasData: !!data,
        hasAppId: !!(data.data?.agoraAppId || data.agoraAppId),
        hasChannel: !!(data.data?.channelName || data.channelName),
        hasToken: !!(data.data?.token || data.token)
      });

      const creds = data.data || data;

      if (!creds.agoraAppId) {
        throw new Error('Invalid response: Missing Agora App ID');
      }
      if (!creds.channelName) {
        throw new Error('Invalid response: Missing channel name');
      }

      if (mountedRef.current) {
        configRef.current = {
          agoraAppId: creds.agoraAppId,
          channelName: creds.channelName,
          token: creds.token || null,
          uid: creds.uid || Math.floor(Math.random() * 100000)
        };

        console.log('Credentials configured:', {
          appId: configRef.current.agoraAppId.substring(0, 8) + '...',
          channel: configRef.current.channelName,
          hasToken: !!configRef.current.token,
          uid: configRef.current.uid
        });

        setConnectionState('ready');
        reconnectAttempts.current = 0;
        showNotification('Connected to classroom successfully!', 'success', 5000);
      }

    } catch (error) {
      console.error('Credentials fetch error:', error);

      if (!mountedRef.current) return;

      const errorMessage = error.message || 'Unknown error occurred';
      setConnectionError(errorMessage);

      if (retryCount < maxRetries && !error.message.includes('Authentication')) {
        console.log(`Retrying in ${retryDelay}ms...`);
        setConnectionState('reconnecting');
        showNotification(`Connection failed. Retrying... (${retryCount + 1}/${maxRetries})`, 'info', 2000);

        connectionTimerRef.current = setTimeout(() => {
          if (mountedRef.current) {
            fetchCredentials(retryCount + 1);
          }
        }, retryDelay);
      } else {
        setConnectionState('failed');
        showNotification(errorMessage, 'error', 10000);
      }
    }
  }, [userInfo, classScheduleId, showNotification]);

  // Complete cleanup system - production grade
  const performCompleteCleanup = useCallback(async (skipNavigation = false) => {
    console.log('🧹 Starting complete cleanup...', { skipNavigation });

    try {
      // Clear all timers
      if (connectionTimerRef.current) {
        clearTimeout(connectionTimerRef.current);
        connectionTimerRef.current = null;
      }

      // Stop screen sharing
      if (screenTrackRef.current) {
        try {
          console.log('📺 Stopping screen share...');
          await screenTrackRef.current.stop();
          await screenTrackRef.current.close();
          screenTrackRef.current = null;
          setScreenTrack(null);
          setIsScreenSharing(false);
          console.log('✅ Screen share stopped');
        } catch (error) {
          console.warn('⚠️ Screen share cleanup error:', error);
        }
      }

      // Unpublish tracks
      if (client && tracksToPublish.length > 0) {
        try {
          console.log('📡 Unpublishing tracks...');
          await client.unpublish(tracksToPublish);
          console.log('✅ Tracks unpublished');
        } catch (error) {
          console.warn('⚠️ Unpublish error:', error);
        }
      }

      // Stop local tracks
      if (localCameraTrack) {
        try {
          console.log('📹 Stopping camera...');
          await localCameraTrack.stop();
          await localCameraTrack.close();
          console.log('✅ Camera stopped');
        } catch (error) {
          console.warn('⚠️ Camera cleanup error:', error);
        }
      }

      if (localMicrophoneTrack) {
        try {
          console.log('🎤 Stopping microphone...');
          await localMicrophoneTrack.stop();
          await localMicrophoneTrack.close();
          console.log('✅ Microphone stopped');
        } catch (error) {
          console.warn('⚠️ Microphone cleanup error:', error);
        }
      }

      // Leave channel
      if (client && isConnected) {
        try {
          console.log('🚪 Leaving channel...');
          await client.leave();
          console.log('✅ Channel left successfully');
        } catch (error) {
          console.warn('⚠️ Leave channel error:', error);
        }
      }

      // Reset all states
      console.log('🔄 Resetting states...');
      setMicEnabled(false);
      setVideoEnabled(false);
      setConnectionState('idle');
      setChatMessages([]);
      setLeftSidebarOpen(false);
      setCurrentLeftPanel(null);
      setShowWhiteboard(false);
      setFocusedUser(null);
      setViewMode('gallery');
      setConnectionError(null);
      setPopupVideos([]);
      setNextPopupId(1);

      // Clear config
      configRef.current = {
        agoraAppId: '',
        channelName: '',
        token: null,
        uid: null
      };

      console.log('✅ Complete cleanup finished successfully');

      // Navigate safely
      if (!skipNavigation && mountedRef.current) {
        console.log('🧭 Navigating to teacher dashboard...');
        setTimeout(() => {
          if (mountedRef.current) {
            navigate('/teacher');
          }
        }, 500);
      }

    } catch (error) {
      console.error('💥 Cleanup error:', error);
      if (!skipNavigation) {
        console.log('🚨 Force navigating due to error...');
        navigate('/teacher');
      }
    }
  }, [
    client, 
    localCameraTrack, 
    localMicrophoneTrack, 
    tracksToPublish,
    isConnected,
    navigate
  ]);

  // Draggable popup video management
  const createPopupVideo = useCallback((user, type = 'remote') => {
    if (!user || isLeaving) return;

    const popupId = `popup_${nextPopupId}_${Date.now()}`;
    const popup = {
      id: popupId,
      user,
      type,
      position: getNextAvailablePosition(),
      created: Date.now()
    };

    setPopupVideos(prev => {
      // Remove existing popup for same user
      const filtered = prev.filter(p => 
        !(p.user.uid === user.uid || (type === 'local' && p.type === 'local'))
      );
      return [...filtered, popup];
    });

    setNextPopupId(prev => prev + 1);
    showNotification(`Created floating window for ${user.name || `User ${user.uid}`}`, 'info', 2000);
  }, [nextPopupId, isLeaving, showNotification]);

  const removePopupVideo = useCallback((popupId) => {
    setPopupVideos(prev => prev.filter(p => p.id !== popupId));
    showNotification('Floating window closed', 'info', 1500);
  }, [showNotification]);

  const getNextAvailablePosition = useCallback(() => {
    const positions = ['bottom-right', 'top-right', 'bottom-left', 'top-left'];
    const usedPositions = popupVideos.map(p => p.position);

    for (let pos of positions) {
      if (!usedPositions.includes(pos)) {
        return pos;
      }
    }

    // If all positions are used, use bottom-right with offset
    return 'bottom-right';
  }, [popupVideos]);

  // Drag functionality for popup videos
  const handleMouseDown = useCallback((e, popupId) => {
    if (e.button !== 0) return; // Only left mouse button

    e.preventDefault();
    e.stopPropagation();

    isDragging.current = true;
    const popup = document.getElementById(popupId);
    if (!popup) return;

    const rect = popup.getBoundingClientRect();
    dragOffset.current = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };

    popup.classList.add('dragging');
    document.body.style.cursor = 'grabbing';
    document.body.style.userSelect = 'none';

    const handleMouseMove = (e) => {
      if (!isDragging.current) return;

      const x = e.clientX - dragOffset.current.x;
      const y = e.clientY - dragOffset.current.y;

      // Constrain to viewport
      const maxX = window.innerWidth - popup.offsetWidth;
      const maxY = window.innerHeight - popup.offsetHeight;

      const constrainedX = Math.max(0, Math.min(x, maxX));
      const constrainedY = Math.max(0, Math.min(y, maxY));

      popup.style.left = constrainedX + 'px';
      popup.style.top = constrainedY + 'px';
      popup.style.right = 'auto';
      popup.style.bottom = 'auto';
    };

    const handleMouseUp = () => {
      isDragging.current = false;
      popup.classList.remove('dragging');
      document.body.style.cursor = '';
      document.body.style.userSelect = '';

      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, []);

  // Leave handlers
  const handleLeave = useCallback(() => {
    console.log('🚪 Leave button clicked');
    if (isLeaving) {
      console.log('⚠️ Already leaving, ignoring...');
      return;
    }
    setShowLeaveConfirm(true);
  }, [isLeaving]);

  const confirmLeave = useCallback(async () => {
    console.log('✅ Confirm leave clicked');
    if (isLeaving) {
      console.log('⚠️ Already in leaving process, ignoring...');
      return;
    }

    try {
      console.log('🚀 Starting leave process...');
      setIsLeaving(true);
      setShowLeaveConfirm(false);
      mountedRef.current = false;

      showNotification('Leaving meeting...', 'info', 2000);
      await performCompleteCleanup(false);

    } catch (error) {
      console.error('💥 Leave process error:', error);
      navigate('/teacher');
    } finally {
      setIsLeaving(false);
    }
  }, [isLeaving, showNotification, performCompleteCleanup, navigate]);

  const cancelLeave = useCallback(() => {
    console.log('❌ Cancel leave clicked');
    if (!isLeaving) {
      setShowLeaveConfirm(false);
    }
  }, [isLeaving]);

  // Sidebar management
  const openLeftPanel = useCallback((panelType) => {
    if (!panelType || isLeaving) return;

    if (currentLeftPanel === panelType && leftSidebarOpen) {
      setLeftSidebarOpen(false);
      setCurrentLeftPanel(null);
    } else {
      setCurrentLeftPanel(panelType);
      setLeftSidebarOpen(true);
    }
  }, [currentLeftPanel, leftSidebarOpen, isLeaving]);

  const closeLeftPanel = useCallback(() => {
    setLeftSidebarOpen(false);
    setCurrentLeftPanel(null);
  }, []);

  // Screen sharing - enterprise grade
  const startScreenShare = useCallback(async () => {
    if (!isTeacher || isScreenSharing || isLeaving) {
      showNotification('Only teachers can share screen', 'error');
      return;
    }

    try {
      console.log('📺 Starting screen share...');

      const screenVideoTrack = await AgoraRTC.createScreenVideoTrack({
        encoderConfig: {
          width: 1920,
          height: 1080,
          frameRate: 15,
          bitrateMin: 1000,
          bitrateMax: 4000
        },
        optimizationMode: 'detail',
        captureMouseCursor: true
      });

      if (screenVideoTrack && mountedRef.current) {
        screenTrackRef.current = screenVideoTrack;
        setScreenTrack(screenVideoTrack);
        setIsScreenSharing(true);
        setViewMode('gallery');

        screenVideoTrack.on('track-ended', () => {
          console.log('📺 Screen share ended by user');
          if (mountedRef.current) {
            stopScreenShare();
          }
        });

        showNotification('Screen sharing started successfully', 'success');
        console.log('✅ Screen share started successfully');
      }
    } catch (error) {
      console.error('💥 Screen share failed:', error);
      setIsScreenSharing(false);
      setScreenTrack(null);
      screenTrackRef.current = null;

      if (error.message.includes('Permission denied') || error.message.includes('NotAllowedError')) {
        showNotification('Screen share permission denied. Please allow access and try again.', 'error', 5000);
      } else if (error.message.includes('NotSupportedError')) {
        showNotification('Screen sharing is not supported in this browser.', 'error', 5000);
      } else {
        showNotification('Failed to start screen sharing. Please try again.', 'error');
      }
    }
  }, [isTeacher, isScreenSharing, isLeaving, showNotification]);

  const stopScreenShare = useCallback(async () => {
    if (!isScreenSharing) return;

    try {
      console.log('📺 Stopping screen share...');

      if (screenTrackRef.current) {
        await screenTrackRef.current.stop();
        await screenTrackRef.current.close();
        screenTrackRef.current = null;
      }

      setScreenTrack(null);
      setIsScreenSharing(false);
      setViewMode('gallery');

      showNotification('Screen sharing stopped', 'info');
      console.log('✅ Screen share stopped successfully');
    } catch (error) {
      console.error('💥 Stop screen share error:', error);
      screenTrackRef.current = null;
      setScreenTrack(null);
      setIsScreenSharing(false);
    }
  }, [isScreenSharing, showNotification]);

  const toggleScreenShare = useCallback(() => {
    if (isScreenSharing) {
      stopScreenShare();
    } else {
      startScreenShare();
    }
  }, [isScreenSharing, startScreenShare, stopScreenShare]);

  // Media controls - production grade
  const handleMicToggle = useCallback(() => {
    if (isLeaving) return;

    setMicEnabled(prev => {
      const newState = !prev;
      showNotification(
        newState ? '🎤 Microphone turned on' : '🔇 Microphone muted', 
        'info', 
        1500
      );
      return newState;
    });
  }, [isLeaving, showNotification]);

  const handleVideoToggle = useCallback(() => {
    if (isLeaving || isScreenSharing) return;

    setVideoEnabled(prev => {
      const newState = !prev;
      showNotification(
        newState ? '📹 Camera turned on' : '📷 Camera turned off', 
        'info', 
        1500
      );
      return newState;
    });
  }, [isLeaving, isScreenSharing, showNotification]);

  // Whiteboard toggle
  const toggleWhiteboard = useCallback(() => {
    if (!isTeacher) {
      showNotification('Only teachers can access the whiteboard', 'error');
      return;
    }

    if (showWhiteboard) {
      setShowWhiteboard(false);
      setViewMode('gallery');
    } else {
      setShowWhiteboard(true);
      setViewMode('whiteboard');
    }
  }, [isTeacher, showWhiteboard, showNotification]);

  // Chat handling - optimized
  const handleSendMessage = useCallback((message) => {
    if (!mountedRef.current || !message?.trim() || isLeaving) return;

    try {
      const chatMessage = {
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        content: message.trim(),
        userName: userInfo?.name || 'You',
        timestamp: new Date(),
        isSelf: true
      };

      setChatMessages(prev => {
        const updated = [...prev, chatMessage];
        return updated.slice(-100); // Keep max 100 messages
      });

      console.log('💬 Message sent:', chatMessage.content);

    } catch (error) {
      console.error('💥 Send message error:', error);
      showNotification('Failed to send message', 'error');
    }
  }, [userInfo, isLeaving, showNotification]);

  // User focus handling
  const handleUserFocus = useCallback((user) => {
    if (!user || isLeaving) return;

    setFocusedUser(user);
    setViewMode('focus');
    console.log('👁️ Focused on user:', user.name || user.uid);
  }, [isLeaving]);

  // Create popup from video tile
  const handleCreatePopup = useCallback((user, type = 'remote') => {
    createPopupVideo(user, type);
  }, [createPopupVideo]);

  // Settings handlers
  const handleVideoSettingsChange = useCallback((setting, value) => {
    if (!setting || value === undefined) return;

    setVideoSettings(prev => ({ ...prev, [setting]: value }));
    showNotification(`${setting} updated successfully`, 'success', 2000);
    console.log('⚙️ Setting changed:', setting, value);
  }, [showNotification]);

  const handleFeatureToggle = useCallback((feature, enabled) => {
    if (!feature) return;

    showNotification(
      `${feature} ${enabled ? 'enabled' : 'disabled'}`, 
      enabled ? 'success' : 'info',
      2000
    );
    console.log('🎛️ Feature toggled:', feature, enabled);
  }, [showNotification]);

  // Initialization effect - robust
  useEffect(() => {
    console.log('🚀 LiveClassroom component mounting...');
    mountedRef.current = true;

    // Validate prerequisites
    if (!userInfo) {
      console.error('❌ No user info found, redirecting to login...');
      showNotification('Please login to access the classroom', 'error');
      navigate('/login');
      return;
    }

    if (!classScheduleId) {
      console.error('❌ No class schedule ID found');
      showNotification('Invalid classroom link', 'error');
      navigate('/teacher');
      return;
    }

    console.log('✅ Prerequisites validated:', {
      user: userInfo.name,
      role: userInfo.role,
      classId: classScheduleId
    });

    // Initialize credentials
    if (!configRef.current.agoraAppId) {
      console.log('🔑 Fetching credentials...');
      fetchCredentials();
    }

    // Cleanup function
    return () => {
      console.log('🧹 LiveClassroom component unmounting...');
      mountedRef.current = false;

      // Clear timers
      if (connectionTimerRef.current) {
        clearTimeout(connectionTimerRef.current);
        connectionTimerRef.current = null;
      }

      // Emergency cleanup - no navigation
      if (screenTrackRef.current) {
        try {
          screenTrackRef.current.stop();
          screenTrackRef.current.close();
          screenTrackRef.current = null;
        } catch (error) {
          console.warn('⚠️ Emergency screen cleanup error:', error);
        }
      }
    };
  }, [userInfo, classScheduleId, navigate, fetchCredentials, showNotification]);

  // Connection status monitoring
  useEffect(() => {
    if (isConnected && mountedRef.current && connectionState !== 'connected') {
      console.log('✅ Successfully connected to Agora channel');
      setConnectionState('connected');
      showNotification('Successfully joined classroom!', 'success', 3000);
      reconnectAttempts.current = 0;
    }
  }, [isConnected, connectionState, showNotification]);

  // Error monitoring
  useEffect(() => {
    if (joinError && mountedRef.current) {
      console.error('💥 Join error:', joinError);
      setConnectionState('failed');
      setConnectionError(joinError.message || 'Failed to join classroom');
      showNotification('Failed to join classroom: ' + (joinError.message || 'Unknown error'), 'error', 5000);
    }
  }, [joinError, showNotification]);

  useEffect(() => {
    if (micError && mountedRef.current) {
      console.error('💥 Microphone error:', micError);
      showNotification('Microphone access failed. Please check permissions.', 'error');
    }
  }, [micError, showNotification]);

  useEffect(() => {
    if (cameraError && mountedRef.current) {
      console.error('💥 Camera error:', cameraError);
      showNotification('Camera access failed. Please check permissions.', 'error');
    }
  }, [cameraError, showNotification]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (!mountedRef.current || isLeaving) return;

      const isInputActive = ['INPUT', 'TEXTAREA', 'SELECT'].includes(event.target.tagName) ||
                           event.target.contentEditable === 'true';

      if (isInputActive) return;

      switch (event.key.toLowerCase()) {
        case 'm':
          event.preventDefault();
          handleMicToggle();
          break;
        case 'v':
          event.preventDefault();
          handleVideoToggle();
          break;
        case 'c':
          event.preventDefault();
          openLeftPanel('chat');
          break;
        case 'p':
          event.preventDefault();
          openLeftPanel('participants');
          break;
        case 'escape':
          event.preventDefault();
          if (leftSidebarOpen) {
            closeLeftPanel();
          } else if (showLeaveConfirm) {
            cancelLeave();
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    handleMicToggle, 
    handleVideoToggle, 
    openLeftPanel, 
    closeLeftPanel, 
    leftSidebarOpen, 
    isLeaving,
    showLeaveConfirm,
    cancelLeave
  ]);

  // Loading state - enhanced
  if (connectionState === 'connecting' || connectionState === 'reconnecting' || joining) {
    return (
      <div className="classroom-loading">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <h3>
            {connectionState === 'reconnecting' 
              ? 'Reconnecting to Classroom...' 
              : 'Joining Classroom...'}
          </h3>
          <p>
            {connectionState === 'reconnecting'
              ? 'Attempting to restore connection...'
              : 'Setting up your premium video conference...'}
          </p>
          <div className="loading-steps">
            <div className={`step ${connectionState === 'connecting' ? 'active' : 'completed'}`}>
              {connectionState === 'connecting' ? '⏳' : '✅'} Connecting to server...
            </div>
            <div className={`step ${joining ? 'active' : ''}`}>
              ⏳ Initializing camera and microphone...
            </div>
            <div className="step">
              ⏳ Joining classroom...
            </div>
          </div>
          {connectionState === 'reconnecting' && (
            <div className="reconnect-info">
              <p>Attempt {reconnectAttempts.current + 1} of 3</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Error state - enhanced with diagnostics
  if (connectionState === 'failed') {
    return (
      <div className="classroom-error">
        <div className="error-container">
          <div className="error-icon">⚠️</div>
          <h3>Connection Failed</h3>
          <p>Unable to connect to the classroom</p>

          <div className="error-details">
            {connectionError && (
              <div className="error-message">
                <strong>Error:</strong> {connectionError}
              </div>
            )}

            <div className="troubleshooting">
              <h4>Troubleshooting Steps:</h4>
              <ul>
                <li>Check your internet connection</li>
                <li>Ensure camera and microphone permissions are granted</li>
                <li>Try refreshing the page</li>
                <li>Check if the classroom is still active</li>
                <li>Contact support if the problem persists</li>
              </ul>
            </div>
          </div>

          <div className="error-actions">
            <button 
              className="retry-btn" 
              onClick={() => {
                setConnectionState('idle');
                setConnectionError(null);
                reconnectAttempts.current = 0;
                fetchCredentials();
              }}
            >
              🔄 Try Again
            </button>
            <button 
              className="back-btn" 
              onClick={() => navigate('/teacher')}
            >
              ← Go Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Whiteboard mode
  if (viewMode === 'whiteboard' && showWhiteboard) {
    return (
      <div className="classroom-overlay">
        <WhiteboardComponent
          userId={userInfo?._id}
          userName={userInfo?.name || 'You'}
          isTeacher={isTeacher}
          onClose={() => {
            setShowWhiteboard(false);
            setViewMode('gallery');
          }}
        />
      </div>
    );
  }

  // Main classroom interface - world's most beautiful
  return (
    <div className="meet-style-classroom">
      {/* Header */}
      <header className="meet-header">
        <div className="meeting-info">
          <h2 className="meeting-title">Live Classroom</h2>
          <div className="meeting-status">
            <span className={`connection-status ${isConnected ? 'connected' : 'connecting'}`}>
              {isConnected ? '🟢 Connected' : '🟡 Connecting'}
            </span>
            <span className="participant-count">
              {remoteUsers.length + 1} participant{remoteUsers.length !== 0 ? 's' : ''}
            </span>
            {connectionState === 'reconnecting' && (
              <span className="reconnecting-status">
                🔄 Reconnecting...
              </span>
            )}
          </div>
        </div>

        <div className="header-actions">
          {isScreenSharing && (
            <span className="sharing-indicator">🖥️ Sharing screen</span>
          )}
          <button 
            className="header-btn" 
            onClick={handleLeave} 
            disabled={isLeaving}
            title="Leave meeting"
          >
            {isLeaving ? '⏳' : '✕'}
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="meet-content">
        {/* Left Sidebar */}
        <aside className={`left-sidebar ${leftSidebarOpen ? 'open' : 'closed'}`}>
          {leftSidebarOpen && (
            <div className="sidebar-content">
              <div className="sidebar-header">
                <h3>
                  {currentLeftPanel === 'chat' && '💬 Chat'}
                  {currentLeftPanel === 'participants' && '👥 Participants'}
                  {currentLeftPanel === 'settings' && '⚙️ Settings'}
                  {currentLeftPanel === 'features' && '⚡ Features'}
                </h3>
                <button 
                  className="close-sidebar" 
                  onClick={closeLeftPanel} 
                  aria-label="Close sidebar"
                >
                  ✕
                </button>
              </div>

              <div className="sidebar-body">
                {/* Chat Panel */}
                {currentLeftPanel === 'chat' && (
                  <div className="chat-container">
                    <div className="chat-messages">
                      {chatMessages.length === 0 ? (
                        <div className="empty-state">
                          <div className="empty-icon">💬</div>
                          <p>No messages yet</p>
                          <span>Send a message to start the conversation</span>
                        </div>
                      ) : (
                        chatMessages.map(msg => (
                          <div key={msg.id} className="message">
                            <div className="message-header">
                              <strong>{msg.userName}</strong>
                              <span className="message-time">
                                {msg.timestamp.toLocaleTimeString([], {
                                  hour: '2-digit', 
                                  minute: '2-digit'
                                })}
                              </span>
                            </div>
                            <div className="message-content">{msg.content}</div>
                          </div>
                        ))
                      )}
                    </div>

                    <div className="chat-input-container">
                      <input
                        type="text"
                        placeholder="Send a message to everyone"
                        className="chat-input"
                        maxLength={500}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter' && e.target.value.trim()) {
                            handleSendMessage(e.target.value.trim());
                            e.target.value = '';
                          }
                        }}
                        disabled={isLeaving}
                      />
                    </div>
                  </div>
                )}

                {/* Participants Panel */}
                {currentLeftPanel === 'participants' && (
                  <div className="participants-container">
                    <div className="participant-list">
                      {/* Local User */}
                      <div className="participant-item local">
                        <div className="participant-avatar">
                          {userInfo?.name?.charAt(0)?.toUpperCase() || 'U'}
                        </div>
                        <div className="participant-details">
                          <div className="participant-name">
                            {userInfo?.name || 'You'} (You)
                            {isTeacher && <span className="teacher-tag">Teacher</span>}
                          </div>
                          <div className="participant-status">
                            <span className={`status-icon ${micEnabled ? 'on' : 'off'}`}>
                              {micEnabled ? '🎤' : '🔇'}
                            </span>
                            <span className={`status-icon ${videoEnabled || isScreenSharing ? 'on' : 'off'}`}>
                              {isScreenSharing ? '🖥️' : (videoEnabled ? '📹' : '📷')}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Remote Users */}
                      {remoteUsers.map(user => (
                        <div 
                          key={user.uid} 
                          className="participant-item"
                          onDoubleClick={() => handleCreatePopup(user)}
                          title="Double-click to create floating window"
                        >
                          <div className="participant-avatar">
                            {user.uid.toString().charAt(0).toUpperCase()}
                          </div>
                          <div className="participant-details">
                            <div className="participant-name">User {user.uid}</div>
                            <div className="participant-status">
                              <span className={`status-icon ${user.audioTrack ? 'on' : 'off'}`}>
                                {user.audioTrack ? '🎤' : '🔇'}
                              </span>
                              <span className={`status-icon ${user.videoTrack ? 'on' : 'off'}`}>
                                {user.videoTrack ? '📹' : '📷'}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Settings Panel */}
                {currentLeftPanel === 'settings' && (
                  <div className="settings-container">
                    <VideoSettingsPanel
                      localCameraTrack={localCameraTrack}
                      localMicrophoneTrack={localMicrophoneTrack}
                      onClose={closeLeftPanel}
                      onSettingsChange={handleVideoSettingsChange}
                      isTeacher={isTeacher}
                    />
                  </div>
                )}

                {/* Features Panel */}
                {currentLeftPanel === 'features' && (
                  <div className="features-container">
                    <ClassroomFeatures
                      isTeacher={isTeacher}
                      onFeatureToggle={handleFeatureToggle}
                      participants={[
                        {
                          uid: configRef.current.uid,
                          name: userInfo?.name || 'You',
                          handRaised: false,
                          micEnabled,
                          videoEnabled: videoEnabled || isScreenSharing
                        },
                        ...remoteUsers.map(user => ({
                          uid: user.uid,
                          name: `User ${user.uid}`,
                          handRaised: false,
                          micEnabled: !!user.audioTrack,
                          videoEnabled: !!user.videoTrack
                        }))
                      ]}
                    />
                  </div>
                )}
              </div>
            </div>
          )}
        </aside>

        {/* Video Section */}
        <section className={`video-section ${leftSidebarOpen ? 'with-sidebar' : ''}`}>
          {/* View Controls */}
          <div className="view-controls">
            <button 
              className={`view-btn ${viewMode === 'gallery' ? 'active' : ''}`}
              onClick={() => setViewMode('gallery')}
              title="Gallery view (Grid)"
              disabled={isLeaving}
            >
              <span>⚏</span>
            </button>

            {(isScreenSharing || remoteUsers.length > 0) && (
              <button 
                className={`view-btn ${viewMode === 'focus' ? 'active' : ''}`}
                onClick={() => setViewMode('focus')}
                title="Focus view (Speaker)"
                disabled={isLeaving}
              >
                <span>🎯</span>
              </button>
            )}
          </div>

          {/* Video Grid */}
          <div className={`video-grid ${viewMode}`}>
            {viewMode === 'focus' && (focusedUser || isScreenSharing) ? (
              // Focus Layout
              <div className="focus-layout">
                <div className="main-video">
                  {isScreenSharing && screenTrack ? (
                    <div 
                      className="screen-share-video"
                      ref={(div) => {
                        if (div && screenTrack && mountedRef.current) {
                          try {
                            screenTrack.play(div);
                          } catch (error) {
                            console.warn('Screen track play error:', error);
                          }
                        }
                      }}
                    />
                  ) : focusedUser?.videoTrack ? (
                    <div 
                      className="focused-video"
                      ref={(div) => {
                        if (div && focusedUser.videoTrack && mountedRef.current) {
                          try {
                            focusedUser.videoTrack.play(div);
                          } catch (error) {
                            console.warn('Focused video play error:', error);
                          }
                        }
                      }}
                    />
                  ) : (
                    <div className="video-placeholder large">
                      <div className="avatar large">
                        {focusedUser?.name?.charAt(0)?.toUpperCase() || 'U'}
                      </div>
                      <span className="user-name large">{focusedUser?.name || 'Unknown User'}</span>
                    </div>
                  )}
                </div>

                <div className="thumbnail-strip">
                  {/* Local Thumbnail */}
                  <div 
                    className="video-thumbnail local" 
                    onClick={() => setFocusedUser(null)}
                    onDoubleClick={() => handleCreatePopup({ 
                      name: userInfo?.name || 'You', 
                      videoTrack: localCameraTrack,
                      uid: 'local'
                    }, 'local')}
                    title="Double-click to create floating window"
                  >
                    {localCameraTrack && videoEnabled ? (
                      <div 
                        className="thumbnail-video"
                        ref={(div) => {
                          if (div && localCameraTrack && mountedRef.current) {
                            try {
                              localCameraTrack.play(div);
                            } catch (error) {
                              console.warn('Local thumbnail play error:', error);
                            }
                          }
                        }}
                      />
                    ) : (
                      <div className="thumbnail-placeholder">
                        <div className="avatar small">
                          {userInfo?.name?.charAt(0)?.toUpperCase() || 'U'}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Remote Thumbnails */}
                  {remoteUsers.map(user => (
                    <div 
                      key={user.uid} 
                      className="video-thumbnail"
                      onClick={() => handleUserFocus(user)}
                      onDoubleClick={() => handleCreatePopup(user)}
                      title="Double-click to create floating window"
                    >
                      {user.videoTrack ? (
                        <div 
                          className="thumbnail-video"
                          ref={(div) => {
                            if (div && user.videoTrack && mountedRef.current) {
                              try {
                                user.videoTrack.play(div);
                              } catch (error) {
                                console.warn(`Remote thumbnail play error for ${user.uid}:`, error);
                              }
                            }
                          }}
                        />
                      ) : (
                        <div className="thumbnail-placeholder">
                          <div className="avatar small">
                            {user.uid.toString().charAt(0).toUpperCase()}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              // Gallery Layout
              <div className="gallery-grid">
                {/* Local Video */}
                <div 
                  className="video-tile local-tile" 
                  onClick={() => handleUserFocus({ 
                    name: userInfo?.name || 'You', 
                    videoTrack: localCameraTrack 
                  })}
                  onDoubleClick={() => handleCreatePopup({ 
                    name: userInfo?.name || 'You', 
                    videoTrack: localCameraTrack,
                    uid: 'local'
                  }, 'local')}
                  title="Double-click to create floating window"
                >
                  {isScreenSharing && screenTrack ? (
                    <div 
                      className="video-element screen-share"
                      ref={(div) => {
                        if (div && screenTrack && mountedRef.current) {
                          try {
                            screenTrack.play(div);
                          } catch (error) {
                            console.warn('Screen share video play error:', error);
                          }
                        }
                      }}
                    />
                  ) : localCameraTrack && videoEnabled ? (
                    <div 
                      className="video-element"
                      ref={(div) => {
                        if (div && localCameraTrack && mountedRef.current) {
                          try {
                            localCameraTrack.play(div);
                          } catch (error) {
                            console.warn('Local video play error:', error);
                          }
                        }
                      }}
                    />
                  ) : (
                    <div className="video-placeholder">
                      <div className="avatar">
                        {userInfo?.name?.charAt(0)?.toUpperCase() || 'U'}
                      </div>
                      <div className="user-name">{userInfo?.name || 'You'}</div>
                    </div>
                  )}

                  <div className="video-overlay">
                    <div className="user-info">
                      <span className="user-name">
                        {userInfo?.name || 'You'} (You)
                        {isScreenSharing && <span className="sharing-label"> - Sharing</span>}
                      </span>
                    </div>
                    <div className="video-controls">
                      <span className={`control ${micEnabled ? 'on' : 'off'}`}>
                        {micEnabled ? '🎤' : '🔇'}
                      </span>
                      <span className={`control ${(videoEnabled || isScreenSharing) ? 'on' : 'off'}`}>
                        {isScreenSharing ? '🖥️' : (videoEnabled ? '📹' : '📷')}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Remote Videos */}
                {remoteUsers.map(user => (
                  <div 
                    key={user.uid} 
                    className="video-tile remote-tile"
                    onClick={() => handleUserFocus(user)}
                    onDoubleClick={() => handleCreatePopup(user)}
                    title="Double-click to create floating window"
                  >
                    {user.videoTrack ? (
                      <div 
                        className="video-element"
                        ref={(div) => {
                          if (div && user.videoTrack && mountedRef.current) {
                            try {
                              user.videoTrack.play(div);
                            } catch (error) {
                              console.warn(`Remote video play error for ${user.uid}:`, error);
                            }
                          }
                        }}
                      />
                    ) : (
                      <div className="video-placeholder">
                        <div className="avatar">
                          {user.uid.toString().charAt(0).toUpperCase()}
                        </div>
                        <div className="user-name">User {user.uid}</div>
                      </div>
                    )}

                    <div className="video-overlay">
                      <div className="user-info">
                        <span className="user-name">User {user.uid}</span>
                      </div>
                      <div className="video-controls">
                        <span className={`control ${user.audioTrack ? 'on' : 'off'}`}>
                          {user.audioTrack ? '🎤' : '🔇'}
                        </span>
                        <span className={`control ${user.videoTrack ? 'on' : 'off'}`}>
                          {user.videoTrack ? '📹' : '📷'}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </main>

      {/* Draggable Popup Videos */}
      {popupVideos.map(popup => (
        <div 
          key={popup.id}
          id={popup.id}
          className={`floating-popup-video ${popup.position}`}
          onMouseDown={(e) => handleMouseDown(e, popup.id)}
        >
          <div className="popup-video-header">
            <span className="popup-video-title">
              {popup.user.name || (popup.type === 'local' ? 'You' : `User ${popup.user.uid}`)}
              {popup.type === 'local' && ' (You)'}
            </span>
            <div className="popup-video-controls">
              <button 
                className="popup-control-btn close"
                onClick={() => removePopupVideo(popup.id)}
                title="Close floating window"
              >
                ✕
              </button>
            </div>
          </div>

          {popup.type === 'local' ? (
            // Local popup video
            (localCameraTrack && videoEnabled) ? (
              <div 
                className="popup-video-element"
                ref={(div) => {
                  if (div && localCameraTrack && mountedRef.current) {
                    try {
                      localCameraTrack.play(div);
                    } catch (error) {
                      console.warn('Popup local video play error:', error);
                    }
                  }
                }}
              />
            ) : (
              <div className="popup-video-placeholder">
                <div className="popup-avatar">
                  {userInfo?.name?.charAt(0)?.toUpperCase() || 'U'}
                </div>
                <div className="popup-user-name">
                  {userInfo?.name || 'You'}
                </div>
              </div>
            )
          ) : (
            // Remote popup video
            popup.user.videoTrack ? (
              <div 
                className="popup-video-element"
                ref={(div) => {
                  if (div && popup.user.videoTrack && mountedRef.current) {
                    try {
                      popup.user.videoTrack.play(div);
                    } catch (error) {
                      console.warn(`Popup remote video play error for ${popup.user.uid}:`, error);
                    }
                  }
                }}
              />
            ) : (
              <div className="popup-video-placeholder">
                <div className="popup-avatar">
                  {popup.user.uid.toString().charAt(0).toUpperCase()}
                </div>
                <div className="popup-user-name">
                  User {popup.user.uid}
                </div>
              </div>
            )
          )}
        </div>
      ))}

      {/* Bottom Controls */}
      <footer className="meet-controls">
        <div className="controls-wrapper">
          {/* Left Controls */}
          <div className="controls-group left">
            <div className="meeting-info-control">
              <span className="meeting-code">
                ID: {classScheduleId?.slice(-6) || 'LIVE'}
              </span>
            </div>
          </div>

          {/* Center Controls */}
          <div className="controls-group center">
            <button 
              className={`control-btn ${micEnabled ? 'active' : 'muted'}`}
              onClick={handleMicToggle}
              disabled={isLeaving}
              title={micEnabled ? 'Turn off microphone (M)' : 'Turn on microphone (M)'}
            >
              <span className="btn-icon">{micEnabled ? '🎤' : '🔇'}</span>
            </button>

            <button 
              className={`control-btn ${videoEnabled ? 'active' : 'off'}`}
              onClick={handleVideoToggle}
              disabled={isLeaving || isScreenSharing}
              title={videoEnabled ? 'Turn off camera (V)' : 'Turn on camera (V)'}
            >
              <span className="btn-icon">{videoEnabled ? '📹' : '📷'}</span>
            </button>

            {isTeacher && (
              <>
                <button 
                  className={`control-btn ${isScreenSharing ? 'sharing' : ''}`}
                  onClick={toggleScreenShare}
                  disabled={isLeaving}
                  title={isScreenSharing ? 'Stop presenting' : 'Present now'}
                >
                  <span className="btn-icon">{isScreenSharing ? '🛑' : '🖥️'}</span>
                </button>

                <button 
                  className="control-btn"
                  onClick={toggleWhiteboard}
                  disabled={isLeaving}
                  title="Open whiteboard"
                >
                  <span className="btn-icon">📝</span>
                </button>
              </>
            )}

            <button 
              className="control-btn leave"
              onClick={handleLeave}
              disabled={isLeaving}
              title="Leave meeting"
            >
              <span className="btn-icon">{isLeaving ? '⏳' : '📞'}</span>
            </button>
          </div>

          {/* Right Controls */}
          <div className="controls-group right">
            <button 
              className={`sidebar-btn ${currentLeftPanel === 'chat' && leftSidebarOpen ? 'active' : ''}`}
              onClick={() => openLeftPanel('chat')}
              disabled={isLeaving}
              title="Toggle chat (C)"
            >
              <span className="btn-icon">💬</span>
              <span className="btn-label">Chat</span>
              {chatMessages.length > 0 && (
                <span className="message-count">{chatMessages.length}</span>
              )}
            </button>

            <button 
              className={`sidebar-btn ${currentLeftPanel === 'participants' && leftSidebarOpen ? 'active' : ''}`}
              onClick={() => openLeftPanel('participants')}
              disabled={isLeaving}
              title="View participants (P)"
            >
              <span className="btn-icon">👥</span>
              <span className="btn-label">People ({remoteUsers.length + 1})</span>
            </button>

            <button 
              className={`sidebar-btn ${currentLeftPanel === 'settings' && leftSidebarOpen ? 'active' : ''}`}
              onClick={() => openLeftPanel('settings')}
              disabled={isLeaving}
              title="Settings"
            >
              <span className="btn-icon">⚙️</span>
              <span className="btn-label">Settings</span>
            </button>

            {isTeacher && (
              <button 
                className={`sidebar-btn ${currentLeftPanel === 'features' && leftSidebarOpen ? 'active' : ''}`}
                onClick={() => openLeftPanel('features')}
                disabled={isLeaving}
                title="More features"
              >
                <span className="btn-icon">⚡</span>
                <span className="btn-label">More</span>
              </button>
            )}
          </div>
        </div>
      </footer>

      {/* Leave Confirmation Modal */}
      {showLeaveConfirm && (
        <div className="leave-confirmation-overlay">
          <div className="leave-confirmation-modal">
            <div className="modal-header">
              <h3>Leave meeting?</h3>
            </div>

            <div className="modal-body">
              <p>You're about to leave this meeting. Your camera and microphone will be turned off.</p>
              <div className="cleanup-info">
                <div className="cleanup-item">
                  <span className="cleanup-icon">📹</span>
                  <span>Camera will be stopped</span>
                </div>
                <div className="cleanup-item">
                  <span className="cleanup-icon">🎤</span>
                  <span>Microphone will be turned off</span>
                </div>
                {isScreenSharing && (
                  <div className="cleanup-item">
                    <span className="cleanup-icon">🖥️</span>
                    <span>Screen sharing will end</span>
                  </div>
                )}
                {popupVideos.length > 0 && (
                  <div className="cleanup-item">
                    <span className="cleanup-icon">🪟</span>
                    <span>Floating windows will be closed</span>
                  </div>
                )}
                <div className="cleanup-item">
                  <span className="cleanup-icon">🔌</span>
                  <span>Connection will be closed</span>
                </div>
              </div>
            </div>

            <div className="modal-actions">
              <button 
                className="cancel-btn" 
                onClick={cancelLeave}
                disabled={isLeaving}
              >
                Stay in meeting
              </button>
              <button 
                className="confirm-leave-btn" 
                onClick={confirmLeave}
                disabled={isLeaving}
              >
                {isLeaving ? (
                  <>
                    <span className="leaving-spinner"></span>
                    Leaving...
                  </>
                ) : (
                  'Leave meeting'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Leaving Overlay */}
      {isLeaving && (
        <div className="leaving-overlay">
          <div className="leaving-content">
            <div className="leaving-spinner-large"></div>
            <h3>Leaving meeting...</h3>
            <p>Cleaning up camera and microphone</p>
            <div className="leaving-steps">
              <div className="step completed">✅ Stopping camera</div>
              <div className="step completed">✅ Turning off microphone</div>
              {isScreenSharing && <div className="step completed">✅ Ending screen share</div>}
              {popupVideos.length > 0 && <div className="step completed">✅ Closing floating windows</div>}
              <div className="step active">⏳ Disconnecting...</div>
            </div>
          </div>
        </div>
      )}

      {/* Notifications */}
      <div className="notifications-toast">
        {notifications.map(notif => (
          <div key={notif.id} className={`toast ${notif.type}`}>
            <div className="toast-content">
              <span className="toast-icon">
                {notif.type === 'success' && '✅'}
                {notif.type === 'error' && '❌'}
                {notif.type === 'info' && 'ℹ️'}
              </span>
              <span className="toast-message">{notif.message}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Connection Status Indicator */}
      {connectionState === 'reconnecting' && (
        <div className="connection-status-indicator">
          <div className="status-content">
            <div className="status-spinner"></div>
            <span>Reconnecting to classroom...</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default LiveClassroom;
