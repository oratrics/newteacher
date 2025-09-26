// LiveClassroom.jsx - ENHANCED WITH VIRTUAL BACKGROUND AND SCREEN SHARING
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import AgoraRTC from 'agora-rtc-sdk-ng';
import VirtualBackgroundExtension from "agora-extension-virtual-background";
import {
  Mic, MicOff, Video, VideoOff, ScreenShare, PhoneOff,
  MessageCircle, Users, Clock, Hand, Send, X, Crown, 
  GraduationCap, AlertTriangle, Loader2, Monitor,
  Volume2, VolumeX, Wifi, WifiOff, Palette, Camera,
  Settings, Square, Circle, Minus, RotateCcw, Save, 
  Trash2, Pen, Eraser, Image, Filter, Maximize2
} from 'lucide-react';

const baseUrl = 'http://localhost:4000/';

// =================== CONSTANTS ===================
const CONSTANTS = {
  ROLES: { TEACHER: 'teacher', STUDENT: 'student' },
  CONNECTION_STATES: {
    DISCONNECTED: 'DISCONNECTED',
    CONNECTING: 'CONNECTING', 
    CONNECTED: 'CONNECTED',
    RECONNECTING: 'RECONNECTING'
  },
  VIDEO_PROFILES: {
    LOW: { width: 320, height: 240, frameRate: 15, bitrate: 200 },
    MEDIUM: { width: 640, height: 480, frameRate: 30, bitrate: 500 },
    HIGH: { width: 1280, height: 720, frameRate: 30, bitrate: 1000 }
  }
};

// =================== ERROR BOUNDARY ===================
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Classroom Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="h-screen flex items-center justify-center bg-gray-900 text-white">
          <div className="text-center max-w-md mx-auto p-6">
            <AlertTriangle size={64} className="text-red-400 mb-4 mx-auto" />
            <h2 className="text-xl font-bold mb-4">Something went wrong</h2>
            <p className="text-gray-300 mb-6 text-sm">{this.state.error?.message}</p>
            <div className="space-y-3">
              <button 
                onClick={() => window.location.reload()} 
                className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-medium"
              >
                Reload Application
              </button>
              <button 
                onClick={() => window.location.href = '/dashboard'} 
                className="w-full px-6 py-3 bg-gray-600 hover:bg-gray-700 rounded-lg font-medium"
              >
                Back to Dashboard
              </button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

// =================== VIRTUAL BACKGROUND MANAGER ===================
class VirtualBackgroundManager {
  constructor() {
    this.extension = null;
    this.processor = null;
    this.isSupported = false;
    this.isInitialized = false;
    this.currentBackground = 'none';
  }

  async initialize() {
    if (this.isInitialized) return true;
    try {
      this.extension = new VirtualBackgroundExtension();
      this.isSupported = this.extension.checkCompatibility();
      
      if (this.isSupported) {
        AgoraRTC.registerExtensions([this.extension]);
        this.isInitialized = true;
        console.log('✅ Virtual background extension ready');
        return true;
      } else {
        console.warn('⚠️ Virtual background not supported on this device');
      }
    } catch (error) {
      console.error('Virtual background initialization failed:', error);
    }
    return false;
  }

  async createProcessor() {
    if (!this.isInitialized || !this.extension) return null;
    
    try {
      if (!this.processor) {
        this.processor = this.extension.createProcessor();
        await this.processor.init();
        console.log('✅ Virtual background processor created');
      }
      return this.processor;
    } catch (error) {
      console.error('Processor creation failed:', error);
      return null;
    }
  }

  async setBackground(type, options = {}) {
    const processor = await this.createProcessor();
    if (!processor) return false;

    try {
      switch (type) {
        case 'blur':
          await processor.setOptions({ 
            type: 'blur', 
            blurDegree: options.blurDegree || 3 
          });
          break;
        
        case 'image':
          if (options.imageElement) {
            await processor.setOptions({ 
              type: 'img', 
              source: options.imageElement 
            });
          }
          break;
        
        case 'color':
          await processor.setOptions({ 
            type: 'color', 
            color: options.color || '#1a73e8' 
          });
          break;
        
        case 'none':
          await processor.setOptions({ type: 'none' });
          break;
        
        default:
          return false;
      }
      
      await processor.enable();
      this.currentBackground = type;
      console.log(`✅ Virtual background applied: ${type}`);
      return true;
    } catch (error) {
      console.error('Set background failed:', error);
      return false;
    }
  }

  async disable() {
    if (this.processor) {
      try {
        await this.processor.disable();
        this.currentBackground = 'none';
        console.log('✅ Virtual background disabled');
        return true;
      } catch (error) {
        console.error('Disable failed:', error);
      }
    }
    return false;
  }

  release() {
    if (this.processor) {
      try {
        this.processor.release();
        this.processor = null;
        console.log('✅ Virtual background processor released');
      } catch (error) {
        console.error('Release failed:', error);
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
    parsedInfo.role = parsedInfo.role || 'student';
    return parsedInfo;
  } catch (error) {
    console.error('getUserInfo error:', error);
    return null;
  }
};

// =================== API SERVICES ===================
const apiService = {
  async getCredentials(classScheduleId, userId) {
    const token = localStorage.getItem('teacherToken');
    if (!token) throw new Error('Authentication required');

    const response = await fetch(`${baseUrl}api/live/credentials`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ classScheduleId, userId })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
    }

    return await response.json();
  },

  async startScreenShare(liveClassId, userId) {
    const token = localStorage.getItem('teacherToken');
    const response = await fetch(`${baseUrl}api/live/start-screen`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ liveClassId, userId })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Screen share failed');
    }

    return await response.json();
  },

  async stopScreenShare(liveClassId, userId) {
    const token = localStorage.getItem('teacherToken');
    const response = await fetch(`${baseUrl}api/live/stop-screen`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ liveClassId, userId })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Stop screen share failed');
    }

    return await response.json();
  },

  async cleanup(channelName, uid) {
    const token = localStorage.getItem('teacherToken');
    try {
      await fetch(`${baseUrl}api/live/cleanup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ channelName, uid })
      });
    } catch (error) {
      console.warn('Cleanup request failed:', error);
    }
  }
};

// =================== CREDENTIALS HOOK ===================
const useAgoraCredentials = (classScheduleId) => {
  const [credentials, setCredentials] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!classScheduleId) {
      setError('Missing class schedule ID');
      setLoading(false);
      return;
    }

    const userInfo = getUserInfo();
    if (!userInfo) {
      setError('Please login again to join the class');
      setLoading(false);
      return;
    }

    const fetchCredentials = async () => {
      try {
        setLoading(true);
        const response = await apiService.getCredentials(classScheduleId, userInfo._id);
        
        if (!response.data || typeof response.data.uid !== 'number') {
          throw new Error('Invalid credentials received from server');
        }

        const uid = response.data.uid;
        if (uid < 1000 || uid > 65000) {
          throw new Error(`UID ${uid} is outside the safe range (1000-65000)`);
        }

        console.log('✅ Valid credentials received:', { 
          uid, 
          channel: response.data.channelName,
          role: response.data.role
        });
        
        setCredentials(response.data);
        setError(null);
      } catch (err) {
        console.error('❌ Credentials error:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchCredentials();
  }, [classScheduleId]);

  return { credentials, loading, error, refetch: () => window.location.reload() };
};

// =================== VIDEO PARTICIPANT COMPONENT ===================
const VideoParticipant = React.memo(({ 
  user, 
  isLocal = false, 
  isMainView = false,
  className = "",
  isScreenSharing = false 
}) => {
  const displayName = user?.name || user?.username || `User ${user?.uid || 'Unknown'}`;
  const participantRole = user?.role || 'student';
  const isTeacher = participantRole === CONSTANTS.ROLES.TEACHER;

  const avatarUrl = useMemo(() => {
    const bgColor = isTeacher ? '3b82f6' : '10b981';
    const name = displayName.replace(/[^a-zA-Z\s]/g, '').trim() || 'User';
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=${bgColor}&color=fff&size=400&font-size=0.4`;
  }, [displayName, isTeacher]);

  return (
    <div className={`relative bg-gray-900 rounded-lg overflow-hidden shadow-lg ${className} ${
      isMainView ? 'border-2 border-blue-500' : ''
    }`}>
      <div className="w-full h-full relative">
        <div 
          id={isLocal ? 'local-video' : `remote-video-${user.uid}`}
          className="w-full h-full bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: user?.hasVideo ? 'none' : `url(${avatarUrl})`,
            minHeight: isMainView ? '400px' : '200px'
          }}
        />
        
        {!user?.hasVideo && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center text-white">
              <div className="w-16 h-16 bg-gray-700 rounded-full flex items-center justify-center mb-3">
                <span className="text-xl font-bold">
                  {displayName.charAt(0).toUpperCase()}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Participant info overlay */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-3">
        <div className="flex items-center justify-between text-white">
          <div className="flex items-center space-x-2">
            <div className={`w-2 h-2 rounded-full ${isTeacher ? 'bg-blue-400' : 'bg-green-400'}`} />
            <p className="text-sm font-medium truncate max-w-[150px]">
              {displayName}
              {isLocal && ' (You)'}
            </p>
            {isTeacher && <Crown size={12} className="text-blue-400 flex-shrink-0" />}
          </div>

          <div className="flex items-center space-x-1">
            {user?.hasAudio ? (
              <div className="p-1 rounded-full bg-green-500/80">
                <Volume2 size={10} />
              </div>
            ) : (
              <div className="p-1 rounded-full bg-red-500/80">
                <VolumeX size={10} />
              </div>
            )}
            
            {user?.hasVideo ? (
              <div className="p-1 rounded-full bg-green-500/80">
                <Video size={10} />
              </div>
            ) : (
              <div className="p-1 rounded-full bg-red-500/80">
                <VideoOff size={10} />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Connection indicator */}
      <div className="absolute top-3 right-3">
        <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
      </div>

      {/* Screen sharing indicator */}
      {isScreenSharing && (
        <div className="absolute top-3 left-3 bg-blue-500 px-2 py-1 rounded text-xs text-white font-medium">
          <Monitor size={12} className="inline mr-1" />
          Sharing
        </div>
      )}
    </div>
  );
});

// =================== VIRTUAL BACKGROUND PANEL ===================
const VirtualBackgroundPanel = ({ isOpen, onClose, onBackgroundChange, currentBackground }) => {
  const [selectedBg, setSelectedBg] = useState(currentBackground || 'none');
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  const backgroundOptions = [
    { id: 'none', name: 'None', icon: X, description: 'No background effect' },
    { id: 'blur', name: 'Blur', icon: Filter, description: 'Blur your background' },
    { id: 'office', name: 'Office', color: '#2563eb', description: 'Professional blue' },
    { id: 'nature', name: 'Nature', color: '#059669', description: 'Natural green' },
    { id: 'sunset', name: 'Sunset', color: '#dc2626', description: 'Warm gradient' },
    { id: 'custom', name: 'Upload', icon: Image, description: 'Custom image' },
  ];

  const handleBackgroundSelect = async (bgType) => {
    setSelectedBg(bgType);
    
    try {
      switch (bgType) {
        case 'none':
          await onBackgroundChange('none');
          break;
        case 'blur':
          await onBackgroundChange('blur', { blurDegree: 3 });
          break;
        case 'office':
          await onBackgroundChange('color', { color: '#2563eb' });
          break;
        case 'nature':
          await onBackgroundChange('color', { color: '#059669' });
          break;
        case 'sunset':
          await onBackgroundChange('color', { color: '#dc2626' });
          break;
        case 'custom':
          fileInputRef.current?.click();
          break;
      }
    } catch (error) {
      console.error('Background change failed:', error);
    }
  };

  const handleImageUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) { // 5MB limit
      alert('Image size should be less than 5MB');
      return;
    }

    setUploading(true);
    try {
      const img = new Image();
      img.onload = () => {
        onBackgroundChange('image', { imageElement: img });
        setUploading(false);
      };
      img.onerror = () => {
        alert('Failed to load image');
        setUploading(false);
      };
      img.src = URL.createObjectURL(file);
    } catch (error) {
      console.error('Image upload failed:', error);
      setUploading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="absolute top-16 right-4 bg-white rounded-xl shadow-2xl border border-gray-200 p-6 z-50 w-96">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="font-bold text-gray-800">Virtual Background</h3>
          <p className="text-sm text-gray-500">Choose your background effect</p>
        </div>
        <button 
          onClick={onClose} 
          className="p-2 hover:bg-gray-100 rounded-full transition-colors"
        >
          <X size={18} />
        </button>
      </div>
      
      <div className="grid grid-cols-2 gap-3 mb-4">
        {backgroundOptions.map((option) => {
          const Icon = option.icon;
          return (
            <button
              key={option.id}
              onClick={() => handleBackgroundSelect(option.id)}
              disabled={uploading && option.id === 'custom'}
              className={`p-4 rounded-lg border-2 transition-all hover:shadow-md ${
                selectedBg === option.id 
                  ? 'border-blue-500 bg-blue-50 shadow-sm' 
                  : 'border-gray-200 hover:border-gray-300'
              } ${uploading && option.id === 'custom' ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {option.color ? (
                <div 
                  className="w-10 h-10 rounded-lg mx-auto mb-2 shadow-sm" 
                  style={{ backgroundColor: option.color }}
                />
              ) : (
                <Icon size={24} className="mx-auto mb-2 text-gray-600" />
              )}
              <div className="text-sm font-medium text-gray-800">{option.name}</div>
              <div className="text-xs text-gray-500 mt-1">{option.description}</div>
            </button>
          );
        })}
      </div>
      
      {uploading && (
        <div className="text-center py-2">
          <Loader2 className="animate-spin mx-auto mb-2" size={20} />
          <p className="text-sm text-gray-500">Processing image...</p>
        </div>
      )}
      
      <input 
        ref={fileInputRef} 
        type="file" 
        accept="image/*" 
        onChange={handleImageUpload} 
        className="hidden" 
      />
      
      <div className="text-xs text-gray-400 mt-4 p-3 bg-gray-50 rounded-lg">
        <strong>Note:</strong> Virtual backgrounds work best with good lighting and may impact performance on older devices.
      </div>
    </div>
  );
};

// =================== SCREEN SHARE LAYOUT ===================
const ScreenShareLayout = ({ 
  screenSharingUser, 
  otherParticipants, 
  isHeaderTransparent, 
  isControlsFloating 
}) => {
  return (
    <div className="h-full flex">
      {/* Main screen share area */}
      <div className="flex-1 relative">
        <VideoParticipant
          user={screenSharingUser}
          isMainView={true}
          isScreenSharing={true}
          className="w-full h-full"
        />
        
        {/* Floating participants sidebar */}
        <div className="absolute top-4 right-4 w-48 space-y-2 max-h-[calc(100vh-200px)] overflow-y-auto">
          {otherParticipants.map((participant) => (
            <VideoParticipant
              key={participant.uid}
              user={participant}
              isLocal={participant.isLocal}
              className="w-full h-24"
            />
          ))}
        </div>
      </div>
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
  const [isFullscreen, setIsFullscreen] = useState(false);

  const colors = ['#000000', '#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF', '#FFA500', '#800080'];
  const sizes = [2, 4, 6, 8, 12, 16, 20];

  useEffect(() => {
    if (isVisible && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      canvas.width = 1600;
      canvas.height = 900;
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
    }
  }, [isVisible]);

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
    setIsDrawing(false);
  }, []);

  const clearCanvas = () => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black/90 z-50 flex flex-col">
      {/* Header */}
      <div className="bg-white px-6 py-4 flex items-center justify-between border-b">
        <div className="flex items-center space-x-3">
          <Palette className="text-purple-600" size={24} />
          <div>
            <h3 className="text-lg font-bold text-gray-800">Interactive Whiteboard</h3>
            <p className="text-sm text-gray-500">
              {isTeacher ? 'Draw and annotate for your students' : 'View teacher\'s whiteboard'}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <Maximize2 size={20} />
          </button>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>
      </div>

      {/* Toolbar */}
      {isTeacher && (
        <div className="bg-gray-50 px-6 py-4 flex items-center justify-between border-b">
          <div className="flex items-center space-x-6">
            {/* Tools */}
            <div className="flex space-x-2">
              <button
                onClick={() => setTool('pen')}
                className={`p-3 rounded-lg transition-all ${
                  tool === 'pen' ? 'bg-blue-500 text-white shadow-md' : 'bg-white hover:bg-gray-100'
                }`}
              >
                <Pen size={16} />
              </button>
              <button
                onClick={() => setTool('eraser')}
                className={`p-3 rounded-lg transition-all ${
                  tool === 'eraser' ? 'bg-blue-500 text-white shadow-md' : 'bg-white hover:bg-gray-100'
                }`}
              >
                <Eraser size={16} />
              </button>
            </div>

            {/* Colors */}
            <div className="flex space-x-1">
              {colors.map((c) => (
                <button
                  key={c}
                  onClick={() => setColor(c)}
                  className={`w-8 h-8 rounded-full border-2 transition-all ${
                    color === c ? 'border-gray-800 scale-110 shadow-md' : 'border-gray-300 hover:scale-105'
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>

            {/* Size */}
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium text-gray-600">Size:</span>
              <select
                value={size}
                onChange={(e) => setSize(Number(e.target.value))}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {sizes.map((s) => (
                  <option key={s} value={s}>{s}px</option>
                ))}
              </select>
            </div>
          </div>

          {/* Actions */}
          <button 
            onClick={clearCanvas}
            className="flex items-center space-x-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
          >
            <Trash2 size={16} />
            <span>Clear All</span>
          </button>
        </div>
      )}

      {/* Canvas Area */}
      <div className="flex-1 bg-gray-100 flex items-center justify-center p-4">
        <canvas
          ref={canvasRef}
          className={`bg-white border shadow-xl max-w-full max-h-full ${
            isTeacher ? 'cursor-crosshair' : 'cursor-default'
          }`}
          style={{ 
            width: isFullscreen ? '95%' : '90%', 
            height: isFullscreen ? '90%' : '80%' 
          }}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
        />
      </div>

      {/* Status bar */}
      <div className="bg-gray-800 text-white px-6 py-2 text-sm">
        {isTeacher ? (
          <span>Click and drag to draw • Use the eraser to remove content • Clear all to reset</span>
        ) : (
          <span>Teacher's whiteboard • Content is read-only for students</span>
        )}
      </div>
    </div>
  );
};

// =================== CHAT PANEL COMPONENT ===================
const ChatPanel = ({ isOpen, onClose, messages, onSendMessage, currentUser, userRole }) => {
  const [newMessage, setNewMessage] = useState('');
  const [isEmojiOpen, setIsEmojiOpen] = useState(false);
  const messagesEndRef = useRef(null);

  const emojis = ['👋', '👍', '👏', '😊', '😂', '❤️', '🔥', '💯'];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = (e) => {
    e.preventDefault();
    if (newMessage.trim() && currentUser) {
      onSendMessage({
        id: Date.now() + Math.random(),
        user: currentUser.name || 'You',
        message: newMessage.trim(),
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isOwn: true,
        role: userRole
      });
      setNewMessage('');
    }
  };

  const handleEmojiClick = (emoji) => {
    if (currentUser) {
      onSendMessage({
        id: Date.now() + Math.random(),
        user: currentUser.name || 'You',
        message: emoji,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isOwn: true,
        role: userRole,
        isEmoji: true
      });
    }
    setIsEmojiOpen(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed right-0 top-0 bottom-0 w-80 bg-white border-l shadow-2xl z-40 flex flex-col">
      {/* Header */}
      <div className="p-4 border-b bg-gradient-to-r from-blue-50 to-purple-50">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-bold text-gray-800">Live Chat</h3>
            <p className="text-sm text-gray-500">{messages.length} messages</p>
          </div>
          <button 
            onClick={onClose} 
            className="p-2 hover:bg-white/50 rounded-full transition-colors"
          >
            <X size={18} />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
        {messages.length === 0 ? (
          <div className="text-center text-gray-500 mt-8">
            <MessageCircle size={48} className="mx-auto mb-4 opacity-50" />
            <p className="font-medium">No messages yet</p>
            <p className="text-sm">Start the conversation!</p>
          </div>
        ) : (
          messages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.isOwn ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-xs lg:max-w-md ${msg.isOwn ? 'order-2' : 'order-1'}`}>
                {!msg.isOwn && (
                  <div className="flex items-center space-x-1 mb-1">
                    <p className="text-xs font-medium text-gray-600">{msg.user}</p>
                    {msg.role === 'teacher' && <Crown size={10} className="text-blue-500" />}
                  </div>
                )}
                <div className={`inline-block px-4 py-2 rounded-2xl ${
                  msg.isOwn 
                    ? 'bg-blue-500 text-white rounded-br-sm' 
                    : msg.role === 'system'
                    ? 'bg-gray-200 text-gray-700 text-center text-xs'
                    : 'bg-white text-gray-800 border rounded-bl-sm shadow-sm'
                } ${msg.isEmoji ? 'text-2xl px-3 py-1' : ''}`}>
                  <p className={msg.isEmoji ? 'mb-0' : 'text-sm'}>{msg.message}</p>
                  {!msg.isEmoji && (
                    <p className={`text-xs mt-1 ${msg.isOwn ? 'text-blue-100' : 'text-gray-500'}`}>
                      {msg.timestamp}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t bg-white">
        {isEmojiOpen && (
          <div className="mb-3 p-2 bg-gray-50 rounded-lg">
            <div className="grid grid-cols-8 gap-2">
              {emojis.map((emoji) => (
                <button
                  key={emoji}
                  onClick={() => handleEmojiClick(emoji)}
                  className="text-xl hover:bg-gray-200 rounded p-1 transition-colors"
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>
        )}
        
        <form onSubmit={handleSend} className="flex space-x-2">
          <button
            type="button"
            onClick={() => setIsEmojiOpen(!isEmojiOpen)}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors"
          >
            😊
          </button>
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 px-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            maxLength={500}
          />
          <button
            type="submit"
            disabled={!newMessage.trim()}
            className="px-4 py-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Send size={16} />
          </button>
        </form>
        <p className="text-xs text-gray-400 mt-2 text-center">
          Press Enter to send • {500 - newMessage.length} characters remaining
        </p>
      </div>
    </div>
  );
};

// =================== MAIN CLASSROOM CONTENT ===================
const ClassroomContent = ({ credentials }) => {
  const userInfo = useMemo(() => getUserInfo(), []);
  const navigate = useNavigate();

  // Core state
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [handRaised, setHandRaised] = useState(false);
  const [duration, setDuration] = useState('0:00');
  
  // Connection state
  const [connectionState, setConnectionState] = useState(CONSTANTS.CONNECTION_STATES.DISCONNECTED);
  const [isConnected, setIsConnected] = useState(false);
  const [remoteUsers, setRemoteUsers] = useState([]);
  const [networkQuality, setNetworkQuality] = useState({ uplink: 0, downlink: 0 });
  
  // UI state
  const [isWhiteboardOpen, setIsWhiteboardOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isVirtualBgPanelOpen, setIsVirtualBgPanelOpen] = useState(false);
  const [virtualBgEnabled, setVirtualBgEnabled] = useState(false);
  const [chatMessages, setChatMessages] = useState([]);
  const [screenSharingUser, setScreenSharingUser] = useState(null);

  const userRole = credentials?.role || CONSTANTS.ROLES.STUDENT;
  const isTeacher = userRole === CONSTANTS.ROLES.TEACHER;

  // Virtual background
  const virtualBgManager = useRef(new VirtualBackgroundManager());
  const [isVirtualBgSupported, setIsVirtualBgSupported] = useState(false);

  // Agora client and tracks
  const clientRef = useRef(null);
  const localAudioTrackRef = useRef(null);
  const localVideoTrackRef = useRef(null);
  const localScreenTrackRef = useRef(null);

  // Initialize virtual background
  useEffect(() => {
    const initVirtualBg = async () => {
      const supported = await virtualBgManager.current.initialize();
      setIsVirtualBgSupported(supported);
    };
    initVirtualBg();

    return () => {
      virtualBgManager.current.release();
    };
  }, []);

  // Initialize Agora client
  useEffect(() => {
    if (!credentials || !userInfo) return;

    const initAgoraClient = async () => {
      try {
        const client = AgoraRTC.createClient({ 
          mode: "rtc", 
          codec: "vp8" 
        });

        clientRef.current = client;

        // Event listeners
        client.on("user-joined", async (user) => {
          console.log('👋 User joined:', user.uid);
          setRemoteUsers(prev => [...prev.filter(u => u.uid !== user.uid), {
            uid: user.uid,
            name: `User ${user.uid}`,
            role: 'student',
            hasAudio: false,
            hasVideo: false
          }]);

          setChatMessages(prev => [...prev, {
            id: Date.now() + Math.random(),
            user: 'System',
            message: `User ${user.uid} joined the class`,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            isOwn: false,
            role: 'system'
          }]);
        });

        client.on("user-left", (user) => {
          console.log('👋 User left:', user.uid);
          setRemoteUsers(prev => prev.filter(u => u.uid !== user.uid));
          
          if (screenSharingUser?.uid === user.uid) {
            setScreenSharingUser(null);
          }

          setChatMessages(prev => [...prev, {
            id: Date.now() + Math.random(),
            user: 'System',
            message: `User ${user.uid} left the class`,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            isOwn: false,
            role: 'system'
          }]);
        });

        client.on("user-published", async (user, mediaType) => {
          console.log('📡 User published:', user.uid, mediaType);
          
          try {
            await client.subscribe(user, mediaType);
            
            if (mediaType === 'video') {
              const videoElement = document.getElementById(`remote-video-${user.uid}`);
              if (videoElement && user.videoTrack) {
                user.videoTrack.play(videoElement);
              }
              
              // Check if this is screen sharing (typically higher UID)
              if (user.uid > 50000) {
                setScreenSharingUser(user);
              }
              
              setRemoteUsers(prev => prev.map(u => 
                u.uid === user.uid ? { ...u, hasVideo: true } : u
              ));
            }
            
            if (mediaType === 'audio') {
              if (user.audioTrack) {
                user.audioTrack.setVolume(100);
                user.audioTrack.play();
              }
              
              setRemoteUsers(prev => prev.map(u => 
                u.uid === user.uid ? { ...u, hasAudio: true } : u
              ));
            }
          } catch (error) {
            console.error('Subscribe failed:', error);
          }
        });

        client.on("user-unpublished", (user, mediaType) => {
          console.log('📡 User unpublished:', user.uid, mediaType);
          
          if (mediaType === 'video') {
            if (screenSharingUser?.uid === user.uid) {
              setScreenSharingUser(null);
            }
            
            setRemoteUsers(prev => prev.map(u => 
              u.uid === user.uid ? { ...u, hasVideo: false } : u
            ));
          }
          
          if (mediaType === 'audio') {
            setRemoteUsers(prev => prev.map(u => 
              u.uid === user.uid ? { ...u, hasAudio: false } : u
            ));
          }
        });

        client.on("connection-state-change", (curState, revState) => {
          console.log('Connection state changed:', curState);
          setConnectionState(curState);
          setIsConnected(curState === 'CONNECTED');
        });

        client.on("network-quality", (stats) => {
          setNetworkQuality({
            uplink: stats.uplinkNetworkQuality,
            downlink: stats.downlinkNetworkQuality
          });
        });

        // Join channel
        setConnectionState(CONSTANTS.CONNECTION_STATES.CONNECTING);
        
        await client.join(
          credentials.agoraAppId,
          credentials.channelName,
          credentials.token,
          credentials.uid
        );

        console.log('✅ Joined channel successfully');
        setConnectionState(CONSTANTS.CONNECTION_STATES.CONNECTED);
        setIsConnected(true);

      } catch (error) {
        console.error('❌ Agora client initialization failed:', error);
        setConnectionState(CONSTANTS.CONNECTION_STATES.DISCONNECTED);
      }
    };

    initAgoraClient();

    return () => {
      if (clientRef.current) {
        clientRef.current.leave().catch(console.warn);
        clientRef.current.removeAllListeners();
        clientRef.current = null;
      }
      
      // Cleanup API
      apiService.cleanup(credentials.channelName, credentials.uid);
    };
  }, [credentials, userInfo]);

  // Manage local tracks
  useEffect(() => {
    if (!clientRef.current || !isConnected) return;

    const createLocalTracks = async () => {
      try {
        // Audio track
        if (isAudioEnabled && !localAudioTrackRef.current) {
          localAudioTrackRef.current = await AgoraRTC.createMicrophoneAudioTrack({
            AEC: true,
            AGC: true,
            ANS: true,
            encoderConfig: "music_standard"
          });
        }

        // Video tracks (camera OR screen, never both)
        if (isScreenSharing && !localScreenTrackRef.current) {
          if (localVideoTrackRef.current) {
            await clientRef.current.unpublish(localVideoTrackRef.current);
            localVideoTrackRef.current.close();
            localVideoTrackRef.current = null;
          }

          localScreenTrackRef.current = await AgoraRTC.createScreenVideoTrack({
            encoderConfig: "1080p_1",
            optimizationMode: "detail"
          });
          
          // Screen share started
          setScreenSharingUser({
            uid: credentials.uid,
            name: credentials.user?.name || userInfo.name,
            role: userRole,
            hasVideo: true,
            hasAudio: isAudioEnabled
          });
          
        } else if (isVideoEnabled && !isScreenSharing && !localVideoTrackRef.current) {
          if (localScreenTrackRef.current) {
            await clientRef.current.unpublish(localScreenTrackRef.current);
            localScreenTrackRef.current.close();
            localScreenTrackRef.current = null;
          }

          localVideoTrackRef.current = await AgoraRTC.createCameraVideoTrack({
            optimizationMode: "detail",
            encoderConfig: CONSTANTS.VIDEO_PROFILES.MEDIUM
          });

          // Apply virtual background if enabled
          if (virtualBgEnabled && virtualBgManager.current.processor) {
            try {
              localVideoTrackRef.current.pipe(virtualBgManager.current.processor)
                .pipe(localVideoTrackRef.current.processorDestination);
            } catch (error) {
              console.warn('Virtual background application failed:', error);
            }
          }
        }

        // Publish tracks
        const tracksToPublish = [];
        
        if (localAudioTrackRef.current && isAudioEnabled) {
          tracksToPublish.push(localAudioTrackRef.current);
        }
        
        if (localScreenTrackRef.current && isScreenSharing) {
          tracksToPublish.push(localScreenTrackRef.current);
        } else if (localVideoTrackRef.current && isVideoEnabled && !isScreenSharing) {
          tracksToPublish.push(localVideoTrackRef.current);
        }

        if (tracksToPublish.length > 0) {
          await clientRef.current.publish(tracksToPublish);
          console.log('✅ Published tracks:', tracksToPublish.length);
        }

        // Play local video
        const localVideoElement = document.getElementById('local-video');
        if (localVideoElement) {
          if (localScreenTrackRef.current && isScreenSharing) {
            localScreenTrackRef.current.play(localVideoElement);
          } else if (localVideoTrackRef.current && isVideoEnabled) {
            localVideoTrackRef.current.play(localVideoElement);
          }
        }

      } catch (error) {
        console.error('❌ Track management failed:', error);
      }
    };

    createLocalTracks();
  }, [isAudioEnabled, isVideoEnabled, isScreenSharing, isConnected, virtualBgEnabled, credentials, userInfo, userRole]);

  // Duration timer
  const startTimeRef = useRef(null);

  useEffect(() => {
    if (isConnected && !startTimeRef.current) {
      startTimeRef.current = Date.now();
      const timer = setInterval(() => {
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
      
      return () => clearInterval(timer);
    }
  }, [isConnected]);

  // Participants list
  const participants = useMemo(() => {
    if (!userInfo || !credentials) return [];

    const localParticipant = {
      uid: credentials.uid,
      name: credentials.user?.name || userInfo.name,
      role: userRole,
      isLocal: true,
      hasVideo: isVideoEnabled,
      hasAudio: isAudioEnabled
    };

    return [localParticipant, ...remoteUsers];
  }, [userInfo, credentials, remoteUsers, isVideoEnabled, isAudioEnabled, userRole]);

  // Get participants excluding screen sharing user
  const videoParticipants = useMemo(() => {
    if (screenSharingUser) {
      return participants.filter(p => p.uid !== screenSharingUser.uid);
    }
    return participants;
  }, [participants, screenSharingUser]);

  // Event handlers
  const handleToggleAudio = useCallback(async () => {
    try {
      if (isAudioEnabled && localAudioTrackRef.current) {
        await clientRef.current?.unpublish(localAudioTrackRef.current);
        localAudioTrackRef.current.close();
        localAudioTrackRef.current = null;
      }
      setIsAudioEnabled(prev => !prev);
    } catch (error) {
      console.error('Toggle audio failed:', error);
    }
  }, [isAudioEnabled]);

  const handleToggleVideo = useCallback(async () => {
    try {
      if (isVideoEnabled && localVideoTrackRef.current && !isScreenSharing) {
        await clientRef.current?.unpublish(localVideoTrackRef.current);
        localVideoTrackRef.current.close();
        localVideoTrackRef.current = null;
      }
      setIsVideoEnabled(prev => !prev);
    } catch (error) {
      console.error('Toggle video failed:', error);
    }
  }, [isVideoEnabled, isScreenSharing]);

  const handleToggleScreenShare = useCallback(async () => {
    if (!isTeacher) {
      alert('Only teachers can share screen');
      return;
    }

    try {
      if (!isScreenSharing) {
        // Start screen sharing
        await apiService.startScreenShare(credentials.liveClassId, userInfo._id);
        setIsScreenSharing(true);
        
        setChatMessages(prev => [...prev, {
          id: Date.now() + Math.random(),
          user: 'System',
          message: '📺 Screen sharing started',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          isOwn: false,
          role: 'system'
        }]);
      } else {
        // Stop screen sharing
        if (localScreenTrackRef.current) {
          await clientRef.current?.unpublish(localScreenTrackRef.current);
          localScreenTrackRef.current.close();
          localScreenTrackRef.current = null;
        }
        
        setScreenSharingUser(null);
        await apiService.stopScreenShare(credentials.liveClassId, userInfo._id);
        setIsScreenSharing(false);
        
        setChatMessages(prev => [...prev, {
          id: Date.now() + Math.random(),
          user: 'System',
          message: '📺 Screen sharing stopped',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          isOwn: false,
          role: 'system'
        }]);
      }
    } catch (error) {
      console.error('Screen share error:', error);
      alert(`Screen sharing failed: ${error.message}`);
    }
  }, [isScreenSharing, isTeacher, credentials, userInfo]);

  const handleVirtualBackgroundChange = useCallback(async (type, options) => {
    if (!isVirtualBgSupported) {
      alert('Virtual background is not supported on this device');
      return;
    }

    try {
      if (type === 'none') {
        await virtualBgManager.current.disable();
        setVirtualBgEnabled(false);
        if (localVideoTrackRef.current) {
          localVideoTrackRef.current.unpipe();
        }
      } else {
        const success = await virtualBgManager.current.setBackground(type, options);
        if (success) {
          setVirtualBgEnabled(true);
          
          // Reapply to current video track
          if (localVideoTrackRef.current && virtualBgManager.current.processor) {
            localVideoTrackRef.current.pipe(virtualBgManager.current.processor)
              .pipe(localVideoTrackRef.current.processorDestination);
          }
        } else {
          alert('Failed to apply virtual background');
        }
      }
    } catch (error) {
      console.error('Virtual background error:', error);
      alert(`Virtual background failed: ${error.message}`);
    }
    setIsVirtualBgPanelOpen(false);
  }, [isVirtualBgSupported]);

  const handleSendMessage = useCallback((message) => {
    setChatMessages(prev => [...prev, message]);
  }, []);

  const handleLeaveCall = useCallback(async () => {
    try {
      // Show confirmation
      if (!window.confirm('Are you sure you want to leave the classroom?')) {
        return;
      }

      // Cleanup tracks
      const cleanupPromises = [];
      
      if (localAudioTrackRef.current) {
        cleanupPromises.push(localAudioTrackRef.current.close());
      }
      // LiveClassroom.jsx - COMPLETE ENHANCED VERSION (Continuation)

      if (localVideoTrackRef.current) {
        cleanupPromises.push(localVideoTrackRef.current.close());
      }
      
      if (localScreenTrackRef.current) {
        cleanupPromises.push(localScreenTrackRef.current.close());
      }

      await Promise.all(cleanupPromises);

      // Leave channel
      if (clientRef.current) {
        await clientRef.current.leave();
      }

      // Stop screen sharing if active
      if (isScreenSharing) {
        await apiService.stopScreenShare(credentials.liveClassId, userInfo._id);
      }

      // Cleanup API
      await apiService.cleanup(credentials.channelName, credentials.uid);

      // Navigate back
      navigate('/dashboard');
      
    } catch (error) {
      console.error('Leave call failed:', error);
      // Force navigation even if cleanup fails
      navigate('/dashboard');
    }
  }, [navigate, isScreenSharing, credentials, userInfo]);

  // Network quality indicator component
  const NetworkIndicator = ({ quality }) => {
    const getNetworkColor = (q) => {
      if (q >= 4) return 'text-green-500';
      if (q >= 3) return 'text-yellow-500';
      if (q >= 2) return 'text-orange-500';
      return 'text-red-500';
    };

    const getNetworkIcon = (q) => {
      return q >= 3 ? Wifi : WifiOff;
    };

    const NetworkIcon = getNetworkIcon(quality.uplink);
    return (
      <div className={`flex items-center space-x-1 ${getNetworkColor(quality.uplink)}`}>
        <NetworkIcon size={16} />
        <span className="text-xs font-medium">{quality.uplink}/6</span>
      </div>
    );
  };

  // Connection status component
  const ConnectionStatus = ({ state, isConnected }) => {
    const getStatusColor = () => {
      if (isConnected) return 'bg-green-500';
      if (state === CONSTANTS.CONNECTION_STATES.CONNECTING) return 'bg-yellow-500';
      return 'bg-red-500';
    };

    const getStatusText = () => {
      switch (state) {
        case CONSTANTS.CONNECTION_STATES.CONNECTED:
          return 'Connected';
        case CONSTANTS.CONNECTION_STATES.CONNECTING:
        case CONSTANTS.CONNECTION_STATES.RECONNECTING:
          return 'Connecting...';
        default:
          return 'Disconnected';
      }
    };

    return (
      <div className="flex items-center space-x-2">
        <div className={`w-2 h-2 rounded-full ${getStatusColor()} ${isConnected ? 'animate-pulse' : ''}`} />
        <span className="text-sm font-medium text-white">{getStatusText()}</span>
      </div>
    );
  };

  // Loading screen
  if (connectionState === CONSTANTS.CONNECTION_STATES.CONNECTING) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-900">
        <div className="text-center text-white">
          <Loader2 className="animate-spin mx-auto mb-4" size={48} />
          <h3 className="text-xl font-bold mb-2">Connecting to Classroom</h3>
          <p className="text-gray-300">Please wait while we connect you...</p>
          <div className="mt-6 flex justify-center space-x-4">
            <div className="w-12 h-1 bg-blue-600 rounded animate-pulse" />
            <div className="w-12 h-1 bg-blue-600 rounded animate-pulse" style={{ animationDelay: '0.2s' }} />
            <div className="w-12 h-1 bg-blue-600 rounded animate-pulse" style={{ animationDelay: '0.4s' }} />
          </div>
        </div>
      </div>
    );
  }

  // Connection failed screen
  if (connectionState === CONSTANTS.CONNECTION_STATES.DISCONNECTED && !isConnected) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-900">
        <div className="text-center text-white max-w-md mx-auto p-6">
          <AlertTriangle size={64} className="text-red-400 mb-4 mx-auto" />
          <h3 className="text-xl font-bold mb-2">Connection Failed</h3>
          <p className="text-gray-300 mb-6">Unable to connect to the classroom. Please check your internet connection.</p>
          <div className="space-y-3">
            <button 
              onClick={() => window.location.reload()}
              className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-medium transition-colors"
            >
              Try Again
            </button>
            <button 
              onClick={() => navigate('/dashboard')}
              className="w-full px-6 py-3 bg-gray-600 hover:bg-gray-700 rounded-lg font-medium transition-colors"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-gray-900 flex flex-col relative overflow-hidden">
      {/* Header - Transparent during screen sharing */}
      <div className={`px-6 py-4 bg-gradient-to-r from-gray-800 to-gray-900 border-b border-gray-700 flex items-center justify-between relative z-30 ${
        screenSharingUser ? 'bg-opacity-90 backdrop-blur-sm' : ''
      }`}>
        <div className="flex items-center space-x-6">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg">
              <GraduationCap className="text-white" size={24} />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">
                {credentials?.classInfo?.title || 'Live Classroom'}
              </h1>
              <div className="flex items-center space-x-4 text-sm text-gray-300">
                <div className="flex items-center space-x-1">
                  <Clock size={14} />
                  <span>{duration}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Users size={14} />
                  <span>{participants.length} participants</span>
                </div>
                {isTeacher && (
                  <div className="flex items-center space-x-1">
                    <Crown size={14} className="text-blue-400" />
                    <span className="text-blue-400">Instructor</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <NetworkIndicator quality={networkQuality} />
          <ConnectionStatus state={connectionState} isConnected={isConnected} />
          
          {/* Virtual Background Button */}
          {isVirtualBgSupported && (
            <button
              onClick={() => setIsVirtualBgPanelOpen(!isVirtualBgPanelOpen)}
              className={`p-3 rounded-lg transition-all ${
                virtualBgEnabled 
                  ? 'bg-blue-600 text-white shadow-lg' 
                  : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
              }`}
              title="Virtual Background"
            >
              <Filter size={20} />
            </button>
          )}

          <button 
            onClick={() => setIsWhiteboardOpen(true)}
            className="p-3 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors text-gray-300"
            title="Whiteboard"
          >
            <Palette size={20} />
          </button>

          <button 
            onClick={() => setIsChatOpen(!isChatOpen)}
            className={`p-3 rounded-lg transition-colors relative ${
              isChatOpen 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
            }`}
            title="Chat"
          >
            <MessageCircle size={20} />
            {chatMessages.filter(m => !m.isOwn && m.role !== 'system').length > 0 && (
              <div className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                {Math.min(chatMessages.filter(m => !m.isOwn && m.role !== 'system').length, 9)}
              </div>
            )}
          </button>
        </div>
      </div>

      {/* Main content area */}
      <div className="flex-1 relative">
        {screenSharingUser ? (
          // Screen sharing layout
          <ScreenShareLayout
            screenSharingUser={screenSharingUser}
            otherParticipants={videoParticipants}
            isHeaderTransparent={true}
            isControlsFloating={true}
          />
        ) : (
          // Normal grid layout
          <div className="h-full p-4">
            {participants.length === 0 ? (
              <div className="h-full flex items-center justify-center">
                <div className="text-center text-gray-400">
                  <Users size={64} className="mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-medium">Waiting for participants...</p>
                </div>
              </div>
            ) : participants.length === 1 ? (
              // Single participant - full screen
              <div className="h-full">
                <VideoParticipant
                  user={participants[0]}
                  isLocal={participants[0].isLocal}
                  isMainView={true}
                  className="w-full h-full"
                />
              </div>
            ) : participants.length === 2 ? (
              // Two participants - side by side
              <div className="grid grid-cols-2 gap-4 h-full">
                {participants.map((participant) => (
                  <VideoParticipant
                    key={participant.uid}
                    user={participant}
                    isLocal={participant.isLocal}
                    className="w-full h-full"
                  />
                ))}
              </div>
            ) : participants.length <= 4 ? (
              // Up to 4 participants - 2x2 grid
              <div className="grid grid-cols-2 grid-rows-2 gap-4 h-full">
                {participants.map((participant) => (
                  <VideoParticipant
                    key={participant.uid}
                    user={participant}
                    isLocal={participant.isLocal}
                    className="w-full h-full"
                  />
                ))}
              </div>
            ) : (
              // More than 4 participants - main view + sidebar
              <div className="flex h-full gap-4">
                <div className="flex-1">
                  <VideoParticipant
                    user={participants[0]}
                    isLocal={participants[0].isLocal}
                    isMainView={true}
                    className="w-full h-full"
                  />
                </div>
                <div className="w-80 space-y-4 overflow-y-auto">
                  {participants.slice(1).map((participant) => (
                    <VideoParticipant
                      key={participant.uid}
                      user={participant}
                      isLocal={participant.isLocal}
                      className="w-full h-48"
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Floating controls during screen sharing */}
      <div className={`px-6 py-4 bg-gradient-to-r from-gray-800 to-gray-900 border-t border-gray-700 flex items-center justify-center relative z-30 ${
        screenSharingUser ? 'fixed bottom-4 left-1/2 transform -translate-x-1/2 rounded-2xl shadow-2xl border border-gray-600 bg-opacity-95 backdrop-blur-md px-8' : ''
      }`}>
        <div className="flex items-center space-x-4">
          {/* Audio Toggle */}
          <button
            onClick={handleToggleAudio}
            className={`p-4 rounded-full transition-all ${
              isAudioEnabled 
                ? 'bg-gray-700 hover:bg-gray-600 text-white' 
                : 'bg-red-600 hover:bg-red-700 text-white'
            }`}
            title={isAudioEnabled ? 'Mute Audio' : 'Unmute Audio'}
          >
            {isAudioEnabled ? <Mic size={20} /> : <MicOff size={20} />}
          </button>

          {/* Video Toggle */}
          <button
            onClick={handleToggleVideo}
            disabled={isScreenSharing}
            className={`p-4 rounded-full transition-all ${
              isVideoEnabled && !isScreenSharing
                ? 'bg-gray-700 hover:bg-gray-600 text-white' 
                : 'bg-red-600 hover:bg-red-700 text-white'
            } ${isScreenSharing ? 'opacity-50 cursor-not-allowed' : ''}`}
            title={isVideoEnabled ? 'Stop Video' : 'Start Video'}
          >
            {isVideoEnabled && !isScreenSharing ? <Video size={20} /> : <VideoOff size={20} />}
          </button>

          {/* Screen Share - Teachers only */}
          {isTeacher && (
            <button
              onClick={handleToggleScreenShare}
              className={`p-4 rounded-full transition-all ${
                isScreenSharing 
                  ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg' 
                  : 'bg-gray-700 hover:bg-gray-600 text-white'
              }`}
              title={isScreenSharing ? 'Stop Screen Share' : 'Start Screen Share'}
            >
              {isScreenSharing ? <Monitor size={20} /> : <ScreenShare size={20} />}
            </button>
          )}

          {/* Hand Raise - Students only */}
          {!isTeacher && (
            <button
              onClick={() => setHandRaised(!handRaised)}
              className={`p-4 rounded-full transition-all ${
                handRaised 
                  ? 'bg-yellow-600 hover:bg-yellow-700 text-white shadow-lg animate-pulse' 
                  : 'bg-gray-700 hover:bg-gray-600 text-white'
              }`}
              title={handRaised ? 'Lower Hand' : 'Raise Hand'}
            >
              <Hand size={20} />
            </button>
          )}

          {/* Leave Call */}
          <button
            onClick={handleLeaveCall}
            className="p-4 bg-red-600 hover:bg-red-700 text-white rounded-full transition-all ml-4"
            title="Leave Classroom"
          >
            <PhoneOff size={20} />
          </button>
        </div>
      </div>

      {/* Virtual Background Panel */}
      <VirtualBackgroundPanel
        isOpen={isVirtualBgPanelOpen}
        onClose={() => setIsVirtualBgPanelOpen(false)}
        onBackgroundChange={handleVirtualBackgroundChange}
        currentBackground={virtualBgEnabled ? 'active' : 'none'}
      />

      {/* Chat Panel */}
      <ChatPanel
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        messages={chatMessages}
        onSendMessage={handleSendMessage}
        currentUser={userInfo}
        userRole={userRole}
      />

      {/* Whiteboard */}
      <Whiteboard
        isVisible={isWhiteboardOpen}
        onClose={() => setIsWhiteboardOpen(false)}
        isTeacher={isTeacher}
      />
    </div>
  );
};

// =================== MAIN COMPONENT ===================
const LiveClassroom = () => {
  const { classScheduleId } = useParams();
  const navigate = useNavigate();
  
  const { credentials, loading, error, refetch } = useAgoraCredentials(classScheduleId);

  // Redirect if no user info
  useEffect(() => {
    const userInfo = getUserInfo();
    if (!userInfo) {
      navigate('/login');
      return;
    }
  }, [navigate]);

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-900">
        <div className="text-center text-white">
          <Loader2 className="animate-spin mx-auto mb-4" size={48} />
          <h3 className="text-xl font-bold mb-2">Loading Classroom</h3>
          <p className="text-gray-300">Preparing your learning environment...</p>
          <div className="mt-6 flex justify-center space-x-2">
            <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" />
            <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
            <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-900">
        <div className="text-center text-white max-w-md mx-auto p-6">
          <AlertTriangle size={64} className="text-red-400 mb-4 mx-auto" />
          <h3 className="text-xl font-bold mb-2">Access Error</h3>
          <p className="text-gray-300 mb-6">{error}</p>
          <div className="space-y-3">
            <button 
              onClick={refetch}
              className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-medium transition-colors"
            >
              Try Again
            </button>
            <button 
              onClick={() => navigate('/dashboard')}
              className="w-full px-6 py-3 bg-gray-600 hover:bg-gray-700 rounded-lg font-medium transition-colors"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!credentials) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-900">
        <div className="text-center text-white">
          <AlertTriangle size={64} className="text-yellow-400 mb-4 mx-auto" />
          <h3 className="text-xl font-bold mb-2">No Credentials</h3>
          <p className="text-gray-300">Unable to load classroom credentials.</p>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <ClassroomContent credentials={credentials} />
    </ErrorBoundary>
  );
};

export default LiveClassroom;
