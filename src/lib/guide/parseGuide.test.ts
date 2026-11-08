import { describe, expect, it } from 'vitest';
import source from '../../../content/guide.md?raw';
import { diffAtoms, guideStats, isWriteTitle, parseGuide } from './parseGuide';

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

  it('يدمج الفعل المطلوب والسؤال الذي يوجهك داخل القسم', () => {
    const doc = parseGuide(source);
    const stage = doc.activities[1]?.stages[1];
    const section = stage?.flow.find((item) => item.type === 'step' && item.step.title.startsWith('القسم 1: البيانات'));
    expect(section?.type).toBe('step');
    if (section?.type !== 'step') return;
    const text = section.step.body.filter((block) => block.type === 'p').map((block) => (block.type === 'p' ? block.text : ''));
    expect(text.some((line) => line.startsWith('الفعل المطلوب'))).toBe(true);
    expect(text.some((line) => line.startsWith('السؤال الذي يوجهك'))).toBe(true);
    const loose = doc.activities.some((activity) =>
      activity.stages.some((item) =>
        item.flow.some(
          (block) =>
            block.type === 'info' &&
            block.body.some((part) => part.type === 'p' && (part.text.startsWith('الفعل المطلوب') || part.text.startsWith('السؤال الذي يوجهك'))),
        ),
      ),
    );
    expect(loose).toBe(false);
  });

  it('يضع مربعاً على ما يُكتب في التقرير ويبقي أسئلة التوجيه بلا مربع', () => {
    const doc = parseGuide(source);
    const stage = doc.activities[0]?.stages[1];
    const software = stage?.flow.find((item) => item.type === 'step' && item.step.title === 'جدول البرمجيات');
    expect(software?.type).toBe('step');
    if (software?.type !== 'step') return;
    expect(software.step.role).toBe('write');
    expect(software.step.body.some((block) => block.type === 'table' && block.rows[0]?.cells[0]?.startsWith('البرنامج'))).toBe(true);
    expect(software.step.body.some((block) => block.type === 'p' && block.text.includes('السؤال الذي يوجهك'))).toBe(false);
    const guidanceStep = stage?.flow.some((item) => item.type === 'step' && item.step.title.startsWith('ما يجب أن تغطيه'));
    expect(guidanceStep).toBe(false);
    const guidanceKept = stage?.flow.some(
      (item) =>
        item.type !== 'step' &&
        item.body.some((block) => block.type === 'p' && block.text.startsWith('ما يجب أن تغطيه اختياراتك من البرامج')),
    );
    expect(guidanceKept).toBe(true);
    const titles = doc.activities.flatMap((activity) => activity.stages.flatMap((item) => item.flow.flatMap((block) => (block.type === 'step' ? [block.step.title] : []))));
    expect(titles.filter((title) => isWriteTitle(title))).toHaveLength(21);
    expect(titles.some((title) => title.startsWith('مستويات المؤسسة') || title.startsWith('ما يظهر في جدول التحليل'))).toBe(false);
  });
});
