import { describe, expect, it } from 'vitest';
import { emptyData, parseStudentFile, serializeStudent } from './storage';

describe('student file', () => {
  it('exports and imports the same answers, priorities, and quantities', () => {
    const data = emptyData();
    data.name = 'كرم ناصر';
    data.group = 'أ1';
    data.createdAt = '2026-11-07T08:00:00.000Z';
    data.answers = { ج1: ['لابتوب خفيف'] };
    data.understanding = 'شركة جولات مشياً للزوار في مدينة أوروبية ضمن قطاع السياحة والضيافة اليومية.';
    data.other = { ج1: '  شاشة إضافية  ' };
    data.priorities = { 'الواقع المعزز للمعالم': 'الآن' };
    data.quantities = { 'حواسيب ديزي': { count: 2, location: 'مكتب ديزي' } };

    const raw = serializeStudent(data);
    const file = JSON.parse(raw) as { name: string; understanding: string; other: Record<string, string> };
    expect(file.name).toBe('كرم ناصر');
    expect(file.understanding).toContain('شركة جولات');
    expect(file.other['ج1']).toBe('شاشة إضافية');

    const parsed = parseStudentFile(raw);
    expect(parsed?.name).toBe('كرم ناصر');
    expect(parsed?.group).toBe('أ1');
    expect(parsed?.answers['ج1']).toEqual(['لابتوب خفيف']);
    expect(parsed?.answers['ص2']?.[0]).toContain('شركة جولات');
    expect(parsed?.priorities['الواقع المعزز للمعالم']).toBe('الآن');
    expect(parsed?.quantities['حواسيب ديزي']).toEqual({ count: 2, location: 'مكتب ديزي' });
  });

  it('rejects broken files', () => {
    expect(parseStudentFile('لا')).toBeNull();
    expect(parseStudentFile('{"version":2,"name":"كرم"}')).toBeNull();
    expect(parseStudentFile('{"version":1}')).toBeNull();
  });
});
