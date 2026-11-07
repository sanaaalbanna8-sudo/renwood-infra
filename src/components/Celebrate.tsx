import { useReducedMotion } from 'framer-motion';

export function Celebrate() {
  const reduce = useReducedMotion();
  if (reduce) return null;
  const bits = Array.from({ length: 16 }, (_, index) => {
    const angle = (index / 16) * Math.PI * 2;
    const distance = 90 + (index % 3) * 28;
    return {
      x: `${Math.cos(angle) * distance}px`,
      y: `${Math.sin(angle) * distance}px`,
      color: ['#22D3EE', '#8B5CF6', '#F59E0B', '#10B981'][index % 4],
    };
  });
  return (
    <div className="celebrate" aria-hidden="true">
      {bits.map((bit, index) => (
        <i key={index} style={{ ['--x' as string]: bit.x, ['--y' as string]: bit.y, ['--c' as string]: bit.color }} />
      ))}
    </div>
  );
}
