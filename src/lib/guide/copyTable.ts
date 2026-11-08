import type { TextBlock } from './parseGuide';

export type FrameTable = Extract<TextBlock, { type: 'table' }>;

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** إطار فارغ: صف العناوين ثم صفوف وسطها فارغ بعدد صفوف الجدول. */
export function emptyFrame(table: FrameTable): { html: string; text: string } {
  const header = table.rows[0]?.cells ?? [];
  const blanks = Math.max(table.rows.length - 1, 1);
  const text = [header.join('\t'), ...Array.from({ length: blanks }, () => header.map(() => '').join('\t'))].join('\n');
  const cellStyle = 'border:1px solid #000000;padding:8px;min-width:88px;height:28px;';
  const head = header.map((cell) => `<th style="${cellStyle}font-weight:700;background:#eef2ff;">${escapeHtml(cell)}</th>`).join('');
  const emptyRow = `<tr>${header.map(() => `<td style="${cellStyle}">&nbsp;</td>`).join('')}</tr>`;
  const html = `<table border="1" cellspacing="0" cellpadding="8" style="border-collapse:collapse;border:1px solid #000000;"><thead><tr>${head}</tr></thead><tbody>${emptyRow.repeat(blanks)}</tbody></table>`;
  return { html, text };
}
