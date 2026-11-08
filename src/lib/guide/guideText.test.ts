import { describe, expect, it } from 'vitest';
import { ar } from '../../i18n/ar';
import { guide } from './catalog';
import { visibleCheck, visibleItem, visibleListItem } from './guideText';
import { isReportWork } from './reportWork';

describe('عرض أسطر الدليل', () => {
  it('يبقي جملة عنصر القائمة ويترك علامة المصدر للقائمة', () => {
    expect(visibleItem('• النشاط 1 يبدأ سجل القرارات: قرار الطالب وبديله المرفوض وسببه.')).toBe(
      'النشاط 1 يبدأ سجل القرارات: قرار الطالب وبديله المرفوض وسببه.',
    );
  });

  it('يبقي جملة التأشير ويترك المربع لزر الخطوة', () => {
    expect(visibleCheck('• ☐ لكل صف في جدول الاحتياجات قرار، ولكل قرار بديل مرفوض.')).toBe(
      'لكل صف في جدول الاحتياجات قرار، ولكل قرار بديل مرفوض.',
    );
    expect(visibleCheck('الخطوة 1: جدول الاحتياجات')).toBe('الخطوة 1: جدول الاحتياجات');
  });

  it('يضع رسالة لكل نشاط، والأخيرة عن العلامة العليا ومرحلة التقييم', () => {
    expect(ar.cheers).toHaveLength(guide.activities.length);
    expect(ar.cheers[3]).toContain('الوزن الأكبر');
    expect(ar.cheers[3]).toContain('السنة الأخيرة');
    expect(ar.cheers[3]).toContain('العلامة العليا');
    expect(ar.cheers[3]).toContain('مرحلة التقييم');
    expect(ar.cheers[3]).toContain('لا يضيّع تعبكم ولا جهدكم');
    expect(ar.cheerClose).toBe('نكمّل الطريق');
    expect(ar.cheerCloseFinal).toContain('الفصل الثاني');
  });

  it('يعرض جملة التأكيد داخل الخطوة بلا مربع مكرر', () => {
    expect(visibleListItem('• ☐ لكل قطعة كمية وموقع.')).toBe('لكل قطعة كمية وموقع.');
  });

  it('يميّز ما يُكتب في التقرير عن التوجيه والشرح', () => {
    const steps = guide.activities.flatMap((activity) => activity.stages.flatMap((stage) => stage.flow.flatMap((item) => (item.type === 'step' ? [item.step] : []))));
    const byTitle = (title: string) => steps.find((step) => step.title === title || step.title.startsWith(title));
    expect(byTitle('جدول البرمجيات') && isReportWork(byTitle('جدول البرمجيات')!)).toBe(true);
    expect(byTitle('فقرة البداية') && isReportWork(byTitle('فقرة البداية')!)).toBe(true);
    expect(byTitle('الغلاف والمقدمة') && isReportWork(byTitle('الغلاف والمقدمة')!)).toBe(true);
    expect(byTitle('الخاتمة والحكم النهائي') && isReportWork(byTitle('الخاتمة والحكم النهائي')!)).toBe(true);
    expect(byTitle('مسار التقرير') && isReportWork(byTitle('مسار التقرير')!)).toBe(false);
    expect(byTitle('القسم 1: البرمجيات') && isReportWork(byTitle('القسم 1: البرمجيات')!)).toBe(false);
    expect(byTitle('تأكد قبل الانتقال') && isReportWork(byTitle('تأكد قبل الانتقال')!)).toBe(false);
    expect(byTitle('الخطوة 1: جدول الاحتياجات') && isReportWork(byTitle('الخطوة 1: جدول الاحتياجات')!)).toBe(false);
    const writing = guide.activities[0]?.stages[1];
    const guidance = writing?.flow.find((item) => item.type === 'more' && item.body.some((block) => block.type === 'p' && block.text.startsWith('ما يجب أن تغطيه')));
    const section = steps.find((step) => step.title.startsWith('القسم 1: البرمجيات'));
    expect(guidance?.type).toBe('more');
    expect(section && guidance?.type === 'more' && guidance.stepId === section.id && !isReportWork(section)).toBe(true);
  });
});
