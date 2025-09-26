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
  Trash2, Pen, Eraser, Image
} from 'lucide-react';
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
  
  // UI state
  const [isWhiteboardOpen, setIsWhiteboardOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isVirtualBgPanelOpen, setIsVirtualBgPanelOpen] = useState(false);
  const [virtualBgEnabled, setVirtualBgEnabled] = useState(false);
  const [chatMessages, setChatMessages] = useState([]);

  const userRole = credentials?.role || CONSTANTS.ROLES.STUDENT;
  const isTeacher = userRole === CONSTANTS.ROLES.TEACHER;

  // Virtual background
  const virtualBgManager = useRef(new VirtualBackgroundManager());
  const [isVirtualBgSupported, setIsVirtualBgSupported] = useState(false);

  // Agora client and tracks - DIRECT SDK USAGE
  const clientRef = useRef(null);
  const localAudioTrackRef = useRef(null);
  const localVideoTrackRef = useRef(null);
  const localScreenTrackRef = useRef(null);

  useEffect(() => {
    const initVirtualBg = async () => {
      const supported = await virtualBgManager.current.initialize();
      setIsVirtualBgSupported(supported);
    };
    initVirtualBg();

    return () => virtualBgManager.current.release();
  }, []);

  // CRITICAL FIX: Initialize Agora client directly without React hooks
  useEffect(() => {
    if (!credentials || !userInfo) return;

    const initAgoraClient = async () => {
      try {
        // Create client with minimal configuration to avoid data channels
        const client = AgoraRTC.createClient({ 
          mode: "rtc", 
          codec: "vp8"
        });

        clientRef.current = client;

        // Setup event listeners
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
            id: Date.now(),
            user: 'System',
            message: `User ${user.uid} joined`,
            timestamp: new Date().toLocaleTimeString(),
            isOwn: false,
            role: 'system'
          }]);
        });

        client.on("user-left", (user) => {
          console.log('👋 User left:', user.uid);
          setRemoteUsers(prev => prev.filter(u => u.uid !== user.uid));

          setChatMessages(prev => [...prev, {
            id: Date.now(),
            user: 'System',
            message: `User ${user.uid} left`,
            timestamp: new Date().toLocaleTimeString(),
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
          console.log('Connection state:', curState);
          setConnectionState(curState);
          setIsConnected(curState === 'CONNECTED');
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
    };
  }, [credentials, userInfo]);

  // Create and manage local tracks
  useEffect(() => {
    if (!clientRef.current || !isConnected) return;

    const createLocalTracks = async () => {
      try {
        // Create audio track
        if (isAudioEnabled && !localAudioTrackRef.current) {
          localAudioTrackRef.current = await AgoraRTC.createMicrophoneAudioTrack({
            AEC: true,
            AGC: true,
            ANS: true
          });
        }

        // Create video track (camera OR screen, never both)
        if (isScreenSharing && !localScreenTrackRef.current) {
          if (localVideoTrackRef.current) {
            await clientRef.current.unpublish(localVideoTrackRef.current);
            localVideoTrackRef.current.close();
            localVideoTrackRef.current = null;
          }

          localScreenTrackRef.current = await AgoraRTC.createScreenVideoTrack({
            encoderConfig: "720p_1"
          });
        } else if (isVideoEnabled && !isScreenSharing && !localVideoTrackRef.current) {
          if (localScreenTrackRef.current) {
            await clientRef.current.unpublish(localScreenTrackRef.current);
            localScreenTrackRef.current.close();
            localScreenTrackRef.current = null;
          }

          localVideoTrackRef.current = await AgoraRTC.createCameraVideoTrack({
            optimizationMode: "detail",
            encoderConfig: {
              width: 640,
              height: 480,
              frameRate: 15,
              bitrateMin: 300,
              bitrateMax: 600
            }
          });

          // Apply virtual background
          if (virtualBgEnabled && virtualBgManager.current.processor) {
            try {
              localVideoTrackRef.current.pipe(virtualBgManager.current.processor).pipe(localVideoTrackRef.current.processorDestination);
            } catch (error) {
              console.warn('Virtual background failed:', error);
            }
          }
        }

        // Publish tracks (CRITICAL: Publish without data channels)
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
          // CRITICAL FIX: Publish without data channels to avoid UID errors
          await clientRef.current.publish(tracksToPublish);
          console.log('✅ Published tracks successfully:', tracksToPublish.length);
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
        console.error('❌ Track creation/publishing failed:', error);
        // Don't throw error for data channel issues, continue without them
        if (error.message?.includes('invalid id')) {
          console.warn('⚠️ Data channel disabled due to UID compatibility');
        }
      }
    };

    createLocalTracks();
  }, [isAudioEnabled, isVideoEnabled, isScreenSharing, isConnected, virtualBgEnabled]);

  // Duration timer
  const startTimeRef = useRef(null);

  useEffect(() => {
    if (isConnected && !startTimeRef.current) {
      startTimeRef.current = Date.now();
      const timer = setInterval(() => {
        const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
        const minutes = Math.floor(elapsed / 60);
        const seconds = elapsed % 60;
        setDuration(`${minutes}:${seconds.toString().padStart(2, '0')}`);
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
        await apiService.startScreenShare(credentials.liveClassId, userInfo._id);
        setIsScreenSharing(true);
        
        setChatMessages(prev => [...prev, {
          id: Date.now(),
          user: 'System',
          message: 'Screen sharing started',
          timestamp: new Date().toLocaleTimeString(),
          isOwn: false,
          role: 'system'
        }]);
      } else {
        if (localScreenTrackRef.current) {
          await clientRef.current?.unpublish(localScreenTrackRef.current);
          localScreenTrackRef.current.close();
          localScreenTrackRef.current = null;
        }
        
        await apiService.stopScreenShare(credentials.liveClassId, userInfo._id);
        setIsScreenSharing(false);
        
        setChatMessages(prev => [...prev, {
          id: Date.now(),
          user: 'System',
          message: 'Screen sharing stopped',
          timestamp: new Date().toLocaleTimeString(),
          isOwn: false,
          role: 'system'
        }]);
      }
    } catch (error) {
      console.error('Screen share error:', error);
      alert('Screen sharing failed: ' + error.message);
    }
  }, [isScreenSharing, isTeacher, credentials, userInfo]);

  const handleVirtualBackgroundChange = useCallback(async (type, options) => {
    if (!isVirtualBgSupported) {
      alert('Virtual background not supported');
      return;
    }

    try {
      if (type === 'none') {
        await virtualBgManager.current.disable();
        setVirtualBgEnabled(false);
        if (localVideoTrackRef.current) localVideoTrackRef.current.unpipe();
      } else {
        const success = await virtualBgManager.current.setBackground(type, options);
        if (success) {
          setVirtualBgEnabled(true);
        }
      }
    } catch (error) {
      console.error('Virtual background error:', error);
      alert('Virtual background failed');
    }
    setIsVirtualBgPanelOpen(false);
  }, [isVirtualBgSupported]);

  const handleSendMessage = useCallback((message) => {
    setChatMessages(prev => [...prev, message]);
  }, []);

  const handleLeaveCall = useCallback(async () => {
    try {
      // Cleanup tracks
      if (localAudioTrackRef.current) {
        localAudioTrackRef.current.close();
        localAudioTrackRef.current = null;
      }
      if (localVideoTrackRef.current) {
        localVideoTrackRef.current.close();
        localVideoTrackRef.current = null;
      }
      if (localScreenTrackRef.current) {
        localScreenTrackRef.current.close();
        localScreenTrackRef.current = null;
      }

      // Leave channel
      if (clientRef.current) {
        await clientRef.current.leave();
        clientRef.current = null;
      }

      virtualBgManager.current.release();
      navigate('/dashboard');
    } catch (error) {
      console.error('Leave call error:', error);
      navigate('/dashboard');
    }
  }, [navigate]);

  if (!userInfo) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-900 text-white">
        <div className="text-center">
          <AlertTriangle size={64} className="text-red-400 mb-4 mx-auto" />
          <h2 className="text-xl font-bold mb-4">Authentication Required</h2>
          <button onClick={() => navigate('/login')} className="px-6 py-3 bg-blue-600 rounded-lg">
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className="h-screen bg-gray-900 flex flex-col relative">
        
        {/* Header */}
        <div className="bg-gray-800 text-white px-6 py-3 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <GraduationCap size={24} className="text-blue-400" />
            <div>
              <h1 className="text-lg font-bold">Oratrics Classroom</h1>
              <p className="text-xs text-gray-400">Live Session • No Data Channels</p>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            {isTeacher && (
              <button
                onClick={() => setIsWhiteboardOpen(true)}
                className="flex items-center space-x-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg text-sm"
              >
                <Palette size={14} />
                <span>Whiteboard</span>
              </button>
            )}

            <div className="flex items-center space-x-4 text-sm">
              <div className="flex items-center space-x-1 bg-gray-700 px-3 py-1 rounded-full">
                <Clock size={14} className="text-green-400" />
                <span>{duration}</span>
              </div>
              <div className="flex items-center space-x-1 bg-gray-700 px-3 py-1 rounded-full">
                <Users size={14} className="text-blue-400" />
                <span>{participants.length}</span>
              </div>
              <div className="flex items-center space-x-1 bg-gray-700 px-3 py-1 rounded-full">
                {isConnected ? (
                  <>
                    <Wifi size={14} className="text-green-400" />
                    <span className="text-xs text-green-400">Connected</span>
                  </>
                ) : (
                  <>
                    <WifiOff size={14} className="text-red-400" />
                    <span className="text-xs text-red-400">Connecting</span>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Connection status */}
        {!isConnected && (
          <div className="bg-yellow-500 text-white px-4 py-2 text-center">
            <div className="flex items-center justify-center space-x-2">
              <Loader2 className="animate-spin" size={16} />
              <span>Connecting...</span>
              {credentials?.uid && <span>(UID: {credentials.uid})</span>}
            </div>
          </div>
        )}

        {/* Video grid */}
        <div className="flex-1 p-4">
          <div className={`grid gap-4 h-full ${
            participants.length === 1 ? 'grid-cols-1' :
            participants.length === 2 ? 'grid-cols-2' :
            participants.length <= 4 ? 'grid-cols-2' : 'grid-cols-3'
          }`}>
            {participants.map((participant) => (
              <VideoParticipant
                key={participant.uid}
                user={participant}
                isLocal={participant.isLocal}
                className="w-full h-full min-h-[200px]"
              />
            ))}
          </div>

          {/* Empty state */}
          {participants.length <= 1 && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="text-center text-white">
                <div className="w-24 h-24 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <GraduationCap size={32} />
                </div>
                <h2 className="text-xl font-bold mb-2">Waiting for participants...</h2>
                <p className="text-gray-400">Your classroom is ready!</p>
              </div>
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="bg-gray-800 px-6 py-4">
          <div className="flex items-center justify-between max-w-6xl mx-auto">
            <div className="text-white text-sm">
              <div className="font-medium">Oratrics</div>
              <div className="text-gray-400 text-xs">Direct SDK • No Data Channels</div>
            </div>

            <div className="flex items-center space-x-3">
              <button
                onClick={handleToggleAudio}
                className={`p-3 rounded-full transition ${
                  isAudioEnabled ? 'bg-gray-700 hover:bg-gray-600' : 'bg-red-500 hover:bg-red-600'
                }`}
              >
                {isAudioEnabled ? <Mic size={20} className="text-white" /> : <MicOff size={20} className="text-white" />}
              </button>

              <button
                onClick={handleToggleVideo}
                className={`p-3 rounded-full transition ${
                  isVideoEnabled ? 'bg-gray-700 hover:bg-gray-600' : 'bg-red-500 hover:bg-red-600'
                }`}
              >
                {isVideoEnabled ? <Video size={20} className="text-white" /> : <VideoOff size={20} className="text-white" />}
              </button>

              {isTeacher && (
                <button
                  onClick={handleToggleScreenShare}
                  className={`p-3 rounded-full transition ${
                    isScreenSharing ? 'bg-blue-500 hover:bg-blue-600' : 'bg-gray-700 hover:bg-gray-600'
                  }`}
                >
                  <ScreenShare size={20} className="text-white" />
                </button>
              )}

              <button
                onClick={() => setIsVirtualBgPanelOpen(true)}
                className={`p-3 rounded-full transition ${
                  virtualBgEnabled ? 'bg-purple-500 hover:bg-purple-600' : 'bg-gray-700 hover:bg-gray-600'
                }`}
              >
                <Camera size={20} className="text-white" />
              </button>

              {!isTeacher && (
                <button
                  onClick={() => setHandRaised(prev => !prev)}
                  className={`p-3 rounded-full transition ${
                    handRaised ? 'bg-yellow-500 hover:bg-yellow-600 animate-bounce' : 'bg-gray-700 hover:bg-gray-600'
                  }`}
                >
                  <Hand size={20} className="text-white" />
                </button>
              )}

              <button
                onClick={handleLeaveCall}
                className="p-3 rounded-full bg-red-500 hover:bg-red-600 text-white transition"
              >
                <PhoneOff size={20} />
              </button>
            </div>

            <div className="flex items-center space-x-3">
              <button 
                onClick={() => setIsChatOpen(true)} 
                className="p-2 rounded-full bg-gray-700 hover:bg-gray-600 text-white"
              >
                <MessageCircle size={18} />
              </button>
            </div>
          </div>
        </div>

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

        <Whiteboard 
          isVisible={isWhiteboardOpen}
          onClose={() => setIsWhiteboardOpen(false)}
          isTeacher={isTeacher}
        />
      </div>
    </ErrorBoundary>
  );
};

export default ClassroomContent;
