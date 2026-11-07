export type SummarySection = {
  stage: number;
  title: string;
  withQuantities?: boolean;
};

export const summarySections: SummarySection[] = [
  { stage: 2, title: 'قائمة البرامج' },
  { stage: 1, title: 'قائمة العتاد', withQuantities: true },
  { stage: 3, title: 'قائمة الشبكات والاتصال' },
  { stage: 4, title: 'قائمة العمليات والتدفقات' },
  { stage: 5, title: 'قائمة الأنظمة والبيانات' },
  { stage: 6, title: 'قائمة الحماية' },
  { stage: 7, title: 'قائمة التقنيات الناشئة' },
  { stage: 8, title: 'قائمة التشغيل والنمو' },
];
