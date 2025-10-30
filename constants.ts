import type { Tab, HiringFormData, ProductFormData, LaborFormData, CardNewsFormData, BlogFormData, VideoFormData, WorkReportFormData } from './types';
import { HomeIcon } from './components/icons/HomeIcon';
import { UserGroupIcon } from './components/icons/UserGroupIcon';
import { SparklesIcon } from './components/icons/SparklesIcon';
import { ChartBarIcon } from './components/icons/ChartBarIcon';
import { NewspaperIcon } from './components/icons/NewspaperIcon';
import { PillIcon } from './components/icons/PillIcon';
import { UsersIcon } from './components/icons/UsersIcon';
import { ClipboardDocumentCheckIcon } from './components/icons/ClipboardDocumentCheckIcon';

export const TABS: Tab[] = [
  { id: 'dashboard', label: '대시보드', icon: HomeIcon },
  { id: 'hiring', label: 'AI 채용 비서', icon: UserGroupIcon },
  { id: 'product', label: 'AI 제품 추천', icon: SparklesIcon },
  { id: 'labor', label: 'AI 노무 분석', icon: ChartBarIcon },
  { id: 'content', label: 'AI 콘텐츠 제작', icon: NewspaperIcon },
  { id: 'medication', label: 'AI 복약지도', icon: PillIcon },
  { id: 'customer', label: 'AI 고객 관리', icon: UsersIcon },
  { id: 'work_report', label: 'AI 근무 보고서', icon: ClipboardDocumentCheckIcon },
];

export const INITIAL_HIRING_FORM_DATA: HiringFormData = {
  pharmacyName: "튼튼약국",
  location: "서울시 강남구, 소아과 건물 1층",
  mainDepartment: "소아과, 내과",
  prescriptionsPerDay: "250",
  workEnvironment: "가족같은 분위기, 스탭 간 협업 중시",
  otherPerks: "점심 식사 제공, 명절 상여금, 퇴직금 별도",
  targetPosition: "신입/경력 약사",
  requiredSkills: "꼼꼼함, 소아과 처방 조제 유경험자 우대",
  expectedRole: "처방 조제 및 복약 지도, 재고 관리",
};

export const INITIAL_PRODUCT_FORM_DATA: ProductFormData = {
  pharmacyName: "튼튼약국",
  location: "서울시 강남구, 소아과 건물 1층",
  nearbyHospitals: "강남튼튼소아과",
  mainCustomers: "영유아 및 부모, 30-40대 직장인",
  currentProducts: "어린이 영양제, 감기약, 소화제 위주",
};

export const INITIAL_LABOR_FORM_DATA: LaborFormData = {
    pharmacists: '2',
    staff: '1',
    totalHours: '45',
    totalWages: '15000000',
    peakTimes: '평일 오전 9-11시, 오후 4-6시',
};

export const INITIAL_CARD_NEWS_FORM_DATA: CardNewsFormData = {
    topic: "환절기 어린이 면역력 강화법",
    targetAudience: "3-7세 자녀를 둔 부모",
    requiredInfo: "비타민D, 아연의 중요성 포함",
};

export const INITIAL_BLOG_FORM_DATA: BlogFormData = {
    topic: "오메가3, 왜 꼭 챙겨 먹어야 할까?",
    keywords: "오메가3, 혈행개선, EPA, DHA, 영양제 추천",
    targetAudience: "건강에 관심 많은 40-50대",
    tone: "전문적이면서도 이해하기 쉬운",
};

export const INITIAL_VIDEO_FORM_DATA: VideoFormData = {
    prompt: "약사가 직접 알려주는 올바른 인공눈물 사용법, 유튜브 숏폼 영상",
};

export const INITIAL_WORK_REPORT_FORM_DATA: WorkReportFormData = {
  pharmacistName: "김약사",
  notes: "오후에 단골 손님 박도윤 님 방문, 혈압약 관련 장시간 상담 진행. 특별한 재고 문제는 없었음.",
};