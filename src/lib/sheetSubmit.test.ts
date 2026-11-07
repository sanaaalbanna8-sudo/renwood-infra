import { describe, expect, it } from 'vitest';
import { questions } from '../data/questions';
import { emptyData } from './storage';
import { buildSheetPayload, wrapChoice } from './sheetSubmit';

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
  });
});
