// hooks/useDataChannel.js
import { useState, useCallback, useRef, useEffect } from 'react';

export const useDataChannel = (client) => {
  const [messages, setMessages] = useState([]);
  const [isStreamActive, setIsStreamActive] = useState(false);
  const streamIdRef = useRef(null);

  const initDataStream = useCallback(async () => {
    if (!client || isStreamActive) return;

    try {
      const streamId = await client.createDataStream({
        ordered: true,
        reliable: true
      });

      streamIdRef.current = streamId;
      setIsStreamActive(true);

      // Listen for incoming data stream messages
      client.on('stream-message', (uid, streamId, data) => {
        try {
          const message = JSON.parse(new TextDecoder().decode(data));
          setMessages(prev => [...prev, { ...message, uid, streamId }]);
        } catch (error) {
          console.error('Error parsing stream message:', error);
        }
      });

    } catch (error) {
      console.error('Error creating data stream:', error);
    }
  }, [client, isStreamActive]);

  const sendMessage = useCallback(async (messageData) => {
    if (!client || !streamIdRef.current) {
      throw new Error('Data stream not initialized');
    }

    try {
      const messageString = JSON.stringify(messageData);
      const messageBuffer = new TextEncoder().encode(messageString);
      
      await client.sendStreamMessage(streamIdRef.current, messageBuffer);
    } catch (error) {
      console.error('Error sending stream message:', error);
      throw error;
    }
  }, [client]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (client && streamIdRef.current) {
        // Data streams are automatically cleaned up when leaving channel
        setIsStreamActive(false);
        streamIdRef.current = null;
      }
    };
  }, [client]);

  return {
    messages,
    isStreamActive,
    initDataStream,
    sendMessage
  };
};
