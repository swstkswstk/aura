
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { MessageCircle, X, Send, Paperclip, MessageSquare } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Message } from '../types';
import { getConciergeResponse } from '../services/geminiService';
import { apiService } from '../services/api';

interface ChatWidgetProps {
  onNewMessage?: (msg: Message) => void;
  isOpen?: boolean;
  onToggle?: () => void;
  currentUserId?: string;
  currentUserName?: string;
}

export const ChatWidget: React.FC<ChatWidgetProps> = ({ onNewMessage, isOpen: controlledIsOpen, onToggle, currentUserId, currentUserName }) => {
  // Use controlled state if provided, otherwise local state
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const isOpen = controlledIsOpen !== undefined ? controlledIsOpen : internalIsOpen;

  const toggleOpen = () => {
    if (onToggle) {
      onToggle();
    } else {
      setInternalIsOpen(!internalIsOpen);
    }
  };

  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      sender: 'agent',
      content: 'Welcome to Aura. I am your personal scent concierge. How may I assist you in finding your perfect fragrance today?',
      timestamp: new Date(),
      channel: 'web'
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [activeChannel, setActiveChannel] = useState<'web' | 'whatsapp' | 'telegram'>('web');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isOpen]);

  // Poll for new messages from Telegram (Admin)
  useEffect(() => {
    if (!isOpen || !currentUserId) return;

    const interval = setInterval(async () => {
      try {
        const remoteMsgs = await apiService.getMessages(currentUserId);
        // In a real app, merge carefully. Here we just replace if length differs to show new msgs.
        if (remoteMsgs.length > messages.length) {
          // Preserve local "typing" state or system messages if needed, 
          // but for simplicity, we append the difference or sync.
          // For this demo, let's just append the last one if it's new
          const lastRemote = remoteMsgs[remoteMsgs.length - 1];
          const lastLocal = messages[messages.length - 1];

          if (lastRemote && lastRemote.content !== lastLocal.content) {
            setMessages(prev => [...prev, lastRemote]);
          }
        }
      } catch (e) {
        console.error("Polling error", e);
      }
    }, 5000); // Check every 5 seconds

    return () => clearInterval(interval);
  }, [isOpen, currentUserId, messages]);

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      sender: 'user',
      content: inputValue,
      timestamp: new Date(),
      channel: activeChannel
    };

    setMessages(prev => [...prev, userMsg]);
    setInputValue('');
    setIsTyping(true);

    // Notify parent (for CRM simulation)
    if (onNewMessage) onNewMessage(userMsg);

    // 1. Send to Google Sheets (Telegram)
    if (currentUserId && currentUserName) {
      apiService.sendMessage(currentUserId, currentUserName, inputValue).catch(console.error);
    }

    // AI Response
    // Optional: You can keep the AI response for immediate feedback, 
    // or remove it if you want ONLY human reply via Telegram.
    // For now, we keep it as "Concierge" while you wait for human.
    const responseText = await getConciergeResponse(messages, userMsg.content);

    const agentMsg: Message = {
      id: (Date.now() + 1).toString(),
      sender: 'agent',
      content: responseText,
      timestamp: new Date(),
      channel: activeChannel
    };

    setIsTyping(false);
    setMessages(prev => [...prev, agentMsg]);
    if (onNewMessage) onNewMessage(agentMsg);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <>
      {/* Floating Action Button */}
      <motion.button
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={toggleOpen}
        className={`fixed bottom-8 right-8 z-40 p-4 rounded-full shadow-2xl transition-colors duration-300 
          ${isOpen ? 'bg-transparent shadow-none pointer-events-none' : 'bg-brand-800 text-white'}
        `}
      >
        {!isOpen && <MessageCircle className="w-8 h-8" />}
      </motion.button>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.9 }}
            className="fixed bottom-8 right-8 z-50 w-[90vw] md:w-[400px] h-[600px] bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-brand-100"
          >
            {/* Header */}
            <div className="bg-brand-900 p-4 flex justify-between items-center text-white">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-10 h-10 rounded-full bg-brand-700 flex items-center justify-center font-serif text-lg">A</div>
                  <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-400 rounded-full border-2 border-brand-900"></div>
                </div>
                <div>
                  <h3 className="font-medium text-sm">Aura Concierge</h3>
                  <p className="text-xs text-brand-300">Typically replies instantly</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={toggleOpen} className="p-1 hover:bg-brand-800 rounded">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Channel Switcher (Simulation) */}
            <div className="bg-brand-50 px-4 py-2 border-b border-brand-100 flex gap-2 overflow-x-auto">
              {(['web', 'whatsapp', 'telegram'] as const).map(channel => (
                <button
                  key={channel}
                  onClick={() => setActiveChannel(channel)}
                  className={`text-xs px-3 py-1 rounded-full capitalize border transition-colors
                    ${activeChannel === channel
                      ? 'bg-brand-800 text-white border-brand-800'
                      : 'bg-white text-brand-600 border-brand-200 hover:border-brand-400'
                    }`}
                >
                  {channel}
                </button>
              ))}
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm
                      ${msg.sender === 'user'
                        ? 'bg-brand-800 text-white rounded-br-none'
                        : 'bg-white text-brand-900 rounded-bl-none border border-brand-100'
                      }`}
                  >
                    <p>{msg.content}</p>
                    <div className={`text-[10px] mt-1 flex justify-end gap-1 opacity-70 ${msg.sender === 'user' ? 'text-brand-200' : 'text-brand-400'}`}>
                      <span>{msg.channel}</span>
                      <span>•</span>
                      <span>{msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  </div>
                </div>
              ))}
              {isTyping && (
                <div className="flex justify-start">
                  <div className="bg-white px-4 py-3 rounded-2xl rounded-bl-none border border-brand-100">
                    <div className="flex gap-1">
                      <span className="w-2 h-2 bg-brand-400 rounded-full animate-bounce"></span>
                      <span className="w-2 h-2 bg-brand-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></span>
                      <span className="w-2 h-2 bg-brand-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></span>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 bg-white border-t border-brand-100">
              <div className="flex items-center gap-2">
                <button className="p-2 text-brand-400 hover:bg-brand-50 rounded-full transition">
                  <Paperclip className="w-5 h-5" />
                </button>
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder={`Reply via ${activeChannel}...`}
                  className="flex-1 bg-brand-50 border-none rounded-full px-4 py-2 text-sm focus:ring-1 focus:ring-brand-300 outline-none placeholder:text-brand-400 text-brand-900"
                />
                <button
                  onClick={handleSendMessage}
                  disabled={!inputValue.trim()}
                  className="p-2 bg-brand-800 text-white rounded-full hover:bg-brand-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
              <div className="text-center mt-2">
                <p className="text-[10px] text-brand-400">
                  Powered by Gemini • Seamless Omnichannel Support
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
