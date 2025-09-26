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

// =================== VIRTUAL BACKGROUND PANEL ===================
const VirtualBackgroundPanel = ({ isOpen, onClose, onBackgroundChange }) => {
  const [selectedBg, setSelectedBg] = useState('none');
  const fileInputRef = useRef(null);

  const backgroundOptions = [
    { id: 'none', name: 'None', icon: X },
    { id: 'blur', name: 'Blur', icon: Image },
    { id: 'color', name: 'Green', color: '#00ff00' },
    { id: 'image', name: 'Custom', icon: Image },
  ];

  const handleBackgroundSelect = (bgType) => {
    setSelectedBg(bgType);
    switch (bgType) {
      case 'none': onBackgroundChange('none'); break;
      case 'blur': onBackgroundChange('blur', { blurDegree: 2 }); break;
      case 'color': onBackgroundChange('color', { color: '#00ff00' }); break;
      case 'image': fileInputRef.current?.click(); break;
    }
  };

  const handleImageUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      const img = new Image();
      img.onload = () => onBackgroundChange('image', { imageElement: img });
      img.src = URL.createObjectURL(file);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="absolute top-16 right-4 bg-white rounded-lg shadow-xl border p-4 z-50 w-80">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-800">Virtual Background</h3>
        <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
          <X size={16} />
        </button>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {backgroundOptions.map((option) => {
          const Icon = option.icon;
          return (
            <button
              key={option.id}
              onClick={() => handleBackgroundSelect(option.id)}
              className={`p-4 rounded-lg border-2 transition-all ${
                selectedBg === option.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              {option.color ? (
                <div className="w-8 h-8 rounded mx-auto mb-2" style={{ backgroundColor: option.color }}></div>
              ) : (
                <Icon size={24} className="mx-auto mb-2" />
              )}
              <div className="text-sm font-medium">{option.name}</div>
            </button>
          );
        })}
      </div>
      <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
    </div>
  );
};

export default VirtualBackgroundPanel;
