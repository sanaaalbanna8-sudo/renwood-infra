import { describe, expect, it } from 'vitest';
import { questions } from '../data/questions';
import { generateStory } from './story';
import { isNegative } from './text';

describe('generateStory', () => {
  it('joins a multi answer with و before the last item', () => {
    const text = generateStory(
      {
        ج1: ['لابتوب خفيف', 'لابتوب قوي', 'هاتف ذكي'],
        ج2: ['حاسوب مكتبي لكل موظف'],
      },
      'ليان',
    );
    expect(text).toContain('يستخدم لابتوب خفيف، لابتوب قوي و هاتف ذكي لديزي.');
    expect(text).toContain('يستخدم موظفو المعلومات حاسوب مكتبي لكل موظف.');
    expect(text).not.toMatch(/[{}]/);
  });

  it('inserts one single-choice answer', () => {
    const text = generateStory({ ز1: ['Windows 11 Pro'], ز2: ['Android'] }, 'كرم');
    expect(text).toContain('يعمل على أجهزة المكاتب Windows 11 Pro.');
    expect(text).toContain('يعمل على أجهزة المرشدين Android.');
  });

  it('drops an empty answer instead of leaving braces', () => {
    expect(generateStory({}, 'ليان')).toBe('');
  });

  it('drops a whole sentence when one of its variables is empty', () => {
    const text = generateStory({ ز1: ['Windows 11 Pro'], ز2: ['Android'], ز3: ['Microsoft 365'] }, 'كرم');
    expect(text).toContain('Windows 11 Pro');
    expect(text).not.toContain('Microsoft 365');
    expect(text).not.toMatch(/[{}]/);
  });

  it('leaves a lone negative choice out of the sentence and lists it at the end', () => {
    const text = generateStory({ و1: ['لا تتبع'], و2: ['هاتف محمول بحامل'] }, 'سارة');
    expect(text).not.toContain('تُتتبَّع السيارة');
    expect(text).toContain('ولم تُعتمد في هذه البنية: لا تتبع.');
    expect(text).not.toMatch(/\{[^{}]*\}/);
  });

  it('adds the optional other text to a filled answer', () => {
    const text = generateStory(
      { ج1: ['لابتوب خفيف'], ج2: ['حاسوب مكتبي لكل موظف'] },
      'ليان',
      { other: { ج1: 'قلم ضوئي' } },
    );
    expect(text).toContain('لابتوب خفيف و قلم ضوئي');
  });

  it('names only the needs that have at least one answer', () => {
    const text = generateStory(
      {
        ح1: ['جداول بيانات مشتركة'],
        ج1: ['لابتوب خفيف'],
        ج2: ['حاسوب مكتبي لكل موظف'],
      },
      'ليان',
    );
    expect(text).toContain('بُنيت هذه البنية على أهم الاحتياجات الآتية: الحجز من القنوات الثلاث.');
    expect(text).not.toContain('النمو');
    expect(text).not.toMatch(/[{}]/);
  });

  it('never leaves a variable token when answers exist', () => {
    const answers: Record<string, string[]> = {};
    for (const question of questions) {
      if (question.type === 'text') continue;
      const option = question.options.find((item) => !isNegative(item));
      if (option) answers[question.id] = [option];
    }
    const text = generateStory(answers, 'نور');
    expect(text).toContain('الاحتياجات الآتية');
    expect(text).not.toMatch(/[{}]/);
    expect(text.length).toBeGreaterThan(80);
  });
});
