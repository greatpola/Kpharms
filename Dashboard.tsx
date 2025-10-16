import React, { useState, useEffect } from 'react';
import { usePharmacyData } from '../contexts/PharmacyDataContext';
import { ArrowTrendingUpIcon } from './icons/ArrowTrendingUpIcon';
import { ExclamationTriangleIcon } from './icons/ExclamationTriangleIcon';
import { LightBulbIcon } from './icons/LightBulbIcon';
import SalesTrendChart from './shared/SalesTrendChart';
import PeakHoursHeatMap from './shared/PeakHoursHeatMap';
import InventoryMovers from './shared/InventoryMovers';
import MemoPad from './shared/MemoPad';
import { generateContent } from '../services/geminiService';

const Dashboard: React.FC = () => {
    const { totalSalesToday, alerts, salesHistory } = usePharmacyData();
    const [aiMessage, setAiMessage] = useState('AI 비서가 약사님을 위해 오늘의 메시지를 생성하고 있습니다...');
    const [isLoadingMessage, setIsLoadingMessage] = useState(true);

    const lowStockAlert = alerts.find(a => a.type === 'low_stock');
    const expiringSoonAlert = alerts.find(a => a.type === 'expiring_soon');

    useEffect(() => {
        const fetchAIMessage = async () => {
            setIsLoadingMessage(true);
            const prompt = "당신은 약국 AI 비서 '피코'입니다. 약사님을 위해 따뜻하고 힘이 되는 응원의 메시지나, 오늘 하루 약국 운영에 도움이 될 만한 간단한 팁을 생성해주세요. 실제 사람이 말을 건네는 것처럼 자연스럽고 친근한 말투를 사용하고, 마크다운 문법(**, #, - 등)은 절대 사용하지 마세요.";
            try {
                const message = await generateContent(prompt);
                setAiMessage(message);
            } catch (error) {
                setAiMessage("오늘도 힘찬 하루 보내세요, 약사님! 제가 항상 곁에서 돕겠습니다.");
            } finally {
                setIsLoadingMessage(false);
            }
        };

        fetchAIMessage();
    }, []);

    return (
        <div className="p-4 sm:p-8 bg-slate-50 h-full overflow-y-auto">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Content Column */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Header and Stat Cards */}
                    <div>
                        <h2 className="text-3xl font-bold text-slate-800 mb-2">대시보드</h2>
                        <p className="text-slate-600 mb-6">오늘의 약국 현황을 한눈에 파악하세요.</p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                             <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex items-center">
                                <div className="p-3 bg-teal-100 rounded-lg mr-4">
                                    <ArrowTrendingUpIcon className="w-6 h-6 text-teal-600"/>
                                </div>
                                <div>
                                    <p className="text-sm text-slate-500">오늘 판매 건수</p>
                                    <p className="text-2xl font-bold text-slate-800">{totalSalesToday} 건</p>
                                </div>
                            </div>
                             <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex items-center">
                                <div className="p-3 bg-amber-100 rounded-lg mr-4">
                                    <ExclamationTriangleIcon className="w-6 h-6 text-amber-600"/>
                                </div>
                                <div>
                                    <p className="text-sm text-slate-500">재고 부족</p>
                                    <p className="text-2xl font-bold text-slate-800">{lowStockAlert ? `${lowStockAlert.title.split(' ')[3]}` : '없음'}</p>
                                </div>
                            </div>
                             <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex items-center">
                                <div className="p-3 bg-red-100 rounded-lg mr-4">
                                    <ExclamationTriangleIcon className="w-6 h-6 text-red-600"/>
                                </div>
                                <div>
                                    <p className="text-sm text-slate-500">유통기한 임박</p>
                                    <p className="text-2xl font-bold text-slate-800">{expiringSoonAlert ? `${expiringSoonAlert.title.split(' ')[3]}` : '없음'}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                    {/* Sales Trend Chart */}
                     <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                        <h3 className="font-bold text-slate-800 mb-4">카테고리별 판매 동향 (최근 7일)</h3>
                        <SalesTrendChart salesHistory={salesHistory} />
                    </div>
                     <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                        <InventoryMovers salesHistory={salesHistory} />
                    </div>
                </div>

                {/* Right Sidebar Column */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                        <h3 className="font-bold text-slate-800 mb-4">오늘의 AI 비서 메시지</h3>
                        <div className="bg-slate-100 border-l-4 border-slate-400 p-4 rounded-r-lg">
                            <div className="flex">
                                <LightBulbIcon className="w-6 h-6 text-slate-500 mr-3 flex-shrink-0 mt-0.5" />
                                {isLoadingMessage ? (
                                    <div className="w-full h-12 bg-slate-200 rounded animate-pulse"></div>
                                ) : (
                                    <p className="text-sm text-slate-800">{aiMessage}</p>
                                )}
                            </div>
                        </div>
                    </div>
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                        <MemoPad />
                    </div>
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                         <h3 className="font-bold text-slate-800 mb-4">시간대별 판매 집중도</h3>
                        <PeakHoursHeatMap salesHistory={salesHistory} />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;