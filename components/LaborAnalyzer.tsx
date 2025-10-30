import React, { useState, useContext, useMemo, useEffect } from 'react';
import { INITIAL_LABOR_FORM_DATA } from '../constants';
import { generateContent } from '../services/geminiService';
import { Type } from "@google/genai";
import { ChatContext } from '../contexts/ChatContext';
import type { LaborAnalysisData, SavedReport, LaborFormData } from '../types';
import { useReports } from '../hooks/useReports';
import ComparisonChart from './shared/ComparisonChart';
import ShareButton from './shared/ShareButton';
import LoadingSpinner from './shared/LoadingSpinner';

import { TrashIcon } from './icons/TrashIcon';
import { PlusIcon } from './icons/PlusIcon';
import { ClipboardDocumentListIcon } from './icons/ClipboardDocumentListIcon';
import { SaveIcon } from './icons/SaveIcon';

const LABOR_FORM_LABELS: { [key in keyof LaborFormData]: string } = {
  pharmacists: "근무 약사 수",
  staff: "근무 직원 수",
  totalHours: "주당 총 근무 시간",
  totalWages: "월 총 인건비",
  peakTimes: "주요 피크 타임",
};

const laborFormKeys = Object.keys(INITIAL_LABOR_FORM_DATA) as (keyof LaborFormData)[];

const LaborAnalyzer: React.FC = () => {
  const [formData, setFormData] = useState(INITIAL_LABOR_FORM_DATA);
  const [analysisData, setAnalysisData] = useState<LaborAnalysisData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { chatHistory } = useContext(ChatContext);
  const { reports, addReport, updateReport, deleteReport } = useReports('labor');
  const [activeReport, setActiveReport] = useState<SavedReport | null>(null);
  const [editedContent, setEditedContent] = useState('');
  const [showSaveSuccess, setShowSaveSuccess] = useState(false);

  const getShareableText = (reportData: LaborAnalysisData | null): string => {
    if (!reportData) return "분석 결과가 없습니다.";
    let text = `노무 분석 요약 보고서\n\n`;
    text += `■ 종합 분석\n${reportData.analysisSummary}\n\n`;
    text += `■ AI 제안사항\n`;
    reportData.suggestions.forEach((s, i) => {
        text += `${i+1}. ${s.title}\n   - 내용: ${s.description}\n   - 기대 효과: ${s.expectedEffect}\n`;
    });
    return text;
  }

  useEffect(() => {
    if (activeReport) {
        try {
            setAnalysisData(activeReport.formData.analysisData);
            setFormData(activeReport.formData.userInput);
            setEditedContent(activeReport.content);
        } catch(e) {
            console.error("Failed to parse active report content", e);
            setAnalysisData(null);
            setEditedContent('');
            setFormData(INITIAL_LABOR_FORM_DATA);
        }
    } else {
        setAnalysisData(null);
        setEditedContent('');
        setFormData(INITIAL_LABOR_FORM_DATA);
    }
  }, [activeReport]);


  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const responseSchema = {
    type: Type.OBJECT,
    properties: {
        comparison: { type: Type.OBJECT, properties: { pharmacists: { type: Type.OBJECT, properties: { user: { type: Type.NUMBER }, average: { type: Type.NUMBER } } }, staff: { type: Type.OBJECT, properties: { user: { type: Type.NUMBER }, average: { type: Type.NUMBER } } }, totalWages: { type: Type.OBJECT, properties: { user: { type: Type.NUMBER }, average: { type: Type.NUMBER } } }, wagesPerPharmacist: { type: Type.OBJECT, properties: { user: { type: Type.NUMBER }, average: { type: Type.NUMBER } } }, } },
        analysisSummary: { type: Type.STRING, description: "마크다운 문법 없이, 완결된 문장으로 요약해주세요." },
        suggestions: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { title: { type: Type.STRING }, description: { type: Type.STRING, description: "마크다운 문법 없이, 완결된 문장으로 설명해주세요." }, expectedEffect: { type: Type.STRING } } } }
    }
  };


  const generatePrompt = (data: LaborFormData) => `
# AI 노무 분석 전문가
## 약국 인력 현황
- 근무 약사 수: ${data.pharmacists}
- 근무 직원 수: ${data.staff}
- 주당 총 근무 시간: ${data.totalHours}
- 월 총 인건비: ${data.totalWages}
- 주요 피크 타임: ${data.peakTimes}
## 요청 사항
위 데이터를 바탕으로 전국 유사 규모 약국의 평균 데이터와 비교 분석해주세요. 인력 구조의 효율성, 인건비의 적정성을 평가하고, 개선을 위한 구체적인 제안 2-3가지를 제시해주세요. 모든 텍스트 필드(analysisSummary, description 등)에는 마크다운 문법을 절대 사용하지 말고, 완결된 문장으로 서술해주세요.
## 전국 평균 데이터 (가상)
- 약사 수: 1.5명
- 직원 수: 1명
- 월 총 인건비: 1,300만 원
- 약사 1인당 인건비: 867만 원
## 응답 형식
반드시 아래 JSON 스키마에 맞춰 응답해주세요.
`.trim();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setActiveReport(null);
    setAnalysisData(null);
    setEditedContent('');

    const currentFormData = { ...formData };
    const prompt = generatePrompt(currentFormData);
    const response = await generateContent(prompt, { responseMimeType: 'application/json', responseSchema }, chatHistory);
    try {
        const parsedResult: LaborAnalysisData = JSON.parse(response);
        setAnalysisData(parsedResult);
        
        const title = `노무 분석 (${new Date().toLocaleDateString()})`;
        const reportText = getShareableText(parsedResult);
        setEditedContent(reportText);

        const newReport = addReport({
            title,
            content: reportText,
            formData: { userInput: currentFormData, analysisData: parsedResult },
        });
        setActiveReport(newReport);

    } catch (error) {
        console.error("Failed to parse AI response:", error);
        setAnalysisData(null);
        setEditedContent('오류: AI 응답을 분석하는 데 실패했습니다.');
    }
    setIsLoading(false);
  };
  
  const handleSave = () => {
    if (!activeReport) return;
    const currentFormData = { ...formData };
    const updatedReport = {
        ...activeReport,
        content: editedContent,
        formData: { ...activeReport.formData, userInput: currentFormData },
        title: `노무 분석 (${new Date(activeReport.createdAt).toLocaleDateString()})`,
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
    <div className="p-4 sm:p-8">
      <h2 className="text-3xl font-bold text-slate-800 mb-2">AI 노무 분석</h2>
      <p className="text-slate-600 mb-6">약국의 인력 현황 데이터를 입력하면 전국 평균과 비교하여 개선점을 찾아드립니다.</p>
      
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
                <h3 className="font-bold text-lg">{activeReport ? "보고서 정보 수정" : "새 노무 분석 생성"}</h3>
                {laborFormKeys.map((key) => (
                    <div key={key}>
                    <label className="block text-sm font-medium text-slate-700">{LABOR_FORM_LABELS[key]}</label>
                    <input
                        type="text"
                        name={key}
                        value={formData[key]}
                        onChange={handleChange}
                        className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-teal-500 focus:ring-teal-500 disabled:bg-slate-100 sm:text-sm"
                    />
                    </div>
                ))}
                <button type="submit" disabled={isLoading || isGenerateDisabled} className="w-full bg-teal-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-teal-700 disabled:bg-slate-400">
                    {isLoading ? '분석 중...' : 'AI 노무 분석 실행'}
                </button>
            </form>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex flex-col h-full">
                <h3 className="font-bold text-lg mb-4">AI 노무 분석 결과</h3>
                {isLoading && <LoadingSpinner />}
                {!isLoading && !activeReport && (
                    <div className="flex-grow flex items-center justify-center text-slate-400">
                        <p>새 분석을 실행하거나 저장된 보고서를 선택하세요.</p>
                    </div>
                )}
                {activeReport && (
                    <div className="flex flex-col flex-grow h-full space-y-4">
                        {analysisData && (
                            <div>
                                <h4 className="font-bold text-slate-800 mb-2">전국 평균 비교</h4>
                                <ComparisonChart data={analysisData.comparison} />
                            </div>
                        )}
                        
                        <div className="flex flex-col flex-grow">
                            <h4 className="font-bold text-slate-800 mb-2">종합 분석 및 제안</h4>
                            <textarea 
                                value={editedContent} 
                                onChange={e => setEditedContent(e.target.value)} 
                                className="w-full flex-grow p-6 bg-white border-0 rounded-lg focus:ring-2 focus:ring-teal-500 focus:outline-none resize-y leading-7 font-sans text-slate-800 min-h-[200px]"
                            />
                        </div>

                        <div className="flex items-center justify-end space-x-4">
                            <ShareButton shareContent={{ title: activeReport?.title || '노무 분석 결과', text: editedContent }} />
                            <div className="flex items-center">
                                {showSaveSuccess && <span className="text-sm text-green-600 mr-2 transition-opacity duration-300">✓ 저장됨!</span>}
                                <button onClick={handleSave} disabled={!activeReport} className="flex items-center justify-center px-4 py-2 bg-teal-600 text-white font-semibold rounded-lg shadow-sm hover:bg-teal-700 disabled:bg-slate-400 disabled:opacity-50" title="수정사항 저장">
                                    <SaveIcon className="w-5 h-5 mr-2" />
                                    <span>저장</span>
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
      </div>
    </div>
  );
};

export default LaborAnalyzer;