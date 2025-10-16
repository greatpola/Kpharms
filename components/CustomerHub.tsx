import React, { useState, useContext } from 'react';
import { usePharmacyData } from '../contexts/PharmacyDataContext';
import type { Customer, CommunicationRecord } from '../types';
import { generateContent } from '../services/geminiService';
import { UserPlusIcon } from './icons/UserPlusIcon';
import { MagnifyingGlassIcon } from './icons/MagnifyingGlassIcon';
import { PencilIcon } from './icons/PencilIcon';
import { TrashIcon } from './icons/TrashIcon';
import { ShoppingBagIcon } from './icons/ShoppingBagIcon';
import { CalendarDaysIcon } from './icons/CalendarDaysIcon';
import { ChatBubbleLeftRightIcon } from './icons/ChatBubbleLeftRightIcon';
import { UserIcon } from './icons/UserIcon';
import { ChatBubbleBottomCenterTextIcon } from './icons/ChatBubbleBottomCenterTextIcon';
import CustomerFormModal from './shared/CustomerFormModal';
import ShareButton from './shared/ShareButton';
import LoadingSpinner from './shared/LoadingSpinner';

const CustomerHub: React.FC = () => {
    const { customers, deleteCustomer, updateCustomer } = usePharmacyData();
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [customerToEdit, setCustomerToEdit] = useState<Customer | null>(null);

    // AI Communication State
    const [messageType, setMessageType] = useState('복약지도 리마인더');
    const [generatedMessage, setGeneratedMessage] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [showSaveSuccess, setShowSaveSuccess] = useState(false);

    const filteredCustomers = customers.filter(customer =>
        customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
    ).sort((a,b) => a.name.localeCompare(b.name));

    const handleSelectCustomer = (customer: Customer) => {
        setSelectedCustomer(customer);
        setGeneratedMessage(''); // Reset message when customer changes
    };

    const handleAddNew = () => {
        setCustomerToEdit(null);
        setIsModalOpen(true);
    };

    const handleEdit = (customer: Customer) => {
        setCustomerToEdit(customer);
        setIsModalOpen(true);
    };

    const handleDelete = (e: React.MouseEvent, customerId: string) => {
        e.stopPropagation(); // Prevent card click when deleting
        if (window.confirm('정말로 이 고객 정보를 삭제하시겠습니까?')) {
            deleteCustomer(customerId);
            if (selectedCustomer?.id === customerId) {
                setSelectedCustomer(null);
            }
        }
    };
    
    const handleGenerateMessage = async () => {
        if (!selectedCustomer) return;
        
        setIsGenerating(true);
        setGeneratedMessage('');

        const purchaseHistoryText = selectedCustomer.purchaseHistory.map(p => `- ${p.date}: ${p.item} (${p.quantity}개)`).join('\n');
        const communicationHistoryText = selectedCustomer.communicationHistory.map(c => `- ${new Date(c.date).toLocaleString()}: [${c.type}] ${c.message}`).join('\n');

        const prompt = `
# AI 고객 메시지 생성 요청
당신은 친절하고 전문적인 약사입니다. 아래 고객 정보를 바탕으로 요청된 유형의 메시지를 작성해주세요. 고객의 상황과 구매 이력, 그리고 과거 소통 내용을 자연스럽게 반영하여, 따뜻하고 개인화된 느낌을 주는 것이 중요합니다.

## 고객 정보
- 이름: ${selectedCustomer.name}
- 나이: ${selectedCustomer.age}세
- 성별: ${selectedCustomer.gender}
- 특징: ${selectedCustomer.tags.join(', ')}
- 약사 메모: ${selectedCustomer.notes}
- 최근 구매 이력:
${purchaseHistoryText || '최근 구매 이력 없음'}
- 과거 소통 기록:
${communicationHistoryText || '과거 소통 기록 없음'}

## 요청 사항
- 메시지 유형: ${messageType}
- 작성 지침: 고객에게 보내는 문자 메시지 형식이므로, 이모지를 적절히 사용하여 친근하게 작성해주세요. 과거 소통 기록을 참고하여 메시지가 자연스럽게 이어지도록 해주세요. 마크다운은 사용하지 마세요.
`.trim();

        try {
            const message = await generateContent(prompt);
            setGeneratedMessage(message);
        } catch (error) {
            console.error(error);
            setGeneratedMessage('메시지를 생성하는 중 오류가 발생했습니다. 다시 시도해주세요.');
        } finally {
            setIsGenerating(false);
        }
    };

    const handleSaveMessageToProfile = () => {
        if (!selectedCustomer || !generatedMessage) return;

        const newRecord: CommunicationRecord = {
            date: new Date().toISOString(),
            type: messageType,
            message: generatedMessage,
        };

        const updatedCustomer: Customer = {
            ...selectedCustomer,
            communicationHistory: [newRecord, ...selectedCustomer.communicationHistory],
        };

        updateCustomer(updatedCustomer);
        setSelectedCustomer(updatedCustomer); // Update local state to reflect change immediately
        
        setShowSaveSuccess(true);
        setTimeout(() => setShowSaveSuccess(false), 2000);
    };
    
    const handleSendMessage = () => {
        if(!generatedMessage) return;
        alert(`'${selectedCustomer?.name}'님에게 메시지를 발송했습니다.\n\n내용:\n${generatedMessage}`);
    }

    return (
        <div className="flex h-screen bg-slate-50 font-sans">
            {/* Customer List Panel */}
            <aside className="w-1/3 bg-white border-r border-slate-200 flex flex-col h-full">
                <div className="p-4 border-b border-slate-200">
                     <h2 className="text-xl font-bold text-slate-800 mb-4">고객 목록</h2>
                     <div className="relative">
                        <MagnifyingGlassIcon className="h-5 w-5 text-slate-400 absolute top-1/2 left-3 -translate-y-1/2" />
                        <input
                            type="text"
                            placeholder="이름 또는 태그로 검색..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-teal-500 focus:border-teal-500"
                        />
                    </div>
                </div>
                <nav className="flex-1 p-2 space-y-1 overflow-y-auto">
                    {filteredCustomers.map((customer) => (
                        <button
                            key={customer.id}
                            onClick={() => handleSelectCustomer(customer)}
                            className={`w-full text-left p-3 rounded-lg group transition-colors ${
                                selectedCustomer?.id === customer.id
                                ? 'bg-teal-50 text-teal-800'
                                : 'hover:bg-slate-100'
                            }`}
                        >
                            <div className="flex justify-between items-center">
                                <p className="font-bold text-slate-800">{customer.name}</p>
                                <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button onClick={() => handleEdit(customer)} className="p-1 text-slate-400 hover:text-teal-600 rounded-full"><PencilIcon className="w-4 h-4"/></button>
                                    <button onClick={(e) => handleDelete(e, customer.id)} className="p-1 text-slate-400 hover:text-red-600 rounded-full"><TrashIcon className="w-4 h-4"/></button>
                                </div>
                            </div>
                            <p className="text-sm text-slate-500">{customer.age}세 / {customer.gender}</p>
                        </button>
                    ))}
                </nav>
                 <div className="p-4 border-t border-slate-200">
                    <button 
                        onClick={handleAddNew}
                        className="w-full flex items-center justify-center bg-teal-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-teal-700 transition-colors"
                    >
                        <UserPlusIcon className="w-5 h-5 mr-2" />
                        새 고객 추가
                    </button>
                </div>
            </aside>

            {/* Main Content Panel */}
            <main className="flex-1 p-8 overflow-y-auto">
                 <h2 className="text-3xl font-bold text-slate-800 mb-2">AI 고객 관리 허브</h2>
                 <p className="text-slate-600 mb-6">고객을 선택하여 상세 정보를 확인하고 AI로 맞춤 소통을 시작하세요.</p>
                {selectedCustomer ? (
                    <div className="space-y-8">
                        {/* Customer Details */}
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                            <div className="flex justify-between items-start mb-4">
                                <h3 className="text-2xl font-bold text-slate-800 flex items-center"><UserIcon className="w-7 h-7 mr-3 text-teal-600"/>{selectedCustomer.name}</h3>
                                <div className="flex items-center space-x-2">
                                     <div className="text-sm text-slate-500 flex items-center"><CalendarDaysIcon className="w-4 h-4 mr-1.5"/>마지막 방문: {new Date(selectedCustomer.lastVisit).toLocaleDateString()}</div>
                                     <button onClick={() => handleEdit(selectedCustomer)} className="p-2 text-slate-400 hover:text-teal-600 rounded-full"><PencilIcon className="w-5 h-5"/></button>
                                </div>
                            </div>
                            <div className="flex space-x-2 mb-4">
                                {selectedCustomer.tags.map(tag => (
                                    <span key={tag} className="bg-teal-100 text-teal-800 text-xs font-medium px-2.5 py-0.5 rounded-full">{tag}</span>
                                ))}
                            </div>
                            <p className="text-sm text-slate-700 bg-slate-50 p-3 rounded-lg">{selectedCustomer.notes || '메모가 없습니다.'}</p>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4 pt-4 border-t border-slate-200">
                                <div>
                                    <h4 className="font-semibold text-slate-700 mb-2 flex items-center"><ShoppingBagIcon className="w-5 h-5 mr-2"/>최근 구매 이력</h4>
                                    <ul className="space-y-1 text-sm text-slate-600 max-h-40 overflow-y-auto">
                                        {selectedCustomer.purchaseHistory.length > 0 ? selectedCustomer.purchaseHistory.map((p, i) => (
                                            <li key={i} className="flex justify-between"><span>- {p.item} ({p.quantity}개)</span><span>{new Date(p.date).toLocaleDateString()}</span></li>
                                        )) : <li>구매 이력이 없습니다.</li>}
                                    </ul>
                                </div>
                                <div>
                                    <h4 className="font-semibold text-slate-700 mb-2 flex items-center"><ChatBubbleBottomCenterTextIcon className="w-5 h-5 mr-2"/>소통 기록</h4>
                                     <ul className="space-y-2 text-sm text-slate-600 max-h-40 overflow-y-auto">
                                        {selectedCustomer.communicationHistory.length > 0 ? selectedCustomer.communicationHistory.map((c, i) => (
                                            <li key={i} className="p-2 bg-slate-50 rounded-md">
                                                <div className="flex justify-between items-center text-xs text-slate-500 mb-1">
                                                    <span className="font-semibold text-teal-700">{c.type}</span>
                                                    <span>{new Date(c.date).toLocaleString()}</span>
                                                </div>
                                                <p className="whitespace-pre-wrap">{c.message}</p>
                                            </li>
                                        )) : <li>소통 기록이 없습니다.</li>}
                                    </ul>
                                </div>
                            </div>
                        </div>

                        {/* AI Communication Hub */}
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                             <h3 className="text-xl font-bold text-slate-800 mb-4 flex items-center"><ChatBubbleLeftRightIcon className="w-6 h-6 mr-3 text-teal-600"/>AI 커뮤니케이션 허브</h3>
                             <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                                 <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-slate-700 mb-1">메시지 유형</label>
                                    <select value={messageType} onChange={e => setMessageType(e.target.value)} className="w-full rounded-md border-slate-300">
                                        <option>복약지도 리마인더</option>
                                        <option>건강 팁 제공</option>
                                        <option>안부 인사</option>
                                        <option>영양제 재구매 제안</option>
                                    </select>
                                </div>
                                <div className="self-end">
                                    <button onClick={handleGenerateMessage} disabled={isGenerating} className="w-full bg-teal-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-teal-700 disabled:bg-slate-400">
                                        {isGenerating ? '생성 중...' : 'AI 메시지 생성'}
                                    </button>
                                </div>
                             </div>

                             <div className="relative">
                                <textarea value={generatedMessage} onChange={e => setGeneratedMessage(e.target.value)} placeholder="AI가 생성한 메시지가 여기에 표시됩니다." rows={8} className="w-full rounded-md border-slate-300 p-4"></textarea>
                                {isGenerating && <div className="absolute inset-0 bg-white/70 flex items-center justify-center"><LoadingSpinner/></div>}
                             </div>

                             <div className="mt-4 flex justify-end items-center space-x-3">
                                <ShareButton shareContent={{title: `${selectedCustomer.name}님을 위한 메시지`, text: generatedMessage}} />
                                <div className="flex items-center">
                                    {showSaveSuccess && <span className="text-sm text-green-600 mr-2 transition-opacity duration-300">✓ 저장됨!</span>}
                                    <button onClick={handleSaveMessageToProfile} disabled={!generatedMessage} className="px-4 py-2 bg-teal-600 text-white font-semibold rounded-lg hover:bg-teal-700 disabled:bg-slate-400">기록 저장</button>
                                </div>
                                <button onClick={handleSendMessage} disabled={!generatedMessage} className="px-4 py-2 bg-slate-700 text-white font-semibold rounded-lg hover:bg-slate-800 disabled:bg-slate-400">메시지 발송</button>
                             </div>
                        </div>

                    </div>
                ) : (
                    <div className="flex items-center justify-center h-full text-slate-400">
                        <p>왼쪽 목록에서 고객을 선택해주세요.</p>
                    </div>
                )}
            </main>

            {isModalOpen && (
                <CustomerFormModal 
                    customer={customerToEdit} 
                    onClose={() => setIsModalOpen(false)}
                />
            )}
        </div>
    );
};

export default CustomerHub;