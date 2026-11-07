/** الاحتياجات كلها مطلوبة، ومرتّبة من الأكثر أهمية إلى الأقل. text جملة للطالب، وtitle الاسم المختصر في الملخص. */
export type Need = {
  id: string;
  title: string;
  text: string;
  questions: string[];
};

export const needs: Need[] = [
  {
    id: 'channels',
    title: 'الحجز من القنوات الثلاث',
    text: 'العميل يحجز الجولة من ثلاث قنوات: في المقر، أو بمساعدة المرشد عند نقطة التجمع، أو عبر الإنترنت.',
    questions: ['ح1', 'ح2', 'ح3', 'ح4'],
  },
  {
    id: 'payments',
    title: 'تحصيل المدفوعات',
    text: 'الشركة تقبل عدة طرق للدفع. المرشد يحصّل ثمن الحجز الإضافي عند نقطة التجمع، والعميل يدفع عند الحجز عبر الإنترنت.',
    questions: ['د4', 'د5', 'د6'],
  },
  {
    id: 'field-desk',
    title: 'التواصل بين القسم والمرشدين',
    text: 'القسم والمرشد يتبادلان طوال اليوم: من حضر، وهل الجولة متأخرة أو انتهت، وماذا يحتاج المرشد.',
    questions: ['ه3', 'ه4', 'ه6', 'ي1', 'ي2'],
  },
  {
    id: 'safety',
    title: 'سلامة الجولات وتتبع المواقع',
    text: 'الشركة تعرف مكان الجولة، وتتأكد من سلامة المجموعة، وتستدعي سيارة الطوارئ عند الحاجة.',
    questions: ['ه5', 'و1', 'و4'],
  },
  {
    id: 'service',
    title: 'خدمة العملاء والاستفسارات',
    text: 'الموظف يساعد العميل ويرد على أسئلته قبل الجولة وبعدها.',
    questions: ['ح11', 'ي3'],
  },
  {
    id: 'partners',
    title: 'حجز الفنادق والمطاعم',
    text: 'الموظف يحجز الفندق أو المطعم نيابة عن العميل، ويتفق مع الشريك على الحجز.',
    questions: ['ح9', 'ي4'],
  },
  {
    id: 'privacy',
    title: 'حماية بيانات العملاء والموظفين',
    text: 'بيانات العملاء والموظفين تبقى محفوظة، ولا يراها إلا الموظف الذي يحتاجها.',
    questions: ['ز6', 'ك6', 'ل2', 'ل3', 'ل6', 'ل7', 'ل8'],
  },
  {
    id: 'money',
    title: 'الميزانية والرواتب والجداول',
    text: 'ديزي تتابع الميزانية ورواتب الموظفين وجدول الجولات اليومي.',
    questions: ['ط1', 'ط2', 'ط3'],
  },
  {
    id: 'shop',
    title: 'المقهى والمتجر',
    text: 'المقهى ومتجر الهدايا يسجّلان البيع والمخزون.',
    questions: ['د1', 'د2', 'د3', 'د11'],
  },
  {
    id: 'publicity',
    title: 'الإعلان والعلاقات العامة',
    text: 'الشركة تعلن عن جولاتها وتتواصل مع الزوار والفنادق والمطاعم.',
    questions: ['ط7', 'ز8', 'ز9'],
  },
  {
    id: 'growth',
    title: 'النمو',
    text: 'البنية تتحمل زيادة الحجوزات والموظفين والأجهزة عندما تكبر الشركة.',
    questions: ['ن8'],
  },
];

export function questionTouched(
  id: string,
  answers: Record<string, string[]>,
  other: Record<string, string> = {},
): boolean {
  if ((answers[id]?.length ?? 0) > 0) return true;
  return Boolean(other[id]?.trim());
}

export function coveredNeeds(
  answers: Record<string, string[]>,
  other: Record<string, string> = {},
): Need[] {
  return needs.filter((need) => need.questions.some((id) => questionTouched(id, answers, other)));
}
