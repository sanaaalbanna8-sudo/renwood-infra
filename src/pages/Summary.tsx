import { useEffect, useMemo, useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { Background } from '../components/Background';
import { TermText } from '../components/TermText';
import { Celebrate } from '../components/Celebrate';
import { stageById } from '../data/stages';
import { useStore } from '../context/Store';
import { useTheme } from '../context/Theme';
import { questionPath } from '../lib/progress';
import { buildReport, type ReportRow } from '../lib/report';
import { submitResults } from '../lib/sheetSubmit';
import type { SaveData, Warning } from '../lib/types';
import { useTitle } from '../lib/useTitle';
import { Check, Moon, Sun } from 'lucide-react';

type LocationState = { snapshot?: SaveData; celebrate?: boolean };

export function Summary() {
  const location = useLocation();
  const navigate = useNavigate();
  const state = (location.state ?? null) as LocationState | null;
  const { data: live } = useStore();
  const { theme, toggle } = useTheme();
  const snapshot = state?.snapshot;
  const readonly = Boolean(snapshot);
  const data = snapshot ?? live;
  useTitle(`ملخص ${data.name}`);
  const report = useMemo(() => buildReport(data), [data]);
  const [celebrate, setCelebrate] = useState(Boolean(state?.celebrate && !readonly));
  const [sendState, setSendState] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const [sendNote, setSendNote] = useState('');

  useEffect(() => {
    if (readonly || data.name.trim().length < 2) return;
    let cancel = false;
    setSendState('sending');
    setSendNote('جارٍ إرسال النتائج إلى جدول المعلمة');
    submitResults(data).then((result) => {
      if (cancel) return;
      setSendState(result.ok ? 'sent' : 'error');
      setSendNote(result.message);
    });
    return () => {
      cancel = true;
    };
  }, [readonly, data]);

  useEffect(() => {
    if (!celebrate) return;
    const timer = window.setTimeout(() => setCelebrate(false), 1200);
    return () => window.clearTimeout(timer);
  }, [celebrate]);

  if (!readonly && data.name.trim().length < 2) return <Navigate to="/" replace />;

  return (
    <>
      <Background />
      {celebrate && <Celebrate />}
      <div className="page">
        <header className="page-bar no-print">
          <button type="button" className="btn-ghost" onClick={() => navigate(readonly ? '/teacher' : '/review')}>
            {readonly ? 'العودة إلى متابعة الطلاب' : 'العودة إلى المراجعة'}
          </button>
          <span className="grow" />
          <button type="button" className="icon-btn" onClick={toggle} aria-label={theme === 'dark' ? 'تفعيل الوضع الفاتح' : 'تفعيل الوضع الداكن'}>
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>
        </header>
        <article className="wide" style={{ padding: 16 }}>
          <header className="summary-banner">
            <p>مصمم البنية التحتية · رينواد تورز</p>
            <h1>ملخص البنية التحتية لـ {data.name}</h1>
            <p>
              الشعبة: {data.group || '—'} · التاريخ: {report.date}
              {readonly ? ' · عرض فقط' : ''}
            </p>
            <div className="actions no-print">
              <button type="button" className="btn-primary pdf-btn" onClick={() => window.print()}>
                عرض اختياراتي PDF
              </button>
            </div>
            {!readonly && sendNote && (
              <p className={sendState === 'error' ? 'why no-print' : 'muted no-print'}>{sendNote}</p>
            )}
          </header>

          <section className="glass section-card" style={{ ['--stage' as string]: '#38BDF8' }}>
            <h2>الاحتياجات التي ستخدمها بنيتك</h2>
            <ul className="need-list">
              {report.needs.map((need) => (
                <li key={need.title}>
                  <span className={need.covered ? 'need-mark on' : 'need-mark'} aria-hidden="true">
                    {need.covered ? <Check size={16} /> : null}
                  </span>
                  <span>{need.title}</span>
                  <span className="sr-only">{need.covered ? 'مغطى' : 'غير مغطى'}</span>
                </li>
              ))}
            </ul>
          </section>

          {report.sections.map((section) => {
            const stage = stageById(section.stage);
            return (
              <section key={section.title} className="glass section-card summary-section" style={{ ['--stage' as string]: stage.color, ['--ink' as string]: stage.ink }}>
                <h2>{section.title}</h2>
                <div className="scroll-x">
                  <table className="report-table">
                    <thead>
                      <tr>
                        <th>التسمية</th>
                        <th>ما اخترته</th>
                        {section.withQuantities && <th>العدد</th>}
                        {section.withQuantities && <th>الموقع</th>}
                        <th>البدائل</th>
                      </tr>
                    </thead>
                    <tbody>
                      {section.rows.map((row) => (
                        <Row key={`${section.stage}-${row.id}`} row={row} withQuantities={section.withQuantities} />
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            );
          })}

          <section className="glass section-card" style={{ ['--stage' as string]: '#F59E0B' }}>
            <h2>فحص التناقض</h2>
            {report.warnings.length === 0 && <p>لا تعارض ظاهراً بين اختياراتك</p>}
            {report.warnings
              .filter((warning) => warning.ruleId !== '11')
              .map((warning) => (
                <article key={warning.ruleId} className="warn-card">
                  <strong>{warning.message}</strong>
                  <p>{warningLinks(warning, readonly)}</p>
                </article>
              ))}
            {report.warnings.some((warning) => warning.ruleId === '11') && (
              <article className="warn-card">
                <strong>إغفال في تغطية الاحتياجات</strong>
                <ul>
                  {report.warnings
                    .filter((warning) => warning.ruleId === '11')
                    .map((warning) => (
                      <li key={`${warning.detail}-${warning.questionIds.join('-')}`}>
                        {warning.detail || warning.questionIds[0]}
                        {warning.message === 'إغفال' ? ' — إغفال' : ''} — {warningLinks(warning, readonly)}
                      </li>
                    ))}
                </ul>
              </article>
            )}
          </section>

          <section className="glass section-card story" style={{ ['--stage' as string]: '#6366F1' }}>
            <h2>الصورة العامة</h2>
            {report.story ? (
              report.story.split('\n\n').map((paragraph) => (
                <p key={paragraph.slice(0, 24)}>
                  <TermText text={paragraph} />
                </p>
              ))
            ) : (
              <p>أجب عن مزيد من الأسئلة لتظهر الصورة العامة.</p>
            )}
          </section>
        </article>
      </div>
    </>
  );
}

function Row({ row, withQuantities }: { row: ReportRow; withQuantities: boolean }) {
  const quantityOnly = Boolean(row.quantityLabel) && row.chosen.length === 0 && row.alternatives.length === 0;
  return (
    <tr>
      <td data-label="التسمية">
        <bdi className="qid">{row.id}</bdi>
        <div>{row.short}</div>
      </td>
      <td data-label="ما اخترته">
        {row.unanswered && <span className="tag miss">لم تجب</span>}
        {quantityOnly && <span className="faint">—</span>}
        <div className="chips">
          {row.chosen.map((item) => (
            <span key={item.text} className={item.added ? 'tag added' : 'chip'}>
              <TermText text={item.text} />
              {item.priority ? ` · ${item.priority}` : ''}
              {item.added ? ' · خيار مضاف' : ''}
            </span>
          ))}
        </div>
      </td>
      {withQuantities && <td data-label="العدد">{row.count == null ? '—' : row.count}</td>}
      {withQuantities && <td data-label="الموقع">{row.location || '—'}</td>}
      <td data-label="البدائل">
        {row.alternatives.length === 0 ? (
          <span className="faint">—</span>
        ) : (
          <ul className="alt-list">
            {row.alternatives.map((item) => (
              <li key={item}>
                <TermText text={item} />
              </li>
            ))}
          </ul>
        )}
      </td>
    </tr>
  );
}

function warningLinks(warning: Warning, readonly: boolean) {
  return warning.questionIds.map((id) =>
    readonly ? (
      <span key={id} style={{ marginInlineEnd: 8 }}>
        <bdi className="qid">{id}</bdi>
      </span>
    ) : (
      <Link key={id} to={questionPath(id)} style={{ marginInlineEnd: 8 }}>
        <bdi className="qid">{id}</bdi>
      </Link>
    ),
  );
}
