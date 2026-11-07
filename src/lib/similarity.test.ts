import { describe, expect, it } from 'vitest';
import { choicePairs, isSimilar, jaccard, similarityPairs } from './similarity';

describe('similarity', () => {
  it('measures Jaccard overlap of id::option pairs and ignores free text', () => {
    const left = choicePairs({
      answers: { ج1: ['لابتوب خفيف', 'هاتف ذكي'], ص2: ['نص مختلف تماماً عن الآخر'] },
      priorities: {},
    });
    const right = choicePairs({
      answers: { ج1: ['لابتوب خفيف'], ص2: ['صياغة أخرى لا تشبه الأولى'] },
      priorities: {},
    });
    expect(jaccard(left, right)).toBeCloseTo(0.5);
    expect(jaccard(left, left)).toBe(1);
    expect(jaccard(new Set(['أ']), new Set(['ب']))).toBe(0);
    expect(jaccard(new Set(), new Set())).toBe(0);
  });

  it('flags pairs above 85 percent', () => {
    const full = Object.fromEntries(Array.from({ length: 10 }, (_, index) => [`س${index}`, ['خيار']]));
    const almost = Object.fromEntries(Array.from({ length: 9 }, (_, index) => [`س${index}`, ['خيار']]));
    const pairs = similarityPairs([
      { name: 'أ', answers: full, priorities: {} },
      { name: 'ب', answers: almost, priorities: {} },
      { name: 'ج', answers: { س0: ['مختلف'] }, priorities: {} },
    ]);
    const close = pairs.find((pair) => pair.left === 'أ' && pair.right === 'ب');
    const far = pairs.find((pair) => pair.right === 'ج' || pair.left === 'ج');
    expect(close?.score).toBeCloseTo(0.9);
    expect(isSimilar(close?.score ?? 0)).toBe(true);
    expect(isSimilar(0.85)).toBe(false);
    expect(isSimilar(far?.score ?? 1)).toBe(false);
  });
});
