import React, { useState, useEffect } from 'react';
import type { Customer } from '../../types';
import { usePharmacyData } from '../../contexts/PharmacyDataContext';
import { XMarkIcon } from '../icons/XMarkIcon';

interface CustomerFormModalProps {
    customer: Customer | null;
    onClose: () => void;
}

const CustomerFormModal: React.FC<CustomerFormModalProps> = ({ customer, onClose }) => {
    const { addCustomer, updateCustomer } = usePharmacyData();
    const [formData, setFormData] = useState({
        name: '',
        age: '',
        gender: '남' as '남' | '여',
        tags: '',
        notes: '',
    });

    useEffect(() => {
        if (customer) {
            setFormData({
                name: customer.name,
                age: String(customer.age),
                gender: customer.gender,
                tags: customer.tags.join(', '),
                notes: customer.notes,
            });
        } else {
            setFormData({ name: '', age: '', gender: '남', tags: '', notes: '' });
        }
    }, [customer]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const customerData = {
            name: formData.name,
            age: parseInt(formData.age, 10),
            gender: formData.gender,
            tags: formData.tags.split(',').map(tag => tag.trim()).filter(Boolean),
            notes: formData.notes,
        };

        if (customer) {
            updateCustomer({ ...customer, ...customerData });
        } else {
            addCustomer(customerData);
        }
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center z-50 p-4" onClick={onClose}>
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md" onClick={(e) => e.stopPropagation()}>
                <header className="flex items-center justify-between p-4 border-b border-slate-200">
                    <h2 className="font-bold text-lg text-slate-800">{customer ? '고객 정보 수정' : '새 고객 추가'}</h2>
                    <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-700 rounded-full">
                        <XMarkIcon className="w-6 h-6" />
                    </button>
                </header>
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700">이름</label>
                        <input type="text" name="name" value={formData.name} onChange={handleChange} required className="mt-1 w-full rounded-md border-slate-300"/>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                         <div>
                            <label className="block text-sm font-medium text-slate-700">나이</label>
                            <input type="number" name="age" value={formData.age} onChange={handleChange} required className="mt-1 w-full rounded-md border-slate-300"/>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700">성별</label>
                             <select name="gender" value={formData.gender} onChange={handleChange} className="mt-1 w-full rounded-md border-slate-300">
                                <option value="남">남</option>
                                <option value="여">여</option>
                            </select>
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700">태그 (쉼표로 구분)</label>
                        <input type="text" name="tags" value={formData.tags} onChange={handleChange} placeholder="예: 영양제, 소아과, 당뇨" className="mt-1 w-full rounded-md border-slate-300"/>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700">메모</label>
                        <textarea name="notes" value={formData.notes} onChange={handleChange} rows={4} className="mt-1 w-full rounded-md border-slate-300"></textarea>
                    </div>
                     <footer className="pt-4 flex justify-end space-x-2">
                        <button type="button" onClick={onClose} className="px-4 py-2 bg-white border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50">취소</button>
                        <button type="submit" className="px-4 py-2 bg-teal-600 text-white font-bold rounded-lg hover:bg-teal-700">{customer ? '저장' : '추가'}</button>
                    </footer>
                </form>
            </div>
        </div>
    );
};

export default CustomerFormModal;
