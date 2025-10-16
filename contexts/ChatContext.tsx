import React, { createContext, useState, useCallback, ReactNode, useEffect } from 'react';
import type { ChatMessage } from '../types';
import { createChatWithTools } from '../services/geminiService';
import { placeOrder } from '../services/supplierService';
import type { Chat } from '@google/genai';

interface AddMessageOptions {
  apiPrompt?: string;
}

interface ChatContextType {
  isChatOpen: boolean;
  openChat: () => void;
  closeChat: () => void;
  chatHistory: ChatMessage[];
  addMessage: (text: string, options?: AddMessageOptions) => Promise<void>;
  handleFileUpload: (file: File) => void;
  isReceiving: boolean;
}

export const ChatContext = createContext<ChatContextType>({
  isChatOpen: false,
  openChat: () => {},
  closeChat: () => {},
  chatHistory: [],
  addMessage: async () => {},
  handleFileUpload: () => {},
  isReceiving: false,
});

const initialMessage: ChatMessage = {
  id: Date.now(),
  role: 'model',
  parts: [{ text: '안녕하세요, 약사님! 저는 약사님의 AI 비서 피코입니다. 무엇이든 물어보세요. 약국 운영에 관한 파일을 첨부하여 저를 학습시킬 수도 있습니다.' }],
};

export const ChatProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([initialMessage]);
  const [isReceiving, setIsReceiving] = useState(false);
  const [chatSession, setChatSession] = useState<Chat | null>(null);

  useEffect(() => {
    if (!chatSession) {
      const newChat = createChatWithTools();
      setChatSession(newChat);
    }
  }, [chatSession]);


  const openChat = useCallback(() => setIsChatOpen(true), []);
  const closeChat = useCallback(() => setIsChatOpen(false), []);

  const addMessage = async (text: string, options?: AddMessageOptions) => {
    if (!chatSession) return;

    const userMessage: ChatMessage = { id: Date.now(), role: 'user', parts: [{ text }] };
    setChatHistory(prev => [...prev, userMessage]);
    setIsReceiving(true);

    const messageToSend = options?.apiPrompt || text;
    
    try {
      let response = await chatSession.sendMessage({ message: messageToSend });

      while (response.functionCalls && response.functionCalls.length > 0) {
        const functionCalls = response.functionCalls;
        
        const thinkingMessage: ChatMessage = { id: Date.now() + 1, role: 'model', parts: [{ text: `잠시만요, 요청하신 작업을 처리하고 있어요... (항목: ${functionCalls.map(fc => fc.name).join(', ')})` }] };
        setChatHistory(prev => [...prev, thinkingMessage]);

        const functionResponses = [];
        for (const fc of functionCalls) {
            if (fc.name === 'placeOrder' && fc.args.items) {
                const result = await placeOrder(fc.args.items);
                functionResponses.push({ id: fc.id, name: fc.name, response: { result } });
            } else {
                 functionResponses.push({ id: fc.id, name: fc.name, response: { result: "알 수 없는 함수 호출입니다." } });
            }
        }
        
        setChatHistory(prev => prev.filter(m => m.id !== thinkingMessage.id));
        response = await chatSession.sendToolResponse({ functionResponses });
      }

      const aiMessage: ChatMessage = {
        id: Date.now() + 2,
        role: 'model',
        parts: [{ text: response.text }],
      };
      setChatHistory(prev => [...prev, aiMessage]);

    } catch (error) {
        console.error("Error during chat:", error);
        const errorMessage: ChatMessage = { id: Date.now() + 2, role: 'model', parts: [{ text: "죄송합니다, 요청을 처리하는 중 오류가 발생했습니다." }] };
        setChatHistory(prev => [...prev, errorMessage]);
    } finally {
        setIsReceiving(false);
    }
  };
  
  const handleFileUpload = (file: File) => {
    const allowedTypes = ['text/plain', 'text/csv'];
    if (!allowedTypes.includes(file.type)) {
        const errorMsg = "텍스트(.txt) 또는 CSV(.csv) 파일만 학습 및 분석할 수 있습니다.";
        const userMsg: ChatMessage = { id: Date.now(), role: 'user', parts: [{ text: `'${file.name}' 파일 첨부` }] };
        const aiMsg: ChatMessage = { id: Date.now()+1, role: 'model', parts: [{ text: errorMsg }] };
        setChatHistory(prev => [...prev, userMsg, aiMsg]);
        return;
    }
    
    const reader = new FileReader();
    reader.onload = (e) => {
        const text = e.target?.result as string;
        const visibleMessage = `'${file.name}' 파일의 데이터를 분석하고 실행 가능한 제안을 해주세요.`;
        const analysisPrompt = `
[시스템 메시지: 약사님이 '${file.name}' 파일을 첨부했습니다. 이 파일의 내용을 전문가로서 분석하고, 데이터에 기반한 핵심 요약과 약국 운영에 도움이 될 구체적인 실행 방안을 제안해주세요. 파일 내용이 데이터가 아닌 일반 텍스트 정보라면, 해당 내용을 학습하고 잘 기억했다고 확인시켜주세요.]
--- 파일 내용 시작 ---
${text}
--- 파일 내용 끝 ---
`;
        addMessage(visibleMessage, { apiPrompt: analysisPrompt });
    };
    reader.onerror = () => {
         const aiMessage: ChatMessage = {
            id: Date.now() + 1,
            role: 'model',
            parts: [{ text: '파일을 읽는 데 실패했습니다. 다시 시도해주세요.' }],
        };
        setChatHistory(prev => [...prev, aiMessage]);
    }
    reader.readAsText(file);
  }

  return (
    <ChatContext.Provider value={{ isChatOpen, openChat, closeChat, chatHistory, addMessage, handleFileUpload, isReceiving }}>
      {children}
    </ChatContext.Provider>
  );
};