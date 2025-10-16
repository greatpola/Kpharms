import React, { useState } from 'react';
import { useMemos } from '../../hooks/useMemos';
import { DocumentTextIcon } from '../icons/DocumentTextIcon';
import { PlusIcon } from '../icons/PlusIcon';
import { TrashIcon } from '../icons/TrashIcon';

const MemoPad: React.FC = () => {
    const { memos, addMemo, deleteMemo } = useMemos();
    const [newMemo, setNewMemo] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        addMemo(newMemo);
        setNewMemo('');
    };

    return (
        <div>
            <h3 className="font-bold text-slate-800 flex items-center mb-3">
                <DocumentTextIcon className="w-5 h-5 mr-2 text-slate-600"/>
                메모장
            </h3>
            <form onSubmit={handleSubmit} className="flex space-x-2 mb-4">
                <input
                    type="text"
                    value={newMemo}
                    onChange={(e) => setNewMemo(e.target.value)}
                    placeholder="빠른 메모를 추가하세요..."
                    className="flex-grow px-3 py-1.5 bg-slate-100 border border-transparent rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent text-sm"
                />
                <button type="submit" className="p-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:bg-slate-400" disabled={!newMemo.trim()}>
                    <PlusIcon className="w-4 h-4"/>
                </button>
            </form>
            <div className="space-y-2 max-h-40 overflow-y-auto">
                {memos.length > 0 ? (
                    memos.map(memo => (
                        <div key={memo.id} className="group flex items-start justify-between bg-slate-50 p-2 rounded-md text-sm">
                            <p className="text-slate-700 flex-grow pr-2">{memo.content}</p>
                            <button onClick={() => deleteMemo(memo.id)} className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-500 flex-shrink-0">
                                <TrashIcon className="w-4 h-4" />
                            </button>
                        </div>
                    ))
                ) : (
                    <p className="text-sm text-slate-400 text-center py-4">메모가 없습니다.</p>
                )}
            </div>
        </div>
    );
};

export default MemoPad;
