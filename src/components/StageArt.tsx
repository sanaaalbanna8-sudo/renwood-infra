import { stageById } from '../data/stages';

export function StageArt({ stageId }: { stageId: number }) {
  const stage = stageById(stageId);
  return (
    <svg viewBox="0 0 180 130" width="180" height="130" aria-hidden="true">
      <rect x="8" y="8" width="164" height="114" rx="22" fill={stage.color} opacity="0.14" />
      {stageId === 0 && <path d="M30 90c30-40 50-10 70-24s40 6 50-16" fill="none" stroke={stage.color} strokeWidth="3" />}
      {stageId === 1 && <rect x="62" y="36" width="56" height="56" rx="10" fill="none" stroke={stage.color} strokeWidth="3" />}
      {stageId === 2 && <rect x="48" y="34" width="84" height="62" rx="8" fill="none" stroke={stage.color} strokeWidth="3" />}
      {stageId === 3 && (
        <g fill="none" stroke={stage.color} strokeWidth="3">
          <circle cx="50" cy="65" r="12" />
          <circle cx="90" cy="40" r="12" />
          <circle cx="130" cy="78" r="12" />
          <path d="M62 60l18-14M100 48l20 22" />
        </g>
      )}
      {stageId === 4 && <path d="M36 65h30l14-20 16 36 14-16h34" fill="none" stroke={stage.color} strokeWidth="3" />}
      {stageId === 5 && <path d="M50 78c8-28 72-28 80 0H50z" fill="none" stroke={stage.color} strokeWidth="3" />}
      {stageId === 6 && <path d="M90 32l34 14v28c0 22-34 32-34 32s-34-10-34-32V46z" fill="none" stroke={stage.color} strokeWidth="3" />}
      {stageId === 7 && (
        <g fill={stage.color}>
          <circle cx="70" cy="50" r="4" />
          <circle cx="100" cy="40" r="5" />
          <circle cx="120" cy="68" r="3" />
          <circle cx="84" cy="78" r="4" />
        </g>
      )}
      {stageId === 8 && <path d="M48 86a42 42 0 1 1 84 0" fill="none" stroke={stage.color} strokeWidth="3" />}
      {stageId === 9 && <path d="M40 90h100M50 90V48M130 90V48M50 48h80" fill="none" stroke={stage.color} strokeWidth="3" />}
      <circle cx="90" cy="102" r="4" fill={stage.color} />
    </svg>
  );
}
