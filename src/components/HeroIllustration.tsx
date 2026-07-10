// A simple flat-vector castle, replacing the old washed-out raster PNG
// (8-bit indexed color, visibly banded/faded at display size). Crisp at
// any size since it's a real SVG, not a scaled-up bitmap. Colors match the
// existing brand palette (favicon.svg's purple, the header's accent blue).
export function HeroIllustration({ size = 120, className }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size * (150 / 140)}
      viewBox="0 0 140 150"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="Schloss"
      className={className}
    >
      {/* Left tower */}
      <rect x="10" y="75" width="26" height="65" fill="#863bff" />
      <polygon points="8,75 38,75 23,50" fill="#7e14ff" />
      <rect x="18" y="95" width="8" height="10" rx="1.5" fill="#ede6ff" />

      {/* Right tower */}
      <rect x="104" y="75" width="26" height="65" fill="#863bff" />
      <polygon points="102,75 132,75 117,50" fill="#7e14ff" />
      <rect x="114" y="95" width="8" height="10" rx="1.5" fill="#ede6ff" />

      {/* Central keep */}
      <rect x="45" y="55" width="50" height="85" fill="#863bff" />
      <polygon points="40,55 100,55 70,25" fill="#7e14ff" />
      <rect x="53" y="68" width="9" height="11" rx="1.5" fill="#ede6ff" />
      <rect x="78" y="68" width="9" height="11" rx="1.5" fill="#ede6ff" />

      {/* Door */}
      <path d="M60 140 V115 A10 10 0 0 1 80 115 V140 Z" fill="#ede6ff" />

      {/* Flag */}
      <line x1="70" y1="25" x2="70" y2="10" stroke="#7e14ff" strokeWidth="2" />
      <polygon points="70,10 86,15 70,20" fill="#3b82f6" />
    </svg>
  )
}
