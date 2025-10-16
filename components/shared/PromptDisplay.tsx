
import React, { useState } from 'react';
import { ClipboardIcon } from '../icons/ClipboardIcon';
import { CheckIcon } from '../icons/CheckIcon';

interface PromptDisplayProps {
  title: string;
  prompt: string;
}

const PromptDisplay: React.FC<PromptDisplayProps> = ({ title, prompt }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(prompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-slate-800 rounded-lg p-4 h-full flex flex-col">
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-lg font-semibold text-white">{title}</h3>
        <button
          onClick={handleCopy}
          className="flex items-center space-x-2 bg-slate-700 hover:bg-slate-600 text-white font-semibold py-1 px-3 rounded-md transition-all duration-200 text-sm"
        >
          {copied ? (
            <>
              <CheckIcon className="h-4 w-4 text-green-400" />
              <span>Copied!</span>
            </>
          ) : (
            <>
              <ClipboardIcon className="h-4 w-4" />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>
      <div className="bg-slate-900 rounded-md p-3 text-slate-300 text-sm font-mono overflow-auto flex-grow">
        <pre className="whitespace-pre-wrap">{prompt}</pre>
      </div>
    </div>
  );
};

export default PromptDisplay;