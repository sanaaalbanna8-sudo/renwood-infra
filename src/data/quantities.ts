export type QuantityItem = {
  label: string;
  questionId?: string;
};

export const quantityCounts = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

export const quantityLocations = [
  'مكتب ديزي',
  'قسم المعلومات',
  'منطقة الانتظار',
  'المقهى',
  'المتجر',
  'المقر',
  'نقطة التجمع',
  'مع المرشدين',
  'سيارة الطوارئ',
  'أكثر من موقع',
];

export const quantityItems: QuantityItem[] = [
  { label: 'حواسيب ديزي', questionId: 'ج1' },
  { label: 'حواسيب موظفي المعلومات', questionId: 'ج2' },
  { label: 'أجهزة المرشدين', questionId: 'ج3' },
  { label: 'بطاريات متنقلة وملحقات المرشدين', questionId: 'ج4' },
  { label: 'قارئات بطاقات محمولة' },
  { label: 'شرائح البيانات' },
  { label: 'الطابعات والماسحات', questionId: 'ج5' },
  { label: 'نقاط البيع (المقهى والمتجر)', questionId: 'د1' },
  { label: 'الشاشات والأكشاك (الانتظار والقسم)', questionId: 'ج7' },
  { label: 'نقاط الوصول اللاسلكية' },
  { label: 'السويتشات' },
  { label: 'الراوتر والجدار الناري' },
  { label: 'خطوط الإنترنت (رئيس واحتياطي)' },
  { label: 'وحدات UPS', questionId: 'أ3' },
  { label: 'الكاميرات والأقفال', questionId: 'أ4' },
  { label: 'الخادم أو NAS أو وسائط النسخ الاحتياطي', questionId: 'ك4' },
  { label: 'تراخيص واشتراكات البرمجيات (بعدد المستخدمين)' },
  { label: 'تجهيزات سيارة الطوارئ', questionId: 'و3' },
];

export function quantityForQuestion(questionId: string): QuantityItem | undefined {
  return quantityItems.find((item) => item.questionId === questionId);
}
