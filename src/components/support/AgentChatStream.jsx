import React, { useState, useEffect, useRef } from 'react';
import {
  Send,
  User,
  ShieldCheck,
  CheckCircle,
  MessageSquare,
  Clock,
  Sparkles,
  Zap,
} from 'lucide-react';
import './AgentChatStream.css';

const CANNED_RESPONSES = [
  {
    label: 'Standard Greeting',
    text: 'Hello! Thank you for reaching out to Dickwella Fashion Corner. My name is Alex. How may I assist you today?',
  },
  {
    label: 'Ask for Order Number',
    text: 'Could you please provide your DFC invoice or order number so I can check your order status in our warehouse system?',
  },
  {
    label: '30-Day Return Courtesy',
    text: 'Our 30-day return policy allows size exchanges and returns for unworn items with original tags attached. We can authorize a pickup or exchange immediately.',
  },
  {
    label: 'Courier Delay Apology',
    text: 'We apologize for the delivery delay. I am contacting Sri Lanka Post EMS dispatch to expedite your parcel delivery today.',
  },
  {
    label: 'Resolution & Closing',
    text: 'I have processed your request. You should receive an email confirmation shortly. Is there anything else I can assist you with today?',
  },
];

export default function AgentChatStream({
  session = null,
  messages = [],
  isCustomerTyping = false,
  onSendMessage,
  onTyping,
  onResolveSession,
}) {
  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef(null);
  const typingTimerRef = useRef(null);

  useEffect(() => {
    if (typeof messagesEndRef.current?.scrollIntoView === 'function') {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isCustomerTyping]);

  if (!session) {
    return (
      <div className="agent-chat-empty-panel" data-testid="agent-chat-empty">
        <MessageSquare size={48} className="empty-chat-icon" />
        <h3 className="empty-chat-title">Select a Conversation</h3>
        <p className="empty-chat-desc">
          Choose an incoming customer inquiry from the left queue to view the conversation history and reply in real time.
        </p>
      </div>
    );
  }

  const handleInputChange = (e) => {
    const val = e.target.value;
    setInputText(val);

    if (onTyping) {
      onTyping(true);
      if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
      typingTimerRef.current = setTimeout(() => {
        onTyping(false);
      }, 1500);
    }
  };

  const handleSend = (e) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    if (onSendMessage) {
      onSendMessage(inputText.trim());
    }
    setInputText('');
    if (onTyping) onTyping(false);
  };

  const handleCannedSelect = (e) => {
    const val = e.target.value;
    if (val) {
      setInputText(val);
      if (onTyping) onTyping(true);
      e.target.value = ''; // Reset select
    }
  };

  const formatTime = (isoString) => {
    if (!isoString) return 'Just now';
    try {
      const date = new Date(isoString);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return 'Just now';
    }
  };

  const isActive = session.status === 'agent_active' || session.status === 'active';

  return (
    <div className="agent-chat-stream-panel" data-testid="agent-chat-stream-panel">
      {/* Header */}
      <div className="stream-header">
        <div className="stream-customer-info">
          <div className="stream-avatar">
            <User size={18} />
          </div>
          <div>
            <div className="stream-name-row">
              <h4 className="stream-customer-name">{session.customer_name || 'Customer'}</h4>
              <span className="stream-session-id">Session #{session.id}</span>
            </div>
            <span className="stream-subject">{session.subject || 'Customer Support Request'}</span>
          </div>
        </div>

        <div className="stream-actions">
          {isActive && (
            <button
              className="resolve-chat-btn"
              onClick={() => onResolveSession && onResolveSession(session)}
              data-testid="resolve-chat-btn"
              title="Mark conversation as resolved"
            >
              <CheckCircle size={15} />
              <span>Resolve Chat</span>
            </button>
          )}
        </div>
      </div>

      {/* Messages Stream */}
      <div className="stream-messages-body" data-testid="stream-messages-body">
        {messages.map((msg, index) => {
          const isAgent = msg.senderRole === 'support_agent' || msg.senderRole === 'admin' || msg.senderRole === 'agent';
          const isBot = msg.senderRole === 'bot';
          const isCustomer = msg.senderRole === 'customer' || msg.senderRole === 'user';

          return (
            <div
              key={msg.id || index}
              className={`stream-msg-row ${isAgent ? 'agent-row' : 'customer-row'}`}
              data-testid={`stream-msg-${msg.id || index}`}
            >
              <div className="stream-msg-group">
                <span className="stream-msg-author">
                  {isAgent ? 'You (Support Agent)' : isBot ? 'Dickwella Virtual Assistant' : session.customer_name || 'Customer'}
                </span>

                <div className={`stream-bubble ${isAgent ? 'agent-bubble' : isBot ? 'bot-bubble' : 'customer-bubble'}`}>
                  <p className="stream-msg-text">{msg.message}</p>
                </div>

                <span className="stream-msg-time">{formatTime(msg.createdAt)}</span>
              </div>
            </div>
          );
        })}

        {/* Real-Time Customer Typing Indicator (AC4) */}
        {isCustomerTyping && (
          <div className="stream-msg-row customer-row" data-testid="customer-typing-indicator">
            <div className="stream-msg-group">
              <div className="stream-bubble customer-bubble customer-typing-bubble">
                <span className="typing-dots">
                  <span className="dot" />
                  <span className="dot" />
                  <span className="dot" />
                </span>
                <span className="typing-text">{session.customer_name || 'Customer'} is typing...</span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Canned Responses & Quick Tools Bar */}
      <div className="canned-responses-bar">
        <div className="canned-select-wrapper">
          <Zap size={13} className="canned-icon" />
          <select
            className="canned-dropdown"
            onChange={handleCannedSelect}
            defaultValue=""
            data-testid="canned-responses-select"
          >
            <option value="" disabled>
              ⚡ Insert quick canned response...
            </option>
            {CANNED_RESPONSES.map((item, idx) => (
              <option key={idx} value={item.text}>
                {item.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Input Bar */}
      <form onSubmit={handleSend} className="stream-input-bar">
        <input
          type="text"
          className="stream-text-input"
          placeholder="Type reply to customer..."
          value={inputText}
          onChange={handleInputChange}
          data-testid="agent-chat-input"
        />
        <button
          type="submit"
          className="stream-send-btn"
          disabled={!inputText.trim()}
          data-testid="agent-chat-send-btn"
          aria-label="Send Reply"
        >
          <Send size={15} />
          <span>Send</span>
        </button>
      </form>
    </div>
  );
}
