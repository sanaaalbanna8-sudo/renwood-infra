import remarkGfm from 'remark-gfm';
import remarkParse from 'remark-parse';
import { unified } from 'unified';
import type { Content, List, ListItem, PhrasingContent, Root, Table } from 'mdast';

export type TextBlock =
  | { type: 'p'; text: string }
  | { type: 'ul'; items: string[] }
  | { type: 'table'; rows: { cells: string[]; example: boolean }[] };

export type GuideStep = {
  id: string;
  title: string;
  optional: boolean;
  check: boolean;
  role: 'section' | 'leaf' | 'check' | 'write';
  body: TextBlock[];
};

export type FlowItem =
  | { type: 'info'; body: TextBlock[] }
  | { type: 'step'; step: GuideStep }
  | { type: 'more'; stepId: string; body: TextBlock[] };

export type GuideStage = {
  id: string;
  title: string;
  tag: string;
  criteria: string[];
  flow: FlowItem[];
};

export type GuideActivity = {
  id: string;
  title: string;
  outcome: string;
  criteria: string[];
  stages: GuideStage[];
};

export type GuideDoc = {
  _comment: string;
  intro: FlowItem[];
  activities: GuideActivity[];
};

export type GuideStats = {
  activities: number;
  stages: number;
  steps: number;
  tables: number;
  rows: number;
  examples: number;
  checks: number;
};

const CRITERIA = /[A-Z]{1,2}\.[A-Z]\d+/g;

const SECTION =
  /^(?:الخطوة \d+|القسم \d+|مسار التقرير|مسار الوثيقة|الغلاف والمقدمة|الرسم|الخاتمة والحكم النهائي|الخاتمة|نقاط التواصل المطلوبة|التقنيات الناشئة \(البند 1\.10\)|تبرير نهجك)(?::|\s|$)/;

const LEAF = /^(?:فقرة البداية|فقرة الختام|توصية اختيارية|تأكد قبل الانتقال|تأكد قبل التسليم)/;

/** عنوان ما يكتبه الطالب في التقرير. أسئلة التوجيه ليست منه. */
export function isWriteTitle(line: string): boolean {
  if (line.startsWith('جدول ')) return true;
  return (
    line === 'أثر البنية على الشركة' ||
    line === 'أثر البنية على أصحاب المصلحة' ||
    line === 'الموازنة' ||
    line === 'وزن الأثر' ||
    line === 'التوصيات' ||
    line.startsWith('الطرق البديلة') ||
    line.startsWith('تقييم الأثر') ||
    line.startsWith('تقييم وثيقة السياسات')
  );
}

function headingLevel(line: string): 1 | 2 | 3 | 0 {
  if (line.startsWith('خطة ')) return 1;
  if (line.startsWith('المرحلة ')) return 2;
  if (line.startsWith('الخاتمة والحكم النهائي') || SECTION.test(line) || LEAF.test(line) || isWriteTitle(line)) return 3;
  return 0;
}

function sourceToMarkdown(source: string): string {
  const lines = source.split(/\r?\n/);
  const out: string[] = [];
  let index = 0;
  while (index < lines.length) {
    const raw = lines[index] ?? '';
    const line = raw.trim();
    if (!line) {
      out.push('');
      index += 1;
      continue;
    }
    if (raw.includes('\t') && !line.startsWith('•')) {
      const rows: string[][] = [];
      while (index < lines.length) {
        const current = lines[index] ?? '';
        if (!current.includes('\t') || current.trim().startsWith('•')) break;
        rows.push(current.split('\t').map((cell) => cell.trim()));
        index += 1;
      }
      const width = rows[0]?.length ?? 0;
      if (rows.some((row) => row.length !== width)) {
        throw new Error(`TABLE_UNEVEN ${rows[0]?.join(' | ') ?? ''}`);
      }
      const escapeCell = (cell: string) => cell.replace(/\|/g, '\\|');
      out.push(`| ${rows[0]?.map(escapeCell).join(' | ') ?? ''} |`);
      out.push(`| ${rows[0]?.map(() => '---').join(' | ') ?? ''} |`);
      for (const row of rows.slice(1)) out.push(`| ${row.map(escapeCell).join(' | ')} |`);
      out.push('');
      continue;
    }
    const level = headingLevel(line);
    if (level) {
      out.push(`${'#'.repeat(level)} ${line}`);
      out.push('');
      index += 1;
      continue;
    }
    if (line.startsWith('•')) {
      while (index < lines.length && (lines[index] ?? '').trim().startsWith('•')) {
        out.push(`- ${(lines[index] ?? '').trim()}`);
        index += 1;
      }
      out.push('');
      continue;
    }
    out.push(line);
    out.push('');
    index += 1;
  }
  return out.join('\n');
}

function plain(node: Content | PhrasingContent): string {
  if (node.type === 'text' || node.type === 'inlineCode') return node.value;
  if (node.type === 'html') throw new Error('HTML_RAW');
  if ('children' in node && Array.isArray(node.children)) {
    return node.children.map((child) => plain(child as Content)).join('');
  }
  return '';
}

function criteriaIn(title: string): string[] {
  return title.match(CRITERIA) ?? [];
}

function stageTag(title: string): string {
  if (title.includes('قبل الكتابة')) return 'قبل الكتابة';
  if (title.includes('كتابة وثيقة السياسات')) return 'كتابة وثيقة السياسات';
  if (title.includes('كتابة التقرير')) return 'كتابة التقرير';
  return '';
}

function isLeafTitle(title: string): boolean {
  return LEAF.test(title);
}

function isCheckLine(text: string): boolean {
  return /^•\s*☐/.test(text);
}

function isInfoLine(text: string): boolean {
  return text.startsWith('الفعل المطلوب') || text.startsWith('السؤال الذي يوجهك');
}

type Bucket = {
  flow: FlowItem[];
  sectionId: string | null;
  leafId: string | null;
  writeId: string | null;
};

function makeSlugger() {
  const seen = new Map<string, number>();
  return (title: string) => {
    const base =
      title
        .normalize('NFKC')
        .replace(/[\u064B-\u0652\u0670\u0640]/g, '')
        .replace(/[أإآ]/g, 'ا')
        .replace(/ى/g, 'ي')
        .replace(/ة/g, 'ه')
        .replace(/[^\p{L}\p{N}]+/gu, '-')
        .replace(/^-+|-+$/g, '')
        .slice(0, 72) || 'band';
    const count = (seen.get(base) ?? 0) + 1;
    seen.set(base, count);
    return count === 1 ? base : `${base}-${count}`;
  };
}

function sectionStep(bucket: Bucket) {
  if (!bucket.sectionId) return undefined;
  for (let index = bucket.flow.length - 1; index >= 0; index -= 1) {
    const item = bucket.flow[index];
    if (item?.type === 'step' && item.step.id === bucket.sectionId && item.step.role === 'section') return item.step;
  }
  return undefined;
}

function appendBody(bucket: Bucket, stepId: string, blocks: TextBlock[]) {
  if (!blocks.length) return;
  const last = bucket.flow[bucket.flow.length - 1];
  if (last?.type === 'step' && last.step.id === stepId) {
    last.step.body.push(...blocks);
    return;
  }
  if (last?.type === 'more' && last.stepId === stepId) {
    last.body.push(...blocks);
    return;
  }
  bucket.flow.push({ type: 'more', stepId, body: blocks });
}

function addContent(bucket: Bucket, blocks: TextBlock[], preferLeaf: boolean) {
  const stepId = (preferLeaf && bucket.leafId) || bucket.writeId || bucket.sectionId;
  if (!stepId) {
    bucket.flow.push({ type: 'info', body: blocks });
    return;
  }
  appendBody(bucket, stepId, blocks);
}

function pushStep(bucket: Bucket, step: GuideStep) {
  bucket.flow.push({ type: 'step', step });
  if (step.role === 'section') {
    bucket.sectionId = step.id;
    bucket.leafId = null;
    bucket.writeId = null;
  } else if (step.role === 'write') {
    bucket.writeId = step.id;
    bucket.leafId = step.id;
  } else if (step.role === 'leaf') {
    bucket.leafId = step.id;
    if (!step.optional) bucket.writeId = null;
  } else {
    bucket.leafId = null;
  }
}

function tableBlock(table: Table): TextBlock {
  const rows = table.children.map((row) => {
    const cells = row.children.map((cell) => plain(cell).replace(/\s+/g, ' ').trim());
    return { cells, example: cells[0]?.startsWith('مثال') ?? false };
  });
  return { type: 'table', rows };
}

function confirmLeafOpen(bucket: Bucket): boolean {
  if (!bucket.leafId) return false;
  for (let index = bucket.flow.length - 1; index >= 0; index -= 1) {
    const item = bucket.flow[index];
    if (item?.type !== 'step' || item.step.id !== bucket.leafId) continue;
    return item.step.title.startsWith('تأكد قبل الانتقال') || item.step.title.startsWith('تأكد قبل التسليم');
  }
  return false;
}

function consumeList(bucket: Bucket, list: List, slug: (title: string) => string) {
  let pending: string[] = [];
  const flush = () => {
    if (!pending.length) return;
    addContent(bucket, [{ type: 'ul', items: pending }], true);
    pending = [];
  };
  for (const item of list.children) {
    const text = listItemText(item);
    if (isCheckLine(text) && !confirmLeafOpen(bucket)) {
      flush();
      pushStep(bucket, {
        id: slug(text),
        title: text,
        optional: false,
        check: true,
        role: 'check',
        body: [],
      });
    } else {
      pending.push(text);
    }
  }
  flush();
}

function listItemText(item: ListItem): string {
  return item.children.map((child) => plain(child)).join('').replace(/\s+/g, ' ').trim();
}

function consumeFlow(nodes: Content[], slug: (title: string) => string): { flow: FlowItem[]; stages: GuideStage[]; activities: GuideActivity[] } {
  const intro: FlowItem[] = [];
  const activities: GuideActivity[] = [];
  let bucket: Bucket = { flow: intro, sectionId: null, leafId: null, writeId: null };
  let activity: GuideActivity | null = null;
  let stage: GuideStage | null = null;

  const openBucket = (flow: FlowItem[]) => {
    bucket = { flow, sectionId: null, leafId: null, writeId: null };
  };

  for (const node of nodes) {
    if (node.type === 'heading' && node.depth === 1) {
      const title = plain(node).replace(/\s+/g, ' ').trim();
      activity = { id: slug(title), title, outcome: '', criteria: criteriaIn(title), stages: [] };
      activities.push(activity);
      stage = null;
      continue;
    }
    if (node.type === 'heading' && node.depth === 2) {
      const title = plain(node).replace(/\s+/g, ' ').trim();
      if (!activity) throw new Error(`STAGE_OUTSIDE ${title}`);
      stage = { id: slug(title), title, tag: stageTag(title), criteria: criteriaIn(title), flow: [] };
      activity.stages.push(stage);
      openBucket(stage.flow);
      continue;
    }
    if (node.type === 'heading' && node.depth === 3) {
      const title = plain(node).replace(/\s+/g, ' ').trim();
      const role = isLeafTitle(title) ? 'leaf' : isWriteTitle(title) ? 'write' : 'section';
      pushStep(bucket, {
        id: slug(title),
        title,
        optional: title.startsWith('توصية اختيارية'),
        check: false,
        role,
        body: [],
      });
      continue;
    }
    if (node.type === 'paragraph') {
      const text = plain(node).replace(/\s+/g, ' ').trim();
      if (!text) continue;
      if (isInfoLine(text)) {
        bucket.leafId = null;
        const section = sectionStep(bucket);
        if (section) section.body.push({ type: 'p', text });
        else bucket.flow.push({ type: 'info', body: [{ type: 'p', text }] });
        continue;
      }
      if (bucket.writeId && bucket.leafId === bucket.writeId) {
        addContent(bucket, [{ type: 'p', text }], true);
        continue;
      }
      if (bucket.writeId && bucket.leafId) {
        addContent(bucket, [{ type: 'p', text }], false);
        continue;
      }
      bucket.leafId = null;
      addContent(bucket, [{ type: 'p', text }], false);
      continue;
    }
    if (node.type === 'list') {
      consumeList(bucket, node, slug);
      continue;
    }
    if (node.type === 'table') {
      if (!bucket.writeId) bucket.leafId = null;
      addContent(bucket, [tableBlock(node)], false);
      continue;
    }
    if (node.type === 'html') throw new Error('HTML_RAW');
  }

  for (const current of activities) {
    for (const item of current.stages) {
      const hasStep = item.flow.some((block) => block.type === 'step');
      if (!hasStep) {
        item.flow.unshift({
          type: 'step',
          step: {
            id: slug(item.title),
            title: item.title,
            optional: false,
            check: false,
            role: 'section',
            body: [],
          },
        });
      }
    }
  }

  return { flow: intro, stages: [], activities };
}

function outcomesOf(intro: FlowItem[]): string[] {
  const outcomes: string[] = [];
  const visit = (blocks: TextBlock[]) => {
    for (const block of blocks) {
      if (block.type !== 'table') continue;
      if (block.rows[0]?.cells[0] !== 'النشاط') continue;
      for (const row of block.rows.slice(1)) outcomes.push(row.cells[row.cells.length - 1] ?? '');
    }
  };
  for (const item of intro) {
    if (item.type === 'info') visit(item.body);
    else if (item.type === 'more') visit(item.body);
    else visit(item.step.body);
  }
  return outcomes;
}

export function parseGuide(source: string): GuideDoc {
  const markdown = sourceToMarkdown(source);
  const tree = unified().use(remarkParse).use(remarkGfm).parse(markdown) as Root;
  const slug = makeSlugger();
  const built = consumeFlow(tree.children, slug);
  const outcomes = outcomesOf(built.flow);
  built.activities.forEach((activity, index) => {
    activity.outcome = outcomes[index] ?? '';
  });
  return {
    _comment: 'لا يُعدَّل يدوياً',
    intro: built.flow,
    activities: built.activities,
  };
}

function countBlocks(blocks: TextBlock[], stats: GuideStats) {
  for (const block of blocks) {
    if (block.type !== 'table') continue;
    stats.tables += 1;
    stats.rows += block.rows.length;
    stats.examples += block.rows.filter((row) => row.example).length;
  }
}

export function guideStats(doc: GuideDoc): GuideStats {
  const stats: GuideStats = {
    activities: doc.activities.length,
    stages: 0,
    steps: 0,
    tables: 0,
    rows: 0,
    examples: 0,
    checks: 0,
  };
  const visit = (flow: FlowItem[]) => {
    for (const item of flow) {
      if (item.type === 'info') countBlocks(item.body, stats);
      else if (item.type === 'more') countBlocks(item.body, stats);
      else {
        stats.steps += 1;
        if (item.step.check) stats.checks += 1;
        countBlocks(item.step.body, stats);
      }
    }
  };
  visit(doc.intro);
  for (const activity of doc.activities) {
    stats.stages += activity.stages.length;
    for (const stage of activity.stages) visit(stage.flow);
  }
  return stats;
}

export function normalizeSpace(value: string): string {
  return value.normalize('NFKC').replace(/\s+/g, ' ').trim();
}

export function sourceAtoms(source: string): string[] {
  const atoms: string[] = [];
  for (const raw of source.split(/\r?\n/)) {
    if (!raw.trim()) continue;
    if (raw.includes('\t') && !raw.trim().startsWith('•')) {
      for (const cell of raw.split('\t')) {
        const text = normalizeSpace(cell);
        if (text) atoms.push(text);
      }
    } else {
      atoms.push(normalizeSpace(raw));
    }
  }
  return atoms;
}

function pushAtoms(blocks: TextBlock[], atoms: string[]) {
  for (const block of blocks) {
    if (block.type === 'p') atoms.push(normalizeSpace(block.text));
    else if (block.type === 'ul') atoms.push(...block.items.map(normalizeSpace));
    else {
      for (const row of block.rows) {
        for (const cell of row.cells) {
          const text = normalizeSpace(cell);
          if (text) atoms.push(text);
        }
      }
    }
  }
}

export function guideAtoms(doc: GuideDoc): string[] {
  const atoms: string[] = [];
  const visit = (flow: FlowItem[]) => {
    for (const item of flow) {
      if (item.type === 'info') pushAtoms(item.body, atoms);
      else if (item.type === 'more') pushAtoms(item.body, atoms);
      else {
        atoms.push(normalizeSpace(item.step.title));
        pushAtoms(item.step.body, atoms);
      }
    }
  };
  visit(doc.intro);
  for (const activity of doc.activities) {
    atoms.push(normalizeSpace(activity.title));
    for (const stage of activity.stages) {
      atoms.push(normalizeSpace(stage.title));
      visit(stage.flow);
    }
  }
  return atoms.filter(Boolean);
}

export function diffAtoms(source: string, doc: GuideDoc): { missing: string[]; extra: string[] } {
  const wanted = new Map<string, number>();
  for (const atom of sourceAtoms(source)) wanted.set(atom, (wanted.get(atom) ?? 0) + 1);
  const got = new Map<string, number>();
  for (const atom of guideAtoms(doc)) got.set(atom, (got.get(atom) ?? 0) + 1);
  const missing: string[] = [];
  const extra: string[] = [];
  for (const [atom, count] of wanted) {
    const have = got.get(atom) ?? 0;
    for (let index = have; index < count; index += 1) missing.push(atom);
  }
  for (const [atom, count] of got) {
    const have = wanted.get(atom) ?? 0;
    for (let index = have; index < count; index += 1) extra.push(atom);
  }
  return { missing, extra };
}
