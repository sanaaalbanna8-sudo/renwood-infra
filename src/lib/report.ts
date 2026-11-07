import { coveredNeeds, needs } from '../data/needs';
import { quantityForQuestion, quantityItems } from '../data/quantities';
import { questionById, questionsByStage } from '../data/questions';
import { summarySections } from '../data/summarySections';
import { checkRules } from './rules';
import { generateStory } from './story';
import type { SaveData, Warning } from './types';
import { formatDate, isNegative, joinArabic } from './text';

export type ChosenItem = {
  text: string;
  added?: boolean;
  priority?: string;
};

export type ReportRow = {
  id: string;
  short: string;
  chosen: ChosenItem[];
  alternatives: string[];
  unanswered: boolean;
  count: number | null;
  location: string;
  quantityLabel?: string;
};

export type ReportSection = {
  stage: number;
  title: string;
  withQuantities: boolean;
  rows: ReportRow[];
};

export type NeedStatus = {
  title: string;
  covered: boolean;
};

export type Report = {
  name: string;
  group: string;
  date: string;
  understanding: string;
  needs: NeedStatus[];
  sections: ReportSection[];
  warnings: Warning[];
  story: string;
};

function chosenFor(data: SaveData, id: string): { chosen: ChosenItem[]; alternatives: string[]; unanswered: boolean } {
  const question = questionById(id);
  if (!question) return { chosen: [], alternatives: [], unanswered: true };
  if (question.type === 'text') {
    const text = id === 'ص2' ? data.understanding || data.answers['ص2']?.[0] || '' : data.answers[id]?.[0] || '';
    return {
      chosen: text.trim() ? [{ text }] : [],
      alternatives: [],
      unanswered: !text.trim(),
    };
  }
  const selected = new Set(data.answers[id] ?? []);
  const chosen: ChosenItem[] = (data.answers[id] ?? []).map((text) => {
    const item: ChosenItem = { text };
    if (id === 'م1' && !isNegative(text)) {
      item.priority = data.priorities[text] || '';
    }
    return item;
  });
  const extra = data.other[id]?.trim();
  if (extra) chosen.push({ text: extra, added: true });
  return {
    chosen,
    alternatives: question.options.filter((option) => !selected.has(option)),
    unanswered: chosen.length === 0,
  };
}

export function buildReport(data: SaveData, date = new Date()): Report {
  const warnings = checkRules({
    answers: data.answers,
    other: data.other,
    priorities: data.priorities,
  });
  const story = generateStory(data.answers, data.name, {
    other: data.other,
    warnings: warnings.map((warning) => warning.message),
  });
  const covered = new Set(coveredNeeds(data.answers, data.other).map((need) => need.title));
  const needRows = needs.map((need) => ({ title: need.title, covered: covered.has(need.title) }));
  const sections: ReportSection[] = summarySections.map((section) => {
    const rows: ReportRow[] = questionsByStage(section.stage)
      .filter((question) => question.id !== 'م2')
      .map((question) => {
        const result = chosenFor(data, question.id);
        const quantity = section.withQuantities ? quantityForQuestion(question.id) : undefined;
        const stored = quantity ? data.quantities[quantity.label] : undefined;
        return {
          id: question.id,
          short: question.short,
          chosen: result.chosen,
          alternatives: result.alternatives,
          unanswered: result.unanswered,
          count: stored?.count ?? null,
          location: stored?.location ?? '',
          quantityLabel: quantity?.label,
        };
      });
    if (section.withQuantities) {
      for (const item of quantityItems) {
        if (item.questionId) continue;
        const stored = data.quantities[item.label];
        rows.push({
          id: item.label,
          short: item.label,
          chosen: [],
          alternatives: [],
          unanswered: false,
          count: stored?.count ?? null,
          location: stored?.location ?? '',
          quantityLabel: item.label,
        });
      }
    }
    return {
      stage: section.stage,
      title: section.title,
      withQuantities: Boolean(section.withQuantities),
      rows,
    };
  });

  return {
    name: data.name,
    group: data.group,
    date: formatDate(date),
    understanding: data.understanding || data.answers['ص2']?.[0] || '',
    needs: needRows,
    sections,
    warnings,
    story,
  };
}

function chosenLine(items: ChosenItem[]): string {
  if (!items.length) return 'لم تجب';
  return joinArabic(
    items.map((item) => {
      const priority = item.priority ? ` (${item.priority})` : '';
      const added = item.added ? ' [خيار مضاف]' : '';
      return `${item.text}${priority}${added}`;
    }),
  );
}

export function reportToMarkdown(report: Report): string {
  const lines: string[] = [
    `# ملخص البنية التحتية لـ ${report.name}`,
    '',
    `الشعبة: ${report.group || '—'}`,
    `التاريخ: ${report.date}`,
    '',
    '## الاحتياجات التي ستخدمها بنيتك',
    ...report.needs.map((need) => `- ${need.covered ? '✓' : '○'} ${need.title}`),
    '',
  ];
  for (const section of report.sections) {
    lines.push(`## ${section.title}`, '');
    for (const row of section.rows) {
      const choice = questionById(row.id) ? chosenLine(row.chosen) : '—';
      lines.push(`### ${row.short}`);
      lines.push(`- ما اخترته: ${choice}`);
      if (section.withQuantities) {
        lines.push(`- العدد: ${row.count == null ? '—' : String(row.count)}`);
        lines.push(`- الموقع: ${row.location || '—'}`);
      }
      if (row.alternatives.length) lines.push(`- البدائل: ${joinArabic(row.alternatives)}`);
      lines.push('');
    }
  }
  lines.push('## فحص التناقض', '');
  if (!report.warnings.length) lines.push('لا تعارض ظاهراً بين اختياراتك', '');
  else {
    for (const warning of report.warnings) {
      const where = warning.questionIds.join('، ');
      lines.push(`- ${warning.detail ? `${warning.detail}: ` : ''}${warning.message} (${where})`);
    }
    lines.push('');
  }
  lines.push('## الصورة العامة', '', report.story || 'لا تكفي الإجابات بعد لتكوين فقرة.');
  return lines.join('\n');
}

export function reportToPlain(report: Report): string {
  return reportToMarkdown(report).replace(/^#{1,3} /gm, '');
}
