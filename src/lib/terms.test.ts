import { describe, expect, it } from 'vitest';
import { glossary } from '../data/glossary';
import { splitTerms } from './terms';

describe('glossary hover terms', () => {
  it('keeps each term unique', () => {
    const terms = glossary.map((entry) => entry.term);
    expect(new Set(terms).size).toBe(terms.length);
  });

  it('prefers the longer term when one name starts another', () => {
    const wifi = splitTerms('Wi-Fi 6E و Wi-Fi').filter((part) => part.kind === 'term');
    expect(wifi.map((part) => part.value)).toEqual(['Wi-Fi 6E', 'Wi-Fi']);
    const cable = splitTerms('Ethernet فئة Cat6a ثم Cat6').filter((part) => part.kind === 'term');
    expect(cable.map((part) => part.value)).toEqual(['Ethernet', 'Cat6a', 'Cat6']);
    const stack = splitTerms('TCP/IP للشبكة').filter((part) => part.kind === 'term');
    expect(stack.map((part) => part.value)).toEqual(['TCP/IP']);
    const windows = splitTerms('Windows 11 Pro أو Windows').filter((part) => part.kind === 'term');
    expect(windows.map((part) => part.value)).toEqual(['Windows 11 Pro', 'Windows']);
  });

  it('attaches an English sentence and an Arabic explanation', () => {
    const poe = splitTerms('مُدار مع PoE').find((part) => part.kind === 'term');
    expect(poe?.kind === 'term' && poe.english.length).toBeGreaterThan(12);
    expect(poe?.kind === 'term' && poe.arabic.length).toBeGreaterThan(12);
  });
});
