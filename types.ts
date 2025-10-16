import type React from 'react';

// From App.tsx
export type TabId = 'dashboard' | 'hiring' | 'product' | 'labor' | 'content' | 'medication' | 'customer';

// From constants.ts
export interface Tab {
  id: TabId;
  label: string;
  icon: React.FC<React.SVGProps<SVGSVGElement>>;
}

// From components/HiringAssistant.tsx
export interface HiringFormData {
  pharmacyName: string;
  location: string;
  mainDepartment: string;
  prescriptionsPerDay: string;
  workEnvironment: string;
  otherPerks: string;
  targetPosition: string;
  requiredSkills: string;
  expectedRole: string;
}

// From components/ProductRecommender.tsx
export interface ProductFormData {
  pharmacyName: string;
  location: string;
  nearbyHospitals: string;
  mainCustomers: string;
  currentProducts: string;
}

// From components/LaborAnalyzer.tsx
export interface LaborFormData {
  pharmacists: string;
  staff: string;
  totalHours: string;
  totalWages: string;
  peakTimes: string;
}

export interface LaborAnalysisData {
    comparison: {
        pharmacists: { user: number; average: number };
        staff: { user: number; average: number };
        totalWages: { user: number; average: number };
        wagesPerPharmacist: { user: number; average: number };
    };
    analysisSummary: string;
    suggestions: {
        title: string;
        description: string;
        expectedEffect: string;
    }[];
}


// From components/ContentCreator.tsx
export interface CardNewsFormData {
  topic: string;
  targetAudience: string;
  requiredInfo: string;
}

export interface BlogFormData {
  topic: string;
  keywords: string;
  targetAudience: string;
  tone: string;
}

export interface VideoFormData {
  prompt: string;
}

// from contexts/ChatContext.tsx
export interface ChatMessagePart {
  text: string;
}

export interface ChatMessage {
  id: number;
  role: 'user' | 'model';
  parts: ChatMessagePart[];
}

// from hooks/useReports.ts
export type ReportType = 'hiring' | 'product' | 'labor' | 'content' | 'medication' | 'customer';

export interface SavedReport {
    id: string;
    createdAt: string;
    type: ReportType;
    title: string;
    content: string;
    formData: any;
    subType?: string; // for content creator
    sources?: any[]; // for grounding
}

// From components/MedicationAssistant.tsx
export interface PatientInfo {
    age: string;
    condition: string;
    otherMeds: string;
    precautions: string;
}

export interface MedicationInfo {
    name: string;
    dosage: string;
    frequency: string;
    duration: string;
}

export interface MedicationGuidance {
    greeting: string;
    medications: {
        name: string;
        instructions: string;
        precautions: string;
    }[];
    generalAdvice: string[];
    closing: string;
}

// From contexts/PharmacyDataContext.tsx and its consumers
export interface InventoryItem {
    id: string;
    name: string;
    category: string;
    quantity: number;
    expirationDate: string;
}

export interface SalesHistoryItem {
    id: string;
    name: string;
    category: string;
    date: string;
    quantity: number;
    price: number;
}

export interface Alert {
    id: string;
    type: 'low_stock' | 'expiring_soon' | 'sales_opportunity';
    title: string;
    message: string;
}

export interface CommunicationRecord {
    date: string;
    type: string;
    message: string;
}

export interface Customer {
    id: string;
    name: string;
    age: number;
    gender: '남' | '여';
    tags: string[];
    notes: string;
    lastVisit: string;
    totalSpent: number;
    purchaseHistory: {
        date: string;
        item: string;
        quantity: number;
    }[];
    communicationHistory: CommunicationRecord[];
}
