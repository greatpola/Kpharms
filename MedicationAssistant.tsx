import React, { useState, useMemo, useEffect, useContext } from 'react';
import { generateContent, generateContentWithGrounding } from '../services/geminiService';
import { Type } from "@google/genai";
import type { PatientInfo, MedicationInfo, MedicationGuidance, SavedReport } from '../types';
import { useReports } from '../hooks/useReports';
import { ChatContext } from '../contexts/ChatContext';
import { PlusIcon } from './icons/PlusIcon';
import { TrashIcon } from './icons/TrashIcon';
import LoadingSpinner from './shared/LoadingSpinner';
import ShareButton from './shared/ShareButton';
import { ClipboardDocumentListIcon } from './icons/ClipboardDocumentListIcon';
import { SaveIcon } from './icons/SaveIcon';
import { LinkIcon } from './icons/LinkIcon';

const MedicationAssistant: React.FC = () => {
  const [patientInfo, setPatientInfo] = useState<PatientInfo>({
    age: '7',
    condition: '급성 중이염',
    otherMeds: '없음',
    precautions: '항생제 알러지 없음',
  });
  const [medications, setMedications] = useState<MedicationInfo[]>([
    { name: '아목시실린 시럽', dosage: '5ml', frequency: '1일 3회', duration: '7일' },
    { name: '부루펜 시럽', dosage: '4ml', frequency: '필요시 4-6시간 간격', duration: '5일' },
  ]);
  
  const [isLoading, setIsLoading] = useState(false);
  const { chatHistory } = useContext(ChatContext);
  const { reports, addReport, updateReport, deleteReport } = useReports('medication');
  const [activeReport, setActiveReport] = useState<SavedReport | null>(null);
  const [editedContent, setEditedContent] = useState('');
  const [showSaveSuccess, setShowSaveSuccess] = useState(false);
  const [useRealtimeSearch, setUseRealtimeSearch] = useState(false);
  const [sources, setSources] = useState<any[]>([]);

  const formatGuidanceToText = (guidance: MedicationGuidance | null): string => {
    if (!guidance) return "";
    let text = `${guidance.greeting}\n\n`;
    guidance.medications.forEach(med => {
        text += `■ ${med.name}\n`;
        text += `- 복용법: ${med.instructions}\n`;
        text += `- 주의사항: ${med.precautions}\n\n`;
    });
    text += "■ 생활 가이드\n";
    guidance.generalAdvice.forEach(advice => {
        text += `- ${advice}\n`;
    });
    text += `\n${guidance.closing}`;
    return text;
  };

  useEffect(() => {
    if (activeReport) {
        const formData = activeReport.formData || {};
        setPatientInfo(formData.patientInfo || { age: '', condition: '', otherMeds: '', precautions: '' });
        setMedications(formData.medications || []);
        setEditedContent(activeReport.content);
        setSources(activeReport.sources || []);
    } else {
        setPatientInfo({ age: '7', condition: '급성 중이염', otherMeds: '없음', precautions: '항생제 알러지 없음' });
        setMedications([ { name: '아목시실린 시럽', dosage: '5ml', frequency: '1일 3회', duration: '7일' }, { name: '부루펜 시럽', dosage: '4ml', frequency: '필요시 4-6시간 간격', duration: '5일' } ]);
        setEditedContent('');
        setSources([]);
    }
  }, [activeReport]);

  const handlePatientInfoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPatientInfo({ ...patientInfo, [e.target.name]: e.target.value });
  };
  
  const handleMedicationChange = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const newMeds = [...medications];
    newMeds[index] = { ...newMeds[index], [e.target.name]: e.target.value };
    setMedications(newMeds);
  };
  
  const addMedication = () => {
    setMedications([...medications, { name: '', dosage: '', frequency: '', duration: '' }]);
  };

  const removeMedication = (index: number) => {
    setMedications(medications.filter((_, i) => i !== index));
  };

  const responseSchema = {
    type: Type.OBJECT,
    properties: {
      greeting: { type: Type.STRING },
      medications: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING },
            instructions: { type: Type.STRING },
            precautions: { type: Type.STRING }
          }
        }
      },
      generalAdvice: { type: Type.ARRAY, items: { type: Type.STRING } },
      closing: { type: Type.STRING }
    },
    required: ["greeting", "medications", "generalAdvice", "closing"]
  };

  const generatePrompt = (patient: PatientInfo, meds: MedicationInfo[]): string => {
    const medList = meds.map(m => `- ${m.name} (${m.dosage}, ${m.frequency}, ${m.duration})`).join('\n');
    return `
# AI 복약 지도 생성 요청
## 환자 정보
- 나이/특성: ${patient.age}
- 주요 증상: ${patient.condition}
- 병용 약물: ${patient.otherMeds}
- 기타 주의사항: ${patient.precautions}
## 처방 약물 정보
${medList}
## 요청 사항
위 정보를 바탕으로, 보호자가 이해하기 쉽고 친절한 말투로 복약 지도문을 생성해주세요. 각 약물별 복용법과 주의사항을 명확히 구분하고, 일반적인 생활 수칙과 당부사항을 포함하여 안심할 수 있는 메시지를 전달해주세요. 반드시 아래 JSON 스키마에 맞춰 응답해주세요. 모든 텍스트 필드에는 마크다운 문법(예: **, #, - 등)을 **절대** 사용하지 말고, 보호자가 이해하기 쉬운 완결된 문장으로 작성해주세요.
${useRealtimeSearch ? '\n## 추가 요청\n입력된 약물과 환자 상태에 대한 최신 의학 정보(상호작용, 부작용, 가이드라인 등)를 실시간으로 검색하여 복약 지도에 반영해주세요.' : ''}
`.trim();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setActiveReport(null);
    setEditedContent('');
    setSources([]);

    const currentPatientInfo = { ...patientInfo };
    const currentMedications = [...medications];
    const generatedPrompt = generatePrompt(currentPatientInfo, currentMedications);
    
    let aiResponseText = '';
    let newSources: any[] = [];
    let parsedResult: MedicationGuidance | null = null;
    
    try {
        if (useRealtimeSearch) {
            const response = await generateContentWithGrounding(generatedPrompt, chatHistory);
            // Grounding API might not strictly follow JSON schema, so we use its text and sources
            aiResponseText = response.text;
            newSources = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
            // We have to rely on the text part for grounding, can't guarantee JSON
            parsedResult = {
                greeting: "실시간 검색 기반 복약지도입니다.",
                medications: [],
                generalAdvice: [aiResponseText],
                closing: "자세한 내용은 참고 자료를 확인해주세요."
            }
        } else {
            aiResponseText = await generateContent(generatedPrompt, { responseMimeType: 'application/json', responseSchema }, chatHistory);
            parsedResult = JSON.parse(aiResponseText);
        }

        const newContent = formatGuidanceToText(parsedResult);
        setEditedContent(newContent);
        setSources(newSources);
        
        const title = `${currentPatientInfo.condition} 복약지도 (${new Date().toLocaleDateString()})`;
        const newReport = addReport({
            title,
            content: newContent,
            formData: { patientInfo: currentPatientInfo, medications: currentMedications },
            sources: newSources,
        });
        setActiveReport(newReport);

    } catch (error) {
        console.error("Failed to process AI response:", error);
        setEditedContent(`오류: AI 응답을 처리하는 데 실패했습니다.\n\n${aiResponseText}`);
    }
    
    setIsLoading(false);
  };
  
  const handleSave = () => {
    if (!activeReport) return;
    const updatedReport = {
        ...activeReport,
        content: editedContent,
        formData: { patientInfo, medications },
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
      <h2 className="text-3xl font-bold text-slate-800 mb-2">AI 복약지도</h2>
      <p className="text-slate-600 mb-6">환자와 약물 정보를 입력하면 AI가 맞춤형 복약 지도문을 생성해 드립니다.</p>
      
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
              <h3 className="font-bold text-lg">{activeReport ? "보고서 정보 수정" : "새 복약 지도 생성"}</h3>
              <div className="space-y-2 p-3 border rounded-md">
                <h4 className="font-semibold text-slate-800">환자 정보</h4>
                <input name="age" value={patientInfo.age} onChange={handlePatientInfoChange} placeholder="나이/특성" className="w-full text-sm rounded-md border-slate-300 shadow-sm" />
                <input name="condition" value={patientInfo.condition} onChange={handlePatientInfoChange} placeholder="주요 증상" className="w-full text-sm rounded-md border-slate-300 shadow-sm" />
                <input name="otherMeds" value={patientInfo.otherMeds} onChange={handlePatientInfoChange} placeholder="병용 약물" className="w-full text-sm rounded-md border-slate-300 shadow-sm" />
                <input name="precautions" value={patientInfo.precautions} onChange={handlePatientInfoChange} placeholder="기타 주의사항" className="w-full text-sm rounded-md border-slate-300 shadow-sm" />
              </div>
              <div className="space-y-3">
                <h4 className="font-semibold text-slate-800">처방 약물</h4>
                {medications.map((med, index) => (
                  <div key={index} className="grid grid-cols-5 gap-2 items-center p-2 border rounded-md">
                    <input name="name" value={med.name} onChange={e => handleMedicationChange(index, e)} placeholder="약물명" className="col-span-5 text-sm rounded-md border-slate-300 shadow-sm" />
                    <input name="dosage" value={med.dosage} onChange={e => handleMedicationChange(index, e)} placeholder="1회 용량" className="col-span-2 text-sm rounded-md border-slate-300 shadow-sm" />
                    <input name="frequency" value={med.frequency} onChange={e => handleMedicationChange(index, e)} placeholder="복용 횟수" className="col-span-2 text-sm rounded-md border-slate-300 shadow-sm" />
                    <input name="duration" value={med.duration} onChange={e => handleMedicationChange(index, e)} placeholder="총 기간" className="col-span-4 text-sm rounded-md border-slate-300 shadow-sm" />
                    <button type="button" onClick={() => removeMedication(index)} className="col-span-1 p-2 text-slate-400 hover:text-red-500 rounded-full flex justify-center"><TrashIcon className="w-5 h-5"/></button>
                  </div>
                ))}
                <button type="button" onClick={addMedication} className="w-full flex items-center justify-center py-2 border-2 border-dashed border-slate-300 rounded-lg text-sm text-slate-500 hover:bg-slate-50"><PlusIcon className="w-4 h-4 mr-1"/> 약물 추가</button>
              </div>
               <div className="flex items-center space-x-2 pt-2">
                <input
                  type="checkbox"
                  id="realtimeSearchMed"
                  checked={useRealtimeSearch}
                  onChange={(e) => setUseRealtimeSearch(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-teal-600 focus:ring-teal-500"
                  disabled={isGenerateDisabled}
                />
                <label htmlFor="realtimeSearchMed" className="text-sm text-slate-600">최신 의학 정보 실시간 검색</label>
              </div>
              <button type="submit" disabled={isLoading || isGenerateDisabled} className="w-full bg-teal-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-teal-700 disabled:bg-slate-400">
                {isLoading ? '생성 중...' : 'AI 복약 지도 생성'}
              </button>
            </form>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col h-full">
                <h3 className="text-lg font-semibold text-slate-800 flex items-center p-4 border-b border-slate-200">AI 복약 지도</h3>
                <div className="flex-grow flex flex-col">
                    {isLoading && <div className="flex-grow flex items-center justify-center"><LoadingSpinner /></div>}
                    {!isLoading && !activeReport && (
                        <div className="flex-grow flex items-center justify-center text-slate-400">
                            <p>새 복약 지도를 생성하거나 저장된 보고서를 선택하세요.</p>
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
                                <ShareButton shareContent={{ title: activeReport?.title || '복약 지도', text: editedContent }} />
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

export default MedicationAssistant;