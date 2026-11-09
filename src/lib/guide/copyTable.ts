import type { TextBlock } from './parseGuide';

export type FrameTable = Extract<TextBlock, { type: 'table' }>;

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** جدول التوجيه فيه «السؤال الذي يوجهك». يُعرض ولا يُنسخ، لأن الطالب لا يلصقه في التقرير. */
export function isGuidanceTable(table: FrameTable): boolean {
  return table.rows.some((row) => row.cells.some((cell) => cell.includes('السؤال الذي يوجهك')));
}

/** جدول «مسار التقرير»: القسم وما يغطيه والمعيار. يُعرض ولا يُنسخ. */
export function isReportPathTable(table: FrameTable): boolean {
  const header = table.rows[0]?.cells ?? [];
  return header[0] === 'القسم' && header.includes('ما يغطيه من الواجب');
}

/** المرحلة 1 مسودة قبل التسليم، وجداولها لا تُنسخ إلى التقرير. */
export function isPrepStage(tag: string): boolean {
  return tag === 'قبل الكتابة';
}

export function canCopyTable(table: FrameTable): boolean {
  return !isGuidanceTable(table) && !isReportPathTable(table);
}

/** الصفحة من اليمين، ووورد يلصق من اليسار. نعكس الأعمدة ليطابق الإطار ما تراه الطالبة. */
function wordOrder(cells: string[]): string[] {
  return [...cells].reverse();
}

/** إطار فارغ: صف العناوين ثم صفوف وسطها فارغ بعدد صفوف الجدول. */
export function emptyFrame(table: FrameTable): { html: string; text: string } {
  const header = wordOrder(table.rows[0]?.cells ?? []);
  const blanks = Math.max(table.rows.length - 1, 1);
  const text = [header.join('\t'), ...Array.from({ length: blanks }, () => header.map(() => '').join('\t'))].join('\n');
  const cellStyle = 'border:1px solid #000000;padding:8px;min-width:88px;height:28px;text-align:right;';
  const head = header.map((cell) => `<th style="${cellStyle}font-weight:700;background:#eef2ff;">${escapeHtml(cell)}</th>`).join('');
  const emptyRow = `<tr>${header.map(() => `<td style="${cellStyle}">&nbsp;</td>`).join('')}</tr>`;
  const html = `<table dir="ltr" border="1" cellspacing="0" cellpadding="8" style="direction:ltr;border-collapse:collapse;border:1px solid #000000;"><thead><tr>${head}</tr></thead><tbody>${emptyRow.repeat(blanks)}</tbody></table>`;
  return { html, text };
}
