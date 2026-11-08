import { describe, expect, it } from 'vitest';
import { ar } from '../../i18n/ar';
import { guide } from './catalog';
import { visibleCheck, visibleItem, visibleListItem } from './guideText';

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
  });

  it('يعرض جملة التأكيد داخل الخطوة بلا مربع مكرر', () => {
    expect(visibleListItem('• ☐ لكل قطعة كمية وموقع.')).toBe('لكل قطعة كمية وموقع.');
  });
});
