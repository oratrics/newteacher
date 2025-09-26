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
const VideoParticipant = React.memo(({ user, isLocal = false, className = ""}) => {
  const displayName = user?.name || user?.username || `User ${user?.uid || 'Unknown'}`;
  const participantRole = user?.role || 'student';
  const isTeacher = participantRole === CONSTANTS.ROLES.TEACHER;

  const avatarUrl = useMemo(() => {
    const bgColor = isTeacher ? '3b82f6' : '10b981';
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=${bgColor}&color=fff&size=256`;
  }, [displayName, isTeacher]);

  return (
    <div className={`relative bg-gray-900 rounded-xl overflow-hidden shadow-2xl ${className}`}>
      <div className="w-full h-full relative">
        <div 
          id={isLocal ? 'local-video' : `remote-video-${user.uid}`}
          className="w-full h-full"
          style={{
            backgroundImage: `url(${avatarUrl})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center'
          }}
        />
      </div>

      {/* Participant info */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 to-transparent p-3">
        <div className="flex items-center justify-between text-white">
          <div className="flex items-center space-x-2">
            <div className={`w-3 h-3 rounded-full ${isTeacher ? 'bg-blue-400' : 'bg-green-400'}`}></div>
            <p className="text-sm font-medium truncate">
              {displayName}
              {isLocal && ' (you)'}
            </p>
            {isTeacher && <Crown size={12} className="text-blue-400" />}
          </div>

          <div className="flex items-center space-x-1">
            {user?.hasVideo && <div className="p-1 rounded-full bg-green-500"><Video size={10} /></div>}
            {user?.hasAudio && <div className="p-1 rounded-full bg-green-500"><Volume2 size={10} /></div>}
            {!isLocal && !user?.hasVideo && <div className="p-1 rounded-full bg-red-500"><VideoOff size={10} /></div>}
            {!isLocal && !user?.hasAudio && <div className="p-1 rounded-full bg-red-500"><VolumeX size={10} /></div>}
          </div>
        </div>
      </div>

      <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-green-400 animate-pulse"></div>
    </div>
  );
});
export default VideoParticipant;
