// components/ChatSidebar/ChatSidebar.jsx - ENTERPRISE GRADE
import React, { 
  memo, 
  useState, 
  useRef, 
  useEffect, 
  useCallback, 
  useMemo 
} from 'react';
import './ChatSidebar.css';

const ChatMessage = memo(({
  message,
  currentUserId,
  isSystemMessage = false
}) => {
  const isOwn = message.uid === currentUserId;
  const messageRef = useRef(null);

  const formatTime = useCallback((timestamp) => {
    try {
      const date = timestamp instanceof Date ? timestamp : new Date(timestamp);
      if (isNaN(date.getTime())) return '';
      
      return date.toLocaleTimeString([], { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: false
      });
    } catch {
      return '';
    }
  }, []);

  const formatMessage = useCallback((content) => {
    if (typeof content !== 'string') return '';
    
    // Basic XSS protection
    return content
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .trim()
      .slice(0, 1000); // Limit message length
  }, []);

  useEffect(() => {
    // Scroll new messages into view
    if (messageRef.current && !isOwn) {
      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (!entry.isIntersecting) {
            entry.target.scrollIntoView({ 
              behavior: 'smooth', 
              block: 'nearest' 
            });
          }
        });
      }, { threshold: 0.1 });

      observer.observe(messageRef.current);
      return () => observer.disconnect();
    }
  }, [isOwn]);

  if (isSystemMessage) {
    return (
      <div className="chat-message system-message" ref={messageRef}>
        <div className="system-content">
          <span className="system-icon">ℹ️</span>
          <span className="system-text">{formatMessage(message.content || message.message)}</span>
        </div>
        <div className="message-time">{formatTime(message.timestamp)}</div>
      </div>
    );
  }

  return (
    <div 
      className={`chat-message ${isOwn ? 'own-message' : 'other-message'}`}
      ref={messageRef}
    >
      <div className="message-content">
        {!isOwn && (
          <div className="message-header">
            <div className="user-avatar">
              {(message.userName || `User ${message.uid}`).charAt(0).toUpperCase()}
            </div>
            <div className="user-info">
              <span className="user-name">
                {message.userName || `User ${message.uid}`}
              </span>
              <span className="message-time">{formatTime(message.timestamp)}</span>
            </div>
          </div>
        )}
        
        <div className="message-bubble">
          <div 
            className="message-text"
            dangerouslySetInnerHTML={{ __html: formatMessage(message.content || message.message) }}
          />
          {isOwn && (
            <div className="message-time own-time">{formatTime(message.timestamp)}</div>
          )}
        </div>
      </div>
    </div>
  );
});

ChatMessage.displayName = 'ChatMessage';

const ChatSidebar = memo(({
  messages = [],
  currentUser = { uid: 'unknown', name: 'Unknown' },
  onSendMessage = () => {},
  onClose = () => {},
  showNotification = () => {}
}) => {
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isSending, setIsSending] = useState(false);
  
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const chatContainerRef = useRef(null);
  const mountedRef = useRef(true);

  // Sanitize and validate messages
  const validMessages = useMemo(() => {
    if (!Array.isArray(messages)) return [];
    
    return messages
      .filter(msg => msg && typeof msg === 'object' && (msg.content || msg.message))
      .slice(-100) // Limit to last 100 messages to prevent memory issues
      .map(msg => ({
        ...msg,
        id: msg.id || `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        timestamp: msg.timestamp || new Date(),
        uid: msg.uid || 'unknown',
        userName: msg.userName || `User ${msg.uid}`,
        content: msg.content || msg.message || '',
        type: msg.type || 'chat'
      }));
  }, [messages]);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // Auto-scroll to bottom for new messages
  useEffect(() => {
    if (messagesEndRef.current && validMessages.length > 0) {
      const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ 
          behavior: 'smooth',
          block: 'end'
        });
      };

      // Small delay to ensure DOM is updated
      const timeoutId = setTimeout(scrollToBottom, 100);
      return () => clearTimeout(timeoutId);
    }
  }, [validMessages.length]);

  // Focus input when component mounts
  useEffect(() => {
    const timer = setTimeout(() => {
      inputRef.current?.focus();
    }, 300);
    return () => clearTimeout(timer);
  }, []);

  const handleInputChange = useCallback((e) => {
    const value = e.target.value;
    if (value.length <= 500) { // Limit message length
      setInputValue(value);
      setIsTyping(value.length > 0);
    }
  }, []);

  const handleSendMessage = useCallback(async (e) => {
    e?.preventDefault();
    
    if (!inputValue.trim() || isSending || !mountedRef.current) return;

    const messageText = inputValue.trim();
    if (messageText.length === 0) return;

    try {
      setIsSending(true);
      setInputValue('');
      setIsTyping(false);

      await onSendMessage(messageText);
      
      // Success feedback
      if (inputRef.current) {
        inputRef.current.focus();
      }
    } catch (error) {
      console.error('Error sending message:', error);
      showNotification?.('Failed to send message. Please try again.', 'error');
      
      // Restore message on error
      setInputValue(messageText);
    } finally {
      if (mountedRef.current) {
        setIsSending(false);
      }
    }
  }, [inputValue, isSending, onSendMessage, showNotification]);

  const handleKeyPress = useCallback((e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  }, [handleSendMessage]);

  const handleClose = useCallback(() => {
    try {
      onClose();
    } catch (error) {
      console.error('Error closing chat:', error);
    }
  }, [onClose]);

  return (
    <div className="chat-sidebar">
      {/* Header */}
      <div className="chat-header">
        <div className="chat-title">
          <span className="chat-icon">💬</span>
          <h3>Chat</h3>
          <div className="chat-status">
            {validMessages.length} message{validMessages.length !== 1 ? 's' : ''}
          </div>
        </div>
        
        <button
          className="chat-close-btn"
          onClick={handleClose}
          title="Close chat"
          aria-label="Close chat panel"
        >
          ✕
        </button>
      </div>

      {/* Messages */}
      <div className="chat-messages" ref={chatContainerRef}>
        <div className="messages-container">
          {validMessages.length === 0 ? (
            <div className="empty-chat">
              <div className="empty-icon">💬</div>
              <h4>No messages yet</h4>
              <p>Start the conversation by sending a message below.</p>
            </div>
          ) : (
            validMessages.map((message) => (
              <ChatMessage
                key={message.id}
                message={message}
                currentUserId={currentUser.uid}
                isSystemMessage={message.type === 'system'}
              />
            ))
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input */}
      <div className="chat-input-section">
        {isTyping && (
          <div className="typing-indicator">
            <span className="typing-text">Typing...</span>
          </div>
        )}
        
        <form onSubmit={handleSendMessage} className="chat-input-form">
          <div className="input-container">
            <textarea
              ref={inputRef}
              value={inputValue}
              onChange={handleInputChange}
              onKeyPress={handleKeyPress}
              placeholder="Type a message..."
              className="chat-input"
              disabled={isSending}
              maxLength={500}
              rows={1}
              style={{
                resize: 'none',
                minHeight: '44px',
                maxHeight: '120px',
                overflow: 'auto'
              }}
            />
            
            <div className="input-actions">
              <div className="character-count">
                {inputValue.length}/500
              </div>
              
              <button
                type="submit"
                className={`send-btn ${inputValue.trim() ? 'active' : ''}`}
                disabled={!inputValue.trim() || isSending}
                title="Send message (Enter)"
                aria-label="Send message"
              >
                {isSending ? (
                  <div className="send-spinner" />
                ) : (
                  <span className="send-icon">➤</span>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
});

ChatSidebar.displayName = 'ChatSidebar';

export default ChatSidebar;
