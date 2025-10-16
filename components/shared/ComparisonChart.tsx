import React, { useEffect, useRef } from 'react';
import type { LaborAnalysisData } from '../../types';
import { Chart, BarController, BarElement, CategoryScale, LinearScale, Title, Tooltip, Legend } from 'chart.js';

Chart.register(BarController, BarElement, CategoryScale, LinearScale, Title, Tooltip, Legend);

interface ComparisonChartProps {
    data: LaborAnalysisData['comparison'];
}

const ComparisonChart: React.FC<ComparisonChartProps> = ({ data }) => {
    const chartRef = useRef<HTMLCanvasElement>(null);
    const chartInstance = useRef<Chart | null>(null);

    useEffect(() => {
        if (!chartRef.current) return;

        const ctx = chartRef.current.getContext('2d');
        if (!ctx) return;

        if (chartInstance.current) {
            chartInstance.current.destroy();
        }

        const labels = ['약사 수(명)', '직원 수(명)', '총 인건비(만원)', '약사 1인당 인건비(만원)'];
        const userData = [
            data.pharmacists.user,
            data.staff.user,
            data.totalWages.user,
            data.wagesPerPharmacist.user,
        ];
        const averageData = [
            data.pharmacists.average,
            data.staff.average,
            data.totalWages.average,
            data.wagesPerPharmacist.average,
        ];

        chartInstance.current = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: '우리 약국',
                        data: userData,
                        backgroundColor: 'rgba(20, 184, 166, 0.6)',
                        borderColor: 'rgba(15, 118, 110, 1)',
                        borderWidth: 1.5,
                        borderRadius: 4,
                    },
                    {
                        label: '전국 평균',
                        data: averageData,
                        backgroundColor: 'rgba(148, 163, 184, 0.6)',
                        borderColor: 'rgba(71, 85, 105, 1)',
                        borderWidth: 1.5,
                        borderRadius: 4,
                    },
                ],
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: {
                            color: '#e2e8f0',
                        },
                         ticks: {
                            font: {
                                family: "'Noto Sans KR', sans-serif",
                            }
                        }
                    },
                    x: {
                         grid: {
                            display: false,
                        },
                         ticks: {
                            font: {
                                family: "'Noto Sans KR', sans-serif",
                            }
                        }
                    }
                },
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                             font: {
                                family: "'Noto Sans KR', sans-serif",
                                size: 12,
                            }
                        }
                    },
                    title: {
                        display: false,
                    },
                    tooltip: {
                        bodyFont: {
                            family: "'Noto Sans KR', sans-serif",
                        },
                        titleFont: {
                            family: "'Noto Sans KR', sans-serif",
                        }
                    }
                },
            },
        });

        return () => {
            if (chartInstance.current) {
                chartInstance.current.destroy();
            }
        };
    }, [data]);

    return <div style={{ height: '350px' }}><canvas ref={chartRef}></canvas></div>;
};

export default ComparisonChart;