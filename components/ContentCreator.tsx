import React, { useState, useMemo, useEffect, useContext } from 'react';
import {
  INITIAL_CARD_NEWS_FORM_DATA,
  INITIAL_BLOG_FORM_DATA,
  INITIAL_VIDEO_FORM_DATA,
} from '../constants';
import { generateContent, generateImageForContent } from '../services/geminiService';
import type { CardNewsFormData, BlogFormData, VideoFormData, SavedReport } from '../types';
import { useReports } from '../hooks/useReports';
import { ChatContext } from '../contexts/ChatContext';
import LoadingSpinner from './shared/LoadingSpinner';
import ShareButton from './shared/ShareButton';
import { TrashIcon } from './icons/TrashIcon';
import { PlusIcon } from './icons/PlusIcon';
import { ClipboardDocumentListIcon } from './icons/ClipboardDocumentListIcon';
import { SaveIcon } from './icons/SaveIcon';
import { NewspaperIcon } from './icons/NewspaperIcon';
import { PencilSquareIcon } from './icons/PencilSquareIcon';
import { PresentationChartLineIcon } from './icons/PresentationChartLineIcon';

const CARD_NEWS_FORM_LABELS: { [key in keyof CardNewsFormData]: string } = {
  topic: "주제",
  targetAudience: "핵심 타겟",
  requiredInfo: "필수 포함 정보",
};
const cardNewsFormKeys = Object.keys(INITIAL_CARD_NEWS_FORM_DATA) as (keyof CardNewsFormData)[];

const BLOG_FORM_LABELS: { [key in keyof BlogFormData]: string } = {
  topic: "주제",
  keywords: "핵심 키워드",
  targetAudience: "핵심 타겟",
  tone: "글의 톤앤매너",
};
const blogFormKeys = Object.keys(INITIAL_BLOG_FORM_DATA) as (keyof BlogFormData)[];

const VIDEO_FORM_LABELS: { [key in keyof VideoFormData]: string } = {
  prompt: "영상 주제 및 컨셉",
};
const videoFormKeys = Object.keys(INITIAL_VIDEO_FORM_DATA) as (keyof VideoFormData)[];

type SubTabId = 'card-news' | 'blog' | 'video';

const subTabs: { id: SubTabId; label: string; icon: React.FC<React.SVGProps<SVGSVGElement>>; }[] = [
    { id: 'card-news', label: '카드뉴스', icon: NewspaperIcon },
    { id: 'blog', label: '블로그 포스팅', icon: PencilSquareIcon },
    { id: 'video', label: '영상 스크립트', icon: PresentationChartLineIcon },
];

const ContentCreator: React.FC = () => {
    const [activeSubTab, setActiveSubTab] = useState<SubTabId>('card-news');
    
    const [cardNewsFormData, setCardNewsFormData] = useState<CardNewsFormData>(INITIAL_CARD_NEWS_FORM_DATA);
    const [blogFormData, setBlogFormData] = useState<BlogFormData>(INITIAL_BLOG_FORM_DATA);
    const [videoFormData, setVideoFormData] = useState<VideoFormData>(INITIAL_VIDEO_FORM_DATA);
    
    const [isLoading, setIsLoading] = useState(false);
    const { chatHistory } = useContext(ChatContext);
    const { reports, addReport, updateReport, deleteReport } = useReports('content');
    const [activeReport, setActiveReport] = useState<SavedReport | null>(null);
    const [editedContent, setEditedContent] = useState('');
    const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null);
    const [showSaveSuccess, setShowSaveSuccess] = useState(false);

    useEffect(() => {
        if (activeReport) {
            const subType = (activeReport.subType || 'card-news') as SubTabId;
            setActiveSubTab(subType);
            
            const formData = activeReport.formData || {};
            if (subType === 'card-news') setCardNewsFormData(formData);
            else if (subType === 'blog') setBlogFormData(formData);
            else if (subType === 'video') setVideoFormData(formData);
            
            setEditedContent(activeReport.content);
            setGeneratedImageUrl(activeReport.imageUrl || null);
        } else {
            setCardNewsFormData(INITIAL_CARD_NEWS_FORM_DATA);
            setBlogFormData(INITIAL_BLOG_FORM_DATA);
            setVideoFormData(INITIAL_VIDEO_FORM_DATA);
            setEditedContent('');
            setGeneratedImageUrl(null);
        }
    }, [activeReport]);

    const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        switch (activeSubTab) {
            case 'card-news':
                setCardNewsFormData(prev => ({...prev, [name]: value}));
                break;
            case 'blog':
                setBlogFormData(prev => ({...prev, [name]: value}));
                break;
            case 'video':
                setVideoFormData(prev => ({...prev, [name]: value}));
                break;
        }
    };
    
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setActiveReport(null);
        setEditedContent('');
        setGeneratedImageUrl(null);
    
        let prompt = '';
        let currentFormData: any;
        let title = '';
        let imageUrl: string | null = null;

        switch (activeSubTab) {
            case 'card-news':
                currentFormData = { ...cardNewsFormData };
                title = `카드뉴스: ${currentFormData.topic}`;
                prompt = `# AI 카드뉴스 제작 요청\n## 주제: ${currentFormData.topic}\n## 핵심 타겟: ${currentFormData.targetAudience}\n## 필수 포함 정보: ${currentFormData.requiredInfo}\n## 요청 사항: 위 정보를 바탕으로, 인스타그램에 바로 올릴 수 있는 카드뉴스 콘텐츠를 10장 이내로 제작해주세요. 각 장의 내용을 명확히 구분하고, 이모지를 활용하여 가독성을 높여주세요. 결과물에 마크다운 문법(예: **, #, - 등)을 **절대** 사용하지 마세요. 각 카드 내용은 완결된 문장으로 작성해주세요.\n\n[1번 카드]\n제목...\n\n[2번 카드]\n내용...`;
                break;
            case 'blog':
                currentFormData = { ...blogFormData };
                title = `블로그: ${currentFormData.topic}`;
                prompt = `# AI 블로그 포스팅 작성 요청\n## 주제: ${currentFormData.topic}\n## 핵심 키워드: ${currentFormData.keywords}\n## 핵심 타겟: ${currentFormData.targetAudience}\n## 글의 톤앤매너: ${currentFormData.tone}\n## 요청 사항: 위 정보를 바탕으로, 약국 블로그에 게시할 전문적인 정보성 포스팅을 **완성된 문서 형태**로 작성해주세요. SEO(검색엔진 최적화)를 고려하여 키워드를 자연스럽게 본문에 녹여내고, 독자의 흥미를 유발할 수 있는 도입부와 명확한 결론을 포함해주세요. 결과물에 마크다운 문법(예: **, #, - 등)을 **절대** 사용하지 마세요. 바로 블로그에 게시할 수 있는 **완성된 글**의 형태로, 자연스러운 단락과 소제목으로만 구성해주세요.`;
                break;
            case 'video':
                currentFormData = { ...videoFormData };
                title = `영상 스크립트: ${currentFormData.prompt.substring(0, 20)}...`;
                prompt = `# AI 영상 스크립트 작성 요청\n## 영상 주제 및 컨셉: ${currentFormData.prompt}\n## 요청 사항: 위 컨셉에 맞춰 1분 내외의 유튜브 숏폼(Shorts) 영상 스크립트를 작성해주세요. 약사가 시청자에게 직접 말하는 형태로, 각 장면(Scene)별로 행동 지침(Action)과 대사(Dialogue)를 구분하여 작성해주세요. 시청자의 흥미를 끌 수 있는 도입부와 간결하고 명확한 정보 전달에 초점을 맞춰주세요. 결과물에는 마크다운 문법을 사용하지 마세요.`;
                break;
        }

        const newContent = await generateContent(prompt, {}, chatHistory);
        setEditedContent(newContent);
        
        if (activeSubTab === 'card-news') {
            const imagePrompt = `'${currentFormData.topic}' 주제를 상징하는 심플한 일러스트. 밝고 깨끗한 스타일. 배경에 글자나 텍스트가 전혀 없는 이미지를 생성해주세요.`;
            imageUrl = await generateImageForContent(imagePrompt);
            setGeneratedImageUrl(imageUrl);
        }

        const newReport = addReport({
            title,
            content: newContent,
            formData: currentFormData,
            subType: activeSubTab,
            imageUrl,
        });
        setActiveReport(newReport);
        setIsLoading(false);
    };

    const handleSave = () => {
        if (!activeReport) return;

        let currentFormData;
        switch (activeSubTab) {
            case 'card-news': currentFormData = cardNewsFormData; break;
            case 'blog': currentFormData = blogFormData; break;
            case 'video': currentFormData = videoFormData; break;
        }

        const updatedReport = {
            ...activeReport,
            content: editedContent,
            formData: currentFormData,
            imageUrl: generatedImageUrl,
        };
        updateReport(updatedReport);
        setActiveReport(updatedReport);
        setShowSaveSuccess(true);
        setTimeout(() => setShowSaveSuccess(false), 2000);
    };

    const handleNew = () => {
        setActiveReport(null);
    };
  
    const handleDelete = (reportId: string) => {
        if (window.confirm('정말로 이 보고서를 삭제하시겠습니까?')) {
            deleteReport(reportId);
            if(activeReport?.id === reportId) {
                handleNew();
            }
        }
    };

    const sortedReports = useMemo(() => reports.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()), [reports]);
    const isGenerateDisabled = !!activeReport;

    const renderForm = () => {
        switch(activeSubTab) {
            case 'card-news':
                return cardNewsFormKeys.map(key => (
                    <div key={key}>
                        <label className="block text-sm font-medium text-slate-700">{CARD_NEWS_FORM_LABELS[key]}</label>
                        <textarea name={key} value={cardNewsFormData[key]} onChange={handleFormChange} className="mt-1 block w-full rounded-md border-slate-300 shadow-sm sm:text-sm" rows={2}/>
                    </div>
                ));
            case 'blog':
                return blogFormKeys.map(key => (
                    <div key={key}>
                        <label className="block text-sm font-medium text-slate-700">{BLOG_FORM_LABELS[key]}</label>
                        <textarea name={key} value={blogFormData[key]} onChange={handleFormChange} className="mt-1 block w-full rounded-md border-slate-300 shadow-sm sm:text-sm" rows={2}/>
                    </div>
                ));
            case 'video':
                return videoFormKeys.map(key => (
                    <div key={key}>
                        <label className="block text-sm font-medium text-slate-700">{VIDEO_FORM_LABELS[key]}</label>
                        <textarea name={key} value={videoFormData[key]} onChange={handleFormChange} className="mt-1 block w-full rounded-md border-slate-300 shadow-sm sm:text-sm" rows={3}/>
                    </div>
                ));
            default:
                return null;
        }
    }

    return (
        <div className="p-4 sm:p-8">
          <h2 className="text-3xl font-bold text-slate-800 mb-2">AI 콘텐츠 제작</h2>
          <p className="text-slate-600 mb-6">카드뉴스, 블로그 포스팅, 영상 스크립트 등 다양한 콘텐츠를 AI로 손쉽게 제작하세요.</p>
          
          <div className="grid grid-cols-12 gap-8">
            <div className="col-span-12 lg:col-span-3">
                <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 h-full">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="font-bold text-slate-800 flex items-center"><ClipboardDocumentListIcon className="w-5 h-5 mr-2" /> 저장된 보고서</h3>
                        <button onClick={handleNew} title="새로 만들기" className="p-2 rounded-md hover:bg-slate-100"><PlusIcon className="w-5 h-5 text-slate-600" /></button>
                    </div>
                    <div className="space-y-2 max-h-[600px] overflow-y-auto">
                        {sortedReports.map(report => (
                             <div key={report.id} className="relative group">
                                <button onClick={() => setActiveReport(report)} className={`w-full text-left p-3 rounded-lg ${activeReport?.id === report.id ? 'bg-teal-50 text-teal-800' : 'hover:bg-slate-50'}`}>
                                    <p className="font-semibold text-sm truncate">{report.title}</p>
                                    <p className="text-xs text-slate-500">{new Date(report.createdAt).toLocaleString()}</p>
                                </button>
                                 <button onClick={() => handleDelete(report.id)} className="absolute top-1 right-1 p-1 rounded-full bg-white bg-opacity-50 text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <TrashIcon className="w-4 h-4" />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
    
            <div className="col-span-12 lg:col-span-9 grid grid-cols-1 xl:grid-cols-2 gap-8 items-start">
                <form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 space-y-4">
                    <h3 className="font-bold text-lg">{activeReport ? "보고서 정보 수정" : "새 콘텐츠 생성"}</h3>
                    <div className="border-b border-slate-200">
                        <nav className="-mb-px flex space-x-4 overflow-x-auto" aria-label="Tabs">
                            {subTabs.map((tab) => (
                                <button key={tab.id} onClick={() => setActiveSubTab(tab.id)} type="button"
                                    className={`${
                                        activeSubTab === tab.id
                                        ? 'border-teal-500 text-teal-600'
                                        : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                                    } flex-shrink-0 flex items-center whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm`}
                                >
                                    <tab.icon className="w-5 h-5 mr-2" /> {tab.label}
                                </button>
                            ))}
                        </nav>
                    </div>

                    {renderForm()}
                    
                    <button type="submit" disabled={isLoading || isGenerateDisabled} className="w-full bg-teal-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-teal-700 disabled:bg-slate-400">
                        {isLoading ? '생성 중...' : `AI ${subTabs.find(t=>t.id===activeSubTab)?.label} 생성`}
                    </button>
                </form>
    
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col h-full">
                    <h3 className="text-lg font-semibold text-slate-800 flex items-center p-4 border-b border-slate-200">AI 생성 콘텐츠</h3>
                    <div className="flex-grow flex flex-col">
                        {isLoading && <div className="flex-grow flex items-center justify-center"><LoadingSpinner /></div>}
                        {!isLoading && !activeReport && (
                            <div className="flex-grow flex items-center justify-center text-slate-400">
                                <p>새 콘텐츠를 생성하거나 저장된 보고서를 선택하세요.</p>
                            </div>
                        )}
                        {activeReport && (
                            <>
                                {generatedImageUrl && activeSubTab === 'card-news' && (
                                    <div className="p-4 border-b border-slate-200 bg-slate-50">
                                        <img src={generatedImageUrl} alt="AI 생성 이미지" className="rounded-lg w-full object-contain max-h-60 mx-auto" />
                                    </div>
                                )}
                                <textarea 
                                    value={editedContent} 
                                    onChange={e => setEditedContent(e.target.value)} 
                                    className="w-full flex-grow p-6 bg-white border-0 rounded-lg focus:ring-2 focus:ring-teal-500 focus:outline-none resize-y leading-7 font-sans text-slate-800 min-h-[400px]"
                                />
                                <div className="flex items-center justify-end space-x-4 p-4 border-t border-slate-200 bg-slate-50 rounded-b-xl">
                                    <ShareButton shareContent={{ title: activeReport?.title || '콘텐츠', text: editedContent }} />
                                    <div className="flex items-center">
                                        {showSaveSuccess && <span className="text-sm text-green-600 mr-2 transition-opacity duration-300">✓ 저장됨!</span>}
                                        <button onClick={handleSave} disabled={!activeReport} className="flex items-center justify-center px-4 py-2 bg-teal-600 text-white font-semibold rounded-lg shadow-sm hover:bg-teal-700 disabled:bg-slate-400 disabled:opacity-50" title="수정사항 저장">
                                            <SaveIcon className="w-5 h-5 mr-2" />
                                            <span>저장</span>
                                        </button>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>
          </div>
        </div>
      );
};

export default ContentCreator;