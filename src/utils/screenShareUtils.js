// utils/screenShareUtils.js - NO HOOKS, PURE FUNCTIONS
import AgoraRTC from 'agora-rtc-sdk-ng';

let screenTrackInstance = null;
let isCurrentlySharing = false;

export const screenShareUtils = {
  // Start screen sharing - pure function
  startScreenShare: async (client, onSuccess, onError, onTrackEnded) => {
    try {
      if (!client) {
        throw new Error('Agora client not available');
      }

      console.log('Starting screen share...');
      
      const screenVideoTrack = await AgoraRTC.createScreenVideoTrack({
        encoderConfig: {
          width: 1920,
          height: 1080,
          frameRate: 15,
          bitrateMin: 1000,
          bitrateMax: 3000
        },
        optimizationMode: 'detail'
      });

      if (screenVideoTrack) {
        // Store reference
        screenTrackInstance = screenVideoTrack;
        isCurrentlySharing = true;

        // Handle track end
        screenVideoTrack.on('track-ended', () => {
          console.log('Screen share ended by user');
          screenShareUtils.stopScreenShare(client, onTrackEnded, () => {});
        });

        // Publish to channel
        await client.publish([screenVideoTrack]);

        console.log('Screen share started successfully');
        
        if (onSuccess) {
          onSuccess(screenVideoTrack);
        }
        
        return screenVideoTrack;
      }
    } catch (error) {
      console.error('Screen share failed:', error);
      isCurrentlySharing = false;
      screenTrackInstance = null;
      
      if (onError) {
        onError(error);
      }
      throw error;
    }
  },

  // Stop screen sharing - pure function
  stopScreenShare: async (client, onSuccess, onError) => {
    try {
      console.log('Stopping screen share...');
      
      if (screenTrackInstance) {
        // Unpublish first
        if (client) {
          await client.unpublish([screenTrackInstance]);
        }
        
        // Stop and close
        screenTrackInstance.stop();
        screenTrackInstance.close();
        screenTrackInstance = null;
      }
      
      isCurrentlySharing = false;
      
      console.log('Screen share stopped successfully');
      
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error('Error stopping screen share:', error);
      
      // Force cleanup
      screenTrackInstance = null;
      isCurrentlySharing = false;
      
      if (onError) {
        onError(error);
      }
    }
  },

  // Get current status
  getScreenShareStatus: () => ({
    isSharing: isCurrentlySharing,
    track: screenTrackInstance
  }),

  // Cleanup function
  cleanup: () => {
    if (screenTrackInstance) {
      try {
        screenTrackInstance.stop();
        screenTrackInstance.close();
      } catch (error) {
        console.warn('Cleanup warning:', error);
      }
      screenTrackInstance = null;
    }
    isCurrentlySharing = false;
  }
};
