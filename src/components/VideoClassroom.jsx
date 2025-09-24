// LiveClassroom.jsx - OPTIMIZED WITH MEMORY LEAK FIXES AND DIRECT AGORA SCREEN SHARING
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  AgoraRTCProvider,
  useRTCClient,
  useLocalCameraTrack,
  useLocalMicrophoneTrack,
  useLocalScreenTrack,
  useRemoteUsers,
  useRemoteAudioTracks,
  useRemoteVideoTracks,
  usePublish,
  useJoin,
  LocalUser,
  RemoteUser
} from 'agora-rtc-react';
import AgoraRTC from 'agora-rtc-sdk-ng';
import VirtualBackgroundExtension from "agora-extension-virtual-background";
import {
  Mic, MicOff, Video, VideoOff, ScreenShare, PhoneOff,
  MessageCircle, Users, Clock, Hand, 
  Send, X, Crown, BookOpen, GraduationCap,
  AlertTriangle, Loader2, Palette, Monitor,
  Maximize2, Settings, Square, Circle, Minus, 
  RotateCcw, Save, Trash2, Pen, Eraser, MoreHorizontal,
  Image, Camera, Volume2, VolumeX
} from 'lucide-react';

// =================== ERROR BOUNDARY ===================
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('❌ LiveClassroom Error:', error, errorInfo);
    this.setState({ error: error });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="h-screen flex items-center justify-center bg-gray-900 text-white">
          <div className="text-center bg-gray-800 rounded-xl p-8 max-w-lg mx-4 shadow-2xl">
            <AlertTriangle size={64} className="text-red-400 mb-4 mx-auto" />
            <h2 className="text-xl font-bold mb-4">Classroom Error</h2>
            <p className="text-gray-300 mb-6">We encountered an issue. Please reload the page.</p>
            <button 
              onClick={() => window.location.reload()} 
              className="w-full px-6 py-3 bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Reload Classroom
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

// =================== CONSTANTS ===================
const CONSTANTS = {
  ROLES: {
    TEACHER: 'teacher',
    STUDENT: 'student'
  },
  PERMISSIONS: {
    teacher: {
      canMuteOthers: true,
      canKickParticipants: true,
      canRecord: true,
      canScreenShare: true,
      canUseWhiteboard: true,
      canPromoteToHost: true,
      canManageChat: true
    },
    student: {
      canMuteOthers: false,
      canKickParticipants: false,
      canRecord: false,
      canScreenShare: false,
      canUseWhiteboard: false,
      canPromoteToHost: false,
      canManageChat: false
    }
  }
};

// =================== VIRTUAL BACKGROUND MANAGER ===================
class VirtualBackgroundManager {
  constructor() {
    this.extension = null;
    this.processor = null;
    this.isSupported = false;
    this.isInitialized = false;
  }

  async initialize() {
    if (this.isInitialized) return true;
    try {
      this.extension = new VirtualBackgroundExtension();
      this.isSupported = this.extension.checkCompatibility();
      if (!this.isSupported) {
        console.warn('🎭 Virtual background not supported');
        return false;
      }
      AgoraRTC.registerExtensions([this.extension]);
      this.isInitialized = true;
      console.log('✅ Virtual background initialized');
      return true;
    } catch (error) {
      console.error('Virtual background init error:', error);
      return false;
    }
  }

  async createProcessor() {
    if (!this.isInitialized || !this.extension) return null;
    try {
      if (this.processor) return this.processor;
      this.processor = this.extension.createProcessor();
      await this.processor.init();
      this.processor.onoverload = () => this.disable();
      return this.processor;
    } catch (error) {
      console.error('Processor creation error:', error);
      return null;
    }
  }

  async setBackground(type, options = {}) {
    if (!this.processor) {
      await this.createProcessor();
    }
    if (!this.processor) return false;

    try {
      switch (type) {
        case 'blur':
          await this.processor.setOptions({ type: 'blur', blurDegree: options.blurDegree || 2 });
          break;
        case 'image':
          if (options.imageElement) {
            await this.processor.setOptions({ type: 'img', source: options.imageElement });
          }
          break;
        case 'color':
          await this.processor.setOptions({ type: 'color', color: options.color || '#00ff00' });
          break;
        case 'none':
          await this.processor.setOptions({ type: 'none' });
          break;
        default:
          return false;
      }
      await this.processor.enable();
      return true;
    } catch (error) {
      console.error('Set background error:', error);
      return false;
    }
  }

  async disable() {
    if (this.processor) {
      try {
        await this.processor.disable();
        return true;
      } catch (error) {
        console.error('Disable error:', error);
        return false;
      }
    }
    return false;
  }

  release() {
    if (this.processor) {
      try {
        this.processor.release();
        this.processor = null;
      } catch (error) {
        console.error('Release error:', error);
      }
    }
  }
}

// =================== HELPER FUNCTIONS ===================
const getUserInfo = () => {
  try {
    const userInfo = localStorage.getItem('teacherUser');
    if (!userInfo) return null;
    const parsedInfo = JSON.parse(userInfo);
    if (parsedInfo) {
      parsedInfo.role = parsedInfo.role || 'student';
      parsedInfo.permissions = CONSTANTS.PERMISSIONS[parsedInfo.role] || CONSTANTS.PERMISSIONS.student;
    }
    return parsedInfo;
  } catch (error) {
    console.error('getUserInfo error:', error);
    return null;
  }
};

const generateValidUID = (userId) => {
  if (typeof userId === 'number' && userId >= 0 && userId <= Math.pow(2, 32) - 1) {
    return userId;
  }
  if (typeof userId === 'string') {
    let hash = 0;
    for (let i = 0; i < userId.length; i++) {
      const char = userId.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash) % (Math.pow(2, 32) - 1);
  }
  return Math.floor(Math.random() * (Math.pow(2, 32) - 1));
};

// =================== OPTIMIZED CREDENTIALS HOOK ===================
const useAgoraCredentials = (classScheduleId) => {
  const [credentials, setCredentials] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const fetchedRef = useRef(false);

  useEffect(() => {
    if (fetchedRef.current || !classScheduleId) {
      if (!classScheduleId) {
        setError('Missing class ID');
        setLoading(false);
      }
      return;
    }

    const userInfo = getUserInfo();
    if (!userInfo) {
      setError('Please login again');
      setLoading(false);
      return;
    }

    fetchedRef.current = true;

    const fetchCredentials = async () => {
      try {
        const token = localStorage.getItem('teacherToken');
        if (!token) throw new Error('Authentication required');

        const response = await fetch('/api/live/credentials', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({ 
            classScheduleId, 
            userId: userInfo._id,
            role: userInfo.role || 'student'
          })
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || `Failed to get credentials`);
        }

        const data = await response.json();
        const validCredentials = {
          ...data.data,
          uid: generateValidUID(data.data.uid || userInfo._id)
        };

        setCredentials(validCredentials);
        setError(null);
      } catch (err) {
        console.error('Credentials error:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchCredentials();
  }, [classScheduleId]);

  return { credentials, loading, error };
};

// =================== UI COMPONENTS ===================
const ClassroomHeader = ({ userRole, participantCount, duration, onOpenWhiteboard, isScreenSharing, screenSharingUser }) => {
  const isTeacher = userRole === CONSTANTS.ROLES.TEACHER;

  return (
    <div className="bg-gradient-to-r from-gray-900 to-gray-800 text-white px-6 py-3 flex items-center justify-between shadow-lg z-40">
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
            <GraduationCap size={24} className="text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-blue-400">Oratrics</h1>
            <p className="text-xs text-gray-400 -mt-1">Live Classroom</p>
          </div>
        </div>
        {isScreenSharing && (
          <div className="flex items-center space-x-2 bg-blue-600 px-3 py-1 rounded-full animate-pulse">
            <Monitor size={14} />
            <span className="text-sm">{screenSharingUser} is presenting</span>
          </div>
        )}
      </div>

      <div className="flex items-center space-x-6">
        {isTeacher && (
          <button
            onClick={onOpenWhiteboard}
            className="flex items-center space-x-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg text-sm transition-all"
          >
            <Palette size={14} />
            <span>Whiteboard</span>
          </button>
        )}

        <div className="flex items-center space-x-4 text-sm">
          <div className="flex items-center space-x-1 bg-gray-800 px-3 py-1 rounded-full">
            <Clock size={14} className="text-green-400" />
            <span className="font-mono">{duration}</span>
          </div>
          <div className="flex items-center space-x-1 bg-gray-800 px-3 py-1 rounded-full">
            <Users size={14} className="text-blue-400" />
            <span>{participantCount}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

const VideoControls = ({ 
  userRole, permissions, isAudioEnabled, isVideoEnabled, isScreenSharing, virtualBgEnabled, handRaised,
  onToggleAudio, onToggleVideo, onToggleScreenShare, onToggleVirtualBg, onToggleHand, onLeaveCall, 
  onOpenChat, onOpenParticipants
}) => {
  const isTeacher = userRole === CONSTANTS.ROLES.TEACHER;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-gradient-to-t from-gray-900 to-gray-800 px-6 py-4 z-50 border-t border-gray-700">
      <div className="flex items-center justify-between max-w-6xl mx-auto">
        <div className="text-white text-sm">
          <div className="font-medium">Oratrics Classroom</div>
          <div className="text-gray-400 text-xs">Secure • Encrypted</div>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={onToggleAudio}
            className={`p-3 rounded-full transition-all ${
              isAudioEnabled ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-red-500 hover:bg-red-600 text-white animate-pulse'
            }`}
          >
            {isAudioEnabled ? <Mic size={20} /> : <MicOff size={20} />}
          </button>

          <button
            onClick={onToggleVideo}
            className={`p-3 rounded-full transition-all ${
              isVideoEnabled ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-red-500 hover:bg-red-600 text-white animate-pulse'
            }`}
          >
            {isVideoEnabled ? <Video size={20} /> : <VideoOff size={20} />}
          </button>

          {permissions.canScreenShare && (
            <button
              onClick={onToggleScreenShare}
              className={`p-3 rounded-full transition-all ${
                isScreenSharing ? 'bg-blue-500 hover:bg-blue-600 text-white animate-pulse' : 'bg-gray-700 hover:bg-gray-600 text-white'
              }`}
            >
              <ScreenShare size={20} />
            </button>
          )}

          <button
            onClick={onToggleVirtualBg}
            className={`p-3 rounded-full transition-all ${
              virtualBgEnabled ? 'bg-purple-500 hover:bg-purple-600 text-white' : 'bg-gray-700 hover:bg-gray-600 text-white'
            }`}
          >
            <Camera size={20} />
          </button>

          {!isTeacher && (
            <button
              onClick={onToggleHand}
              className={`p-3 rounded-full transition-all ${
                handRaised ? 'bg-yellow-500 hover:bg-yellow-600 text-white animate-bounce' : 'bg-gray-700 hover:bg-gray-600 text-white'
              }`}
            >
              <Hand size={20} />
            </button>
          )}

          <button
            onClick={onLeaveCall}
            className="p-3 rounded-full bg-red-500 hover:bg-red-600 text-white transition-all"
          >
            <PhoneOff size={20} />
          </button>
        </div>

        <div className="flex items-center space-x-3">
          <button onClick={onOpenChat} className="p-2 rounded-full bg-gray-700 hover:bg-gray-600 text-white">
            <MessageCircle size={18} />
          </button>
          <button onClick={onOpenParticipants} className="p-2 rounded-full bg-gray-700 hover:bg-gray-600 text-white">
            <Users size={18} />
          </button>
        </div>
      </div>
    </div>
  );
};

// =================== OPTIMIZED VIDEO PARTICIPANT COMPONENT ===================
const VideoParticipant = ({ 
  user, audioTrack, videoTrack, screenTrack, isLocal = false, isScreenShare = false,
  micOn = true, cameraOn = true, handRaised = false, className = ""
}) => {
  const displayName = user?.name || user?.username || `User ${user?.uid || 'Unknown'}`;
  const participantRole = user?.role || 'student';
  const isTeacher = participantRole === CONSTANTS.ROLES.TEACHER;

  const avatarUrl = useMemo(() => {
    const bgColor = isTeacher ? '3b82f6' : '10b981';
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=${bgColor}&color=fff&size=256&font-size=0.4&rounded=true&bold=true`;
  }, [displayName, isTeacher]);

  const [audioLevel, setAudioLevel] = useState(0);
  const animationFrameRef = useRef(null);

  // Optimized audio level monitoring with cleanup
  useEffect(() => {
    if (audioTrack && micOn) {
      const updateAudioLevel = () => {
        try {
          const volume = audioTrack.getVolumeLevel ? audioTrack.getVolumeLevel() : 0;
          setAudioLevel(volume * 100);
          animationFrameRef.current = requestAnimationFrame(updateAudioLevel);
        } catch (error) {
          // Ignore errors
        }
      };
      updateAudioLevel();
    } else {
      setAudioLevel(0);
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
    };
  }, [audioTrack, micOn]);

  return (
    <div className={`relative bg-gray-900 rounded-xl overflow-hidden shadow-2xl ${className}`}>
      <div className="w-full h-full relative">
        {isLocal ? (
          <LocalUser
            audioTrack={audioTrack}
            videoTrack={isScreenShare ? screenTrack : videoTrack}
            cameraOn={isScreenShare ? Boolean(screenTrack) : cameraOn}
            micOn={micOn}
            playAudio={false}
            playVideo={true}
            className="w-full h-full"
            cover={!isScreenShare && !cameraOn ? avatarUrl : undefined}
            style={{ objectFit: isScreenShare ? 'contain' : 'cover' }}
          />
        ) : (
          <RemoteUser 
            user={user}
            className="w-full h-full"
            cover={!cameraOn && !isScreenShare ? avatarUrl : undefined}
            playAudio={true}
            playVideo={true}
            style={{ objectFit: isScreenShare ? 'contain' : 'cover' }}
          />
        )}
      </div>

      {isScreenShare && (
        <div className="absolute top-4 left-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center space-x-2 shadow-lg animate-pulse">
          <Monitor size={16} />
          <span>{isLocal ? 'You are presenting' : 'Presenting'}</span>
        </div>
      )}

      {micOn && audioLevel > 10 && (
        <div className="absolute top-4 right-4 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center animate-pulse shadow-lg">
          <Volume2 size={16} className="text-white" />
        </div>
      )}

      {!isScreenShare && (
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/70 to-transparent p-4">
          <div className="flex items-center justify-between text-white">
            <div className="flex-1 min-w-0 flex items-center space-x-2">
              <div className={`w-3 h-3 rounded-full ${isTeacher ? 'bg-blue-400' : 'bg-green-400'}`}></div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">
                  {displayName}
                  {isLocal && ' (you)'}
                </p>
                <div className="flex items-center space-x-2 mt-1">
                  {handRaised && (
                    <div className="flex items-center space-x-1">
                      <Hand size={12} className="text-yellow-400 animate-bounce" />
                      <span className="text-xs text-yellow-400 font-medium">Hand raised</span>
                    </div>
                  )}
                  {isTeacher && (
                    <div className="flex items-center space-x-1">
                      <Crown size={12} className="text-blue-400" />
                      <span className="text-xs text-blue-400">Teacher</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              {!micOn && (
                <div className="p-1.5 rounded-full bg-red-500 shadow-lg">
                  <MicOff size={12} />
                </div>
              )}
              {!cameraOn && (
                <div className="p-1.5 rounded-full bg-red-500 shadow-lg">
                  <VideoOff size={12} />
                </div>
              )}
              {micOn && audioLevel > 10 && (
                <div className="p-1.5 rounded-full bg-green-500 animate-pulse shadow-lg">
                  <Volume2 size={12} />
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="absolute top-4 left-4 w-2 h-2 bg-green-400 rounded-full shadow-lg animate-pulse"></div>
    </div>
  );
};

// =================== VIRTUAL BACKGROUND PANEL ===================
const VirtualBackgroundPanel = ({ isOpen, onClose, onBackgroundChange }) => {
  const [selectedBg, setSelectedBg] = useState('none');
  const [customImage, setCustomImage] = useState(null);
  const fileInputRef = useRef(null);

  const backgroundOptions = [
    { id: 'none', name: 'None', icon: X },
    { id: 'blur', name: 'Blur', icon: Image },
    { id: 'color', name: 'Green', color: '#00ff00' },
    { id: 'image', name: 'Custom', icon: Image },
  ];

  const handleBackgroundSelect = async (bgType) => {
    setSelectedBg(bgType);
    switch (bgType) {
      case 'none':
        onBackgroundChange('none');
        break;
      case 'blur':
        onBackgroundChange('blur', { blurDegree: 2 });
        break;
      case 'color':
        onBackgroundChange('color', { color: '#00ff00' });
        break;
      case 'image':
        if (customImage) {
          onBackgroundChange('image', { imageElement: customImage });
        } else {
          fileInputRef.current?.click();
        }
        break;
    }
  };

  const handleImageUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      const img = new Image();
      img.onload = () => {
        setCustomImage(img);
        onBackgroundChange('image', { imageElement: img });
      };
      img.crossOrigin = 'anonymous';
      img.src = URL.createObjectURL(file);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="absolute top-16 right-4 bg-white rounded-lg shadow-xl border p-4 z-50 w-80">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-800">Virtual Background</h3>
        <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
          <X size={16} />
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {backgroundOptions.map((option) => {
          const Icon = option.icon;
          return (
            <button
              key={option.id}
              onClick={() => handleBackgroundSelect(option.id)}
              className={`p-4 rounded-lg border-2 transition-all ${
                selectedBg === option.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              {option.color ? (
                <div className="w-8 h-8 rounded mx-auto mb-2" style={{ backgroundColor: option.color }} />
              ) : (
                Icon && <Icon size={24} className="mx-auto mb-2" />
              )}
              <div className="text-sm font-medium">{option.name}</div>
            </button>
          );
        })}
      </div>

      <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
    </div>
  );
};

// =================== WHITEBOARD COMPONENT ===================
const Whiteboard = ({ isVisible, onClose, isTeacher }) => {
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [tool, setTool] = useState('pen');
  const [color, setColor] = useState('#000000');
  const [size, setSize] = useState(4);
  const [canvasHistory, setCanvasHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  const colors = ['#000000', '#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF'];
  const sizes = [2, 4, 6, 8, 12, 16];

  useEffect(() => {
    if (isVisible && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      canvas.width = 1200;
      canvas.height = 800;
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      saveToHistory();
    }
  }, [isVisible]);

  const saveToHistory = () => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const imageData = canvas.toDataURL();
    const newHistory = canvasHistory.slice(0, historyIndex + 1);
    newHistory.push(imageData);
    if (newHistory.length > 20) newHistory.shift();
    setCanvasHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  };

  const undo = () => {
    if (historyIndex > 0) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      const img = new Image();
      img.onload = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);
      };
      setHistoryIndex(historyIndex - 1);
      img.src = canvasHistory[historyIndex - 1];
    }
  };

  const clearCanvas = () => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    saveToHistory();
  };

  const getMousePos = useCallback((e) => {
    if (!canvasRef.current) return { x: 0, y: 0 };
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY
    };
  }, []);

  const startDrawing = useCallback((e) => {
    if (!canvasRef.current || !isTeacher) return;
    setIsDrawing(true);
    const pos = getMousePos(e);
    const ctx = canvasRef.current.getContext('2d');
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.lineWidth = size;
    ctx.strokeStyle = tool === 'eraser' ? '#FFFFFF' : color;
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
  }, [getMousePos, isTeacher, size, tool, color]);

  const draw = useCallback((e) => {
    if (!isDrawing || !canvasRef.current) return;
    const pos = getMousePos(e);
    const ctx = canvasRef.current.getContext('2d');
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
  }, [isDrawing, getMousePos]);

  const stopDrawing = useCallback(() => {
    if (isDrawing) {
      setIsDrawing(false);
      saveToHistory();
    }
  }, [isDrawing]);

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex flex-col">
      <div className="bg-white p-4 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <h3 className="text-lg font-bold">Oratrics Whiteboard</h3>
          {isTeacher && (
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600">Teacher Mode</span>
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            </div>
          )}
        </div>
        <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full">
          <X size={20} />
        </button>
      </div>

      {isTeacher && (
        <div className="bg-gray-50 p-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex space-x-2">
              <button onClick={() => setTool('pen')} className={`p-2 rounded ${tool === 'pen' ? 'bg-blue-500 text-white' : 'bg-white hover:bg-gray-100'}`}>
                <Pen size={16} />
              </button>
              <button onClick={() => setTool('eraser')} className={`p-2 rounded ${tool === 'eraser' ? 'bg-blue-500 text-white' : 'bg-white hover:bg-gray-100'}`}>
                <Eraser size={16} />
              </button>
            </div>
            <div className="flex space-x-1">
              {colors.map((c) => (
                <button key={c} onClick={() => setColor(c)} className={`w-8 h-8 rounded-full border-2 hover:scale-110 transition-transform ${color === c ? 'border-gray-800 ring-2 ring-blue-300' : 'border-gray-300'}`} style={{ backgroundColor: c }} />
              ))}
            </div>
            <select value={size} onChange={(e) => setSize(Number(e.target.value))} className="px-3 py-1 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500">
              {sizes.map((s) => (<option key={s} value={s}>{s}px</option>))}
            </select>
          </div>
          <div className="flex items-center space-x-2">
            <button onClick={undo} disabled={historyIndex <= 0} className="p-2 bg-white rounded hover:bg-gray-100 disabled:opacity-50">
              <RotateCcw size={16} />
            </button>
            <button onClick={clearCanvas} className="p-2 bg-red-500 text-white rounded hover:bg-red-600">
              <Trash2 size={16} />
            </button>
          </div>
        </div>
      )}

      <div className="flex-1 bg-gray-100 flex items-center justify-center p-4">
        <canvas ref={canvasRef} className="bg-white border shadow-lg max-w-full max-h-full cursor-crosshair" style={{ width: '90%', height: '80%' }} onMouseDown={startDrawing} onMouseMove={draw} onMouseUp={stopDrawing} onMouseLeave={stopDrawing} />
      </div>
    </div>
  );
};

// =================== CHAT PANEL COMPONENT ===================
const ChatPanel = ({ isOpen, onClose, messages, onSendMessage, currentUser, userRole }) => {
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = (e) => {
    e.preventDefault();
    if (newMessage.trim() && currentUser) {
      onSendMessage({
        id: Date.now(),
        user: currentUser.name || currentUser.username || 'You',
        message: newMessage.trim(),
        timestamp: new Date().toLocaleTimeString(),
        isOwn: true,
        role: userRole
      });
      setNewMessage('');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed right-0 top-0 bottom-0 w-80 bg-white border-l shadow-2xl z-40 flex flex-col">
      <div className="p-4 border-b bg-gradient-to-r from-blue-50 to-purple-50">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-gray-800">In-call messages</h3>
            <p className="text-xs text-gray-500">{messages.length} messages</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full">
            <X size={16} />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
        {messages.length === 0 ? (
          <div className="text-center text-gray-500 mt-8">
            <MessageCircle size={48} className="mx-auto mb-4 opacity-50" />
            <p>No messages yet</p>
            <p className="text-sm">Start the conversation!</p>
          </div>
        ) : (
          messages.map((msg) => (
            <div key={msg.id} className={msg.isOwn ? 'text-right' : 'text-left'}>
              <div className={`inline-block px-4 py-2 rounded-lg max-w-xs shadow-md ${
                msg.isOwn ? 'bg-blue-500 text-white rounded-br-none' : 'bg-white text-gray-800 rounded-bl-none border'
              }`}>
                {!msg.isOwn && (
                  <div className="flex items-center space-x-1 mb-1">
                    <p className="text-xs font-medium opacity-75">{msg.user}</p>
                    {msg.role === 'teacher' && <Crown size={10} className="text-blue-500" />}
                  </div>
                )}
                <p className="text-sm">{msg.message}</p>
                <p className={`text-xs mt-1 opacity-75 ${msg.isOwn ? 'text-blue-100' : 'text-gray-500'}`}>
                  {msg.timestamp}
                </p>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSend} className="p-4 border-t bg-white">
        <div className="flex space-x-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Send a message to everyone"
            className="flex-1 px-4 py-2 border rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500"
            maxLength={500}
          />
          <button
            type="submit"
            disabled={!newMessage.trim()}
            className="px-4 py-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 disabled:opacity-50 transition-colors"
          >
            <Send size={16} />
          </button>
        </div>
      </form>
    </div>
  );
};

// =================== PARTICIPANTS PANEL COMPONENT ===================
const ParticipantsPanel = ({ isOpen, onClose, participants, currentUser, userRole, onRemoveUser }) => {
  const isTeacher = userRole === CONSTANTS.ROLES.TEACHER;

  if (!isOpen) return null;

  return (
    <div className="fixed right-0 top-0 bottom-0 w-80 bg-white border-l shadow-2xl z-40 flex flex-col">
      <div className="p-4 border-b bg-gradient-to-r from-blue-50 to-purple-50">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-gray-800">People</h3>
            <p className="text-xs text-gray-500">{participants.length} in call</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full">
            <X size={16} />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
        {participants.map((participant) => {
          const isCurrentUser = participant.uid === currentUser?._id || participant.uid === generateValidUID(currentUser?._id);
          const displayName = participant.name || participant.username || `User ${participant.uid}`;
          const participantIsTeacher = participant.role === 'teacher';

          return (
            <div key={participant.uid} className="flex items-center space-x-3 p-3 bg-white rounded-lg shadow-sm border">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-medium relative ${
                participantIsTeacher ? 'bg-gradient-to-br from-blue-500 to-purple-600' : 'bg-gradient-to-br from-green-500 to-teal-600'
              }`}>
                {displayName.charAt(0).toUpperCase()}
                {participantIsTeacher && <Crown size={12} className="absolute -top-1 -right-1 text-yellow-400" />}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2">
                  <p className="text-sm font-medium truncate">
                    {displayName}
                    {isCurrentUser && ' (you)'}
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <p className="text-xs text-gray-500">
                    {participantIsTeacher ? 'Teacher' : 'Student'}
                  </p>
                  {participant.handRaised && (
                    <div className="flex items-center space-x-1 text-yellow-500">
                      <Hand size={12} />
                      <span className="text-xs">Hand raised</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <div className="flex items-center space-x-1">
                  {!participant.micOn && (
                    <div className="p-1 rounded-full bg-red-100">
                      <MicOff size={12} className="text-red-500" />
                    </div>
                  )}
                  {!participant.cameraOn && (
                    <div className="p-1 rounded-full bg-red-100">
                      <VideoOff size={12} className="text-red-500" />
                    </div>
                  )}
                  {participant.micOn && (
                    <div className="p-1 rounded-full bg-green-100">
                      <Mic size={12} className="text-green-500" />
                    </div>
                  )}
                </div>

                {isTeacher && !isCurrentUser && (
                  <button
                    onClick={() => onRemoveUser?.(participant)}
                    className="p-1 rounded-full bg-red-100 hover:bg-red-200 text-red-600 transition-colors"
                    title="Remove participant"
                  >
                    <X size={12} />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// =================== OPTIMIZED CLIENT COMPONENT ===================
const ClassroomContent = ({ credentials }) => {
  const userInfo = useMemo(() => getUserInfo(), []);
  const navigate = useNavigate();

  // Core state management
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isWhiteboardOpen, setIsWhiteboardOpen] = useState(false);
  const [handRaised, setHandRaised] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isParticipantsOpen, setIsParticipantsOpen] = useState(false);
  const [isVirtualBgPanelOpen, setIsVirtualBgPanelOpen] = useState(false);
  const [virtualBgEnabled, setVirtualBgEnabled] = useState(false);
  const [duration, setDuration] = useState('0:00');
  const [connectionState, setConnectionState] = useState('disconnected');
  const [chatMessages, setChatMessages] = useState([]);

  // Virtual background management
  const virtualBgManager = useRef(new VirtualBackgroundManager());
  const [isVirtualBgSupported, setIsVirtualBgSupported] = useState(false);

  const userRole = useMemo(() => userInfo?.role || CONSTANTS.ROLES.STUDENT, [userInfo]);
  const permissions = useMemo(() => 
    userInfo?.permissions || CONSTANTS.PERMISSIONS[userRole] || CONSTANTS.PERMISSIONS.student,
    [userInfo, userRole]
  );

  // Join parameters with proper error handling
  const joinParams = useMemo(() => {
    if (!credentials || !userInfo) {
      console.warn('Missing credentials or user info');
      return null;
    }

    const params = {
      appid: credentials.agoraAppId,
      channel: credentials.channelName,
      token: credentials.token,
      uid: credentials.uid
    };

    console.log('📡 Join Parameters:', { ...params, token: params.token ? '[REDACTED]' : 'MISSING' });
    return params;
  }, [credentials, userInfo]);

  // Initialize virtual background
  useEffect(() => {
    const initVirtualBg = async () => {
      try {
        const supported = await virtualBgManager.current.initialize();
        setIsVirtualBgSupported(supported);
      } catch (error) {
        console.error('Virtual background init error:', error);
        setIsVirtualBgSupported(false);
      }
    };

    initVirtualBg();

    return () => {
      try {
        virtualBgManager.current.release();
      } catch (error) {
        console.error('Virtual background cleanup error:', error);
      }
    };
  }, []);

  // Agora hooks with optimized configuration
  const client = useRTCClient();

  const { localMicrophoneTrack } = useLocalMicrophoneTrack(isAudioEnabled, {
    AEC: true, AGC: true, ANS: true
  });

  const { localCameraTrack } = useLocalCameraTrack(isVideoEnabled, {
    optimizationMode: "detail",
    encoderConfig: { width: 1280, height: 720, frameRate: 30, bitrateMin: 600, bitrateMax: 1000 }
  });

  // DIRECT SCREEN SHARING WITHOUT BACKEND API - ZERO SERVER LOAD
  const { screenTrack, error: screenError } = useLocalScreenTrack(isScreenSharing, {
    encoderConfig: "1080p_1", 
    optimizeForDetail: true
  }, "disable");

  const remoteUsers = useRemoteUsers();
  const { audioTracks: remoteAudioTracks } = useRemoteAudioTracks(remoteUsers);
  const { videoTracks: remoteVideoTracks } = useRemoteVideoTracks(remoteUsers);

  // Optimized join with cleanup
  const joinResult = useJoin(joinParams, joinParams !== null);

  // Enhanced track publishing with screen share detection
  const tracksToPublish = useMemo(() => {
    const tracks = [];

    if (localMicrophoneTrack) {
      tracks.push(localMicrophoneTrack);
    }

    if (isScreenSharing && screenTrack) {
      tracks.push(screenTrack);
      console.log('📺 Publishing screen track (direct Agora - no server load)');
    } else if (localCameraTrack && !isScreenSharing) {
      // Apply virtual background if enabled
      if (virtualBgEnabled && virtualBgManager.current.processor) {
        try {
          localCameraTrack.pipe(virtualBgManager.current.processor).pipe(localCameraTrack.processorDestination);
        } catch (error) {
          console.error('Virtual background pipe error:', error);
        }
      }
      tracks.push(localCameraTrack);
      console.log('📹 Publishing camera track');
    }

    return tracks;
  }, [localMicrophoneTrack, localCameraTrack, screenTrack, isScreenSharing, virtualBgEnabled]);

  usePublish(tracksToPublish);

  // Handle screen sharing errors with better UX
  useEffect(() => {
    if (screenError) {
      console.error('🚨 Screen sharing error:', screenError);
      setIsScreenSharing(false);

      if (screenError.code === 'PERMISSION_DENIED') {
        alert('Screen sharing permission denied. Please allow screen sharing in your browser settings.');
      } else if (screenError.code === 'NOT_SUPPORTED') {
        alert('Screen sharing is not supported on this browser. Please use Chrome, Firefox, or Edge.');
      } else {
        console.warn('Screen sharing error:', screenError.message);
      }
    }
  }, [screenError]);

  // Optimized remote audio handling with proper cleanup
  useEffect(() => {
    const handleRemoteAudio = async () => {
      for (const track of remoteAudioTracks) {
        try {
          track.setVolume(100);
          await track.play();
        } catch (err) {
          console.warn('Audio play failed:', err);
        }
      }
    };

    handleRemoteAudio();

    return () => {
      remoteAudioTracks.forEach(track => {
        try {
          track.stop();
        } catch (error) {
          console.warn('Audio stop error:', error);
        }
      });
    };
  }, [remoteAudioTracks]);

  // Enhanced client event handling with memory leak prevention
  useEffect(() => {
    if (!client) return;

    const handleUserJoined = (user) => {
      console.log('👋 User joined:', user.uid);
      setChatMessages(prev => [...prev, {
        id: Date.now() + Math.random(),
        user: 'System',
        message: `User ${user.uid} joined the classroom`,
        timestamp: new Date().toLocaleTimeString(),
        isOwn: false,
        role: 'system'
      }]);
    };

    const handleUserLeft = (user) => {
      console.log('👋 User left:', user.uid);
      setChatMessages(prev => [...prev, {
        id: Date.now() + Math.random(),
        user: 'System',
        message: `User ${user.uid} left the classroom`,
        timestamp: new Date().toLocaleTimeString(),
        isOwn: false,
        role: 'system'
      }]);
    };

    const handleConnectionStateChange = (curState, revState, reason) => {
      console.log('🔗 Connection state:', curState, 'Reason:', reason);
      setConnectionState(curState);
    };

    client.on('user-joined', handleUserJoined);
    client.on('user-left', handleUserLeft);
    client.on('connection-state-change', handleConnectionStateChange);

    return () => {
      try {
        client.off('user-joined', handleUserJoined);
        client.off('user-left', handleUserLeft);
        client.off('connection-state-change', handleConnectionStateChange);
      } catch (error) {
        console.warn('Event cleanup error:', error);
      }
    };
  }, [client]);

  // Optimized duration timer with cleanup
  const startTimeRef = useRef(null);
  const timerRef = useRef(null);

  useEffect(() => {
    if (connectionState === 'CONNECTED') {
      if (!startTimeRef.current) startTimeRef.current = Date.now();

      timerRef.current = setInterval(() => {
        const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
        const hours = Math.floor(elapsed / 3600);
        const minutes = Math.floor((elapsed % 3600) / 60);
        const seconds = elapsed % 60;

        if (hours > 0) {
          setDuration(`${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
        } else {
          setDuration(`${minutes}:${seconds.toString().padStart(2, '0')}`);
        }
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [connectionState]);

  // Connection monitoring
  useEffect(() => {
    if (joinResult) {
      console.log('✅ Successfully joined classroom');
      setConnectionState('CONNECTED');
    }
  }, []);

  // Enhanced participants list with optimized remote user handling
  const participants = useMemo(() => {
    if (!userInfo) return [];

    const localParticipant = {
      uid: userInfo._id,
      name: userInfo.name,
      username: userInfo.username,
      isLocal: true,
      micOn: isAudioEnabled,
      cameraOn: isVideoEnabled,
      role: userRole,
      handRaised: handRaised,
      isScreenSharing: isScreenSharing
    };

    const remoteParticipants = remoteUsers.map(user => {
      // Enhanced screen sharing detection
      const userVideoTrack = remoteVideoTracks.find(track => track.getUserId() === user.uid);

      const hasScreenShare = userVideoTrack && (
        userVideoTrack.getMediaStreamTrack()?.contentHint === 'detail' ||
        userVideoTrack.getMediaStreamTrack()?.label?.toLowerCase().includes('screen') ||
        userVideoTrack.isScreenTrack ||
        userVideoTrack.getMediaStreamTrack()?.getSettings()?.displaySurface === 'monitor'
      );

      return {
        ...user,
        isLocal: false,
        micOn: user.hasAudio !== false,
        cameraOn: user.hasVideo && !hasScreenShare,
        role: user.role || 'student',
        handRaised: user.handRaised || false,
        isScreenSharing: hasScreenShare
      };
    });

    return [localParticipant, ...remoteParticipants];
  }, [userInfo, remoteUsers, remoteVideoTracks, isAudioEnabled, isVideoEnabled, handRaised, userRole, isScreenSharing]);

  // Screen sharing detection
  const screenSharingParticipant = participants.find(p => p.isScreenSharing);
  const hasScreenShare = Boolean(screenSharingParticipant);
  const screenSharingUser = screenSharingParticipant?.name || screenSharingParticipant?.username || 'Someone';

  // Optimized event handlers
  const handleToggleAudio = useCallback(() => {
    setIsAudioEnabled(prev => {
      console.log(`🎤 Audio ${!prev ? 'enabled' : 'disabled'}`);
      return !prev;
    });
  }, []);

  const handleToggleVideo = useCallback(() => {
    setIsVideoEnabled(prev => {
      console.log(`📹 Video ${!prev ? 'enabled' : 'disabled'}`);
      return !prev;
    });
  }, []);

  // DIRECT AGORA SCREEN SHARING - NO BACKEND CALLS, ZERO SERVER LOAD
  const handleToggleScreenShare = useCallback(async () => {
    if (!permissions.canScreenShare) {
      alert('You do not have permission to share screen');
      return;
    }

    const newState = !isScreenSharing;
    console.log(`🖥️ Screen sharing ${newState ? 'starting' : 'stopping'} - Direct Agora (no server load)`);

    try {
      setIsScreenSharing(newState);

      // Add system message for screen sharing state
      setChatMessages(prev => [...prev, {
        id: Date.now() + Math.random(),
        user: 'System',
        message: `${userInfo.name || 'You'} ${newState ? 'started' : 'stopped'} screen sharing`,
        timestamp: new Date().toLocaleTimeString(),
        isOwn: false,
        role: 'system'
      }]);

    } catch (error) {
      console.error('❌ Screen sharing error:', error);
      setIsScreenSharing(prev => prev); // Revert state
    }
  }, [permissions.canScreenShare, isScreenSharing, userInfo]);

  const handleToggleVirtualBg = useCallback(() => {
    setIsVirtualBgPanelOpen(prev => !prev);
  }, []);

  const handleVirtualBackgroundChange = useCallback(async (type, options = {}) => {
    if (!isVirtualBgSupported) {
      alert('Virtual background not supported on this device');
      return;
    }

    try {
      if (type === 'none') {
        await virtualBgManager.current.disable();
        setVirtualBgEnabled(false);
        if (localCameraTrack) {
          localCameraTrack.unpipe();
        }
      } else {
        const success = await virtualBgManager.current.setBackground(type, options);
        if (success) {
          setVirtualBgEnabled(true);
          console.log('🎭 Virtual background applied:', type);
        }
      }
    } catch (error) {
      console.error('Virtual background error:', error);
      alert('Failed to apply virtual background');
      setVirtualBgEnabled(false);
    }

    setIsVirtualBgPanelOpen(false);
  }, [isVirtualBgSupported, localCameraTrack]);

  const handleToggleHand = useCallback(() => {
    setHandRaised(prev => {
      const newState = !prev;
      setChatMessages(prevMessages => [...prevMessages, {
        id: Date.now() + Math.random(),
        user: 'System',
        message: `${userInfo.name || 'You'} ${newState ? 'raised' : 'lowered'} hand`,
        timestamp: new Date().toLocaleTimeString(),
        isOwn: false,
        role: 'system'
      }]);
      return newState;
    });
  }, [userInfo]);

  const handleRemoveUser = useCallback(async (participant) => {
    if (!permissions.canKickParticipants) {
      alert('You do not have permission to remove participants');
      return;
    }

    if (confirm(`Remove ${participant.name || participant.username || 'this participant'} from the classroom?`)) {
      try {
        // For now, just show system message
        console.log('👢 Removing user (UI only):', participant.uid);

        setChatMessages(prev => [...prev, {
          id: Date.now() + Math.random(),
          user: 'System',
          message: `${participant.name || participant.username || 'Participant'} was removed from the classroom`,
          timestamp: new Date().toLocaleTimeString(),
          isOwn: false,
          role: 'system'
        }]);

        alert('User removal feature will be implemented when backend API is ready');
      } catch (error) {
        console.error('Remove user error:', error);
        alert('Failed to remove user');
      }
    }
  }, [permissions.canKickParticipants]);

  const handleLeaveCall = useCallback(() => {
    try {
      // Cleanup virtual background
      virtualBgManager.current.release();

      // Clear timers
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }

      navigate('/dashboard');
    } catch (error) {
      console.error('Leave call error:', error);
      navigate('/dashboard');
    }
  }, [navigate]);

  const handleSendMessage = useCallback((message) => {
    setChatMessages(prev => [...prev, message]);
  }, []);

  // Error boundary for missing user info
  if (!userInfo) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-900 text-white">
        <div className="text-center bg-gray-800 rounded-xl p-8 max-w-md mx-4 shadow-2xl">
          <AlertTriangle size={64} className="text-red-400 mb-4 mx-auto" />
          <h2 className="text-xl font-bold mb-4">Authentication Required</h2>
          <p className="text-gray-300 mb-6">Please sign in to join the classroom</p>
          <button onClick={() => navigate('/login')} className="w-full px-6 py-3 bg-blue-600 rounded-lg hover:bg-blue-700">
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className="h-screen bg-gray-900 flex flex-col relative overflow-hidden">

        <ClassroomHeader 
          userRole={userRole}
          participantCount={participants.length}
          duration={duration}
          onOpenWhiteboard={() => setIsWhiteboardOpen(true)}
          isScreenSharing={hasScreenShare}
          screenSharingUser={screenSharingUser}
        />

        {connectionState !== 'CONNECTED' && (
          <div className="bg-yellow-500 text-white px-4 py-2 text-center text-sm font-medium">
            <div className="flex items-center justify-center space-x-2">
              <Loader2 className="animate-spin" size={16} />
              <span>Connecting to classroom...</span>
            </div>
          </div>
        )}

        <div className="flex-1 relative">
          {hasScreenShare ? (
            <div className="h-full flex">
              <div className="flex-1 p-6">
                <VideoParticipant 
                  user={screenSharingParticipant}
                  audioTrack={screenSharingParticipant.isLocal ? localMicrophoneTrack : null}
                  videoTrack={screenSharingParticipant.isLocal ? localCameraTrack : null}
                  screenTrack={screenSharingParticipant.isLocal ? screenTrack : null}
                  isLocal={screenSharingParticipant.isLocal}
                  isScreenShare={true}
                  micOn={screenSharingParticipant.micOn}
                  cameraOn={screenSharingParticipant.cameraOn}
                  className="w-full h-full shadow-2xl"
                />
              </div>

              <div className="w-80 p-4 space-y-3 overflow-y-auto bg-gray-800">
                <div className="text-white text-sm font-medium mb-4 flex items-center space-x-2">
                  <Users size={16} />
                  <span>Participants ({participants.filter(p => !p.isScreenSharing).length})</span>
                </div>
                {participants.filter(p => !p.isScreenSharing).map((participant) => (
                  <VideoParticipant 
                    key={participant.uid}
                    user={participant}
                    audioTrack={participant.isLocal ? localMicrophoneTrack : null}
                    videoTrack={participant.isLocal ? localCameraTrack : null}
                    isLocal={participant.isLocal}
                    micOn={participant.micOn}
                    cameraOn={participant.cameraOn}
                    handRaised={participant.handRaised}
                    className="h-32 w-full"
                  />
                ))}
              </div>
            </div>
          ) : (
            <div className="h-full p-6">
              <div className={`grid gap-4 h-full ${
                participants.length === 1 ? 'grid-cols-1' :
                participants.length === 2 ? 'grid-cols-2' :
                participants.length <= 4 ? 'grid-cols-2' : 'grid-cols-3'
              }`}>
                {participants.slice(0, 9).map((participant) => (
                  <VideoParticipant 
                    key={participant.uid}
                    user={participant}
                    audioTrack={participant.isLocal ? localMicrophoneTrack : null}
                    videoTrack={participant.isLocal ? localCameraTrack : null}
                    isLocal={participant.isLocal}
                    micOn={participant.micOn}
                    cameraOn={participant.cameraOn}
                    handRaised={participant.handRaised}
                    className="w-full h-full"
                  />
                ))}
              </div>
            </div>
          )}

          {!hasScreenShare && participants.length <= 1 && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="text-center">
                <div className="w-32 h-32 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-2xl mb-4 animate-pulse">
                  <GraduationCap size={48} className="text-white" />
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">Oratrics Classroom</h2>
                <p className="text-gray-400">Waiting for participants to join...</p>
              </div>
            </div>
          )}
        </div>

        <VideoControls 
          userRole={userRole}
          permissions={permissions}
          isAudioEnabled={isAudioEnabled}
          isVideoEnabled={isVideoEnabled}
          isScreenSharing={isScreenSharing}
          virtualBgEnabled={virtualBgEnabled}
          handRaised={handRaised}
          onToggleAudio={handleToggleAudio}
          onToggleVideo={handleToggleVideo}
          onToggleScreenShare={handleToggleScreenShare}
          onToggleVirtualBg={handleToggleVirtualBg}
          onToggleHand={handleToggleHand}
          onLeaveCall={handleLeaveCall}
          onOpenChat={() => setIsChatOpen(true)}
          onOpenParticipants={() => setIsParticipantsOpen(true)}
        />

        <VirtualBackgroundPanel 
          isOpen={isVirtualBgPanelOpen}
          onClose={() => setIsVirtualBgPanelOpen(false)}
          onBackgroundChange={handleVirtualBackgroundChange}
        />

        <ChatPanel 
          isOpen={isChatOpen}
          onClose={() => setIsChatOpen(false)}
          messages={chatMessages}
          onSendMessage={handleSendMessage}
          currentUser={userInfo}
          userRole={userRole}
        />

        <ParticipantsPanel 
          isOpen={isParticipantsOpen}
          onClose={() => setIsParticipantsOpen(false)}
          participants={participants}
          currentUser={userInfo}
          userRole={userRole}
          onRemoveUser={handleRemoveUser}
        />

        <Whiteboard 
          isVisible={isWhiteboardOpen}
          onClose={() => setIsWhiteboardOpen(false)}
          isTeacher={userRole === CONSTANTS.ROLES.TEACHER}
        />
      </div>
    </ErrorBoundary>
  );
};

// =================== OPTIMIZED MAIN COMPONENT ===================
let clientInstance = null;

const LiveClassroom = () => {
  const { classScheduleId } = useParams();
  const navigate = useNavigate();

  const { credentials, loading, error } = useAgoraCredentials(classScheduleId);

  // Create client instance only once to prevent memory leaks
  const client = useMemo(() => {
    if (!clientInstance) {
      clientInstance = AgoraRTC.createClient({ 
        mode: "rtc", 
        codec: "vp8",
        role: "host" // Set role to host for better performance
      });

      // Enable dual stream for better quality
      clientInstance.enableDualStream().catch(err => {
        console.warn('Dual stream not supported:', err);
      });
    }
    return clientInstance;
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (clientInstance) {
        try {
          clientInstance.leave().catch(err => console.warn('Leave error:', err));
        } catch (error) {
          console.warn('Cleanup error:', error);
        }
      }
    };
  }, []);

  // Error handling
  if (error) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-900 text-white">
        <div className="text-center bg-gray-800 rounded-xl p-8 max-w-md mx-4 shadow-2xl">
          <AlertTriangle size={64} className="text-red-400 mb-4 mx-auto" />
          <h2 className="text-xl font-bold mb-4">Unable to join classroom</h2>
          <p className="text-gray-300 mb-6">{error}</p>
          <div className="space-y-3">
            <button 
              onClick={() => window.location.reload()} 
              className="w-full px-6 py-3 bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Retry Connection
            </button>
            <button 
              onClick={() => navigate('/dashboard')} 
              className="w-full px-6 py-3 bg-gray-600 rounded-lg hover:bg-gray-700 transition-colors"
            >
              Return to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Loading state
  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-900 text-white">
        <div className="text-center">
          <div className="w-32 h-32 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mb-6 shadow-2xl animate-pulse">
            <GraduationCap size={48} className="text-white" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-4">Oratrics Classroom</h2>
          <div className="flex items-center justify-center space-x-2 text-gray-400 mb-4">
            <Loader2 className="animate-spin" size={20} />
            <span>Preparing your classroom...</span>
          </div>
          <p className="text-sm text-gray-500">Setting up audio, video, and screen sharing</p>
          <div className="mt-6 bg-gray-800 rounded-lg p-4">
            <div className="flex items-center space-x-2 text-green-400 text-sm">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span>Connecting to Agora servers...</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Main render with optimized AgoraRTC provider
  return (
    <ErrorBoundary>
      <AgoraRTCProvider client={client}>
        <ClassroomContent credentials={credentials} />
      </AgoraRTCProvider>
    </ErrorBoundary>
  );
};

export default LiveClassroom;