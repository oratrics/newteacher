// components/AudioControls.jsx
import React, { useState, useEffect } from 'react';
import './AudioControls.css';

const AudioControls = ({
  localMicrophoneTrack,
  isNoiseReductionActive,
  onNoiseReductionToggle,
  onClose
}) => {
  const [audioLevel, setAudioLevel] = useState(0);
  const [selectedMicrophone, setSelectedMicrophone] = useState('');
  const [selectedSpeaker, setSelectedSpeaker] = useState('');
  const [microphones, setMicrophones] = useState([]);
  const [speakers, setSpeakers] = useState([]);
  const [microphoneVolume, setMicrophoneVolume] = useState(100);
  const [speakerVolume, setSpeakerVolume] = useState(100);
  const [isTestingMic, setIsTestingMic] = useState(false);

  // Get available audio devices
  useEffect(() => {
    const getAudioDevices = async () => {
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const mics = devices.filter(device => device.kind === 'audioinput');
        const speakers = devices.filter(device => device.kind === 'audiooutput');
        
        setMicrophones(mics);
        setSpeakers(speakers);
        
        // Set default devices
        if (mics.length > 0) setSelectedMicrophone(mics[0].deviceId);
        if (speakers.length > 0) setSelectedSpeaker(speakers[0].deviceId);
      } catch (error) {
        console.error('Error getting audio devices:', error);
      }
    };

    getAudioDevices();
  }, []);

  // Monitor audio level
  useEffect(() => {
    let animationFrame;
    
    if (localMicrophoneTrack && isTestingMic) {
      const analyzeAudio = () => {
        try {
          const audioContext = new (window.AudioContext || window.webkitAudioContext)();
          const mediaStreamSource = audioContext.createMediaStreamSource(
            new MediaStream([localMicrophoneTrack.getMediaStreamTrack()])
          );
          const analyser = audioContext.createAnalyser();
          analyser.fftSize = 256;
          
          mediaStreamSource.connect(analyser);
          
          const dataArray = new Uint8Array(analyser.frequencyBinCount);
          
          const updateLevel = () => {
            analyser.getByteFrequencyData(dataArray);
            const average = dataArray.reduce((sum, value) => sum + value, 0) / dataArray.length;
            setAudioLevel(Math.min(100, (average / 255) * 100 * 2));
            
            if (isTestingMic) {
              animationFrame = requestAnimationFrame(updateLevel);
            }
          };
          
          updateLevel();
        } catch (error) {
          console.error('Audio analysis error:', error);
        }
      };

      analyzeAudio();
    }

    return () => {
      if (animationFrame) {
        cancelAnimationFrame(animationFrame);
      }
    };
  }, [localMicrophoneTrack, isTestingMic]);

  const handleMicrophoneChange = async (deviceId) => {
    setSelectedMicrophone(deviceId);
    try {
      if (localMicrophoneTrack) {
        await localMicrophoneTrack.setDevice(deviceId);
      }
    } catch (error) {
      console.error('Error changing microphone:', error);
    }
  };

  const handleSpeakerChange = (deviceId) => {
    setSelectedSpeaker(deviceId);
    // Note: Speaker change would need to be handled at the audio element level
  };

  const testMicrophone = () => {
    setIsTestingMic(!isTestingMic);
  };

  return (
    <div className="audio-controls-overlay">
      <div className="audio-controls-modal">
        <div className="modal-header">
          <h3>🎛️ Audio Settings</h3>
          <button onClick={onClose} className="close-btn">✕</button>
        </div>

        <div className="audio-controls-content">
          {/* Microphone Section */}
          <div className="control-section">
            <h4>🎤 Microphone</h4>
            
            <div className="device-selector">
              <label>Select Microphone:</label>
              <select 
                value={selectedMicrophone} 
                onChange={(e) => handleMicrophoneChange(e.target.value)}
                className="device-select"
              >
                {microphones.map(device => (
                  <option key={device.deviceId} value={device.deviceId}>
                    {device.label || `Microphone ${device.deviceId.slice(0, 5)}`}
                  </option>
                ))}
              </select>
            </div>

            <div className="volume-control">
              <label>Microphone Volume: {microphoneVolume}%</label>
              <input
                type="range"
                min="0"
                max="100"
                value={microphoneVolume}
                onChange={(e) => setMicrophoneVolume(e.target.value)}
                className="volume-slider"
              />
            </div>

            <div className="mic-test">
              <button 
                onClick={testMicrophone}
                className={`test-button ${isTestingMic ? 'active' : ''}`}
              >
                {isTestingMic ? '🔴 Stop Test' : '🎤 Test Microphone'}
              </button>
              
              {isTestingMic && (
                <div className="audio-level-indicator">
                  <div className="level-bars">
                    {[...Array(10)].map((_, i) => (
                      <div
                        key={i}
                        className={`level-bar ${audioLevel > (i * 10) ? 'active' : ''}`}
                        style={{ 
                          height: `${20 + (i * 4)}px`,
                          backgroundColor: audioLevel > (i * 10) ? 
                            (i < 6 ? '#10b981' : i < 8 ? '#f59e0b' : '#ef4444') : 
                            '#374151'
                        }}
                      />
                    ))}
                  </div>
                  <span className="level-text">
                    {audioLevel > 5 ? 'Speaking detected' : 'Speak into microphone...'}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Speaker Section */}
          <div className="control-section">
            <h4>🔊 Speaker</h4>
            
            <div className="device-selector">
              <label>Select Speaker:</label>
              <select 
                value={selectedSpeaker} 
                onChange={(e) => handleSpeakerChange(e.target.value)}
                className="device-select"
              >
                {speakers.map(device => (
                  <option key={device.deviceId} value={device.deviceId}>
                    {device.label || `Speaker ${device.deviceId.slice(0, 5)}`}
                  </option>
                ))}
              </select>
            </div>

            <div className="volume-control">
              <label>Speaker Volume: {speakerVolume}%</label>
              <input
                type="range"
                min="0"
                max="100"
                value={speakerVolume}
                onChange={(e) => setSpeakerVolume(e.target.value)}
                className="volume-slider"
              />
            </div>
          </div>

          {/* Advanced Settings */}
          <div className="control-section">
            <h4>⚙️ Advanced Settings</h4>
            
            <div className="setting-item">
              <label className="setting-label">
                <input
                  type="checkbox"
                  checked={isNoiseReductionActive}
                  onChange={onNoiseReductionToggle}
                  className="setting-checkbox"
                />
                <span className="checkmark"></span>
                Noise Reduction
              </label>
              <p className="setting-description">
                Reduce background noise and improve audio clarity
              </p>
            </div>
          </div>

          {/* Audio Quality Info */}
          <div className="audio-quality-info">
            <div className="quality-item">
              <span className="quality-label">Sample Rate:</span>
              <span className="quality-value">48 kHz</span>
            </div>
            <div className="quality-item">
              <span className="quality-label">Bit Rate:</span>
              <span className="quality-value">128 kbps</span>
            </div>
            <div className="quality-item">
              <span className="quality-label">Latency:</span>
              <span className="quality-value"> 50ms</span>
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button onClick={onClose} className="apply-button">
            ✅ Apply Settings
          </button>
        </div>
      </div>
    </div>
  );
};

export default AudioControls;
