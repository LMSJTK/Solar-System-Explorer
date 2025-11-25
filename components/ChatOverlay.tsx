import React, { useState, useRef, useEffect } from 'react';
import { Terminal, X, Send } from 'lucide-react';
import { ChatMessage } from '../types';

interface ChatOverlayProps {
  isOpen: boolean;
  messages: ChatMessage[];
  isLoading: boolean;
  onClose: () => void;
  onSendMessage: (message: string) => void;
}

export const ChatOverlay: React.FC<ChatOverlayProps> = ({
  isOpen,
  messages,
  isLoading,
  onClose,
  onSendMessage,
}) => {
  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input when chat opens
  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
    }
  }, [isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim() && !isLoading) {
      onSendMessage(inputValue.trim());
      setInputValue('');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="absolute bottom-36 right-4 w-96 max-w-[calc(100vw-2rem)] bg-black/95 border border-green-500/50 rounded-lg shadow-[0_0_30px_rgba(34,197,94,0.2)] font-mono text-xs overflow-hidden pointer-events-auto animate-in slide-in-from-bottom-4 fade-in duration-300">
      {/* Header */}
      <div className="flex items-center justify-between bg-green-900/20 border-b border-green-500/30 px-3 py-2">
        <div className="flex items-center gap-2 text-green-400">
          <Terminal size={14} />
          <span className="font-bold uppercase tracking-wider">Ship Computer</span>
        </div>
        <button
          onClick={onClose}
          className="text-green-400/70 hover:text-green-400 transition-colors"
        >
          <X size={16} />
        </button>
      </div>

      {/* Messages */}
      <div className="h-64 overflow-y-auto p-3 space-y-3 scrollbar-thin scrollbar-thumb-green-500/30 scrollbar-track-transparent">
        {messages.length === 0 && (
          <div className="text-green-500/50 text-center py-8">
            Communications channel open.
            <br />
            Type a message to begin.
          </div>
        )}

        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex flex-col gap-1 ${
              msg.role === 'user' ? 'items-end' : 'items-start'
            }`}
          >
            <div
              className={`max-w-[85%] px-3 py-2 rounded ${
                msg.role === 'user'
                  ? 'bg-cyan-500/20 text-cyan-200 border border-cyan-500/30'
                  : 'bg-green-900/20 text-green-200 border border-green-500/30'
              }`}
            >
              <div className="text-[10px] opacity-60 mb-1">
                {msg.role === 'user' ? 'PILOT' : 'COMPUTER'}
                {msg.planet && ` • ${msg.planet}`}
              </div>
              <div className="leading-relaxed">{msg.content}</div>
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex items-start gap-2 text-green-400/70">
            <div className="flex gap-1 py-2">
              <span className="animate-pulse">▓</span>
              <span className="animate-pulse delay-100">▓</span>
              <span className="animate-pulse delay-200">▓</span>
            </div>
            <span className="text-[10px] pt-2">Processing query...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="border-t border-green-500/30 p-3">
        <div className="flex items-center gap-2">
          <span className="text-green-500 flex-shrink-0">{'>'}</span>
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            disabled={isLoading}
            placeholder="Query ship computer..."
            className="flex-1 bg-transparent text-green-300 placeholder-green-500/30 outline-none disabled:opacity-50"
            maxLength={200}
          />
          <button
            type="submit"
            disabled={!inputValue.trim() || isLoading}
            className="text-green-500 hover:text-green-400 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <Send size={14} />
          </button>
        </div>
        <div className="text-green-500/40 text-[10px] mt-2">
          Press Enter to send • ESC to close
        </div>
      </form>
    </div>
  );
};
