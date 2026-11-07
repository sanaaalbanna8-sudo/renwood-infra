import { Check } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { TermText } from './TermText';
import { questionById } from '../data/questions';
import { stageById } from '../data/stages';
import { useStore } from '../context/Store';
import { isNegative } from '../lib/text';
import type { Question } from '../lib/types';

const kindLabel = { single: 'اختيار واحد', multi: 'اختيار متعدد', text: 'إجابة مكتوبة' };

export function QuestionCard({
  question,
  index,
  total,
  heading,
}: {
  question: Question;
  index: number;
  total: number;
  heading?: string;
}) {
  const stage = stageById(question.stage);
  const Icon = stage.icon;
  const { data, chooseSingle, toggleMulti, setText, setOther, setPriority } = useStore();
  const [hintOpen, setHintOpen] = useState(false);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const selected = data.answers[question.id] ?? [];
  const selectedSet = new Set(selected);

  useEffect(() => {
    setHintOpen(false);
    const article = titleRef.current?.closest('article');
    if (article) {
      const top = article.getBoundingClientRect().top + window.scrollY - 84;
      window.scrollTo({ top: Math.max(0, top), behavior: 'auto' });
    }
    titleRef.current?.focus({ preventScroll: true });
  }, [question.id]);

  const textValue = selected[0] || '';
  const techs = (data.answers['م1'] ?? []).filter((option) => !isNegative(option));
  const priorityOptions = questionById('م2')?.options ?? [];

  return (
    <article className="glass narrow" style={{ ['--stage' as string]: stage.color, ['--ink' as string]: stage.ink, ['--mark' as string]: stage.mark, padding: 18 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
        <p className="stage-pill">
          <Icon size={16} />
          {heading ? `${stage.name} · ${index + 1} من ${total}` : `${stage.name} · سؤال ${index + 1} من ${total}`}
        </p>
        <span className="kind">{question.id === 'م2' ? 'اختيار واحد لكل تقنية' : kindLabel[question.type]}</span>
      </div>
      <div className="bar" style={{ margin: '12px 0' }} role="progressbar" aria-valuemin={0} aria-valuemax={total} aria-valuenow={index + 1} aria-label={`موضع السؤال في ${stage.name}`}>
        <span style={{ width: `${((index + 1) / total) * 100}%`, background: stage.color }} />
      </div>
      <p className="qid faint">
        <bdi>{question.id}</bdi>
      </p>
      <h2 id={`heading-${question.id}`} ref={titleRef} tabIndex={-1}>
        {heading ? heading : <TermText text={question.text} />}
      </h2>
      {heading && heading !== question.text && (
        <p>
          <TermText text={question.text} />
        </p>
      )}

      {question.id === 'م2' ? (
        techs.length === 0 ? (
          <p className="hint">اختر تقنية في السؤال السابق. إن كان اختيارك «لا شيء الآن» فلا حاجة لتحديد أولوية.</p>
        ) : (
          <div className="options">
            {techs.map((tech) => (
              <label key={tech} className="field">
                <span>
                  أولوية: <TermText text={tech} />
                </span>
                <select className="select" value={data.priorities[tech] ?? ''} onChange={(event) => setPriority(tech, event.target.value)}>
                  <option value="">اختر الأولوية</option>
                  {priorityOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </label>
            ))}
          </div>
        )
      ) : question.type === 'text' ? (
        <label className="field">
          <span className="sr-only">{question.text}</span>
          <textarea value={textValue} onChange={(event) => setText(question.id, event.target.value)} />
        </label>
      ) : (
        <div className="options" role={question.type === 'single' ? 'radiogroup' : 'group'} aria-labelledby={`heading-${question.id}`}>
          {question.options.map((option) => {
            const on = selectedSet.has(option);
            return (
              <label key={option} className={on ? 'tile tile-on' : 'tile'}>
                <input
                  type={question.type === 'single' ? 'radio' : 'checkbox'}
                  name={question.id}
                  checked={on}
                  onChange={() => (question.type === 'single' ? chooseSingle(question.id, option) : toggleMulti(question.id, option))}
                />
                <span className={question.type === 'single' ? 'mark circle' : 'mark'} aria-hidden="true">
                  {on ? <Check size={14} /> : null}
                </span>
                <span>
                  <TermText text={option} />
                  {question.gloss?.[option] && (
                    <small className="tile-note">
                      <TermText text={question.gloss[option]} />
                    </small>
                  )}
                </span>
              </label>
            );
          })}
        </div>
      )}

      {question.why &&
        selected.map((option) =>
          question.why?.[option] ? (
            <p key={option} className="why">
              <TermText text={question.why[option]} />
            </p>
          ) : null,
        )}

      <button type="button" className="btn-ghost" style={{ marginTop: 12 }} aria-expanded={hintOpen} onClick={() => setHintOpen((value) => !value)}>
        معلومة
      </button>
      {hintOpen && (
        <p className="hint">
          <TermText text={question.hint || 'لا توجد معلومة إضافية لهذا السؤال بعد.'} />
        </p>
      )}

      {question.type !== 'text' && question.id !== 'م2' && (
        <label className="field" style={{ marginTop: 12 }}>
          <span>خيار آخر (اختياري)</span>
          <input
            value={data.other[question.id] ?? ''}
            onChange={(event) => setOther(question.id, event.target.value)}
            placeholder="اكتب خيارك إن لم تجده أعلاه"
          />
          <small className="faint">يظهر في الملخص بوسم «خيار مضاف».</small>
        </label>
      )}
    </article>
  );
}
