/** ملاحظة بجانب ما اختاره الطالب في الجزء الأول. البديل والسبب والمعايير ليست منها. */
export function partOneHint(title: string): 'needsDecision' | 'decisionLog' | 'quantities' | 'quantityCheck' | 'placesCheck' | null {
  if (title.startsWith('الخطوة 1: جدول الاحتياجات')) return 'needsDecision';
  if (title.startsWith('الخطوة 3: افتح سجل القرارات')) return 'decisionLog';
  if (title.startsWith('الخطوة 4: حدد الكميات والمواقع')) return 'quantities';
  if (title.includes('لكل بند كمية وموقع ومستفيد')) return 'quantityCheck';
  if (title.includes('غطيت المقهى ومتجر الهدايا ومنطقة الانتظار وسيارة الطوارئ')) return 'placesCheck';
  return null;
}
