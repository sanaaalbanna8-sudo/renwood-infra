import { Check } from 'lucide-react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { stages } from '../data/stages';
import { useStore } from '../context/Store';
import { stageStats } from '../lib/progress';
import { Diagram } from './Diagram';

export function Sidebar({ open, onNavigate }: { open: boolean; onNavigate: () => void }) {
  const { data } = useStore();
  const params = useParams();
  const location = useLocation();
  const active = location.pathname.startsWith('/wizard/') && params.stage != null ? Number(params.stage) : null;

  return (
    <aside id="journey-nav" className={open ? 'sidebar is-open' : 'sidebar'} aria-label="خريطة الرحلة">
      <div className="stage-list">
        {stages.map((stage) => {
          const stats = stageStats(stage.id, data);
          const reading = stage.id === 0;
          const current = active === stage.id;
          const pastReading =
            reading &&
            ((active != null && active > 0) || location.pathname === '/review' || location.pathname === '/summary');
          const complete = reading ? pastReading : stats.total > 0 && stats.answered === stats.total;
          const upcoming = !reading && active != null && stage.id > active && stats.answered === 0;
          const warning = !reading && !complete && !upcoming && !current && stats.answered < stats.total;
          const className = [
            'stage-btn',
            current ? 'is-current' : '',
            upcoming ? 'is-next' : '',
          ]
            .filter(Boolean)
            .join(' ');
          const Icon = stage.icon;
          const body = (
            <>
              <span className="stage-ico" style={{ ['--stage' as string]: stage.color }}>
                <Icon size={18} />
              </span>
              <span>
                <strong>{stage.name}</strong>
                <small>
                  {reading
                    ? current
                      ? `${Math.min(Number(params.index ?? 0), 1) + 1} من 2`
                      : 'شاشتان'
                    : `${stats.answered} من ${stats.total}`}
                </small>
              </span>
              {complete ? <Check size={16} color="#10B981" aria-label="مكتملة" /> : warning || (current && !complete && !reading) ? <span className="dot" aria-label="فيها أسئلة غير مجابة" /> : <span />}
            </>
          );
          return (
            <Link
              key={stage.id}
              to={`/wizard/${stage.id}/0`}
              className={className}
              style={{ ['--stage' as string]: stage.color, textDecoration: 'none', color: 'inherit' }}
              aria-current={current ? 'step' : undefined}
              onClick={onNavigate}
            >
              {body}
            </Link>
          );
        })}
      </div>
      <div className="side-links">
        <Link className="btn-ghost" to="/review" onClick={onNavigate}>
          المراجعة
        </Link>
        <Link className="btn-ghost" to="/summary" onClick={onNavigate}>
          الملخص
        </Link>
      </div>
      <Diagram data={data} />
    </aside>
  );
}
