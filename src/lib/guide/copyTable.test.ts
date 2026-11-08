import { describe, expect, it } from 'vitest';
import { activityRatio, countedSteps, guide, stageRatio } from './catalog';
import { emptyFrame } from './copyTable';
import type { SaveData } from '../types';

describe('نسخ إطار الجدول', () => {
  it('ينسخ العناوين والإطار ويفرغ الوسط من الأمثلة', () => {
    const frame = emptyFrame({
      type: 'table',
      rows: [
        { cells: ['القرار', 'البديل'], example: false },
        { cells: ['مثال 1: نظام حجز', 'سجل منفصل'], example: true },
        { cells: ['[قرارك]', '[البديل]'], example: false },
      ],
    });
    expect(frame.text.startsWith('القرار\tالبديل\n')).toBe(true);
    expect(frame.text).not.toContain('مثال');
    expect(frame.text).not.toContain('نظام حجز');
    expect(frame.text).not.toContain('[قرارك]');
    expect(frame.html).toContain('<th');
    expect(frame.html).toContain('border:1px solid #000000');
    expect(frame.html.match(/<td /g)?.length).toBe(4);
    expect(frame.html).not.toContain('مثال');
  });
});

describe('تقدم الدليل', () => {
  it('لا يحسب الخطوة الاختيارية في النسبة', () => {
    const stage = guide.activities[0]?.stages[1];
    expect(stage).toBeTruthy();
    if (!stage) return;
    const optional = stage.flow.find((item) => item.type === 'step' && item.step.optional);
    expect(optional && optional.type === 'step').toBe(true);
    if (!optional || optional.type !== 'step') return;
    const required = countedSteps(stage);
    expect(required.some((step) => step.id === optional.step.id)).toBe(false);
    const progress = Object.fromEntries(required.map((step) => [step.id, { done: true, at: '2026-11-08' }]));
    progress[optional.step.id] = { done: false, at: '' };
    expect(stageRatio(stage, progress)).toBe(1);
    const activity = guide.activities[0];
    if (!activity) return;
    expect(activityRatio(activity, progress as SaveData['progress'])).toBeLessThan(1);
  });
});
