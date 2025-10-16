import React, { useMemo } from 'react';
import type { SalesHistoryItem } from '../../types';

interface PeakHoursHeatMapProps {
    salesHistory: SalesHistoryItem[];
}

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const HOURS = Array.from({ length: 11 }, (_, i) => i + 9); // 9 AM to 7 PM

const PeakHoursHeatMap: React.FC<PeakHoursHeatMapProps> = ({ salesHistory }) => {
    
    const salesData = useMemo(() => {
        const grid: number[][] = Array(7).fill(0).map(() => Array(11).fill(0));
        
        salesHistory.forEach(sale => {
            const saleDate = new Date(sale.date);
            const dayOfWeek = saleDate.getDay(); // 0 for Sunday, 1 for Monday, etc.
            const hourOfDay = saleDate.getHours();

            if (hourOfDay >= 9 && hourOfDay <= 19) {
                const hourIndex = hourOfDay - 9;
                grid[dayOfWeek][hourIndex]++;
            }
        });

        return grid;
    }, [salesHistory]);

    const maxSales = useMemo(() => Math.max(...salesData.flat(), 1), [salesData]);

    const getColor = (count: number) => {
        if (count === 0) return 'bg-slate-100';
        const intensity = Math.min(count / (maxSales * 0.8), 1); // Cap intensity to avoid extreme colors
        if (intensity < 0.2) return 'bg-teal-200';
        if (intensity < 0.4) return 'bg-teal-300';
        if (intensity < 0.6) return 'bg-teal-400';
        if (intensity < 0.8) return 'bg-teal-500';
        return 'bg-teal-600';
    };

    return (
        <div className="p-2">
            <div className="grid grid-cols-[auto_repeat(11,_minmax(0,_1fr))] gap-1.5">
                {/* Top Header (Hours) */}
                <div />
                {HOURS.map(hour => (
                    <div key={hour} className="text-center text-xs font-semibold text-slate-500">
                        {hour}
                    </div>
                ))}

                {/* Side Header (Days) and Heatmap Cells */}
                {DAYS.map((day, dayIndex) => (
                    <React.Fragment key={day}>
                        <div className="flex items-center justify-end text-xs font-semibold text-slate-500 pr-2">{day}</div>
                        {HOURS.map((hour, hourIndex) => {
                             const count = salesData[dayIndex]?.[hourIndex] || 0;
                             return (
                                <div key={`${day}-${hour}`}
                                    className="w-full aspect-square rounded-md flex items-center justify-center transition-colors"
                                    title={`${day} ${hour}:00 - ${count} sales`}
                                >
                                     <div className={`w-full h-full rounded ${getColor(count)}`}></div>
                                </div>
                             );
                        })}
                    </React.Fragment>
                ))}
            </div>
            <div className="flex justify-end items-center space-x-2 mt-3 text-xs text-slate-500">
                <span>적음</span>
                <div className="flex space-x-1">
                    <div className="w-3 h-3 rounded-sm bg-teal-200"></div>
                    <div className="w-3 h-3 rounded-sm bg-teal-300"></div>
                    <div className="w-3 h-3 rounded-sm bg-teal-400"></div>
                    <div className="w-3 h-3 rounded-sm bg-teal-500"></div>
                    <div className="w-3 h-3 rounded-sm bg-teal-600"></div>
                </div>
                <span>많음</span>
            </div>
        </div>
    );
};

export default PeakHoursHeatMap;