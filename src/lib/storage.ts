import type { QuantityValue, SaveData, StudentFile } from './types';

export function emptyData(): SaveData {
  return {
    version: 1,
    name: '',
    group: '',
    createdAt: '',
    updatedAt: '',
    lastPath: '',
    readingDone: false,
    introsSeen: [],
    answers: {},
    other: {},
    priorities: {},
    quantities: {},
    understanding: '',
  };
}

function stringRecord(value: unknown): Record<string, string> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  const result: Record<string, string> = {};
  for (const [key, item] of Object.entries(value as Record<string, unknown>)) {
    if (typeof item === 'string') result[key] = item;
  }
  return result;
}

function answerRecord(value: unknown): Record<string, string[]> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  const result: Record<string, string[]> = {};
  for (const [key, item] of Object.entries(value as Record<string, unknown>)) {
    if (!Array.isArray(item)) continue;
    const options = item.filter((option): option is string => typeof option === 'string' && option.trim().length > 0);
    if (options.length) result[key] = options;
  }
  return result;
}

function quantityRecord(value: unknown): Record<string, QuantityValue> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  const result: Record<string, QuantityValue> = {};
  for (const [key, item] of Object.entries(value as Record<string, unknown>)) {
    if (!item || typeof item !== 'object') continue;
    const record = item as { count?: unknown; location?: unknown };
    const count = typeof record.count === 'number' && Number.isFinite(record.count) ? record.count : null;
    const location = typeof record.location === 'string' ? record.location : '';
    if (count == null && !location.trim()) continue;
    result[key] = { count, location };
  }
  return result;
}

function trimmedOther(other: Record<string, string>): Record<string, string> {
  const result: Record<string, string> = {};
  for (const [key, value] of Object.entries(other)) {
    if (value.trim()) result[key] = value.trim();
  }
  return result;
}

export function toStudentFile(data: SaveData): StudentFile {
  const quantities: StudentFile['quantities'] = {};
  for (const [label, value] of Object.entries(data.quantities)) {
    if (typeof value.count !== 'number' || !Number.isFinite(value.count)) continue;
    quantities[label] = { count: value.count, location: value.location };
  }
  const understanding = data.understanding || data.answers['ص2']?.[0] || '';
  const answers = { ...data.answers };
  if (understanding) answers['ص2'] = [understanding];
  return {
    version: 1,
    name: data.name,
    group: data.group,
    createdAt: data.createdAt,
    answers,
    other: trimmedOther(data.other),
    priorities: data.priorities,
    quantities,
    understanding,
  };
}

export function serializeStudent(data: SaveData): string {
  return JSON.stringify(toStudentFile(data), null, 2);
}

export function parseStudentFile(raw: string): SaveData | null {
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return null;
    const file = parsed as Partial<StudentFile>;
    if (file.version != null && file.version !== 1) return null;
    if (typeof file.name !== 'string' || !file.name.trim()) return null;
    const answers = answerRecord(file.answers);
    const understanding =
      typeof file.understanding === 'string' && file.understanding.trim()
        ? file.understanding
        : answers['ص2']?.[0] ?? '';
    if (understanding) answers['ص2'] = [understanding];
    return {
      ...emptyData(),
      version: 1,
      name: file.name.trim(),
      group: typeof file.group === 'string' ? file.group : '',
      createdAt: typeof file.createdAt === 'string' ? file.createdAt : '',
      updatedAt: typeof file.createdAt === 'string' ? file.createdAt : '',
      readingDone: true,
      answers,
      other: stringRecord(file.other),
      priorities: stringRecord(file.priorities),
      quantities: quantityRecord(file.quantities),
      understanding,
    };
  } catch {
    return null;
  }
}

const STORAGE_KEY = 'renwood-infra';

export function loadSave(): SaveData {
  if (typeof localStorage === 'undefined') return emptyData();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return emptyData();
    const parsed = JSON.parse(raw) as Partial<SaveData>;
    if (parsed.version !== 1 || typeof parsed.name !== 'string') return emptyData();
    return {
      ...emptyData(),
      ...parsed,
      version: 1,
      answers: parsed.answers ?? {},
      other: parsed.other ?? {},
      priorities: parsed.priorities ?? {},
      quantities: parsed.quantities ?? {},
      introsSeen: parsed.introsSeen ?? [],
      understanding: parsed.understanding ?? '',
    };
  } catch {
    return emptyData();
  }
}

export function writeSave(data: SaveData): void {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    /* المتصفح قد يمنع التخزين */
  }
}
