type Props = { value: number };

export function ProgressRing({ value }: Props) {
  const radius = 16;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.max(0, Math.min(1, value));
  const offset = circumference * (1 - clamped);
  return (
    <svg width="40" height="40" viewBox="0 0 40 40" aria-hidden="true">
      <circle cx="20" cy="20" r={radius} fill="none" stroke="currentColor" strokeOpacity="0.2" strokeWidth="3" />
      <circle
        className="ring-fg"
        cx="20"
        cy="20"
        r={radius}
        fill="none"
        stroke="#22D3EE"
        strokeWidth="3"
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        transform="rotate(-90 20 20)"
      />
    </svg>
  );
}
