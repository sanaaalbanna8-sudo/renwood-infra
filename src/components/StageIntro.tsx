import { useReducedMotion } from 'framer-motion';
import { useEffect } from 'react';
import { stageById } from '../data/stages';
import { useStore } from '../context/Store';
import { StageArt } from './StageArt';

export function StageIntro({ stageId }: { stageId: number }) {
  const { markIntro } = useStore();
  const reduce = useReducedMotion();
  const stage = stageById(stageId);
  const Icon = stage.icon;

  useEffect(() => {
    if (reduce) return;
    const timer = window.setTimeout(() => markIntro(stageId), 1500);
    return () => window.clearTimeout(timer);
  }, [markIntro, reduce, stageId]);

  return (
    <section className="glass intro narrow" style={{ ['--stage' as string]: stage.color }}>
      <StageArt stageId={stageId} />
      <p className="stage-pill">
        <Icon size={16} />
        {stage.name}
      </p>
      <h1>{stage.name}</h1>
      <p>{stage.blurb}</p>
      <button type="button" className="btn-primary" onClick={() => markIntro(stageId)}>
        {reduce ? 'متابعة' : 'تخطّي'}
      </button>
    </section>
  );
}
