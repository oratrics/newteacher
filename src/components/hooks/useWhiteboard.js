// hooks/useWhiteboard.js
import { useState, useCallback, useRef, useEffect } from 'react';
import { WhiteWebSdk, RoomPhase } from 'white-web-sdk';

export const useWhiteboard = (channelName, userId, userRole) => {
  const [room, setRoom] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [connectionState, setConnectionState] = useState('disconnected');
  
  // Whiteboard state management
  const [currentTool, setCurrentTool] = useState('pencil');
  const [strokeColor, setStrokeColor] = useState('#000000');
  const [strokeWidth, setStrokeWidth] = useState(2);
  const [isReadOnly, setIsReadOnly] = useState(userRole !== 'teacher');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  const [participants, setParticipants] = useState([]);
  
  // Refs
  const sdkRef = useRef(null);
  const roomRef = useRef(null);
  const whiteboardElementRef = useRef(null);

  // Initialize Whiteboard SDK
  const initializeWhiteboard = useCallback(async (whiteboardElement) => {
    if (!channelName || !userId) {
      throw new Error('Channel name and user ID are required');
    }

    setIsLoading(true);
    setError(null);
    whiteboardElementRef.current = whiteboardElement;

    try {
      // Get whiteboard token from your backend
      const tokenResponse = await fetch('/api/whiteboard/token', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('teacherToken')}`,
        },
        body: JSON.stringify({ 
          channelName, 
          userId,
          userRole 
        })
      });

      if (!tokenResponse.ok) {
        throw new Error(`Failed to get whiteboard token: ${tokenResponse.statusText}`);
      }

      const tokenData = await tokenResponse.json();

      // Initialize WhiteWeb SDK
      const sdk = new WhiteWebSdk({
        appIdentifier: tokenData.appId,
        useMobXState: true,
        devicePixelRatio: window.devicePixelRatio || 1,
        handToolKey: ' ', // Space key for hand tool
        loggerOptions: {
          reportQualityMode: 'always',
          reportDebugLogMode: 'always'
        }
      });

      sdkRef.current = sdk;

      // Room configuration
      const roomConfig = {
        uuid: tokenData.roomId,
        roomToken: tokenData.roomToken,
        uid: userId.toString(),
        isWritable: userRole === 'teacher',
        disableCameraTransform: userRole !== 'teacher',
        userPayload: {
          nickName: `User_${userId}`,
          role: userRole,
          avatar: `https://api.dicebear.com/6.x/initials/svg?seed=${userId}`
        },
        floatBar: true,
        hotKeys: {
          changeToSelector: 's',
          changeToLaserPointer: 'l',
          changeToPencil: 'p',
          changeToRectangle: 'r',
          changeToEllipse: 'c',
          changeToEraser: 'e',
          changeToText: 't',
          changeToStraight: 'n',
          changeToArrow: 'a',
          changeToHand: 'h'
        }
      };

      // Join whiteboard room
      const room = await sdk.joinRoom(roomConfig);
      roomRef.current = room;
      setRoom(room);

      // Bind to DOM element
      if (whiteboardElement) {
        room.bindHtmlElement(whiteboardElement);
      }

      // Setup event listeners
      setupRoomEventListeners(room);
      
      setIsConnected(true);
      setConnectionState('connected');

      // Initialize room state
      updateRoomState(room);

    } catch (err) {
      console.error('Whiteboard initialization error:', err);
      setError(err.message);
      setConnectionState('failed');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [channelName, userId, userRole]);

  // Setup room event listeners
  const setupRoomEventListeners = useCallback((room) => {
    // Connection state changes
    room.callbacks.on('onRoomStateChanged', (modifyState) => {
      if (modifyState.broadcastState) {
        const { mode } = modifyState.broadcastState;
        const newState = mode === RoomPhase.Connected ? 'connected' : 
                        mode === RoomPhase.Connecting ? 'connecting' : 
                        mode === RoomPhase.Disconnected ? 'disconnected' : 
                        'failed';
        setConnectionState(newState);
        setIsConnected(newState === 'connected');
      }
      
      // Scene state changes (pages)
      if (modifyState.sceneState) {
        const scenes = room.state.sceneState.scenes;
        const currentIndex = room.state.sceneState.index;
        setCurrentPage(currentIndex + 1);
        setTotalPages(scenes.length);
      }

      // Member state changes (tools, colors, etc.)
      if (modifyState.memberState) {
        const memberState = room.state.memberState;
        if (memberState.currentApplianceName) {
          setCurrentTool(memberState.currentApplianceName);
        }
        if (memberState.strokeColor && memberState.strokeColor.length > 0) {
          setStrokeColor(memberState.strokeColor[0]);
        }
        if (memberState.strokeWidth) {
          setStrokeWidth(memberState.strokeWidth);
        }
      }

      // Room members changes
      if (modifyState.roomMembers) {
        setParticipants(room.state.roomMembers || []);
      }

      // Undo/Redo state
      setCanUndo(room.canUndoSteps > 0);
      setCanRedo(room.canRedoSteps > 0);
    });

    // Disconnection handling
    room.callbacks.on('onDisconnectWithError', (error) => {
      console.error('Whiteboard disconnected with error:', error);
      setError(`Connection lost: ${error.message}`);
      setConnectionState('failed');
      setIsConnected(false);
    });

    // Kicked out of room
    room.callbacks.on('onKickedWithReason', (reason) => {
      console.warn('Kicked from whiteboard:', reason);
      setError(`Removed from whiteboard: ${reason}`);
      setConnectionState('failed');
      setIsConnected(false);
    });

    // Phase change
    room.callbacks.on('onPhaseChanged', (phase) => {
      console.log('Whiteboard phase changed:', phase);
      const newState = phase === RoomPhase.Connected ? 'connected' : 
                      phase === RoomPhase.Connecting ? 'connecting' : 
                      phase === RoomPhase.Disconnected ? 'disconnected' : 
                      'failed';
      setConnectionState(newState);
      setIsConnected(newState === 'connected');
    });

    // Catchable errors
    room.callbacks.on('onCatchErrorWhenAppendFrame', (userId, error) => {
      console.error('Append frame error:', userId, error);
    });

    room.callbacks.on('onCatchErrorWhenRender', (error) => {
      console.error('Render error:', error);
    });

  }, []);

  // Update room state helper
  const updateRoomState = useCallback((room) => {
    if (!room) return;

    try {
      const state = room.state;
      
      // Update pages
      if (state.sceneState) {
        setCurrentPage(state.sceneState.index + 1);
        setTotalPages(state.sceneState.scenes.length);
      }

      // Update participants
      if (state.roomMembers) {
        setParticipants(state.roomMembers);
      }

      // Update undo/redo state
      setCanUndo(room.canUndoSteps > 0);
      setCanRedo(room.canRedoSteps > 0);

      // Update member state
      if (state.memberState) {
        const memberState = state.memberState;
        if (memberState.currentApplianceName) {
          setCurrentTool(memberState.currentApplianceName);
        }
        if (memberState.strokeColor && memberState.strokeColor.length > 0) {
          setStrokeColor(memberState.strokeColor[0]);
        }
        if (memberState.strokeWidth) {
          setStrokeWidth(memberState.strokeWidth);
        }
      }
    } catch (err) {
      console.error('Error updating room state:', err);
    }
  }, []);

  // Tool change handler
  const changeTool = useCallback((toolName, options = {}) => {
    if (!room || isReadOnly) return;

    try {
      const memberState = {
        strokeColor: [strokeColor],
        strokeWidth: strokeWidth,
        ...options
      };

      switch (toolName) {
        case 'pencil':
          room.setMemberState({ ...memberState, currentApplianceName: 'pencil' });
          break;
        case 'eraser':
          room.setMemberState({ currentApplianceName: 'eraser' });
          break;
        case 'rectangle':
          room.setMemberState({ ...memberState, currentApplianceName: 'rectangle' });
          break;
        case 'ellipse':
          room.setMemberState({ ...memberState, currentApplianceName: 'ellipse' });
          break;
        case 'straight':
          room.setMemberState({ ...memberState, currentApplianceName: 'straight' });
          break;
        case 'arrow':
          room.setMemberState({ ...memberState, currentApplianceName: 'arrow' });
          break;
        case 'text':
          room.setMemberState({ 
            currentApplianceName: 'text',
            strokeColor: [strokeColor],
            textSize: strokeWidth * 8
          });
          break;
        case 'hand':
          room.setMemberState({ currentApplianceName: 'hand' });
          break;
        case 'selector':
          room.setMemberState({ currentApplianceName: 'selector' });
          break;
        case 'laserPointer':
          room.setMemberState({ currentApplianceName: 'laserPointer' });
          break;
        default:
          console.warn('Unknown tool:', toolName);
      }

      setCurrentTool(toolName);
    } catch (error) {
      console.error('Tool change error:', error);
      setError(`Failed to change tool: ${error.message}`);
    }
  }, [room, isReadOnly, strokeColor, strokeWidth]);

  // Color change handler
  const changeColor = useCallback((color) => {
    if (!room || isReadOnly) return;

    try {
      room.setMemberState({
        strokeColor: [color]
      });
      setStrokeColor(color);
    } catch (error) {
      console.error('Color change error:', error);
      setError(`Failed to change color: ${error.message}`);
    }
  }, [room, isReadOnly]);

  // Stroke width change handler
  const changeStrokeWidth = useCallback((width) => {
    if (!room || isReadOnly) return;

    try {
      room.setMemberState({
        strokeWidth: width
      });
      setStrokeWidth(width);
    } catch (error) {
      console.error('Stroke width change error:', error);
      setError(`Failed to change stroke width: ${error.message}`);
    }
  }, [room, isReadOnly]);

  // Page navigation
  const nextPage = useCallback(() => {
    if (!room || !isConnected) return;

    try {
      const currentIndex = room.state.sceneState.index;
      const scenes = room.state.sceneState.scenes;
      
      if (currentIndex < scenes.length - 1) {
        room.setSceneIndex(currentIndex + 1);
      }
    } catch (error) {
      console.error('Next page error:', error);
      setError(`Failed to go to next page: ${error.message}`);
    }
  }, [room, isConnected]);

  const previousPage = useCallback(() => {
    if (!room || !isConnected) return;

    try {
      const currentIndex = room.state.sceneState.index;
      
      if (currentIndex > 0) {
        room.setSceneIndex(currentIndex - 1);
      }
    } catch (error) {
      console.error('Previous page error:', error);
      setError(`Failed to go to previous page: ${error.message}`);
    }
  }, [room, isConnected]);

  const addPage = useCallback(() => {
    if (!room || !isConnected || isReadOnly) return;

    try {
      const scenes = room.state.sceneState.scenes;
      const newSceneName = `Scene ${scenes.length + 1}`;
      
      room.putScenes('/', [{ name: newSceneName }], scenes.length);
      room.setSceneIndex(scenes.length);
    } catch (error) {
      console.error('Add page error:', error);
      setError(`Failed to add page: ${error.message}`);
    }
  }, [room, isConnected, isReadOnly]);

  // Undo/Redo operations
  const undo = useCallback(() => {
    if (!room || !canUndo || isReadOnly) return;

    try {
      room.undo();
    } catch (error) {
      console.error('Undo error:', error);
      setError(`Failed to undo: ${error.message}`);
    }
  }, [room, canUndo, isReadOnly]);

  const redo = useCallback(() => {
    if (!room || !canRedo || isReadOnly) return;

    try {
      room.redo();
    } catch (error) {
      console.error('Redo error:', error);
      setError(`Failed to redo: ${error.message}`);
    }
  }, [room, canRedo, isReadOnly]);

  // Clear operations
  const clearCurrentPage = useCallback(() => {
    if (!room || !isConnected || isReadOnly) return;

    try {
      room.cleanCurrentScene();
    } catch (error) {
      console.error('Clear page error:', error);
      setError(`Failed to clear page: ${error.message}`);
    }
  }, [room, isConnected, isReadOnly]);

  const clearAllPages = useCallback(() => {
    if (!room || !isConnected || isReadOnly) return;

    try {
      const scenes = room.state.sceneState.scenes;
      scenes.forEach((_, index) => {
        room.setSceneIndex(index);
        room.cleanCurrentScene();
      });
      room.setSceneIndex(0);
    } catch (error) {
      console.error('Clear all pages error:', error);
      setError(`Failed to clear all pages: ${error.message}`);
    }
  }, [room, isConnected, isReadOnly]);

  // Export/Import functionality
  const exportWhiteboard = useCallback(async (format = 'png') => {
    if (!room || !isConnected) return null;

    try {
      const scenes = room.state.sceneState.scenes;
      const exportPromises = scenes.map(async (scene, index) => {
        const scenePreview = await room.getScenePreviewImage(scene.name, 1920, 1080);
        return {
          pageNumber: index + 1,
          sceneName: scene.name,
          imageUrl: scenePreview
        };
      });

      const exportData = await Promise.all(exportPromises);
      return exportData;
    } catch (error) {
      console.error('Export error:', error);
      setError(`Failed to export whiteboard: ${error.message}`);
      return null;
    }
  }, [room, isConnected]);

  // Disconnect from whiteboard
  const disconnect = useCallback(async () => {
    try {
      if (roomRef.current) {
        await roomRef.current.disconnect();
        roomRef.current = null;
        setRoom(null);
      }
      
      setIsConnected(false);
      setConnectionState('disconnected');
      
      // Reset all states
      setCurrentTool('pencil');
      setStrokeColor('#000000');
      setStrokeWidth(2);
      setCurrentPage(1);
      setTotalPages(1);
      setCanUndo(false);
      setCanRedo(false);
      setParticipants([]);
      setError(null);
      
    } catch (error) {
      console.error('Disconnect error:', error);
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  // Auto-reconnect functionality
  const reconnect = useCallback(async () => {
    if (whiteboardElementRef.current && channelName && userId) {
      try {
        await disconnect();
        await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second
        await initializeWhiteboard(whiteboardElementRef.current);
      } catch (error) {
        console.error('Reconnection failed:', error);
        setError(`Reconnection failed: ${error.message}`);
      }
    }
  }, [channelName, userId, disconnect, initializeWhiteboard]);

  return {
    // State
    room,
    isConnected,
    isLoading,
    error,
    connectionState,
    currentTool,
    strokeColor,
    strokeWidth,
    isReadOnly,
    currentPage,
    totalPages,
    canUndo,
    canRedo,
    participants,

    // Actions
    initializeWhiteboard,
    disconnect,
    reconnect,
    
    // Drawing tools
    changeTool,
    changeColor,
    changeStrokeWidth,
    
    // Page management
    nextPage,
    previousPage,
    addPage,
    
    // Edit operations
    undo,
    redo,
    clearCurrentPage,
    clearAllPages,
    
    // Export/Import
    exportWhiteboard,

    // Utility
    updateRoomState
  };
};
