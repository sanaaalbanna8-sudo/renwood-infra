import { describe, expect, it } from 'vitest';
import source from '../../../content/guide.md?raw';
import { diffAtoms, guideStats, parseGuide } from './parseGuide';

describe('دليل الحل', () => {
  it('يحفظ إحصاءات المصدر ولا يسقط منه نصاً', () => {
    const doc = parseGuide(source);
    expect(guideStats(doc)).toMatchSnapshot();
    expect(diffAtoms(source, doc)).toEqual({ missing: [], extra: [] });
  });

  it('يدمج جمل تأكد قبل الانتقال في خطوة واحدة', () => {
    const doc = parseGuide(source);
    const writing = doc.activities[0]?.stages[1];
    const block = writing?.flow.find((item) => item.type === 'step' && item.step.title.startsWith('تأكد قبل الانتقال'));
    expect(block?.type).toBe('step');
    if (block?.type !== 'step') return;
    expect(block.step.body).toEqual([
      {
        type: 'ul',
        items: [
          '• ☐ ذكرت عتاداً للمكاتب وقسم المعلومات ومنطقة الانتظار والمقهى ومتجر الهدايا والميدان وسيارة الطوارئ.',
          '• ☐ لكل قطعة كمية وموقع.',
          '• ☐ ذكرت عتاد الشبكة والتخزين، لا الحواسيب وحدها.',
        ],
      },
    ]);
    const separate = writing?.flow.some((item) => item.type === 'step' && item.step.check && item.step.title.includes('عتاد الشبكة'));
    expect(separate).toBe(false);
  });
});
