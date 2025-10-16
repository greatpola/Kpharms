import React from 'react';
import { SparklesIcon } from '../icons/SparklesIcon';

interface ChatMessageProps {
    sender: 'user' | 'ai';
    children: React.ReactNode;
}

const ChatMessage: React.FC<ChatMessageProps> = ({ sender, children }) => {
    const isAI = sender === 'ai';

    return (
        <div className={`flex items-start gap-4 w-full`}>
            {isAI && (
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-teal-100 flex items-center justify-center ring-2 ring-white">
                    <SparklesIcon className="w-6 h-6 text-teal-600" />
                </div>
            )}

            <div className={`max-w-2xl w-full ${isAI ? 'text-slate-800' : ''}`}>
                {children}
            </div>
        </div>
    );
};
export default ChatMessage;