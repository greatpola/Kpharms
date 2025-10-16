import React, { useEffect, useState } from 'react';
import { usePharmacyData } from '../contexts/PharmacyDataContext';
import { BellAlertIcon } from './icons/BellAlertIcon';
import { ExclamationTriangleIcon } from './icons/ExclamationTriangleIcon';
import { LightBulbIcon } from './icons/LightBulbIcon';
import { ArrowTrendingUpIcon } from './icons/ArrowTrendingUpIcon';
import { CurrencyDollarIcon } from './icons/CurrencyDollarIcon';
import { ArchiveBoxXMarkIcon } from './icons/ArchiveBoxXMarkIcon';
import { SparklesIcon } from './icons/SparklesIcon';
import SalesTrendChart from './shared/SalesTrendChart';
import PeakHoursHeatMap from './shared/PeakHoursHeatMap';
import InventoryMovers from './shared/InventoryMovers';
import { generateContent } from '../services/geminiService';


const Dashboard: React.FC = () => {
    const { alerts, totalSalesToday, expiringSoonCount, inventory, salesHistory } = usePharmacyData();
    const [aiMessage, setAiMessage] = useState('');
    const [isAiMessageLoading, setIsAiMessageLoading] = useState(true);

    useEffect(() => {
        const fetchAiMessage = async () => {
            const prompt = "당신은 약사님의 AI 비서 '피코'입니다. 약사님에게 아침 인사를 건네며 오늘 하루를 응원하는 친근한 메시지를 생성해주세요. 실제 사람이 말을 건네는 것처럼 자연스럽고 따뜻한 말투를 사용하고, 절대로 마크다운 문법(**, # 등)을 사용하지 마세요. 메시지는 한두 문장으로 간결하게 작성해주세요.";
            try {
                const message = await generateContent(prompt);
                setAiMessage(message);
            } catch (error) {
                console.error("Failed to fetch AI message:", error);
                setAiMessage("오늘도 약사님의 하루를 응원합니다! 힘찬 하루 보내세요."); // Fallback message
            } finally {
                setIsAiMessageLoading(false);
            }
        };

        fetchAiMessage();
    }, []);

    const lowStockCount = inventory.filter(item => item.quantity < 10).length;

    const getAlertIcon = (type: string) => {
        switch (type) {
            case 'low_stock': return <ExclamationTriangleIcon className="w-6 h-6 text-red-500" />;
            case 'expiring_soon': return <ExclamationTriangleIcon className="w-6 h-6 text-yellow-500" />;
            case 'sales_opportunity': return <LightBulbIcon className="w-6 h-6 text-blue-500" />;
            default: return <BellAlertIcon className="w-6 h-6 text-slate-500" />;
        }
    };

    return (
        <div className="p-8 bg-slate-50">
            <h2 className="text-3xl font-bold text-slate-800 mb-2">대시보드</h2>
            <p className="text-slate-600 mb-6">오늘의 약국 현황을 한눈에 확인하세요.</p>

            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200">
                    <div className="flex items-center">
                        <div className="bg-blue-100 p-3 rounded-full mr-4"><CurrencyDollarIcon className="w-6 h-6 text-blue-600" /></div>
                        <div>
                            <p className="text-sm text-slate-500">오늘 판매 건수</p>
                            <p className="text-2xl font-bold text-slate-800">{totalSalesToday.toLocaleString()}</p>
                        </div>
                    </div>
                </div>
                 <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200">
                    <div className="flex items-center">
                        <div className="bg-green-100 p-3 rounded-full mr-4"><ArrowTrendingUpIcon className="w-6 h-6 text-green-600" /></div>
                        <div>
                            <p className="text-sm text-slate-500">총 재고 품목</p>
                            <p className="text-2xl font-bold text-slate-800">{inventory.length}</p>
                        </div>
                    </div>
                </div>
                 <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200">
                    <div className="flex items-center">
                        <div className="bg-red-100 p-3 rounded-full mr-4"><ArchiveBoxXMarkIcon className="w-6 h-6 text-red-600" /></div>
                        <div>
                            <p className="text-sm text-slate-500">재고 부족</p>
                            <p className="text-2xl font-bold text-slate-800">{lowStockCount}</p>
                        </div>
                    </div>
                </div>
                 <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200">
                    <div className="flex items-center">
                        <div className="bg-yellow-100 p-3 rounded-full mr-4"><ExclamationTriangleIcon className="w-6 h-6 text-yellow-600" /></div>
                        <div>
                            <p className="text-sm text-slate-500">유통기한 임박</p>
                            <p className="text-2xl font-bold text-slate-800">{expiringSoonCount}</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Alerts & AI Message */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                        <h3 className="font-bold text-lg text-slate-800 mb-4">주요 알림</h3>
                        <div className="space-y-4">
                            {alerts.length > 0 ? alerts.map(alert => (
                                <div key={alert.id} className="flex items-start">
                                    <div className="flex-shrink-0 mr-3 mt-1">{getAlertIcon(alert.type)}</div>
                                    <div>
                                        <p className="font-semibold text-sm text-slate-700">{alert.title}</p>
                                        <p className="text-xs text-slate-500">{alert.message}</p>
                                    </div>
                                </div>
                            )) : <p className="text-sm text-slate-400">새로운 알림이 없습니다.</p>}
                        </div>
                    </div>
                     <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                        <h3 className="font-bold text-lg text-slate-800 mb-4 flex items-center">
                            <SparklesIcon className="w-5 h-5 mr-2 text-teal-500" />
                            오늘의 AI 비서 메시지
                        </h3>
                        {isAiMessageLoading ? (
                            <div className="flex items-center justify-center h-20">
                                <p className="text-sm text-slate-400">메시지를 생성 중입니다...</p>
                            </div>
                        ) : (
                            <p className="text-sm text-slate-700 leading-6">{aiMessage}</p>
                        )}
                    </div>
                </div>

                {/* Sales Trend */}
                <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                    <h3 className="font-bold text-lg text-slate-800 mb-4">카테고리별 판매 동향 (최근 7일)</h3>
                    <SalesTrendChart salesHistory={salesHistory} />
                </div>
            </div>
            
             <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
                 <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                    <h3 className="font-bold text-lg text-slate-800 mb-4">시간대별 판매 히트맵</h3>
                    <PeakHoursHeatMap salesHistory={salesHistory} />
                </div>
                 <div className="lg:col-span-1 bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                    <h3 className="font-bold text-lg text-slate-800 mb-4">재고 회전율 분석</h3>
                    <InventoryMovers salesHistory={salesHistory} />
                </div>
            </div>
        </div>
    );
};

export default Dashboard;