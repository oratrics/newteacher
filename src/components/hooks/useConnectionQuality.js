// hooks/useConnectionQuality.js
import { useState, useEffect } from 'react';

export const useConnectionQuality = (client) => {
  const [connectionQuality, setConnectionQuality] = useState('good');
  const [networkStats, setNetworkStats] = useState({
    uplink: { rtt: 0, lossRate: 0 },
    downlink: { rtt: 0, lossRate: 0 }
  });

  useEffect(() => {
    if (!client) return;

    const updateNetworkStats = () => {
      const stats = client.getRTCStats();
      
      if (stats) {
        setNetworkStats({
          uplink: {
            rtt: stats.RTT || 0,
            lossRate: stats.OutgoingAvailableBandwidth || 0
          },
          downlink: {
            rtt: stats.RTT || 0,
            lossRate: stats.RecvBitrate || 0
          }
        });

        // Determine connection quality based on RTT and loss rate
        const rtt = stats.RTT || 0;
        const lossRate = stats.OutgoingAvailableBandwidth || 0;

        if (rtt < 100 && lossRate > 1000) {
          setConnectionQuality('excellent');
        } else if (rtt < 200 && lossRate > 500) {
          setConnectionQuality('good');
        } else if (rtt < 400) {
          setConnectionQuality('fair');
        } else {
          setConnectionQuality('poor');
        }
      }
    };

    // Update stats every 2 seconds
    const interval = setInterval(updateNetworkStats, 2000);

    // Listen to connection state changes
    client.on('connection-state-change', (newState, prevState, reason) => {
      if (newState === 'DISCONNECTED' || newState === 'FAILED') {
        setConnectionQuality('poor');
      }
    });

    return () => {
      clearInterval(interval);
    };
  }, [client]);

  return connectionQuality;
};
