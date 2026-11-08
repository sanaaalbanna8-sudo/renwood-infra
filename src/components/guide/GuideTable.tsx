import { useState } from 'react';
import { ar } from '../../i18n/ar';
import { emptyFrame, isGuidanceTable, type FrameTable } from '../../lib/guide/copyTable';

export function GuideTable({ table }: { table: FrameTable }) {
  const [copied, setCopied] = useState(false);
  const header = table.rows[0]?.cells.length ?? 0;
  const guidance = isGuidanceTable(table);

  async function copy() {
    const frame = emptyFrame(table);
    try {
      if (navigator.clipboard && typeof ClipboardItem !== 'undefined') {
        const html = new Blob([frame.html], { type: 'text/html' });
        const text = new Blob([frame.text], { type: 'text/plain' });
        await navigator.clipboard.write([new ClipboardItem({ 'text/html': html, 'text/plain': text })]);
      } else {
        await navigator.clipboard.writeText(frame.text);
      }
    } catch {
      try {
        await navigator.clipboard.writeText(frame.text);
      } catch {
        return;
      }
    }
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  }

  return (
    <div className="guide-table-block">
      <div className="guide-table-wrap">
        <table className="guide-table">
          {table.rows[0] && (
            <thead>
              <tr>
                {table.rows[0].cells.map((cell, cellIndex) => (
                  <th key={`${cellIndex}-${cell.slice(0, 12)}`} scope="col">
                    {cell}
                  </th>
                ))}
              </tr>
            </thead>
          )}
          <tbody>
            {table.rows.slice(1).map((row, rowIndex) => (
              <tr key={`${row.cells[0] ?? 'row'}-${rowIndex}`} className={row.example ? 'is-example' : undefined}>
                {row.cells.map((cell, cellIndex) => (
                  <td key={`${cellIndex}-${cell.slice(0, 12)}`}>
                    {row.example && cellIndex === 0 ? <span className="example-badge">{ar.exampleBadge}</span> : null}
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {header > 0 && !guidance && (
        <div className="guide-copy no-print">
          <button type="button" className="btn-ghost" onClick={() => void copy()}>
            {copied ? ar.copied : ar.copyFrame}
          </button>
          <p className="faint">{ar.copyHint}</p>
        </div>
      )}
    </div>
  );
}
