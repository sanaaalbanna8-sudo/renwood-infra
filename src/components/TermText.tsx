import { useId, useMemo } from 'react';
import { splitTerms } from '../lib/terms';

export function TermText({ text }: { text: string }) {
  const base = useId();
  const parts = useMemo(() => splitTerms(text), [text]);
  return (
    <>
      {parts.map((part, index) =>
        part.kind === 'text' ? (
          <span key={index}>{part.value}</span>
        ) : (
          <span key={index} className="term" tabIndex={0} aria-describedby={`${base}-${index}`}>
            <bdi>{part.value}</bdi>
            <span id={`${base}-${index}`} className="term-tip" role="tooltip">
              <bdi className="term-en">{part.english}</bdi>
              <span className="term-ar">{part.arabic}</span>
            </span>
          </span>
        ),
      )}
    </>
  );
}
