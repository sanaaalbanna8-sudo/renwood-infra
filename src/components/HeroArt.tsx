export function HeroArt() {
  return (
    <svg viewBox="0 0 640 340" role="img" aria-label="مدينة ومسار جولة وأجهزة">
      <defs>
        <linearGradient id="sky" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#6366F1" />
          <stop offset="0.5" stopColor="#8B5CF6" />
          <stop offset="1" stopColor="#22D3EE" />
        </linearGradient>
      </defs>
      <rect x="16" y="16" width="608" height="308" rx="28" fill="currentColor" opacity="0.04" />
      <path d="M48 250h120l28-90h36l18 90h70l40-130h34l22 130h150" fill="none" stroke="url(#sky)" strokeWidth="3" />
      <path d="M70 250V190h28v60M110 250V160h40v90M168 250v-70h22v70" fill="none" stroke="currentColor" strokeOpacity="0.45" />
      <rect x="250" y="168" width="86" height="58" rx="8" fill="none" stroke="#22D3EE" strokeWidth="2" />
      <path d="M258 214h70M280 168v46" stroke="#22D3EE" strokeOpacity="0.7" />
      <rect x="360" y="150" width="70" height="92" rx="10" fill="none" stroke="#8B5CF6" strokeWidth="2" />
      <circle cx="395" cy="228" r="3" fill="#8B5CF6" />
      <path d="M80 274c80-40 140-10 210-28s150 8 250-36" fill="none" stroke="url(#sky)" strokeWidth="3" strokeDasharray="8 8" />
      <circle cx="150" cy="252" r="6" fill="#38BDF8" />
      <circle cx="300" cy="236" r="6" fill="#F59E0B" />
      <circle cx="470" cy="228" r="6" fill="#10B981" />
      <rect x="500" y="78" width="92" height="64" rx="14" fill="none" stroke="#6366F1" strokeWidth="2" />
      <path d="M516 104h60M516 118h40" stroke="#6366F1" strokeOpacity="0.8" />
    </svg>
  );
}
