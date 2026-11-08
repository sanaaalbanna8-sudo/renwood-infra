import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom';
import { GuideFlow } from '../components/guide/GuideFlow';
import { ProgressRing } from '../components/ProgressRing';
import { themeFor } from '../data/guideTheme';
import { useStore } from '../context/Store';
import { ar } from '../i18n/ar';
import { activityRatio, countedSteps, findStage, neighbor, partOneReady, stageCriteria, stagePath, stageRatio } from '../lib/guide/catalog';
import { isPrepStage } from '../lib/guide/copyTable';
import { useTitle } from '../lib/useTitle';

export function GuideStage() {
  const params = useParams();
  const navigate = useNavigate();
  const found = findStage(params.activity ?? '', params.stage ?? '');
  const { data, toggleStep, skipStage, setGuidePosition } = useStore();
  const [confirmSkip, setConfirmSkip] = useState(false);
  const [celebrating, setCelebrating] = useState(false);
  const [cheerOpen, setCheerOpen] = useState(false);
  const cheerButton = useRef<HTMLButtonElement>(null);
  const activityId = found?.activity.id ?? '';
  const stageId = found?.stage.id ?? '';
  const cheer = found && activityRatio(found.activity, data.progress) === 1 ? (ar.cheers[found.activityIndex] ?? '') : '';
  const cheerFinal = found?.activityIndex === ar.cheers.length - 1;
  useTitle(found?.stage.title ?? ar.guideTitle);

  useEffect(() => {
    if (!activityId || !stageId) return;
    setGuidePosition(activityId, stageId);
    setCelebrating(false);
    setConfirmSkip(false);
  }, [activityId, stageId, setGuidePosition]);

  useEffect(() => {
    if (!activityId) return;
    const key = `renwood-cheer-${activityId}`;
    if (!cheer) {
      sessionStorage.removeItem(key);
      setCheerOpen(false);
      return;
    }
    if (sessionStorage.getItem(key) === '1') {
      setCheerOpen(false);
      return;
    }
    setCheerOpen(true);
  }, [activityId, cheer]);

  useEffect(() => {
    if (!cheerOpen) return;
    cheerButton.current?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      sessionStorage.setItem(`renwood-cheer-${activityId}`, '1');
      setCheerOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [cheerOpen, activityId]);

  function closeCheer() {
    if (activityId) sessionStorage.setItem(`renwood-cheer-${activityId}`, '1');
    setCheerOpen(false);
  }

  if (!found) return <Navigate to="/guide" replace />;

  const { activity, stage, activityIndex } = found;
  const theme = themeFor(activityIndex);
  const ratio = stageRatio(stage, data.progress);
  const required = countedSteps(stage);
  const ready = required.every((step) => data.progress[step.id]?.done);
  const previous = neighbor(found, -1);
  const next = neighbor(found, 1);
  const lastInActivity = !next || next.activity.id !== activity.id;
  const criteria = stageCriteria(stage);

  return (
    <>
    <div className="guide-page" style={{ ['--stage' as string]: theme.color }}>
      <header className="guide-head">
        <div>
          <p className="faint">{activity.title}</p>
          <h1>{stage.title}</h1>
          {stage.tag && <p className="stage-pill">{stage.tag}</p>}
          {criteria.length > 0 && (
            <p className="guide-criteria">
              {criteria.map((item) => (
                <span key={item} className="chip">
                  {item}
                </span>
              ))}
            </p>
          )}
        </div>
        <div className="progress-chip">
          <ProgressRing value={ratio} />
          <span>{Math.round(ratio * 100)}%</span>
        </div>
        <Link to="/guide" className="btn-ghost">
          {ar.backToGuide}
        </Link>
      </header>
      {!partOneReady(data) && <p className="guide-notice">{ar.guideNotice}</p>}
      {data.skipped[stage.id] && <p className="muted">{ar.skipped}</p>}

      {celebrating ? (
        <section className="glass guide-done">
          <h2>{ar.activityDone}</h2>
          <p>
            {ar.outcomeLabel}: {activity.outcome}
          </p>
          {next ? (
            <Link to={stagePath(next.activity.id, next.stage.id)} className="btn-primary">
              {ar.nextActivity}
            </Link>
          ) : (
            <Link to="/guide" className="btn-primary">
              {ar.backToGuide}
            </Link>
          )}
        </section>
      ) : (
        <>
          <GuideFlow flow={stage.flow} progress={data.progress} onToggle={toggleStep} copyTables={!isPrepStage(stage.tag)} />
          <div className="pager">
            {previous ? (
              <Link to={stagePath(previous.activity.id, previous.stage.id)} className="btn-ghost">
                {ar.prevStage}
              </Link>
            ) : (
              <span />
            )}
            {confirmSkip ? (
              <div className="confirm">
                <span>{ar.skipAsk}</span>
                <button
                  type="button"
                  className="btn-warn"
                  onClick={() => {
                    skipStage(stage.id);
                    setConfirmSkip(false);
                  }}
                >
                  {ar.skipYes}
                </button>
                <button type="button" className="btn-ghost" onClick={() => setConfirmSkip(false)}>
                  {ar.skipNo}
                </button>
              </div>
            ) : (
              <button type="button" className="btn-ghost" onClick={() => setConfirmSkip(true)} disabled={ready}>
                {ar.skipStage}
              </button>
            )}
            <button
              type="button"
              className="btn-primary"
              disabled={!ready}
              onClick={() => {
                if (lastInActivity) setCelebrating(true);
                else if (next) navigate(stagePath(next.activity.id, next.stage.id));
              }}
            >
              {ar.finishStage}
            </button>
            {next && !lastInActivity ? (
              <Link to={stagePath(next.activity.id, next.stage.id)} className="btn-ghost">
                {ar.nextStage}
              </Link>
            ) : (
              <span />
            )}
          </div>
        </>
      )}
    </div>
    {cheerOpen && cheer
      ? createPortal(
          <div className="cheer-layer">
            <button type="button" className="cheer-backdrop" aria-label={cheerFinal ? ar.cheerCloseFinal : ar.cheerClose} onClick={closeCheer} />
            <section
              className={cheerFinal ? 'cheer-box is-final' : 'cheer-box'}
              role="dialog"
              aria-modal="true"
              aria-labelledby="cheer-kicker"
            >
              <p className="cheer-kicker" id="cheer-kicker">
                {ar.cheerKicker}
              </p>
              <p className="cheer-text">{cheer}</p>
              <button ref={cheerButton} type="button" className="btn-primary" onClick={closeCheer}>
                {cheerFinal ? ar.cheerCloseFinal : ar.cheerClose}
              </button>
            </section>
          </div>,
          document.body,
        )
      : null}
    </>
  );
}
