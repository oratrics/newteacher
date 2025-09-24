// hooks/useSessionTimer.js
import { useState, useEffect } from 'react';

export const useSessionTimer = (isConnected) => {
  const [sessionTime, setSessionTime] = useState(0);
  const [startTime, setStartTime] = useState(null);

  useEffect(() => {
    if (isConnected && !startTime) {
      setStartTime(Date.now());
    } else if (!isConnected) {
      setStartTime(null);
      setSessionTime(0);
    }
  }, [isConnected, startTime]);

  useEffect(() => {
    let interval;

    if (isConnected && startTime) {
      interval = setInterval(() => {
        const elapsed = Math.floor((Date.now() - startTime) / 1000);
        setSessionTime(elapsed);
      }, 1000);
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [isConnected, startTime]);

  return sessionTime;
};
