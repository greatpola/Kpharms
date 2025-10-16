import { useState, useCallback, useEffect, useMemo } from 'react';
import type { Memo } from '../types';

export const useMemos = () => {
    const [memos, setMemos] = useState<Memo[]>([]);
    const storageKey = 'pico_ai_memos';

    useEffect(() => {
        try {
            const savedMemos = localStorage.getItem(storageKey);
            if (savedMemos) {
                setMemos(JSON.parse(savedMemos));
            }
        } catch (error) {
            console.error('Error reading memos from localStorage', error);
        }
    }, []);

    const addMemo = useCallback((content: string) => {
        if (!content.trim()) return;
        const newMemo: Memo = {
            id: `memo-${Date.now()}`,
            content,
            createdAt: new Date().toISOString(),
        };

        setMemos(prevMemos => {
            const updatedMemos = [newMemo, ...prevMemos];
            try {
                localStorage.setItem(storageKey, JSON.stringify(updatedMemos));
            } catch (error) {
                console.error('Error saving memos to localStorage', error);
            }
            return updatedMemos;
        });
    }, []);

    const deleteMemo = useCallback((memoId: string) => {
        setMemos(prevMemos => {
            const updatedMemos = prevMemos.filter(memo => memo.id !== memoId);
            try {
                localStorage.setItem(storageKey, JSON.stringify(updatedMemos));
            } catch (error) {
                console.error('Error deleting memo from localStorage', error);
            }
            return updatedMemos;
        });
    }, []);
    
    const sortedMemos = useMemo(() => memos.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()), [memos]);

    return { memos: sortedMemos, addMemo, deleteMemo };
};
