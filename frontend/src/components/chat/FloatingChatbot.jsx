import React, { useState, useRef, useEffect } from 'react';
import {
  Sparkles,
  Minimize2,
  Send,
  Trash2,
  Bot,
  User,
  ArrowRight,
  ShieldAlert,
} from 'lucide-react';
import { generateChatResponse } from '../../lib/chatEngine';

export const FloatingChatbot = ({
  alerts = [],
  vehicles = [],
  districts = [],
  incidents = [],
  routesData = {},
  onSelectRouteOnMap,
  onLocateItem,
  onTabChange,
  onToggleEmergency,
  onOpenReportModal,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [unreadCount, setUnreadCount] = useState(1);

  const [messages, setMessages] = useState([
    {
      id: 'msg-welcome',
      sender: 'assistant',
      text: "👋 **Welcome Officer.** I am the **NER-SHIELD Logistics Copilot**.\n\nI monitor real-time highway accessibility, landslide hazards, and essential supply buffers across the North Eastern Region. How can I assist your logistics coordination today?",
      actions: [
        { label: '🛑 Blocked Corridors', type: 'ROUTE_FILTER', value: 'ROUTE-PRIMARY' },
        { label: '💊 Safe Route to Imphal', type: 'ROUTE_FILTER', value: 'ROUTE-ALTERNATE' },
        { label: '⚠️ District Supply Risk', type: 'TAB_CHANGE', value: 'districts' },
        { label: '🚨 Active Hazard Alerts', type: 'TAB_CHANGE', value: 'alerts' },
      ],
      timestamp: 'Now',
    },
  ]);

  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  const handleOpenChat = () => {
    setIsOpen(true);
    setUnreadCount(0);
  };

  const handleSendMessage = (queryText) => {
    const textToSend = (queryText || inputText).trim();
    if (!textToSend) return;

    const userMsgId = `usr-${messages.length + 1}`;
    const userMessage = {
      id: userMsgId,
      sender: 'user',
      text: textToSend,
      timestamp: 'Now',
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputText('');
    setIsTyping(true);

    setTimeout(() => {
      const response = generateChatResponse(textToSend, {
        alerts,
        vehicles,
        districts,
        incidents,
        routesData,
      });

      const botMessage = {
        id: `bot-${userMsgId}`,
        sender: 'assistant',
        text: response.text,
        actions: response.actions || [],
        timestamp: 'Now',
      };

      setMessages((prev) => [...prev, botMessage]);
      setIsTyping(false);
    }, 450);
  };

  const handleActionClick = (action) => {
    switch (action.type) {
      case 'ROUTE_FILTER':
        if (onSelectRouteOnMap) onSelectRouteOnMap(action.value);
        break;
      case 'LOCATE_ITEM':
        if (onLocateItem) onLocateItem(action.value);
        break;
      case 'TAB_CHANGE':
        if (onTabChange) onTabChange(action.value);
        break;
      case 'TOGGLE_EMERGENCY':
        if (onToggleEmergency) onToggleEmergency();
        break;
      case 'OPEN_REPORT_MODAL':
        if (onOpenReportModal) onOpenReportModal();
        break;
      default:
        break;
    }
  };

  const handleClearChat = () => {
    setMessages([
      {
        id: `msg-${Date.now()}`,
        sender: 'assistant',
        text: 'Chat history cleared. How can I assist you with NER logistics or disaster advisories?',
        actions: [
          { label: '🛑 Blocked Corridors', type: 'ROUTE_FILTER', value: 'ROUTE-PRIMARY' },
          { label: '💊 Safe Route to Imphal', type: 'ROUTE_FILTER', value: 'ROUTE-ALTERNATE' },
          { label: '⚠️ District Supply Risk', type: 'TAB_CHANGE', value: 'districts' },
        ],
        timestamp: 'Now',
      },
    ]);
  };

  const quickChips = [
    '🛑 What roads are blocked?',
    '💊 Safe route for medicines to Imphal',
    '⚠️ Which district has lowest supply buffer?',
    '🚚 Check delayed vehicles',
  ];

  const renderFormattedText = (text) => {
    // Quick parse for bold **text** and bullets
    const lines = text.split('\n');
    return lines.map((line, idx) => {
      const parts = line.split(/(\*\*.*?\*\*)/g);
      const formattedLine = parts.map((part, pIdx) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return <strong key={pIdx}>{part.slice(2, -2)}</strong>;
        }
        return part;
      });

      return (
        <span key={idx} className="chat-text-line">
          {formattedLine}
          {idx < lines.length - 1 && <br />}
        </span>
      );
    });
  };

  return (
    <div className="floating-chatbot-root">
      {/* Floating Trigger Launcher Button */}
      {!isOpen && (
        <button
          onClick={handleOpenChat}
          className="chatbot-launcher-btn"
          aria-label="Open NER-SHIELD AI Assistant"
          title="NER-SHIELD AI Logistics Copilot"
        >
          <div className="launcher-icon-wrapper">
            <Sparkles className="launcher-icon" />
          </div>
          {unreadCount > 0 && <span className="launcher-badge">{unreadCount}</span>}
          <span className="launcher-label">AI Copilot</span>
        </button>
      )}

      {/* Floating Chat Dialog Window */}
      {isOpen && (
        <div className="chatbot-window">
          {/* Chat Header */}
          <div className="chatbot-header">
            <div className="chatbot-brand-group">
              <div className="chatbot-avatar-box">
                <Bot className="chatbot-avatar-icon" />
              </div>
              <div>
                <h4 className="chatbot-title">NER-SHIELD Copilot</h4>
                <div className="chatbot-status-row">
                  <span className="chatbot-status-dot" />
                  <span className="chatbot-status-text">Active Telemetry Sync</span>
                </div>
              </div>
            </div>

            <div className="chatbot-header-actions">
              <button
                onClick={handleClearChat}
                className="chatbot-header-btn"
                title="Clear conversation"
              >
                <Trash2 className="header-btn-icon" />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="chatbot-header-btn"
                title="Minimize assistant"
              >
                <Minimize2 className="header-btn-icon" />
              </button>
            </div>
          </div>

          {/* Quick Context Summary Bar */}
          <div className="chatbot-context-bar">
            <ShieldAlert className="context-shield-icon" />
            <span>
              <strong>Surveillance Context:</strong> {alerts.length} Alerts • {vehicles.length} Trucks Monitored
            </span>
          </div>

          {/* Messages Stream Container */}
          <div className="chatbot-messages-container">
            {messages.map((msg) => {
              const isUser = msg.sender === 'user';
              return (
                <div
                  key={msg.id}
                  className={`chat-message-row ${isUser ? 'message-user' : 'message-assistant'}`}
                >
                  <div className="message-avatar">
                    {isUser ? <User className="msg-avatar-icon" /> : <Bot className="msg-avatar-icon" />}
                  </div>

                  <div className="message-bubble-wrapper">
                    <div className="message-bubble">
                      <div className="message-text">{renderFormattedText(msg.text)}</div>

                      {/* Interactive Action Buttons inside assistant reply */}
                      {msg.actions && msg.actions.length > 0 && (
                        <div className="message-actions-container">
                          {msg.actions.map((act, actIdx) => (
                            <button
                              key={actIdx}
                              onClick={() => handleActionClick(act)}
                              className="chat-action-btn"
                            >
                              <span>{act.label}</span>
                              <ArrowRight className="action-btn-arrow" />
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                    <span className="message-timestamp">{msg.timestamp}</span>
                  </div>
                </div>
              );
            })}

            {isTyping && (
              <div className="chat-message-row message-assistant">
                <div className="message-avatar">
                  <Bot className="msg-avatar-icon" />
                </div>
                <div className="message-bubble typing-bubble">
                  <span className="typing-dot" />
                  <span className="typing-dot" />
                  <span className="typing-dot" />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Suggestion Chips */}
          <div className="chatbot-quick-chips">
            {quickChips.map((chip, chipIdx) => (
              <button
                key={chipIdx}
                onClick={() => handleSendMessage(chip)}
                className="quick-chip-btn"
              >
                {chip}
              </button>
            ))}
          </div>

          {/* Input Box */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="chatbot-input-form"
          >
            <input
              type="text"
              placeholder="Ask about blocked corridors, medicine routes..."
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              className="chatbot-input"
            />
            <button
              type="submit"
              disabled={!inputText.trim()}
              className="chatbot-send-btn"
              aria-label="Send message"
            >
              <Send className="send-icon" />
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

export default FloatingChatbot;
