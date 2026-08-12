// Brand mark for Vaishnavi Granites and Ceramics.
// Two facets — emerald (stone) and gold (ceramic glaze) — split by a single
// vein line, echoing a cut slab corner. Used at small sizes in the sidebar,
// so detail is kept minimal and shapes stay crisp at 28–32px.

function Mark({ size = 32 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <rect width="32" height="32" rx="8" fill="#1B1D1B" />
      <path d="M16 5 L27 16 L16 27 L5 16 Z" fill="#0E6E4E" />
      <path d="M16 5 L27 16 L16 16 Z" fill="#B8863E" />
      <path
        d="M16 5 L16 27 M5 16 L27 16"
        stroke="#1B1D1B"
        strokeWidth="0.75"
        strokeOpacity="0.35"
      />
    </svg>
  )
}

export default function Logo({ variant = 'full', size = 32, className = '' }) {
  if (variant === 'mark') {
    return <Mark size={size} />
  }

  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <Mark size={size} />
      <div className="leading-tight">
        <p className="font-display font-semibold text-ink text-[15px] tracking-tight">
          Vaishnavi
        </p>
        <p className="text-[10px] font-medium text-ink-muted uppercase tracking-[0.12em]">
          Granites &amp; Ceramics
        </p>
      </div>
    </div>
  )
}
