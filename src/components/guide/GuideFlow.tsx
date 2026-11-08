import { Check } from 'lucide-react';
import { ar } from '../../i18n/ar';
import { visibleCheck, visibleListItem } from '../../lib/guide/guideText';
import { isReportWork } from '../../lib/guide/reportWork';
import type { FlowItem, GuideStep, TextBlock } from '../../lib/guide/parseGuide';
import type { SaveData } from '../../lib/types';
import { GuideTable } from './GuideTable';

function Blocks({ blocks, copyTables }: { blocks: TextBlock[]; copyTables: boolean }) {
  return (
    <>
      {blocks.map((block, index) => {
        if (block.type === 'p') return <p key={index}>{block.text}</p>;
        if (block.type === 'ul') {
          return (
            <ul key={index} className="guide-list">
              {block.items.map((item, itemIndex) => (
                <li key={`${itemIndex}-${item}`}>{visibleListItem(item)}</li>
              ))}
            </ul>
          );
        }
        return <GuideTable key={index} table={block} copyTables={copyTables} />;
      })}
    </>
  );
}

export function GuideFlow({
  flow,
  progress,
  onToggle,
  copyTables = true,
}: {
  flow: FlowItem[];
  progress: SaveData['progress'];
  onToggle: (stepId: string) => void;
  copyTables?: boolean;
}) {
  const steps = new Map(flow.flatMap((item) => (item.type === 'step' ? [[item.step.id, item.step] as const] : [])));
  const tone = (step: GuideStep | undefined) => (step && isReportWork(step) ? 'is-report' : 'is-guide');
  return (
    <div className="guide-flow">
      {flow.map((item, index) => {
        if (item.type === 'info') {
          return (
            <section key={`info-${index}`} className="guide-info is-guide">
              <Blocks blocks={item.body} copyTables={copyTables} />
            </section>
          );
        }
        if (item.type === 'more') {
          return (
            <div key={`more-${item.stepId}-${index}`} className={`guide-more ${tone(steps.get(item.stepId))}`}>
              <Blocks blocks={item.body} copyTables={copyTables} />
            </div>
          );
        }
        const done = Boolean(progress[item.step.id]?.done);
        const report = isReportWork(item.step);
        const title = item.step.check ? visibleCheck(item.step.title) : item.step.title;
        const titleId = `guide-step-${item.step.id}`;
        return (
          <article key={item.step.id} className={done ? `guide-step is-done ${tone(item.step)}` : `guide-step ${tone(item.step)}`}>
            <button type="button" className="guide-box" role="checkbox" aria-checked={done} aria-labelledby={titleId} onClick={() => onToggle(item.step.id)}>
              {done ? <Check className="guide-tick" size={22} strokeWidth={3} /> : null}
            </button>
            <div>
              <h3 className="guide-step-title" id={titleId}>
                <span className="guide-step-label">{title}</span>
                {report ? <span className="chip chip-report">{ar.inReport}</span> : null}
                {item.step.optional ? <span className="chip">{ar.optional}</span> : null}
              </h3>
              <div className="guide-step-body">
                <Blocks blocks={item.step.body} copyTables={copyTables} />
              </div>
            </div>
          </article>
        );
      })}
    </div>
  );
}
