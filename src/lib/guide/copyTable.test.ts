import { describe, expect, it } from 'vitest';
import { activityRatio, countedSteps, guide, stageRatio } from './catalog';
import { canCopyTable, emptyFrame, isGuidanceTable, isPrepStage, isReportPathTable } from './copyTable';
import type { FlowItem, TextBlock } from './parseGuide';
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

  it('لا يجعل جدول السؤال الذي يوجهك قابلاً للنسخ', () => {
    const tables: TextBlock[] = [];
    const take = (blocks: TextBlock[]) => {
      for (const block of blocks) if (block.type === 'table') tables.push(block);
    };
    const walk = (flow: FlowItem[]) => {
      for (const item of flow) {
        if (item.type === 'step') take(item.step.body);
        else take(item.body);
      }
    };
    walk(guide.intro);
    for (const activity of guide.activities) for (const stage of activity.stages) walk(stage.flow);
    const guidance = tables.filter((table) => table.type === 'table' && isGuidanceTable(table));
    expect(guidance).toHaveLength(3);
    const report = tables.find((table) => table.type === 'table' && table.rows[0]?.cells.some((cell) => cell.startsWith('البرنامج')));
    expect(report && report.type === 'table' && canCopyTable(report)).toBe(true);
    const paths = tables.filter((table) => table.type === 'table' && isReportPathTable(table));
    expect(paths).toHaveLength(3);
    expect(paths.every((table) => table.type === 'table' && !canCopyTable(table))).toBe(true);
    const prep = guide.activities.flatMap((activity) => activity.stages.filter((stage) => isPrepStage(stage.tag)));
    expect(prep).toHaveLength(4);
    const prepTables: TextBlock[] = [];
    for (const stage of prep) {
      for (const item of stage.flow) {
        const blocks = item.type === 'step' ? item.step.body : item.body;
        for (const block of blocks) if (block.type === 'table') prepTables.push(block);
      }
    }
    expect(prepTables).toHaveLength(7);
    const needs = prepTables.find((table) => table.type === 'table' && table.rows[0]?.cells[0]?.startsWith('المهمة أو المتطلب'));
    expect(needs && needs.type === 'table' && canCopyTable(needs)).toBe(true);
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
