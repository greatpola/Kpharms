import React, { useState, useMemo, useEffect, useContext } from 'react';
import { INITIAL_PRODUCT_FORM_DATA } from '../constants';
import { generateContent, generateContentWithGrounding } from '../services/geminiService';
import type { ProductFormData, SavedReport } from '../types';
import { useReports } from '../hooks/useReports';
import { ChatContext } from '../contexts/ChatContext';
import LoadingSpinner from './shared/LoadingSpinner';
import ShareButton from './shared/ShareButton';
import { TrashIcon } from './icons/TrashIcon';
import { PlusIcon } from './icons/PlusIcon';
import { ClipboardDocumentListIcon } from './icons/ClipboardDocumentListIcon';
import { SaveIcon } from './icons/SaveIcon';
import { LinkIcon } from './icons/LinkIcon';

const PRODUCT_FORM_LABELS: { [key in keyof ProductFormData]: string } = {
  pharmacyName: "약국명",
  location: "위치 특성",
  nearbyHospitals: "주변 병원",
  mainCustomers: "주요 고객층",
  currentProducts: "현재 주력 제품군",
};

// FIX: Define keys from the initial data object to prevent mismatches and fix type errors.
const productFormKeys = Object.keys(INITIAL_PRODUCT_FORM_DATA) as (keyof ProductFormData)[];

const ProductRecommender: React.FC = () => {
  const [formData, setFormData] = useState<ProductFormData>(INITIAL_PRODUCT_FORM_DATA);
  const [isLoading, setIsLoading] = useState(false);
  const { chatHistory } = useContext(ChatContext);
  const { reports, addReport, updateReport, deleteReport } = useReports('product');
  const [activeReport, setActiveReport] = useState<SavedReport | null>(null);
  const [editedContent, setEditedContent] = useState('');
  const [showSaveSuccess, setShowSaveSuccess] = useState(false);
  const [useRealtimeSearch, setUseRealtimeSearch] = useState(false);
  const [sources, setSources] = useState<any[]>([]);

  useEffect(() => {
    if (activeReport) {
      setFormData(activeReport.formData || INITIAL_PRODUCT_FORM_DATA);
      setEditedContent(activeReport.content);
      setSources(activeReport.sources || []);
    } else {
      setFormData(INITIAL_PRODUCT_FORM_DATA);
      setEditedContent('');
      setSources([]);
    }
  }, [activeReport]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const generatePrompt = (data: ProductFormData): string => {
    return `
# AI 약국 제품 추천 요청
## 약국 정보
- 약국명: ${data.pharmacyName}
- 위치 특성: ${data.location}
- 주변 병원: ${data.nearbyHospitals}
- 주요 고객층: ${data.mainCustomers}
- 현재 주력 제품군: ${data.currentProducts}
## 요청 사항
위 정보를 바탕으로, 우리 약국에 도입하면 좋을 신규 제품 3가지를 추천해주세요. 각 제품별로 아래 내용을 포함하여 구체적으로 제안해주세요. 마크다운 문법(**, # 등)을 사용하지 말고, 실제 보고서처럼 자연스러운 단락과 제목으로 구성해주세요.
- 제품명
- 추천 이유 (우리 약국의 특성과 연관 지어 설명)
- 예상 타겟 고객
- 마케팅 및 진열 전략
${useRealtimeSearch ? '\n## 추가 요청\n최신 건강 트렌드와 신제품 정보를 실시간으로 검색하여 추천에 반영해주세요.' : ''}
`.trim();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setActiveReport(null);
    setEditedContent('');
    setSources([]);

    const currentFormData = { ...formData };
    const generatedPrompt = generatePrompt(currentFormData);
    let newContent = '';
    let newSources: any[] = [];
    
    if (useRealtimeSearch) {
        const response = await generateContentWithGrounding(generatedPrompt, chatHistory);
        newContent = response.text;
        newSources = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    } else {
        newContent = await generateContent(generatedPrompt, {}, chatHistory);
    }

    setEditedContent(newContent);
    setSources(newSources);

    const title = `${currentFormData.pharmacyName} 맞춤 제품 추천`;
    const newReport = addReport({
        title,
        content: newContent,
        formData: currentFormData,
        sources: newSources,
    });
    setActiveReport(newReport);
    setIsLoading(false);
  };
  
  const handleSave = () => {
    if (!activeReport) return;
    const updatedReport = {
        ...activeReport,
        content: editedContent,
        formData: formData,
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

  return (
    <div className="p-8">
      <h2 className="text-3xl font-bold text-slate-800 mb-2">AI 제품 추천</h2>
      <p className="text-slate-600 mb-6">약국 환경과 고객 데이터를 기반으로 맞춤형 제품을 추천받으세요.</p>
      
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
              <h3 className="font-bold text-lg">{activeReport ? "보고서 정보 수정" : "새 제품 추천 생성"}</h3>
              {productFormKeys.map((key) => (
                <div key={key}>
                  <label className="block text-sm font-medium text-slate-700">{PRODUCT_FORM_LABELS[key]}</label>
                  <textarea
                    name={key}
                    value={formData[key]}
                    onChange={handleChange}
                    className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-teal-500 focus:ring-teal-500 sm:text-sm"
                    rows={2}
                  />
                </div>
              ))}
              <div className="flex items-center space-x-2 pt-2">
                <input
                  type="checkbox"
                  id="realtimeSearch"
                  checked={useRealtimeSearch}
                  onChange={(e) => setUseRealtimeSearch(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-teal-600 focus:ring-teal-500"
                  disabled={isGenerateDisabled}
                />
                <label htmlFor="realtimeSearch" className="text-sm text-slate-600">최신 건강 트렌드 실시간 검색</label>
              </div>
              <button type="submit" disabled={isLoading || isGenerateDisabled} className="w-full bg-teal-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-teal-700 disabled:bg-slate-400">
                {isLoading ? '추천받는 중...' : 'AI 제품 추천받기'}
              </button>
            </form>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col h-full">
                <h3 className="text-lg font-semibold text-slate-800 flex items-center p-4 border-b border-slate-200">AI 추천 제품</h3>
                <div className="flex-grow flex flex-col">
                    {isLoading && <div className="flex-grow flex items-center justify-center"><LoadingSpinner /></div>}
                    {!isLoading && !activeReport && (
                        <div className="flex-grow flex items-center justify-center text-slate-400">
                            <p>새 추천을 받거나 저장된 보고서를 선택하세요.</p>
                        </div>
                    )}
                    {activeReport && (
                        <>
                            <textarea 
                                value={editedContent} 
                                onChange={e => setEditedContent(e.target.value)} 
                                className="w-full flex-grow p-6 bg-white border-0 rounded-lg focus:ring-2 focus:ring-teal-500 focus:outline-none resize-y leading-7 font-sans text-slate-800 min-h-[400px]"
                            />
                            {sources.length > 0 && (
                                <div className="p-4 border-t border-slate-200">
                                    <h4 className="font-bold text-sm text-slate-700 flex items-center mb-2">
                                        <LinkIcon className="w-4 h-4 mr-2" />
                                        참고 자료
                                    </h4>
                                    <ul className="space-y-1">
                                        {sources.map((source, index) => (
                                            <li key={index} className="text-xs text-blue-600 hover:underline truncate">
                                                <a href={source.web.uri} target="_blank" rel="noopener noreferrer">{source.web.title || source.web.uri}</a>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                            <div className="flex items-center justify-end space-x-4 p-4 border-t border-slate-200 bg-slate-50 rounded-b-xl">
                                <ShareButton shareContent={{ title: activeReport?.title || '제품 추천', text: editedContent }} />
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

export default ProductRecommender;