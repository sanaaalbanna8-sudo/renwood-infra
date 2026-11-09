import { quantityItems } from '../data/quantities';
import { questions } from '../data/questions';
import type { SaveData } from './types';
import { emptyData } from './storage';

const OPEN = '⟪';
const CLOSE = '⟫';

export function unwrapCell(cell: string): { inner: string; note: string }[] {
  if (!cell.trim() || cell.trim() === 'لم تجب') return [];
  return cell
    .split(OPEN)
    .slice(1)
    .map((piece) => {
      const end = piece.indexOf(CLOSE);
      if (end < 0) return { inner: piece.trim(), note: '' };
      const inner = piece.slice(0, end);
      const rest = piece.slice(end + CLOSE.length).trim();
      const wrapped = rest.startsWith('(') && rest.endsWith(')') ? rest.slice(1, -1) : '';
      return { inner, note: wrapped };
    })
    .filter((item) => item.inner);
}

/** يعيد بناء اختيارات الطالبة من صف «التفاصيل» من غير كتابة أي شيء في الجدول. */
export function restoreSheetRow(headers: string[], values: Array<string | number>): SaveData | null {
  if (headers.length !== values.length || !headers.length) return null;
  const byHeader = new Map<string, string | number>();
  headers.forEach((header, index) => byHeader.set(header, values[index] ?? ''));
  const name = String(byHeader.get('الاسم') ?? '').trim();
  if (name.length < 2) return null;
  const data = emptyData();
  data.name = name;
  data.group = String(byHeader.get('الشعبة') ?? '').trim();
  const sentAt = String(byHeader.get('وقت الإرسال') ?? '').trim();
  data.createdAt = sentAt;
  data.updatedAt = sentAt;
  data.readingDone = true;
  data.lastPath = '/summary';

  for (const question of questions) {
    const cell = String(byHeader.get(`${question.id} · ${question.short}`) ?? '');
    if (question.id === 'م2') {
      for (const token of unwrapCell(cell)) {
        if (token.note) data.priorities[token.note] = token.inner;
      }
      continue;
    }
    const chosen: string[] = [];
    for (const token of unwrapCell(cell)) {
      if (token.inner.startsWith('خيار مضاف:')) {
        const extra = token.inner.slice('خيار مضاف:'.length).trim();
        if (extra) data.other[question.id] = extra;
        continue;
      }
      chosen.push(token.inner);
      if (question.id === 'م1' && token.note) data.priorities[token.inner] = token.note;
    }
    if (chosen.length) data.answers[question.id] = chosen;
  }

  for (const item of quantityItems) {
    const countText = String(byHeader.get(`${item.label} · العدد`) ?? '').trim();
    const locationText = String(byHeader.get(`${item.label} · الموقع`) ?? '').trim();
    const location = !locationText || locationText === 'لم يُحدد' ? '' : locationText;
    const count = !countText || countText === 'لم يُحدد' ? null : Number(countText);
    const numeric = count != null && Number.isFinite(count) ? count : null;
    if (numeric != null || location) data.quantities[item.label] = { count: numeric, location };
  }

  data.understanding = data.answers['ص2']?.[0] ?? '';
  const checks = String(byHeader.get('خطوات الدليل') ?? '');
  for (const id of checks.split('\n')) {
    const stepId = id.trim();
    if (stepId) data.progress[stepId] = { done: true, at: sentAt };
  }
  return data;
}

export type StoredRow = {
  ok: boolean;
  message?: string;
  needGroup?: boolean;
  groups?: string[];
  headers?: string[];
  values?: Array<string | number>;
};

const SHEET_VIEW_KEY = 'renwood-from-sheet';

export function markSheetView(): void {
  sessionStorage.setItem(SHEET_VIEW_KEY, '1');
}

export function clearSheetView(): void {
  sessionStorage.removeItem(SHEET_VIEW_KEY);
}

export function isSheetView(): boolean {
  return sessionStorage.getItem(SHEET_VIEW_KEY) === '1';
}

const SHEETS_URL =
  'https://script.google.com/macros/s/AKfycbxAugVplZ9QGx2btrzthdwjjL7vqtERDw2MH4WpPVRIF0PIg4I20Lxqy9EjZ_K2I5QI/exec';

function loadJsonp(name: string, group: string): Promise<StoredRow> {
  return new Promise((resolve, reject) => {
    const callback = `renwoodRestore_${Date.now()}`;
    const script = document.createElement('script');
    const page = window as unknown as Record<string, ((row: StoredRow) => void) | undefined>;
    const timer = window.setTimeout(() => finish(new Error('timeout')), 25000);
    const finish = (error?: Error, row?: StoredRow) => {
      window.clearTimeout(timer);
      delete page[callback];
      script.remove();
      if (error || !row) reject(error ?? new Error('empty'));
      else resolve(row);
    };
    page[callback] = (row) => finish(undefined, row);
    script.onerror = () => finish(new Error('network'));
    const query = new URLSearchParams({ action: 'restore', name, group, callback });
    script.src = `${SHEETS_URL}?${query}`;
    document.body.append(script);
  });
}

export function isUnknownName(row: StoredRow): boolean {
  return row.ok === false && row.message === 'لا يوجد سجل بهذا الاسم';
}

async function requestRow(name: string, group: string): Promise<StoredRow> {
  const query = new URLSearchParams({ name: name.trim(), group: group.trim() });
  try {
    const response = await fetch(`/api/restore?${query}`);
    const payload = (await response.json().catch(() => null)) as StoredRow | null;
    if (payload && typeof payload.ok === 'boolean' && (response.ok || response.status === 404 || payload.needGroup)) {
      return payload;
    }
  } catch {
    /* الجدول يُقرأ مباشرة إن لم يكن وسيط الموقع جاهزاً */
  }
  return loadJsonp(name.trim(), group.trim());
}

export async function fetchStoredRow(name: string, group: string): Promise<StoredRow> {
  const row = await requestRow(name, group);
  if (group.trim() && row.message === 'لا يوجد سجل بهذا الاسم وهذه الشعبة') return requestRow(name, '');
  return row;
}
