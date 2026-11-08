import { useEffect, useState } from 'react';
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom';
import { GuideFlow } from '../components/guide/GuideFlow';
import { ProgressRing } from '../components/ProgressRing';
import { themeFor } from '../data/guideTheme';
import { useStore } from '../context/Store';
import { ar } from '../i18n/ar';
import { activityRatio, countedSteps, findStage, neighbor, partOneReady, stageCriteria, stagePath, stageRatio } from '../lib/guide/catalog';
import { useTitle } from '../lib/useTitle';

export function GuideStage() {
  const params = useParams();
  const navigate = useNavigate();
  const found = findStage(params.activity ?? '', params.stage ?? '');
  const { data, toggleStep, skipStage, setGuidePosition } = useStore();
  const [confirmSkip, setConfirmSkip] = useState(false);
  const [celebrating, setCelebrating] = useState(false);
  const activityId = found?.activity.id ?? '';
  const stageId = found?.stage.id ?? '';
  useTitle(found?.stage.title ?? ar.guideTitle);

  useEffect(() => {
    if (!activityId || !stageId) return;
    setGuidePosition(activityId, stageId);
    setCelebrating(false);
    setConfirmSkip(false);
  }, [activityId, stageId, setGuidePosition]);

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
  const cheer = activityRatio(activity, data.progress) === 1 ? ar.cheers[activityIndex] : '';

  return (
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
          {cheer ? <p className={activityIndex === ar.cheers.length - 1 ? 'guide-cheer is-final' : 'guide-cheer'}>{cheer}</p> : null}
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
          {cheer ? (
            <p className={activityIndex === ar.cheers.length - 1 ? 'guide-cheer is-final' : 'guide-cheer'} role="status">
              {cheer}
            </p>
          ) : null}
          <GuideFlow flow={stage.flow} progress={data.progress} onToggle={toggleStep} />
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
  );
}
