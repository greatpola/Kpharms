import React, { useEffect, useRef } from 'react';
import type { SalesHistoryItem } from '../../types';
import { Chart, BarController, BarElement, CategoryScale, LinearScale, Title, Tooltip, Legend } from 'chart.js';

Chart.register(BarController, BarElement, CategoryScale, LinearScale, Title, Tooltip, Legend);

interface SalesTrendChartProps {
    salesHistory: SalesHistoryItem[];
}

const SalesTrendChart: React.FC<SalesTrendChartProps> = ({ salesHistory }) => {
    const chartRef = useRef<HTMLCanvasElement>(null);
    const chartInstance = useRef<Chart | null>(null);

    // Effect for initializing the chart
    useEffect(() => {
        if (!chartRef.current) return;
        const ctx = chartRef.current.getContext('2d');
        if (!ctx) return;

        chartInstance.current = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: [],
                datasets: [
                    {
                        label: '최근 7일간 판매량',
                        data: [],
                        backgroundColor: 'rgba(20, 184, 166, 0.6)',
                        borderColor: 'rgba(15, 118, 110, 1)',
                        borderWidth: 1.5,
                        borderRadius: 4,
                    },
                ],
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                indexAxis: 'y',
                scales: {
                    x: {
                        beginAtZero: true,
                        grid: { color: '#e2e8f0' },
                        ticks: { 
                            font: { family: "'Noto Sans KR', sans-serif" },
                            precision: 0, 
                        },
                    },
                    y: {
                        grid: { display: false },
                        ticks: { font: { family: "'Noto Sans KR', sans-serif" } },
                    }
                },
                plugins: {
                    legend: { display: false },
                    title: { display: false },
                    tooltip: {
                        bodyFont: { family: "'Noto Sans KR', sans-serif" },
                        titleFont: { family: "'Noto Sans KR', sans-serif" }
                    }
                },
            },
        });

        return () => {
            chartInstance.current?.destroy();
            chartInstance.current = null;
        };
    }, []);

    // Effect for updating chart data
    useEffect(() => {
        if (!chartInstance.current || !salesHistory) return;

        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        sevenDaysAgo.setHours(0, 0, 0, 0);

        const filteredHistory = salesHistory.filter(sale => new Date(sale.date) >= sevenDaysAgo);

        const salesByCategory = filteredHistory.reduce((acc, sale) => {
            acc[sale.category] = (acc[sale.category] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        const labels = Object.keys(salesByCategory);
        const data = Object.values(salesByCategory);
        
        chartInstance.current.data.labels = labels;
        chartInstance.current.data.datasets[0].data = data;
        chartInstance.current.update();

    }, [salesHistory]);

    return <div className="relative h-96"><canvas ref={chartRef}></canvas></div>;
};

export default SalesTrendChart;