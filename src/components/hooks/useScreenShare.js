// hooks/useScreenShare.js
import { useState, useCallback, useRef } from 'react';
import AgoraRTC from 'agora-rtc-sdk-ng';

export const useScreenShare = (client) => {
  const [screenTrack, setScreenTrack] = useState(null);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [error, setError] = useState(null);
  const screenClientRef = useRef(null);

  const startScreenShare = useCallback(async () => {
    if (!client) {
      throw new Error('Agora client not available');
    }

    setError(null);

    try {
      // Create screen share track
      const screenVideoTrack = await AgoraRTC.createScreenVideoTrack({
        encoderConfig: {
          width: 1920,
          height: 1080,
          frameRate: 15,
          bitrateMax: 3000,
          bitrateMin: 1000
        }
      });

      // Handle screen share end (user clicks "Stop sharing" in browser)
      screenVideoTrack.on('track-ended', () => {
        stopScreenShare();
      });

      // Publish screen share
      await client.publish([screenVideoTrack]);

      setScreenTrack(screenVideoTrack);
      setIsScreenSharing(true);

      return screenVideoTrack;
    } catch (err) {
      console.error('Screen share error:', err);
      setError(err.message);
      throw err;
    }
  }, [client]);

  const stopScreenShare = useCallback(async () => {
    if (!screenTrack || !client) {
      return;
    }

    try {
      // Unpublish and close screen track
      await client.unpublish([screenTrack]);
      screenTrack.close();

      setScreenTrack(null);
      setIsScreenSharing(false);
    } catch (err) {
      console.error('Stop screen share error:', err);
      setError(err.message);
    }
  }, [screenTrack, client]);

  return {
    screenTrack,
    isScreenSharing,
    error,
    startScreenShare,
    stopScreenShare
  };
};
