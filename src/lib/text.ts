export function isNegative(option: string): boolean {
  const text = option.trim();
  return text.startsWith('لا ') || text.startsWith('بلا ');
}

export function wordCount(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

export function joinArabic(items: string[]): string {
  const clean = items.map((item) => item.trim()).filter(Boolean);
  if (clean.length === 0) return '';
  if (clean.length === 1) return clean[0];
  if (clean.length === 2) return `${clean[0]} و ${clean[1]}`;
  return `${clean.slice(0, -1).join('، ')} و ${clean[clean.length - 1]}`;
}

export function formatDate(date = new Date()): string {
  const months = [
    'يناير',
    'فبراير',
    'مارس',
    'أبريل',
    'مايو',
    'يونيو',
    'يوليو',
    'أغسطس',
    'سبتمبر',
    'أكتوبر',
    'نوفمبر',
    'ديسمبر',
  ];
  return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
}

export function safeFileName(name: string): string {
  const cleaned = name.trim().replace(/[\\/:*?"<>|]/g, '').replace(/\s+/g, ' ');
  return cleaned || 'طالب';
}

export function endSentence(text: string): string {
  const trimmed = text.trim();
  if (!trimmed) return '';
  if (/[.!?؟]$/.test(trimmed)) return trimmed;
  return `${trimmed}.`;
}
