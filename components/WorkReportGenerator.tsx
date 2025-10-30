import React, { useState, useMemo, useEffect, useContext } from 'react';
import { INITIAL_WORK_REPORT_FORM_DATA } from '../constants';
import { generateContent } from '../services/geminiService';
import type { WorkReportFormData, SavedReport } from '../types';
import { useReports } from '../hooks/useReports';
import { ChatContext } from '../contexts/ChatContext';
import { usePharmacyData } from '../contexts/PharmacyDataContext';
import LoadingSpinner from './shared/LoadingSpinner';
import ShareButton from './shared/ShareButton';
import { TrashIcon } from './icons/TrashIcon';
import { PlusIcon } from './icons/PlusIcon';
import { ClipboardDocumentListIcon } from './icons/ClipboardDocumentListIcon';
import { SaveIcon } from './icons/SaveIcon';

const WORK_REPORT_FORM_LABELS: { [key in keyof WorkReportFormData]: string } = {
  pharmacistName: "작성자 (약사명)",
  notes: "오늘의 메모 및 특이사항",
};

const workReportFormKeys = Object.keys(INITIAL_WORK_REPORT_FORM_DATA) as (keyof WorkReportFormData)[];

const WorkReportGenerator: React.FC = () => {
  const [formData, setFormData] = useState<WorkReportFormData>(INITIAL_WORK_REPORT_FORM_DATA);
  const [isLoading, setIsLoading] = useState(false);
  const { chatHistory } = useContext(ChatContext);
  const { reports, addReport, updateReport, deleteReport } = useReports('work_report');
  const [activeReport, setActiveReport] = useState<SavedReport | null>(null);
  const [editedContent, setEditedContent] = useState('');
  const [showSaveSuccess, setShowSaveSuccess] = useState(false);
  const { totalSalesToday, alerts, salesHistory } = usePharmacyData();

  useEffect(() => {
    if (activeReport) {
      setFormData(activeReport.formData || INITIAL_WORK_REPORT_FORM_DATA);
      setEditedContent(activeReport.content);
    } else {
      setFormData(INITIAL_WORK_REPORT_FORM_DATA);
      setEditedContent('');
    }
  }, [activeReport]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const generatePrompt = (data: WorkReportFormData): string => {
    const today = new Date();
    const todayString = today.toLocaleDateString('ko-KR');
    const salesCount = totalSalesToday;
    const alertSummary = alerts.length > 0 ? alerts.map(a => a.title).join(', ') : '특이사항 없음';
    
    const todaysSales = salesHistory.filter(s => new Date(s.date).toDateString() === today.toDateString());
    const salesCounts: Record<string, number> = todaysSales.reduce((acc, sale) => {
        acc[sale.name] = (acc[sale.name] || 0) + 1;
        return acc;
    }, {});
    const topItems = Object.entries(salesCounts).sort((a,b) => b[1] - a[1]).slice(0,3).map(item => item[0]).join(', ');

    return `
# AI 근무 보고서 작성 요청
당신은 약국 관리 AI 비서 '피코'입니다. 아래 오늘 약국 현황 데이터와 약사님의 메모를 바탕으로, 간결하고 전문적인 스타일의 일일 근무 보고서를 **완성된 문서 형태**로 작성해주세요. 보고서는 마크다운 형식 없이, 자연스러운 문장과 단락으로 구성되어야 합니다.

## 오늘 약국 현황 (${todayString})
- 총 판매 건수: ${salesCount}건
- 주요 판매 제품: ${topItems || '판매 기록 없음'}
- 시스템 알림: ${alertSummary}

## 약사 메모
- 작성자: ${data.pharmacistName}
- 내용: ${data.notes}

## 보고서 작성 항목
1.  **금일 주요 업무 내용**: 판매 현황과 약사 메모를 종합하여 오늘 있었던 핵심 업무들을 요약해주세요.
2.  **특이사항**: 시스템 알림이나 약사 메모 내용 중 특별히 기록해둘 만한 사항을 간략히 정리해주세요.
3.  **내일 예정된 주요 업무**: 재고 부족 알림 등을 바탕으로 내일 해야 할 일(예: 부족 품목 주문)을 제안해주세요.
4.  **약사 피드백**: 약사 메모 내용을 보고서 형식으로 자연스럽게 포함시켜주세요.

## 최종 결과물 형식
- 마크다운 문법(예: **, #, - 등)을 **절대** 사용하지 마세요.
- 실제 보고서처럼 제목, 각 항목, 그리고 내용으로 구성된 완벽한 문서 형식으로만 생성해야 합니다.
`.trim();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setActiveReport(null);
    setEditedContent('');

    const currentFormData = { ...formData };
    const generatedPrompt = generatePrompt(currentFormData);
    const newContent = await generateContent(generatedPrompt, {}, chatHistory);
    
    setEditedContent(newContent);

    const title = `일일 근무 보고서 (${new Date().toLocaleDateString()})`;
    const newReport = addReport({
        title,
        content: newContent,
        formData: currentFormData,
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
    <div className="p-4 sm:p-8">
      <h2 className="text-3xl font-bold text-slate-800 mb-2">AI 근무 보고서</h2>
      <p className="text-slate-600 mb-6">간단한 메모를 남겨주시면, AI가 오늘의 데이터를 종합하여 근무 보고서를 생성합니다.</p>
      
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
                <h3 className="font-bold text-lg">{activeReport ? "보고서 정보 수정" : "새 근무 보고서 생성"}</h3>
                {workReportFormKeys.map((key) => (
                    <div key={key}>
                        <label className="block text-sm font-medium text-slate-700">{WORK_REPORT_FORM_LABELS[key]}</label>
                        {key === 'notes' ? (
                          <textarea
                            name={key}
                            value={formData[key]}
                            onChange={handleChange}
                            className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-teal-500 focus:ring-teal-500 sm:text-sm"
                            rows={5}
                          />
                        ) : (
                          <input
                            type="text"
                            name={key}
                            value={formData[key]}
                            onChange={handleChange}
                            className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-teal-500 focus:ring-teal-500 sm:text-sm"
                          />
                        )}
                    </div>
                ))}
                <button type="submit" disabled={isLoading || isGenerateDisabled} className="w-full bg-teal-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-teal-700 disabled:bg-slate-400">
                    {isLoading ? '생성 중...' : 'AI 근무 보고서 생성'}
                </button>
            </form>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col h-full">
                <h3 className="text-lg font-semibold text-slate-800 flex items-center p-4 border-b border-slate-200">AI 생성 보고서</h3>
                <div className="flex-grow flex flex-col">
                    {isLoading && <div className="flex-grow flex items-center justify-center"><LoadingSpinner /></div>}
                    {!isLoading && !activeReport && (
                        <div className="flex-grow flex items-center justify-center text-slate-400">
                            <p>새 보고서를 생성하거나 저장된 보고서를 선택하세요.</p>
                        </div>
                    )}
                    {activeReport && (
                        <>
                            <textarea 
                                value={editedContent} 
                                onChange={e => setEditedContent(e.target.value)} 
                                className="w-full flex-grow p-6 bg-white border-0 rounded-lg focus:ring-2 focus:ring-teal-500 focus:outline-none resize-y leading-7 font-sans text-slate-800 min-h-[400px]"
                            />
                            <div className="flex items-center justify-end space-x-4 p-4 border-t border-slate-200 bg-slate-50 rounded-b-xl">
                                <ShareButton shareContent={{ title: activeReport?.title || '근무 보고서', text: editedContent }} />
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

export default WorkReportGenerator;