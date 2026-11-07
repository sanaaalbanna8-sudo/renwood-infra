import { glossary, type GlossaryEntry } from '../data/glossary';

export type TermPart =
  | { kind: 'text'; value: string }
  | { kind: 'term'; value: string; english: string; arabic: string };

const entries = [...glossary].sort((a, b) => b.term.length - a.term.length || a.term.localeCompare(b.term));
const byTerm = new Map<string, GlossaryEntry>(entries.map((entry) => [entry.term, entry]));
const pattern = new RegExp(
  `(?<![A-Za-z0-9])(?:${entries.map((entry) => entry.term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})(?![A-Za-z0-9])`,
  'g',
);

export function splitTerms(text: string): TermPart[] {
  const parts: TermPart[] = [];
  let last = 0;
  pattern.lastIndex = 0;
  for (const match of text.matchAll(pattern)) {
    const index = match.index ?? 0;
    if (index > last) parts.push({ kind: 'text', value: text.slice(last, index) });
    const value = match[0];
    const entry = byTerm.get(value);
    if (entry) parts.push({ kind: 'term', value, english: entry.english, arabic: entry.arabic });
    else parts.push({ kind: 'text', value });
    last = index + value.length;
  }
  if (last < text.length) parts.push({ kind: 'text', value: text.slice(last) });
  if (parts.length === 0) parts.push({ kind: 'text', value: text });
  return parts;
}
