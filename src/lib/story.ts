import { coveredNeeds } from '../data/needs';
import { storyParagraphs } from '../data/storyTemplates';
import { endSentence, isNegative, joinArabic } from './text';

const VARIABLE = /\{([^{}]+)\}/g;

export type StoryExtras = {
  other?: Record<string, string>;
  warnings?: string[];
};

export function generateStory(
  answers: Record<string, string[]>,
  name: string,
  extras: StoryExtras = {},
): string {
  const other = extras.other ?? {};
  const omitted: string[] = [];
  const seen = new Set<string>();

  const remember = (option: string) => {
    if (seen.has(option)) return;
    seen.add(option);
    omitted.push(option);
  };

  const resolve = (id: string): string | null => {
    if (id === 'اسم الطالب') {
      const student = name.trim();
      return student || null;
    }
    if (id === 'الاحتياجات المغطاة') {
      const titles = coveredNeeds(answers, other).map((need) => need.title);
      return titles.length ? joinArabic(titles) : null;
    }
    const selected = answers[id] ?? [];
    const extra = other[id]?.trim() ?? '';
    if (selected.length === 0 && !extra) return null;
    const positives = selected.filter((option) => !isNegative(option));
    if (positives.length === 0 && !extra) {
      selected.filter(isNegative).forEach(remember);
      return null;
    }
    return joinArabic([...selected, ...(extra ? [extra] : [])]);
  };

  const paragraphs: string[] = [];

  for (const paragraph of storyParagraphs) {
    const lines: string[] = [];
    for (const sentence of paragraph.sentences) {
      const ids = [...sentence.matchAll(VARIABLE)].map((match) => match[1]);
      const values = new Map<string, string>();
      let complete = true;
      for (const id of ids) {
        const value = resolve(id);
        if (!value) {
          complete = false;
          continue;
        }
        values.set(id, value);
      }
      if (!complete) continue;
      let filled = sentence;
      for (const [id, value] of values) {
        filled = filled.split(`{${id}}`).join(value);
      }
      if (filled.includes('{') || filled.includes('}')) continue;
      lines.push(filled.trim());
    }
    if (lines.length >= 2) paragraphs.push(lines.join(' '));
  }

  const closing: string[] = [];
  const seenWarnings = new Set<string>();
  for (const warning of extras.warnings ?? []) {
    const sentence = endSentence(warning);
    if (!sentence || seenWarnings.has(sentence)) continue;
    seenWarnings.add(sentence);
    closing.push(sentence);
  }
  if (omitted.length) {
    closing.push(`ولم تُعتمد في هذه البنية: ${joinArabic(omitted)}.`);
  }
  if (closing.length) paragraphs.push(closing.join(' '));

  return paragraphs.join('\n\n');
}
