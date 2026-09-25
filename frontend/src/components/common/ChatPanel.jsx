import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import {
  MessageSquare,
  Send,
  Radio,
  Bot,
  User,
  Shield,
  Truck,
  MapPin,
  Sparkles,
  X,
  ChevronRight
} from 'lucide-react';

export const ChatPanel = ({ isOpen, onClose, defaultChannel = 'All Channels' }) => {
  const { messages, sendMessage, currentUser, currentRole } = useApp();
  const [selectedChannel, setSelectedChannel] = useState(defaultChannel);
  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef(null);

  const channels = [
    { id: 'All Channels', label: 'All Channels', icon: Radio },
    { id: 'Disaster Ops', label: 'Disaster Ops & BRO', icon: Shield },
    { id: 'Driver Network', label: 'Driver Network', icon: Truck },
    { id: 'Supply Ops', label: 'Supply & Freight', icon: MapPin },
    { id: 'AI Copilot', label: 'AI Logistics Copilot', icon: Bot, highlight: true },
  ];

  const quickPrompts = [
    'Check route condition on NH-6 Dima Hasao',
    'What is the ETA for Medical shipment VEH-101?',
    'Is NH-27 Nagaon bypass clear for heavy freight?',
    'Report sudden fog on Umiam Hill section',
  ];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, selectedChannel]);

  if (!isOpen) return null;

  const handleSend = (e) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    sendMessage(inputText, selectedChannel);
    setInputText('');
  };

  const handleQuickPromptClick = (prompt) => {
    sendMessage(prompt, selectedChannel);
  };

  const filteredMessages = messages.filter((m) => {
    if (selectedChannel === 'All Channels') return true;
    if (selectedChannel === 'AI Copilot') return m.role === 'ai' || m.text.toLowerCase().includes('ai');
    return m.channel === selectedChannel || m.channel === 'All Channels';
  });

  const getRoleIcon = (role) => {
    switch (role) {
      case 'ai':
        return <Bot className="w-3.5 h-3.5 text-cyan-400" />;
      case 'driver':
        return <Truck className="w-3.5 h-3.5 text-emerald-400" />;
      case 'officer':
        return <MapPin className="w-3.5 h-3.5 text-amber-400" />;
      case 'supply':
        return <Radio className="w-3.5 h-3.5 text-cyan-400" />;
      case 'admin':
      default:
        return <Shield className="w-3.5 h-3.5 text-indigo-400" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-lg bg-slate-900 border-l border-slate-800 shadow-2xl flex flex-col justify-between">
          
          {/* Header */}
          <div className="p-4 sm:p-5 border-b border-slate-800 bg-slate-950/60 flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
              <div className="p-2 rounded-xl bg-blue-500/10 border border-blue-500/30 text-blue-400">
                <MessageSquare className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                  NER Emergency Dispatch & AI Copilot
                </h3>
                <p className="text-[11px] text-cyan-400 font-medium">
                  Active Channel: {selectedChannel}
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Channels Selection Tabs */}
          <div className="px-3 py-2 bg-slate-950/40 border-b border-slate-800 flex items-center space-x-1.5 overflow-x-auto text-xs">
            {channels.map((ch) => {
              const Icon = ch.icon;
              const isActive = selectedChannel === ch.id;

              return (
                <button
                  key={ch.id}
                  onClick={() => setSelectedChannel(ch.id)}
                  className={`flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg font-medium whitespace-nowrap transition-all ${
                    isActive
                      ? ch.highlight
                        ? 'bg-cyan-600 text-white shadow-sm shadow-cyan-500/20'
                        : 'bg-blue-600 text-white shadow-sm shadow-blue-500/20'
                      : 'bg-slate-800/80 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{ch.label}</span>
                </button>
              );
            })}
          </div>

          {/* Quick Prompts Bar */}
          <div className="p-2 bg-slate-950/60 border-b border-slate-800/60 overflow-x-auto flex items-center space-x-1.5 text-[11px]">
            <span className="text-slate-500 font-semibold uppercase tracking-wider text-[10px] pl-1 shrink-0">
              <Sparkles className="w-3 h-3 text-cyan-400 inline mr-1" />
              Quick AI:
            </span>
            {quickPrompts.map((prompt, idx) => (
              <button
                key={idx}
                onClick={() => handleQuickPromptClick(prompt)}
                className="px-2 py-0.5 rounded-full bg-slate-800 hover:bg-blue-600/30 hover:text-blue-300 text-slate-300 border border-slate-700 whitespace-nowrap transition-colors"
              >
                {prompt}
              </button>
            ))}
          </div>

          {/* Message Stream */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {filteredMessages.length === 0 ? (
              <div className="text-center py-20 text-slate-500 text-xs">
                No messages in this frequency yet. Send an advisory or ask AI Copilot.
              </div>
            ) : (
              filteredMessages.map((msg) => {
                const isMine = msg.sender === currentUser.name;
                const isAi = msg.role === 'ai';

                return (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${isMine ? 'items-end' : 'items-start'}`}
                  >
                    <div className="flex items-center space-x-1.5 mb-1 px-1 text-[10px] text-slate-400">
                      {getRoleIcon(msg.role)}
                      <span className="font-semibold text-slate-300">{msg.sender}</span>
                      <span>•</span>
                      <span>{msg.timestamp}</span>
                      {msg.channel && (
                        <span className="px-1.5 py-0.2 rounded bg-slate-800 text-cyan-400 font-mono text-[9px]">
                          {msg.channel}
                        </span>
                      )}
                    </div>

                    <div
                      className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-xs leading-relaxed shadow-md ${
                        isAi
                          ? 'bg-gradient-to-br from-cyan-950/80 to-blue-950/80 border border-cyan-500/40 text-cyan-100'
                          : isMine
                          ? 'bg-blue-600 text-white rounded-tr-none'
                          : 'bg-slate-800 border border-slate-700 text-slate-200 rounded-tl-none'
                      }`}
                    >
                      {isAi && (
                        <div className="flex items-center gap-1 text-[10px] text-cyan-400 font-bold uppercase tracking-wider mb-1">
                          <Sparkles className="w-3 h-3" /> AI Logistics Telemetry
                        </div>
                      )}
                      <p>{msg.text}</p>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Footer */}
          <form onSubmit={handleSend} className="p-3 bg-slate-950 border-t border-slate-800">
            <div className="flex items-center space-x-2">
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder={`Broadcast message to ${selectedChannel} or ask AI...`}
                className="flex-1 px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
              />
              <button
                type="submit"
                disabled={!inputText.trim()}
                className="p-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 disabled:opacity-40 text-white transition-all shadow-lg shadow-cyan-500/20"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
            <div className="flex items-center justify-between text-[10px] text-slate-500 mt-1 px-1">
              <span>Broadcasting as: <strong className="text-slate-300">{currentUser.name}</strong></span>
              <span>Encrypted via NER GovNet</span>
            </div>
          </form>

        </div>
      </div>
    </div>
  );
};

export default ChatPanel;
