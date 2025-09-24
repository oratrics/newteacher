// hooks/useNoiseReduction.js
import { useState, useCallback, useRef } from 'react';

export const useNoiseReduction = (localMicrophoneTrack) => {
  const [isNoiseReductionActive, setIsNoiseReductionActive] = useState(false);
  const [error, setError] = useState(null);
  const processorRef = useRef(null);

  const enableNoiseReduction = useCallback(async () => {
    if (!localMicrophoneTrack) {
      throw new Error('Microphone track not available');
    }

    setError(null);

    try {
      // Note: This is a simplified implementation
      // In a real app, you'd use Agora's AI Noise Suppression extension
      
      // For now, we'll just set a flag and apply basic audio processing
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const source = audioContext.createMediaStreamSource(
        new MediaStream([localMicrophoneTrack.getMediaStreamTrack()])
      );
      
      // Create a simple noise gate
      const compressor = audioContext.createDynamicsCompressor();
      compressor.threshold.setValueAtTime(-30, audioContext.currentTime);
      compressor.knee.setValueAtTime(40, audioContext.currentTime);
      compressor.ratio.setValueAtTime(12, audioContext.currentTime);
      compressor.attack.setValueAtTime(0, audioContext.currentTime);
      compressor.release.setValueAtTime(0.25, audioContext.currentTime);

      source.connect(compressor);
      
      processorRef.current = { audioContext, compressor };
      setIsNoiseReductionActive(true);

    } catch (err) {
      console.error('Noise reduction error:', err);
      setError(err.message);
      throw err;
    }
  }, [localMicrophoneTrack]);

  const disableNoiseReduction = useCallback(async () => {
    try {
      if (processorRef.current) {
        processorRef.current.audioContext.close();
        processorRef.current = null;
      }
      
      setIsNoiseReductionActive(false);
    } catch (err) {
      console.error('Disable noise reduction error:', err);
      setError(err.message);
    }
  }, []);

  return {
    isNoiseReductionActive,
    error,
    enableNoiseReduction,
    disableNoiseReduction
  };
};
