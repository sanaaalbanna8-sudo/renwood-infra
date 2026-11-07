import type { LucideIcon } from 'lucide-react';
import {
  AppWindow,
  Cloud,
  Compass,
  Cpu,
  Gauge,
  Network,
  Ruler,
  ShieldCheck,
  Sparkles,
  Workflow,
} from 'lucide-react';

export type StageInfo = {
  id: number;
  name: string;
  color: string;
  ink: string;
  mark: string;
  icon: LucideIcon;
  blurb: string;
};

export const stages: StageInfo[] = [
  {
    id: 0,
    name: 'فهم الشركة',
    color: '#38BDF8',
    ink: '#0369A1',
    mark: '#0B1020',
    icon: Compass,
    blurb: 'اقرأ من هي الشركة وما الذي ستخدمه بنيتك، ثم انتقل إلى اختيار الأجهزة والبرامج.',
  },
  {
    id: 1,
    name: 'العتاد',
    color: '#8B5CF6',
    ink: '#6D28D9',
    mark: '#FFFFFF',
    icon: Cpu,
    blurb: 'اختر الأجهزة التي يستخدمها كل شخص في المقر والميدان والسيارة.',
  },
  {
    id: 2,
    name: 'البرمجيات',
    color: '#14B8A6',
    ink: '#0F766E',
    mark: '#0B1020',
    icon: AppWindow,
    blurb: 'حدّد البرامج التي تدير العمل والحجز والمال والملفات.',
  },
  {
    id: 3,
    name: 'الاتصال والشبكات',
    color: '#3B82F6',
    ink: '#1D4ED8',
    mark: '#FFFFFF',
    icon: Network,
    blurb: 'صمّم كيف يتصل المقر والميدان بالإنترنت، وكيف تُقسَّم الشبكة.',
  },
  {
    id: 4,
    name: 'العمليات وتدفق البيانات',
    color: '#F59E0B',
    ink: '#B45309',
    mark: '#0B1020',
    icon: Workflow,
    blurb: 'تتبّع رحلة البيانات من الحجز والدفع إلى الجولة والتواصل.',
  },
  {
    id: 5,
    name: 'الأنظمة والبيانات',
    color: '#6366F1',
    ink: '#4338CA',
    mark: '#FFFFFF',
    icon: Cloud,
    blurb: 'قرّر أين تُحفظ البيانات، وكيف تُنسخ، وكيف يستمر العمل عند العطل.',
  },
  {
    id: 6,
    name: 'الحماية والصلاحيات',
    color: '#10B981',
    ink: '#047857',
    mark: '#0B1020',
    icon: ShieldCheck,
    blurb: 'حدّد من يدخل إلى ماذا، وكم تبقى بيانات العملاء، وماذا يحدث إذا تسرّبت.',
  },
  {
    id: 7,
    name: 'التقنيات الناشئة',
    color: '#EC4899',
    ink: '#BE185D',
    mark: '#FFFFFF',
    icon: Sparkles,
    blurb: 'اختر التقنيات الجديدة التي تناسب حجم الشركة الآن أو لاحقاً.',
  },
  {
    id: 8,
    name: 'التشغيل والنمو',
    color: '#F43F5E',
    ink: '#BE123C',
    mark: '#FFFFFF',
    icon: Gauge,
    blurb: 'خطّط للتشغيل اليومي والكلفة، وكيف تكبر البنية مع الشركة.',
  },
  {
    id: 9,
    name: 'الكميات والمواقع',
    color: '#84CC16',
    ink: '#4D7C0F',
    mark: '#0B1020',
    icon: Ruler,
    blurb: 'قدّر العدد ومكان كل جهاز. هذه الأرقام تظهر في قائمة العتاد داخل الملخص.',
  },
];

export function stageById(id: number): StageInfo {
  return stages.find((stage) => stage.id === id) ?? stages[0];
}
