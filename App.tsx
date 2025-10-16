
import React, { useState, useContext, lazy, Suspense } from 'react';
import { TABS } from './constants';
import type { TabId } from './types';
import { ChatProvider, ChatContext } from './contexts/ChatContext';
import ChatModal from './components/ChatModal';
import { ChatBubbleIcon } from './components/icons/ChatBubbleIcon';
import { PharmacyIcon } from './components/icons/PharmacyIcon';
import { PharmacyDataProvider } from './contexts/PharmacyDataContext';

const Dashboard = lazy(() => import('./components/Dashboard'));
const HiringAssistant = lazy(() => import('./components/HiringAssistant'));
const ProductRecommender = lazy(() => import('./components/ProductRecommender'));
const LaborAnalyzer = lazy(() => import('./components/LaborAnalyzer'));
const ContentCreator = lazy(() => import('./components/ContentCreator'));
const MedicationAssistant = lazy(() => import('./components/MedicationAssistant'));
const CustomerHub = lazy(() => import('./components/CustomerHub'));


const AppContent: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabId>('dashboard');
  const { openChat } = useContext(ChatContext);

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard />;
      case 'hiring':
        return <HiringAssistant />;
      case 'product':
        return <ProductRecommender />;
      case 'labor':
        return <LaborAnalyzer />;
      case 'content':
        return <ContentCreator />;
      case 'medication':
        return <MedicationAssistant />;
      case 'customer':
        return <CustomerHub />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="flex h-screen bg-slate-50 font-sans">
      <aside className="w-64 bg-white border-r border-slate-200 flex flex-col">
        <div className="h-16 flex items-center px-4 border-b border-slate-200">
          <PharmacyIcon className="w-8 h-8 text-teal-600 mr-3 flex-shrink-0" />
          <div>
            <h1 className="text-lg font-bold text-slate-800 leading-tight">피코 AI</h1>
            <p className="text-xs text-slate-500 leading-tight">약국 경영을 위한 맞춤 비서</p>
          </div>
        </div>
        <nav className="flex-1 p-4 space-y-2">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`w-full flex items-center px-4 py-2.5 text-sm font-medium rounded-lg transition-colors duration-200 ${
                activeTab === tab.id
                  ? 'bg-teal-50 text-teal-700'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <tab.icon className="w-5 h-5 mr-3" />
              {tab.label}
            </button>
          ))}
        </nav>
        <div className="p-4 border-t border-slate-200">
            <p className="text-xs text-center text-slate-400">Powered by TP</p>
        </div>
      </aside>
      <main className="flex-1 overflow-y-auto">
        <Suspense fallback={<div className="flex items-center justify-center h-full">로딩 중...</div>}>
            {renderContent()}
        </Suspense>
      </main>
      <button
        onClick={openChat}
        className="fixed bottom-8 right-8 bg-teal-600 text-white p-4 rounded-full shadow-lg hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 transition-transform transform hover:scale-110"
        aria-label="Open AI assistant"
      >
        <ChatBubbleIcon className="w-7 h-7" />
      </button>
      <ChatModal />
    </div>
  );
};

const App: React.FC = () => {
    return (
      <ChatProvider>
        <PharmacyDataProvider>
            <AppContent />
        </PharmacyDataProvider>
      </ChatProvider>
    );
};

export default App;