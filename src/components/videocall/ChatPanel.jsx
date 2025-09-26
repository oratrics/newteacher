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
const ChatPanel = ({ isOpen, onClose, messages, onSendMessage, currentUser, userRole }) => {
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = (e) => {
    e.preventDefault();
    if (newMessage.trim() && currentUser) {
      onSendMessage({
        id: Date.now(),
        user: currentUser.name || 'You',
        message: newMessage.trim(),
        timestamp: new Date().toLocaleTimeString(),
        isOwn: true,
        role: userRole
      });
      setNewMessage('');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed right-0 top-0 bottom-0 w-80 bg-white border-l shadow-2xl z-40 flex flex-col">
      <div className="p-4 border-b bg-blue-50">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-gray-800">Chat</h3>
          <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full">
            <X size={16} />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
        {messages.length === 0 ? (
          <div className="text-center text-gray-500 mt-8">
            <MessageCircle size={48} className="mx-auto mb-4 opacity-50" />
            <p>No messages yet</p>
          </div>
        ) : (
          messages.map((msg) => (
            <div key={msg.id} className={msg.isOwn ? 'text-right' : 'text-left'}>
              <div className={`inline-block px-4 py-2 rounded-lg max-w-xs ${
                msg.isOwn ? 'bg-blue-500 text-white' : 'bg-white text-gray-800 border'
              }`}>
                {!msg.isOwn && (
                  <div className="flex items-center space-x-1 mb-1">
                    <p className="text-xs font-medium opacity-75">{msg.user}</p>
                    {msg.role === 'teacher' && <Crown size={10} />}
                  </div>
                )}
                <p className="text-sm">{msg.message}</p>
                <p className="text-xs mt-1 opacity-75">{msg.timestamp}</p>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSend} className="p-4 border-t bg-white">
        <div className="flex space-x-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 px-4 py-2 border rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            disabled={!newMessage.trim()}
            className="px-4 py-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 disabled:opacity-50"
          >
            <Send size={16} />
          </button>
        </div>
      </form>
    </div>
  );
};

export default ChatPanel;
