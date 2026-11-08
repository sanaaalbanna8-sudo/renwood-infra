import type { GuideStep } from './parseGuide';

const REPORT_SECTION = /^(?:الغلاف والمقدمة|الخاتمة|نقاط التواصل المطلوبة|التقنيات الناشئة|الرسم|تبرير نهجك)/;

/** ما يكتبه الطالب في التقرير، لا التوجيه ولا الشرح ولا أفعال الأمر. */
export function isReportWork(step: Pick<GuideStep, 'role' | 'title'>): boolean {
  if (step.role === 'write') return true;
  if (step.role === 'check') return false;
  if (step.title.startsWith('تأكد قبل')) return false;
  if (step.title.startsWith('فقرة البداية') || step.title.startsWith('فقرة الختام') || step.title.startsWith('توصية اختيارية')) return true;
  return step.role === 'section' && REPORT_SECTION.test(step.title);
}
