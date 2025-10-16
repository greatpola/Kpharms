import React from 'react';
import { SparklesIcon } from '../icons/SparklesIcon';

interface ResultDisplayProps {
  isLoading: boolean;
  result: string;
  title: string;
}

const LoadingSpinner: React.FC = () => (
  <div className="flex flex-col items-center justify-center h-full text-slate-500">
    <svg className="animate-spin -ml-1 mr-3 h-8 w-8 text-teal-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
    <p className="mt-2 text-lg">AI가 분석하고 있습니다...</p>
    <p className="text-sm">잠시만 기다려주세요.</p>
  </div>
);

const ResultDisplay: React.FC<ResultDisplayProps> = ({ isLoading, result, title }) => {
  return (
    <>
      <h3 className="text-lg font-semibold text-slate-800 flex items-center p-4 border-b border-slate-200 bg-white rounded-t-xl">
        <SparklesIcon className="h-5 w-5 mr-2 text-teal-500" />
        {title}
      </h3>
      <div className="bg-slate-50 p-4 flex-grow overflow-auto text-slate-700 leading-relaxed min-h-[200px]">
        {isLoading ? (
          <LoadingSpinner />
        ) : result ? (
          <pre className="whitespace-pre-wrap font-sans text-sm">{result}</pre>
        ) : (
          <div className="flex items-center justify-center h-full text-slate-400">
            <p>버튼을 눌러 AI 분석 결과를 생성하세요.</p>
          </div>
        )}
      </div>
    </>
  );
};

export default ResultDisplay;