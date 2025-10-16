import { useState, useCallback, useEffect } from 'react';
import type { SavedReport, ReportType } from '../types';

export const useReports = (reportType: ReportType) => {
    const [reports, setReports] = useState<SavedReport[]>([]);

    const storageKey = `pico_ai_reports_${reportType}`;

    useEffect(() => {
        try {
            const savedReports = localStorage.getItem(storageKey);
            if (savedReports) {
                setReports(JSON.parse(savedReports));
            }
        } catch (error) {
            console.error('Error reading reports from localStorage', error);
        }
    }, [storageKey]);

    const addReport = useCallback((report: Omit<SavedReport, 'id' | 'createdAt' | 'type'>) => {
        const newReport: SavedReport = {
            ...report,
            id: `report-${Date.now()}`,
            type: reportType,
            createdAt: new Date().toISOString(),
        };

        setReports(prevReports => {
            const updatedReports = [newReport, ...prevReports];
            try {
                localStorage.setItem(storageKey, JSON.stringify(updatedReports));
            } catch (error) {
                console.error('Error saving reports to localStorage', error);
            }
            return updatedReports;
        });
        return newReport;
    }, [storageKey, reportType]);

    const updateReport = useCallback((updatedReport: SavedReport) => {
        setReports(prevReports => {
            const updatedReports = prevReports.map(report =>
                report.id === updatedReport.id ? updatedReport : report
            );
            try {
                localStorage.setItem(storageKey, JSON.stringify(updatedReports));
            } catch (error) {
                console.error('Error updating reports in localStorage', error);
            }
            return updatedReports;
        });
    }, [storageKey]);

    const deleteReport = useCallback((reportId: string) => {
        setReports(prevReports => {
            const updatedReports = prevReports.filter(report => report.id !== reportId);
            try {
                localStorage.setItem(storageKey, JSON.stringify(updatedReports));
            } catch (error) {
                console.error('Error deleting report from localStorage', error);
            }
            return updatedReports;
        });
    }, [storageKey]);

    return { reports, addReport, updateReport, deleteReport };
};