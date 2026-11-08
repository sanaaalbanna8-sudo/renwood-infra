import { Link } from 'react-router-dom';
import { GuideFlow } from '../components/guide/GuideFlow';
import { ProgressRing } from '../components/ProgressRing';
import { themeFor } from '../data/guideTheme';
import { ar } from '../i18n/ar';
import { useStore } from '../context/Store';
import { activityEntry, activityHasProgress, activityRatio, guide, guideRatio, partOneReady, resumePath } from '../lib/guide/catalog';
import { useTitle } from '../lib/useTitle';

export function GuideHome() {
  useTitle(ar.guideTitle);
  const { data } = useStore();
  const ready = partOneReady(data);
  const ratio = guideRatio(data.progress);

  return (
    <div className="guide-page">
      <header className="guide-head">
        <div>
          <p className="faint">{ar.overall}</p>
          <h1>{ar.guideTitle}</h1>
        </div>
        <div className="progress-chip">
          <ProgressRing value={ratio} />
          <span>{Math.round(ratio * 100)}%</span>
        </div>
        <Link to={resumePath(data)} className="btn-primary">
          {data.position.stage ? ar.guideResume : ar.guideStart}
        </Link>
      </header>
      {!ready && <p className="guide-notice">{ar.guideNotice}</p>}
      <GuideFlow flow={guide.intro} progress={data.progress} onToggle={() => undefined} />
      <div className="guide-cards">
        {guide.activities.map((activity, index) => {
          const theme = themeFor(index);
          const Icon = theme.icon;
          const percent = Math.round(activityRatio(activity, data.progress) * 100);
          const started = activityHasProgress(activity, data);
          const first = activity.stages[0];
          return (
            <article key={activity.id} className="guide-card glass" style={{ ['--stage' as string]: theme.color }}>
              <div className="guide-card-top">
                <span className="stage-ico" style={{ ['--stage' as string]: theme.color }}>
                  <Icon size={20} />
                </span>
                <ProgressRing value={percent / 100} />
                <strong>{percent}%</strong>
              </div>
              <h2>{activity.title}</h2>
              <p className="muted">
                {ar.outcomeLabel}: {activity.outcome}
              </p>
              {first && (
                <Link to={activityEntry(activity, data)} className="btn-primary">
                  {started ? ar.guideContinue : ar.guideStart}
                </Link>
              )}
            </article>
          );
        })}
      </div>
    </div>
  );
}
