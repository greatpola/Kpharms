import type { SVGProps } from 'react';

// General
export type TabId = 'dashboard' | 'hiring' | 'product' | 'labor' | 'content' | 'medication' | 'customer';

export interface Tab {
  id: TabId;
  label: string;
  icon: React.FC<SVGProps<SVGSVGElement>>;
}

// Gemini Chat
export interface ChatMessage {
  id: number;
  role: 'user' | 'model';
  parts: { text: string }[];
}

// Reports
export type ReportType = 'hiring' | 'product' | 'labor' | 'content' | 'medication';

export interface SavedReport {
  id: string;
  type: ReportType;
  createdAt: string;
  title: string;
  content: string;
  formData?: any;
  subType?: 'card-news' | 'blog' | 'video';
  imageUrl?: string | null;
  sources?: any[];
}


// Form Data
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

export interface ProductFormData {
  pharmacyName: string;
  location: string;
  nearbyHospitals: string;
  mainCustomers: string;
  currentProducts: string;
}

export interface LaborFormData {
  pharmacists: string;
  staff: string;
  totalHours: string;
  totalWages: string;
  peakTimes: string;
}

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

// Labor Analyzer
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

// Medication Assistant
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

// Pharmacy Data
export interface InventoryItem {
    id: string;
    name: string;
    category: string;
    quantity: number;
    expirationDate: string;
}

export interface SalesHistoryItem extends InventoryItem {
    date: string;
    price: number;
}

export interface Alert {
    id: string;
    type: 'low_stock' | 'expiring_soon';
    title: string;
    message: string;
}

export interface PurchaseRecord {
    date: string;
    item: string;
    quantity: number;
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
    purchaseHistory: PurchaseRecord[];
    communicationHistory: CommunicationRecord[];
}

// Memos
export interface Memo {
    id: string;
    content: string;
    createdAt: string;
}
