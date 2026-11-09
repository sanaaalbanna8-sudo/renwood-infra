import { describe, expect, it } from 'vitest';
import { questions } from '../data/questions';
import { emptyData } from './storage';
import { restoreSheetRow } from './restoreSheet';
import { buildSheetPayload, hasProgressToSave, wrapChoice } from './sheetSubmit';

describe('sheet payload', () => {
  it('puts every question and a wrapped choice on one student row', () => {
    const data = emptyData();
    data.name = 'أمل';
    data.group = 'أ';
    data.answers = { ج1: ['لابتوب خفيف', 'حاسوب مكتبي'] };
    data.priorities = { 'شبكات 4G وكذلك 5G': 'الآن' };
    const payload = buildSheetPayload(data, new Date('2026-11-07T18:00:00Z'));
    expect(payload.values).toHaveLength(payload.headers.length);
    expect(payload.headers[3]).toBe('ج1 · أجهزة ديزي');
    expect(payload.values[3]).toContain(wrapChoice('لابتوب خفيف'));
    expect(payload.values[3]).toContain(wrapChoice('حاسوب مكتبي'));
    const priorityHeader = payload.headers.indexOf('م2 · أولوية التقنية');
    expect(String(payload.values[priorityHeader])).toContain(wrapChoice('الآن'));
    const missed = payload.headers.indexOf('ج2 · أجهزة موظفي المعلومات');
    expect(payload.values[missed]).toBe('لم تجب');
    const daisy = payload.catalog.find((item) => item.title.startsWith('ج1'));
    expect(daisy?.column).toBe(4);
    expect(daisy?.options).toEqual(questions.find((question) => question.id === 'ج1')?.options);
    expect(payload.catalog).toHaveLength(questions.filter((question) => question.options.length > 0).length);
    data.other = { ج1: 'جهاز خاص' };
    data.quantities = { 'حواسيب ديزي': { count: 2, location: 'مكتب ديزي' } };
    const again = buildSheetPayload(data, new Date('2026-11-07T18:00:00Z'));
    const restored = restoreSheetRow(again.headers, again.values);
    expect(restored?.name).toBe('أمل');
    expect(restored?.group).toBe('أ');
    expect(restored?.answers['ج1']).toEqual(['لابتوب خفيف', 'حاسوب مكتبي']);
    expect(restored?.other['ج1']).toBe('جهاز خاص');
    expect(restored?.priorities['شبكات 4G وكذلك 5G']).toBe('الآن');
    expect(restored?.quantities['حواسيب ديزي']).toEqual({ count: 2, location: 'مكتب ديزي' });
  });

  it('يحفظ الاسم إذا بدأت الاختيارات ولو لم يكتمل الجزء', () => {
    const empty = emptyData();
    empty.name = 'أمل';
    expect(hasProgressToSave(empty)).toBe(false);
    empty.answers = { ج1: ['لابتوب خفيف'] };
    expect(hasProgressToSave(empty)).toBe(true);
    const unnamed = emptyData();
    unnamed.answers = { ج1: ['لابتوب خفيف'] };
    expect(hasProgressToSave(unnamed)).toBe(false);
  });
});
