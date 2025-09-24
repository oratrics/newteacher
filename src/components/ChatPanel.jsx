// components/ChatPanel.jsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import './ChatPanel.css';

const ChatPanel = ({ 
  channelName, 
  userId, 
  userName, 
  onClose 
}) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [typingUsers, setTypingUsers] = useState([]);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  
  const messagesEndRef = useRef(null);
  const chatInputRef = useRef(null);
  const websocketRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  // Common emojis for quick access
  const commonEmojis = ['😀', '😂', '🤔', '👍', '👎', '❤️', '🎉', '📚', '✋', '👏'];

  // Connect to WebSocket for real-time chat
  useEffect(() => {
    const connectWebSocket = () => {
      const wsUrl = process.env.NODE_ENV === 'production' 
        ? `wss://${window.location.host}/ws/chat/${channelName}`
        : `ws://localhost:3001/ws/chat/${channelName}`;

      websocketRef.current = new WebSocket(wsUrl);

      websocketRef.current.onopen = () => {
        setIsConnected(true);
        console.log('Chat WebSocket connected');
        
        // Send join message
        websocketRef.current.send(JSON.stringify({
          type: 'join',
          userId,
          userName,
          timestamp: new Date().toISOString()
        }));
      };

      websocketRef.current.onmessage = (event) => {
        const data = JSON.parse(event.data);
        
        switch (data.type) {
          case 'message':
            setMessages(prev => [...prev, {
              id: data.id || Date.now(),
              userId: data.userId,
              userName: data.userName,
              message: data.message,
              timestamp: data.timestamp,
              type: 'text'
            }]);
            break;
            
          case 'user_joined':
            setMessages(prev => [...prev, {
              id: Date.now(),
              type: 'system',
              message: `${data.userName} joined the chat`,
              timestamp: data.timestamp
            }]);
            break;
            
          case 'user_left':
            setMessages(prev => [...prev, {
              id: Date.now(),
              type: 'system',
              message: `${data.userName} left the chat`,
              timestamp: data.timestamp
            }]);
            break;
            
          case 'typing_start':
            if (data.userId !== userId) {
              setTypingUsers(prev => 
                prev.includes(data.userName) ? prev : [...prev, data.userName]
              );
            }
            break;
            
          case 'typing_stop':
            if (data.userId !== userId) {
              setTypingUsers(prev => prev.filter(name => name !== data.userName));
            }
            break;
            
          default:
            break;
        }
      };

      websocketRef.current.onclose = () => {
        setIsConnected(false);
        console.log('Chat WebSocket disconnected');
        
        // Attempt to reconnect after 3 seconds
        setTimeout(connectWebSocket, 3000);
      };

      websocketRef.current.onerror = (error) => {
        console.error('Chat WebSocket error:', error);
      };
    };

    connectWebSocket();

    return () => {
      if (websocketRef.current) {
        websocketRef.current.close();
      }
    };
  }, [channelName, userId, userName]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Send message
  const sendMessage = useCallback(() => {
    if (!newMessage.trim() || !isConnected) return;

    const messageData = {
      type: 'message',
      userId,
      userName,
      message: newMessage.trim(),
      timestamp: new Date().toISOString()
    };

    websocketRef.current.send(JSON.stringify(messageData));
    setNewMessage('');
    setShowEmojiPicker(false);

    // Stop typing indicator
    if (isTyping) {
      websocketRef.current.send(JSON.stringify({
        type: 'typing_stop',
        userId,
        userName
      }));
      setIsTyping(false);
    }
  }, [newMessage, isConnected, userId, userName, isTyping]);

  // Handle typing indicators
  const handleInputChange = (e) => {
    setNewMessage(e.target.value);

    if (!isTyping && e.target.value.trim()) {
      setIsTyping(true);
      websocketRef.current?.send(JSON.stringify({
        type: 'typing_start',
        userId,
        userName
      }));
    }

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set new timeout to stop typing indicator
    typingTimeoutRef.current = setTimeout(() => {
      if (isTyping) {
        websocketRef.current?.send(JSON.stringify({
          type: 'typing_stop',
          userId,
          userName
        }));
        setIsTyping(false);
      }
    }, 2000);
  };

  // Handle key press
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Add emoji to message
  const addEmoji = (emoji) => {
    setNewMessage(prev => prev + emoji);
    setShowEmojiPicker(false);
    chatInputRef.current?.focus();
  };

  // Format timestamp
  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="chat-panel">
      {/* Chat Header */}
      <div className="chat-header">
        <div className="chat-title">
          <h3>💬 Chat</h3>
          <div className="chat-status">
            <div className={`status-dot ${isConnected ? 'connected' : 'disconnected'}`}></div>
            <span>{isConnected ? 'Connected' : 'Connecting...'}</span>
          </div>
        </div>
        
        <div className="chat-actions">
          <button 
            className="chat-action-btn"
            title="Clear Chat"
            onClick={() => setMessages([])}
          >
            🗑️
          </button>
          <button 
            className="chat-close-btn"
            onClick={onClose}
            title="Close Chat"
          >
            ✕
          </button>
        </div>
      </div>

      {/* Messages Area */}
      <div className="chat-messages">
        {messages.length === 0 ? (
          <div className="empty-chat">
            <div className="empty-chat-content">
              <span className="empty-icon">💬</span>
              <p>No messages yet</p>
              <p className="empty-subtitle">Start the conversation!</p>
            </div>
          </div>
        ) : (
          messages.map((msg) => (
            <div 
              key={msg.id} 
              className={`message ${msg.type} ${msg.userId === userId ? 'own' : 'other'}`}
            >
              {msg.type === 'system' ? (
                <div className="system-message">
                  <span className="system-text">{msg.message}</span>
                  <span className="system-time">{formatTime(msg.timestamp)}</span>
                </div>
              ) : (
                <div className="text-message">
                  {msg.userId !== userId && (
                    <div className="message-author">{msg.userName}</div>
                  )}
                  <div className="message-content">
                    <div className="message-bubble">
                      <p className="message-text">{msg.message}</p>
                      <span className="message-time">{formatTime(msg.timestamp)}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))
        )}

        {/* Typing Indicator */}
        {typingUsers.length > 0 && (
          <div className="typing-indicator">
            <div className="typing-bubble">
              <div className="typing-dots">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
            <div className="typing-text">
              {typingUsers.length === 1 
                ? `${typingUsers[0]} is typing...`
                : `${typingUsers.length} people are typing...`
              }
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Chat Input */}
      <div className="chat-input-container">
        {/* Emoji Picker */}
        {showEmojiPicker && (
          <div className="emoji-picker">
            <div className="emoji-header">
              <span>Frequently used</span>
              <button 
                onClick={() => setShowEmojiPicker(false)}
                className="emoji-close"
              >
                ✕
              </button>
            </div>
            <div className="emoji-grid">
              {commonEmojis.map((emoji, index) => (
                <button
                  key={index}
                  onClick={() => addEmoji(emoji)}
                  className="emoji-btn"
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="chat-input-area">
          <div className="input-row">
            <button
              className="emoji-trigger"
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              title="Add Emoji"
            >
              😀
            </button>
            
            <textarea
              ref={chatInputRef}
              value={newMessage}
              onChange={handleInputChange}
              onKeyPress={handleKeyPress}
              placeholder={isConnected ? "Type a message..." : "Connecting..."}
              disabled={!isConnected}
              className="chat-input"
              rows="1"
              maxLength="500"
            />
            
            <button
              onClick={sendMessage}
              disabled={!newMessage.trim() || !isConnected}
              className="send-btn"
              title="Send Message (Enter)"
            >
              ➤
            </button>
          </div>
          
          <div className="input-footer">
            <div className="message-count">
              {newMessage.length}/500
            </div>
            <div className="chat-hint">
              Press Enter to send, Shift+Enter for new line
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatPanel;
