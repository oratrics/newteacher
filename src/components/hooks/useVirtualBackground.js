// hooks/useVirtualBackground.js
import { useState, useEffect, useCallback, useRef } from 'react';
import VirtualBackgroundExtension from 'agora-extension-virtual-background';

export const useVirtualBackground = (localVideoTrack) => {
  const [isVbActive, setIsVbActive] = useState(false);
  const [backgroundType, setBackgroundType] = useState('none');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const extensionRef = useRef(null);
  const processorRef = useRef(null);

  // Initialize virtual background extension
  useEffect(() => {
    const initializeExtension = async () => {
      try {
        if (!localVideoTrack) return;

        const extension = new VirtualBackgroundExtension();
        await extension.checkCompatibility();
        
        extensionRef.current = extension;
        
        // Load WASM files (you'll need to serve these from your public folder)
        const processor = extension.createProcessor();
        await processor.init('/virtual-background-wasm/');
        
        processorRef.current = processor;
      } catch (err) {
        console.error('Virtual background initialization error:', err);
        setError(err.message);
      }
    };

    initializeExtension();

    return () => {
      if (processorRef.current) {
        processorRef.current.release();
      }
    };
  }, [localVideoTrack]);

  const enableVirtualBackground = useCallback(async (type = 'blur', options = {}) => {
    if (!localVideoTrack || !processorRef.current) {
      throw new Error('Virtual background not available');
    }

    setIsLoading(true);
    setError(null);

    try {
      let bgConfig;

      switch (type) {
        case 'blur':
          bgConfig = { type: 'blur', blurRadius: options.blurRadius || 5 };
          break;
        case 'image':
          if (!options.imageUrl) throw new Error('Image URL required');
          bgConfig = { type: 'img', source: options.imageUrl };
          break;
        case 'color':
          bgConfig = { type: 'color', color: options.color || '#00ff00' };
          break;
        default:
          throw new Error('Invalid background type');
      }

      await processorRef.current.setBackground(bgConfig);
      await localVideoTrack.setProcessor(processorRef.current);

      setIsVbActive(true);
      setBackgroundType(type);
    } catch (err) {
      console.error('Enable virtual background error:', err);
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [localVideoTrack]);

  const disableVirtualBackground = useCallback(async () => {
    if (!localVideoTrack || !processorRef.current) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      await localVideoTrack.setProcessor(null);
      setIsVbActive(false);
      setBackgroundType('none');
    } catch (err) {
      console.error('Disable virtual background error:', err);
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [localVideoTrack]);

  return {
    isVbActive,
    backgroundType,
    isLoading,
    error,
    enableVirtualBackground,
    disableVirtualBackground
  };
};
