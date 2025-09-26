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
const useAgoraCredentials = (classScheduleId) => {
  const [credentials, setCredentials] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!classScheduleId) {
      setError('Missing class ID');
      setLoading(false);
      return;
    }

    const userInfo = getUserInfo();
    if (!userInfo) {
      setError('Please login again');
      setLoading(false);
      return;
    }

    const fetchCredentials = async () => {
      try {
        const response = await apiService.getCredentials(classScheduleId, userInfo._id);
        
        if (!response.data || typeof response.data.uid !== 'number') {
          throw new Error('Invalid credentials received');
        }

        const uid = response.data.uid;
        if (uid < 1000 || uid > 65000) {
          throw new Error(`UID ${uid} outside safe range 1000-65000`);
        }

        console.log('✅ Valid credentials received:', { uid, channel: response.data.channelName });
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

  return { credentials, loading, error };
};

export default useAgoraCredentials;
