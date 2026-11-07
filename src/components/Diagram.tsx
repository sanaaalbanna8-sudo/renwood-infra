import { infrastructureBadges, nodeGlow, type DiagramNode, type Glow } from '../lib/diagram';
import { stageStats } from '../lib/progress';
import type { SaveData } from '../lib/types';

const nodes: { id: DiagramNode; label: string; x: number; y: number; color: string }[] = [
  { id: 'cloud', label: 'السحابة', x: 100, y: 18, color: '#6366F1' },
  { id: 'offices', label: 'مكاتب', x: 8, y: 78, color: '#8B5CF6' },
  { id: 'info', label: 'القسم', x: 78, y: 78, color: '#F59E0B' },
  { id: 'cafe', label: 'مقهى', x: 148, y: 78, color: '#8B5CF6' },
  { id: 'shop', label: 'متجر', x: 214, y: 78, color: '#14B8A6' },
  { id: 'guides', label: 'مرشدون', x: 48, y: 148, color: '#F59E0B' },
  { id: 'car', label: 'السيارة', x: 168, y: 148, color: '#38BDF8' },
];

export function Diagram({ data }: { data: SaveData }) {
  const glow = nodeGlow(data, (stage) => {
    const stats = stageStats(stage, data);
    return stats.total > 0 && stats.answered === stats.total;
  });
  const badges = infrastructureBadges(data);
  return (
    <div className="no-print">
      <svg viewBox="0 0 290 210" role="img" aria-label="مخطط البنية يتكون مع الإجابات" style={{ width: '100%', height: 'auto' }}>
        <line x1="132" y1="42" x2="132" y2="78" stroke="currentColor" strokeOpacity="0.35" />
        <line x1="40" y1="100" x2="250" y2="100" stroke="currentColor" strokeOpacity="0.25" />
        <line x1="110" y1="112" x2="80" y2="148" stroke="currentColor" strokeOpacity="0.35" />
        <line x1="180" y1="112" x2="200" y2="148" stroke="currentColor" strokeOpacity="0.35" />
        {nodes.map((node) => (
          <NodeBox key={node.id} {...node} glow={glow[node.id]} />
        ))}
      </svg>
      {badges.length > 0 && (
        <div className="badges">
          {badges.map((badge) => (
            <span key={badge} className="badge-mini">
              <bdi>{badge}</bdi>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

function NodeBox({ label, x, y, color, glow }: { label: string; x: number; y: number; color: string; glow: Glow }) {
  const opacity = glow === 'on' ? 1 : glow === 'partial' ? 0.75 : 0.35;
  return (
    <g opacity={opacity} style={{ fontFamily: 'IBM Plex Sans Arabic, sans-serif' }}>
      <rect
        x={x}
        y={y}
        width="68"
        height="32"
        rx="10"
        fill={glow === 'off' ? 'transparent' : color}
        fillOpacity={glow === 'on' ? 0.28 : 0.1}
        stroke={color}
        strokeWidth={glow === 'on' ? 2.4 : 1.2}
      />
      <text x={x + 34} y={y + 21} textAnchor="middle" fill="currentColor" fontSize="11">
        {label}
      </text>
    </g>
  );
}
