import { coveredNeeds } from '../data/needs';
import { quantityItems } from '../data/quantities';
import { questions } from '../data/questions';
import type { Question, SaveData } from './types';
import { completionRatio } from './progress';
import { checkRules } from './rules';
import { generateStory } from './story';

const OPEN = '⟪';
const CLOSE = '⟫';

export type SheetCatalogItem = {
  title: string;
  column: number;
  options: string[];
};

export type SheetPayload = {
  name: string;
  group: string;
  sentAt: string;
  completion: number;
  needs: string;
  warnings: string;
  story: string;
  headers: string[];
  values: Array<string | number>;
  catalog: SheetCatalogItem[];
};

export function wrapChoice(text: string): string {
  return `${OPEN}${text}${CLOSE}`;
}

function stamp(date: Date): string {
  const part = (value: number) => String(value).padStart(2, '0');
  return `${date.getFullYear()}-${part(date.getMonth() + 1)}-${part(date.getDate())} ${part(date.getHours())}:${part(date.getMinutes())}`;
}

function questionCell(question: Question, data: SaveData): string {
  if (question.id === 'م2') {
    const parts = Object.entries(data.priorities)
      .filter(([, priority]) => priority.trim())
      .map(([tech, priority]) => `${wrapChoice(priority)} (${tech})`);
    return parts.length ? parts.join(' ') : 'لم تجب';
  }
  const parts = (data.answers[question.id] ?? []).map((option) => {
    const priority = question.id === 'م1' ? data.priorities[option]?.trim() : '';
    return priority ? `${wrapChoice(option)} (${priority})` : wrapChoice(option);
  });
  const extra = data.other[question.id]?.trim();
  if (extra) parts.push(wrapChoice(`خيار مضاف: ${extra}`));
  return parts.length ? parts.join(' ') : 'لم تجب';
}

export function buildSheetPayload(data: SaveData, date = new Date()): SheetPayload {
  const headers = ['وقت الإرسال', 'الاسم', 'الشعبة'];
  const values: Array<string | number> = [stamp(date), data.name.trim(), data.group.trim()];
  const catalog: SheetCatalogItem[] = [];

  for (const question of questions) {
    const title = `${question.id} · ${question.short}`;
    headers.push(title);
    values.push(questionCell(question, data));
    if (question.options.length > 0) {
      catalog.push({ title, column: headers.length, options: question.options });
    }
  }

  for (const item of quantityItems) {
    const stored = data.quantities[item.label];
    headers.push(`${item.label} · العدد`);
    values.push(stored?.count == null ? 'لم يُحدد' : stored.count);
    headers.push(`${item.label} · الموقع`);
    values.push(stored?.location?.trim() || 'لم يُحدد');
  }

  const warnings = checkRules({ answers: data.answers, other: data.other, priorities: data.priorities });
  const covered = coveredNeeds(data.answers, data.other).map((need) => need.title);

  return {
    name: data.name.trim(),
    group: data.group.trim(),
    sentAt: stamp(date),
    completion: completionRatio(data),
    needs: covered.length ? covered.join('، ') : 'لا حاجة مغطاة بعد',
    warnings: warnings.map((warning) => (warning.detail ? `${warning.message}: ${warning.detail}` : warning.message)).join('\n'),
    story: generateStory(data.answers, data.name, { other: data.other, warnings: warnings.map((warning) => warning.message) }),
    headers,
    values,
    catalog,
  };
}

const SHEETS_WEB_APP_URL =
  'https://script.google.com/macros/s/AKfycbxAugVplZ9QGx2btrzthdwjjL7vqtERDw2MH4WpPVRIF0PIg4I20Lxqy9EjZ_K2I5QI/exec';

function postThroughForm(payload: SheetPayload): Promise<{ ok: boolean; message: string }> {
  return new Promise((resolve) => {
    const frame = document.createElement('iframe');
    frame.name = `renwood-sheet-${Date.now()}`;
    frame.hidden = true;
    const form = document.createElement('form');
    form.method = 'POST';
    form.action = SHEETS_WEB_APP_URL;
    form.target = frame.name;
    form.acceptCharset = 'UTF-8';
    const field = document.createElement('input');
    field.type = 'hidden';
    field.name = 'payload';
    field.value = JSON.stringify(payload);
    form.append(field);
    let settled = false;
    const finish = (ok: boolean, message: string) => {
      if (settled) return;
      settled = true;
      window.clearTimeout(timer);
      form.remove();
      frame.remove();
      resolve({ ok, message });
    };
    const timer = window.setTimeout(() => finish(false, 'تعذر الاتصال بجدول المعلمة'), 25000);
    let loads = 0;
    frame.onload = () => {
      loads += 1;
      if (loads > 1) finish(true, 'وصلت النتائج إلى جدول المعلمة');
    };
    document.body.append(frame, form);
    form.submit();
  });
}

/** في الجدول ما دامت هناك إجابة واحدة على الأقل، حتى لو لم يكتمل الجزء. */
export function hasProgressToSave(data: SaveData): boolean {
  if (data.name.trim().length < 2) return false;
  if (Object.values(data.answers).some((items) => items.some((item) => item.trim()))) return true;
  if (Object.values(data.other).some((item) => item.trim())) return true;
  if (Object.values(data.priorities).some((item) => item.trim())) return true;
  return Object.values(data.quantities).some((item) => item.count != null || item.location.trim().length > 0);
}

export function flushResults(data: SaveData): void {
  if (!hasProgressToSave(data) || typeof navigator === 'undefined') return;
  const payload = JSON.stringify(buildSheetPayload(data));
  if (navigator.sendBeacon) {
    const body = new FormData();
    body.append('payload', payload);
    if (navigator.sendBeacon(SHEETS_WEB_APP_URL, body)) return;
  }
  void submitResults(data);
}

export async function submitResults(data: SaveData): Promise<{ ok: boolean; message: string }> {
  const body = JSON.stringify(buildSheetPayload(data));
  try {
    const response = await fetch('/api/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
    });
    const payload = (await response.json().catch(() => null)) as { ok?: boolean; message?: string } | null;
    if (payload && response.ok && payload.ok !== false) {
      return { ok: true, message: payload.message || 'وصلت النتائج إلى جدول المعلمة' };
    }
    const canFallBack = !payload || response.status === 502 || response.status === 503;
    if (payload && !canFallBack) {
      return { ok: false, message: payload.message || 'تعذر إرسال النتائج إلى جدول المعلمة' };
    }
  } catch {
    /* The class site can also write straight to the sheet. */
  }
  if (typeof document === 'undefined') return { ok: false, message: 'تعذر الاتصال بجدول المعلمة' };
  return postThroughForm(JSON.parse(body) as SheetPayload);
}
