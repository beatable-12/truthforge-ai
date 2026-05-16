export function LogoMark({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="230 90 220 120"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="TruthForge"
    >
      <defs>
        <linearGradient id="tf-blue" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#6366F1" stopOpacity="1" />
          <stop offset="100%" stopColor="#A855F7" stopOpacity="1" />
        </linearGradient>
        <linearGradient id="tf-forge" x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#F97316" />
          <stop offset="100%" stopColor="#FB923C" />
        </linearGradient>
        <filter id="tf-glow">
          <feGaussianBlur stdDeviation="1.4" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* T glyph */}
      <g filter="url(#tf-glow)">
        <path
          d="M 240 120 L 280 120 L 280 100 L 300 100 L 300 120 L 320 120 L 320 140 L 290 140 L 290 200 L 270 200 L 270 140 L 240 140 Z"
          fill="url(#tf-blue)"
          fillOpacity="0.22"
          stroke="url(#tf-blue)"
          strokeWidth="2.4"
        />
      </g>

      {/* F glyph */}
      <g filter="url(#tf-glow)">
        <path
          d="M 360 100 L 440 100 L 440 120 L 380 120 L 380 145 L 420 145 L 420 165 L 380 165 L 380 200 L 360 200 Z"
          fill="url(#tf-blue)"
          fillOpacity="0.22"
          stroke="url(#tf-blue)"
          strokeWidth="2.4"
        />
      </g>

      {/* Anvil / forge core */}
      <g filter="url(#tf-glow)">
        <rect x="315" y="185" width="50" height="12" rx="2" fill="url(#tf-forge)" opacity="0.9" />
        <rect x="320" y="175" width="40" height="10" rx="1" fill="#F97316" opacity="0.75" />
        <path d="M 325 140 L 340 165 L 355 140 L 350 140 L 340 155 L 330 140 Z" fill="#FB923C" />
      </g>

      {/* Convergence lines */}
      <path d="M 300 150 Q 320 145 340 155" fill="none" stroke="#6366F1" strokeWidth="1.2" opacity="0.7" />
      <path d="M 380 150 Q 360 145 340 155" fill="none" stroke="#A855F7" strokeWidth="1.2" opacity="0.7" />

      {/* Accent nodes */}
      <circle cx="280" cy="110" r="3" fill="#6366F1" />
      <circle cx="400" cy="110" r="3" fill="#A855F7" />
      <circle cx="340" cy="155" r="3.5" fill="#F97316" filter="url(#tf-glow)" />
    </svg>
  );
}
