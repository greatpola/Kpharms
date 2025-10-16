import React, { useMemo } from 'react';
import type { SalesHistoryItem } from '../../types';
import { FireIcon } from '../icons/FireIcon';
import { CubeTransparentIcon } from '../icons/CubeTransparentIcon';

interface InventoryMoversProps {
    salesHistory: SalesHistoryItem[];
}

const InventoryMovers: React.FC<InventoryMoversProps> = ({ salesHistory }) => {
    
    const movers = useMemo(() => {
        const salesCounts: Record<string, { name: string; count: number }> = {};
        
        salesHistory.forEach(sale => {
            if (!salesCounts[sale.id]) {
                salesCounts[sale.id] = { name: sale.name, count: 0 };
            }
            salesCounts[sale.id].count++;
        });

        const sortedMovers = Object.entries(salesCounts)
            .map(([id, data]) => ({ id, ...data }))
            .sort((a, b) => b.count - a.count);

        return {
            fast: sortedMovers.slice(0, 5),
            slow: sortedMovers.filter(item => item.count > 0).slice(-5).reverse(),
        };
    }, [salesHistory]);

    const maxFastMoverCount = movers.fast[0]?.count || 1;

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
                <h3 className="font-bold text-slate-800 flex items-center mb-3">
                    <FireIcon className="w-5 h-5 mr-2 text-orange-500"/>
                    많이 팔리는 제품
                </h3>
                <div className="space-y-3">
                    {movers.fast.map(item => (
                        <div key={item.id} className="text-sm">
                            <div className="flex justify-between items-center mb-1">
                                <p className="font-medium text-slate-700 truncate" title={item.name}>{item.name}</p>
                                <p className="font-semibold text-slate-600">{item.count}</p>
                            </div>
                            <div className="w-full bg-orange-100 rounded-full h-1.5">
                                <div className="bg-orange-400 h-1.5 rounded-full" style={{ width: `${(item.count / maxFastMoverCount) * 100}%` }}></div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
             <div>
                <h3 className="font-bold text-slate-800 flex items-center mb-3">
                    <CubeTransparentIcon className="w-5 h-5 mr-2 text-sky-500"/>
                    적게 팔리는 제품
                </h3>
                <div className="space-y-3">
                    {movers.slow.map(item => (
                        <div key={item.id} className="text-sm">
                            <div className="flex justify-between items-center mb-1">
                                <p className="font-medium text-slate-700 truncate" title={item.name}>{item.name}</p>
                                <p className="font-semibold text-slate-600">{item.count}</p>
                            </div>
                           <div className="w-full bg-sky-100 rounded-full h-1.5">
                                <div className="bg-sky-400 h-1.5 rounded-full" style={{ width: `${(item.count / maxFastMoverCount) * 100}%` }}></div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default InventoryMovers;