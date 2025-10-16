import React, { useContext, useRef, useEffect, useState } from 'react';
import { ChatContext } from '../contexts/ChatContext';
import { SparklesIcon } from './icons/SparklesIcon';
import { UserIcon } from './icons/UserIcon';
import { PaperAirplaneIcon } from './icons/PaperAirplaneIcon';
import { XMarkIcon } from './icons/XMarkIcon';
import { PaperClipIcon } from './icons/PaperClipIcon';

const ChatModal: React.FC = () => {
  const { isChatOpen, closeChat, chatHistory, addMessage, handleFileUpload, isReceiving } = useContext(ChatContext);
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(scrollToBottom, [chatHistory, isReceiving]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !isReceiving) {
      addMessage(input);
      setInput('');
    }
  };
  
  const handleFileClick = () => {
      fileInputRef.current?.click();
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files[0]) {
          handleFileUpload(e.target.files[0]);
      }
  }

  if (!isChatOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center z-50 p-4 transition-opacity duration-300" onClick={closeChat}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl h-full max-h-[700px] flex flex-col transform scale-95 hover:scale-100 transition-transform duration-300" onClick={(e) => e.stopPropagation()}>
        
        {/* Header */}
        <header className="flex items-center justify-between p-4 border-b border-slate-200 flex-shrink-0">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-teal-100 rounded-full">
              <SparklesIcon className="w-6 h-6 text-teal-600" />
            </div>
            <div>
              <h2 className="font-bold text-lg text-slate-800">AI 비서 피코</h2>
              <p className="text-sm text-slate-500">무엇이든 물어보세요</p>
            </div>
          </div>
          <button onClick={closeChat} className="p-2 text-slate-400 hover:text-slate-700 rounded-full transition-colors">
            <XMarkIcon className="w-6 h-6" />
          </button>
        </header>

        {/* Messages */}
        <div className="flex-grow p-6 overflow-y-auto space-y-6">
          {chatHistory.map((msg) => (
            <div key={msg.id} className={`flex items-start gap-3 w-full ${msg.role === 'user' ? 'justify-end' : ''}`}>
                {msg.role === 'model' && (
                     <div className="flex-shrink-0 w-9 h-9 rounded-full bg-teal-100 flex items-center justify-center ring-2 ring-white">
                        <SparklesIcon className="w-5 h-5 text-teal-600" />
                    </div>
                )}
                 <div className={`max-w-lg p-3 rounded-xl whitespace-pre-wrap text-sm ${
                      msg.role === 'user'
                        ? 'bg-teal-600 text-white rounded-br-none'
                        : 'bg-slate-100 text-slate-800 rounded-bl-none'
                    }`}>
                        {msg.parts.map(p => p.text).join('')}
                </div>
                {msg.role === 'user' && (
                     <div className="flex-shrink-0 w-9 h-9 rounded-full bg-slate-200 flex items-center justify-center ring-2 ring-white">
                        <UserIcon className="w-5 h-5 text-slate-600" />
                    </div>
                )}
            </div>
          ))}
          {isReceiving && (
            <div className="flex items-start gap-3 w-full">
                <div className="flex-shrink-0 w-9 h-9 rounded-full bg-teal-100 flex items-center justify-center ring-2 ring-white">
                    <SparklesIcon className="w-5 h-5 text-teal-600" />
                </div>
                <div className="max-w-lg p-3 rounded-xl bg-slate-100 text-slate-800 rounded-bl-none flex items-center">
                    <div className="w-2 h-2 bg-teal-500 rounded-full animate-pulse mr-2"></div>
                    <div className="w-2 h-2 bg-teal-500 rounded-full animate-pulse delay-150 mr-2"></div>
                    <div className="w-2 h-2 bg-teal-500 rounded-full animate-pulse delay-300"></div>
                </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <footer className="p-4 border-t border-slate-200 flex-shrink-0">
          <form onSubmit={handleSubmit} className="flex items-center space-x-3">
            <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept=".txt,.csv"/>
            <button type="button" onClick={handleFileClick} className="p-2 text-slate-500 hover:text-teal-600 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-teal-500">
                <PaperClipIcon className="w-6 h-6" />
            </button>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="메시지를 입력하거나 파일을 첨부하세요..."
              className="flex-grow px-4 py-2 bg-slate-100 border border-transparent rounded-full focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-shadow"
              disabled={isReceiving}
            />
            <button type="submit" disabled={!input.trim() || isReceiving} className="p-3 bg-teal-600 text-white rounded-full shadow-sm hover:bg-teal-700 disabled:bg-slate-400 disabled:cursor-not-allowed transition-colors focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2">
              <PaperAirplaneIcon className="w-5 h-5" />
            </button>
          </form>
        </footer>
      </div>
    </div>
  );
};

export default ChatModal;