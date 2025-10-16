import React, { createContext, useContext, useState, ReactNode, useMemo, useEffect } from 'react';
import type { Customer, InventoryItem, SalesHistoryItem, Alert } from '../types';

// --- Mock Data Generation ---
const MOCK_INVENTORY: InventoryItem[] = [
    { id: 'inv_001', name: '타이레놀 500mg', category: '해열/진통', quantity: 50, expirationDate: '2025-12-31' },
    { id: 'inv_002', name: '어린이 부루펜 시럽', category: '소아과', quantity: 8, expirationDate: '2024-10-31' },
    { id: 'inv_003', name: '오메가3 플러스', category: '영양제', quantity: 25, expirationDate: '2025-08-31' },
    { id: 'inv_004', name: '판콜에이', category: '감기약', quantity: 15, expirationDate: '2024-11-30' },
    { id: 'inv_005', name: '인공눈물', category: '안약', quantity: 100, expirationDate: '2026-01-31' },
    { id: 'inv_006', name: '마데카솔', category: '외용제', quantity: 40, expirationDate: '2025-09-30' },
    { id: 'inv_007', name: '비타민C 1000mg', category: '영양제', quantity: 5, expirationDate: '2024-09-15' },
    { id: 'inv_008', name: '훼스탈', category: '소화제', quantity: 30, expirationDate: '2025-07-31' },
];

const MOCK_SALES_HISTORY: SalesHistoryItem[] = Array.from({ length: 200 }).map((_, i) => {
    const item = MOCK_INVENTORY[Math.floor(Math.random() * MOCK_INVENTORY.length)];
    const date = new Date();
    date.setDate(date.getDate() - Math.floor(Math.random() * 14)); // last 14 days
    date.setHours(9 + Math.floor(Math.random() * 11)); // 9 AM to 7 PM
    return {
        ...item,
        id: `sale_${i}`,
        date: date.toISOString(),
        quantity: 1,
        price: Math.floor(Math.random() * 10000) + 1000,
    };
});

const MOCK_CUSTOMERS: Customer[] = [
    { id: 'cust_001', name: '김민준', age: 35, gender: '남', tags: ['영양제', '직장인'], notes: '오메가3 꾸준히 구매. 최근 피로감을 자주 호소함.', lastVisit: '2024-07-15', totalSpent: 150000, purchaseHistory: [
        { date: '2024-07-15', item: '오메가3 플러스', quantity: 1 },
        { date: '2024-06-12', item: '비타민C 1000mg', quantity: 2 },
    ], communicationHistory: []},
    { id: 'cust_002', name: '이서아', age: 5, gender: '여', tags: ['소아과', '어린이'], notes: '부루펜 시럽 자주 찾음. 환절기마다 콧물 증상 보임.', lastVisit: '2024-07-20', totalSpent: 45000, purchaseHistory: [
        { date: '2024-07-20', item: '어린이 부루펜 시럽', quantity: 1 },
        { date: '2024-07-05', item: '마데카솔', quantity: 1 },
    ], communicationHistory: []},
    { id: 'cust_003', name: '박도윤', age: 68, gender: '남', tags: ['당뇨', '혈압'], notes: '처방약 관련 상담 필요. 눈이 건조하다고 하심.', lastVisit: '2024-07-18', totalSpent: 210000, purchaseHistory: [
        { date: '2024-07-18', item: '인공눈물', quantity: 2 },
        { date: '2024-06-20', item: '타이레놀 500mg', quantity: 1 },
    ], communicationHistory: []},
];
// --- End Mock Data ---


interface PharmacyDataContextType {
    inventory: InventoryItem[];
    salesHistory: SalesHistoryItem[];
    alerts: Alert[];
    totalSalesToday: number;
    expiringSoonCount: number;
    customers: Customer[];
    addCustomer: (customer: Omit<Customer, 'id' | 'lastVisit' | 'totalSpent' | 'purchaseHistory' | 'communicationHistory'>) => void;
    updateCustomer: (customer: Customer) => void;
    deleteCustomer: (customerId: string) => void;
}

const PharmacyDataContext = createContext<PharmacyDataContextType | undefined>(undefined);

export const PharmacyDataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [inventory, setInventory] = useState<InventoryItem[]>(MOCK_INVENTORY);
    const [salesHistory, setSalesHistory] = useState<SalesHistoryItem[]>(MOCK_SALES_HISTORY);
    const [customersData, setCustomersData] = useState<Customer[]>([]);
    
    const customerStorageKey = 'pico_ai_customers';

    useEffect(() => {
        try {
            const savedCustomers = localStorage.getItem(customerStorageKey);
            if (savedCustomers) {
                setCustomersData(JSON.parse(savedCustomers));
            } else {
                setCustomersData(MOCK_CUSTOMERS);
            }
        } catch (error) {
            console.error('Error reading customers from localStorage', error);
            setCustomersData(MOCK_CUSTOMERS);
        }
    }, []);
    
    const saveCustomers = (updatedCustomers: Customer[]) => {
        try {
            localStorage.setItem(customerStorageKey, JSON.stringify(updatedCustomers));
            setCustomersData(updatedCustomers);
        } catch (error) {
            console.error('Error saving customers to localStorage', error);
        }
    };


    const data = useMemo(() => {
        const today = new Date().toDateString();
        const totalSalesToday = salesHistory.filter(s => new Date(s.date).toDateString() === today).length;

        const thirtyDaysFromNow = new Date();
        thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
        const expiringSoonCount = inventory.filter(item => {
            const expDate = new Date(item.expirationDate);
            return expDate <= thirtyDaysFromNow;
        }).length;

        const alerts: Alert[] = [];
        const lowStockItems = inventory.filter(item => item.quantity < 10);
        if (lowStockItems.length > 0) {
            alerts.push({
                id: 'alert_low_stock',
                type: 'low_stock',
                title: `${lowStockItems[0].name} 외 ${lowStockItems.length - 1}개 품목 재고 부족`,
                message: '재고가 10개 미만입니다. 주문이 필요합니다.'
            });
        }
        if (expiringSoonCount > 0) {
            alerts.push({
                id: 'alert_expiring',
                type: 'expiring_soon',
                title: `유통기한 임박 품목 ${expiringSoonCount}개`,
                message: '30일 내 유통기한이 만료되는 품목이 있습니다.'
            });
        }

        return { totalSalesToday, expiringSoonCount, alerts };
    }, [inventory, salesHistory]);

    const addCustomer = (customerData: Omit<Customer, 'id' | 'lastVisit' | 'totalSpent' | 'purchaseHistory' | 'communicationHistory'>) => {
        const newCustomer: Customer = {
            ...customerData,
            id: `cust_${Date.now()}`,
            lastVisit: new Date().toISOString().split('T')[0],
            totalSpent: 0,
            purchaseHistory: [],
            communicationHistory: [],
        };
        saveCustomers([newCustomer, ...customersData]);
    };
    
    const updateCustomer = (updatedCustomer: Customer) => {
        const updatedCustomers = customersData.map(c => c.id === updatedCustomer.id ? updatedCustomer : c);
        saveCustomers(updatedCustomers);
    };

    const deleteCustomer = (customerId: string) => {
        const updatedCustomers = customersData.filter(c => c.id !== customerId);
        saveCustomers(updatedCustomers);
    };


    const value = {
        inventory,
        salesHistory,
        customers: customersData,
        addCustomer,
        updateCustomer,
        deleteCustomer,
        ...data
    };

    return (
        <PharmacyDataContext.Provider value={value}>
            {children}
        </PharmacyDataContext.Provider>
    );
};

export const usePharmacyData = (): PharmacyDataContextType => {
    const context = useContext(PharmacyDataContext);
    if (context === undefined) {
        throw new Error('usePharmacyData must be used within a PharmacyDataProvider');
    }
    return context;
};
