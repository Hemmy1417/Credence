// Credence mark — a hexagonal verification seal with a gold check.
// The hexagon = a minted/sealed credential; the check = verified; the inner
// ticks = consensus from multiple validators.
export function CredenceMark({ size = 32 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="cr-gold" x1="6" y1="3" x2="42" y2="45" gradientUnits="userSpaceOnUse">
          <stop stopColor="#f0d491" />
          <stop offset="0.5" stopColor="#d4af6a" />
          <stop offset="1" stopColor="#a9803a" />
        </linearGradient>
      </defs>
      {/* outer hexagon */}
      <path
        d="M24 3 L41.3 13 V33 L24 43 L6.7 33 V13 Z"
        stroke="url(#cr-gold)"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      {/* inner hairline hexagon */}
      <path
        d="M24 9 L36.1 16 V30 L24 37 L11.9 30 V16 Z"
        stroke="url(#cr-gold)"
        strokeOpacity="0.35"
        strokeWidth="1"
        strokeLinejoin="round"
      />
      {/* check */}
      <path
        d="M16.5 24 L21.8 29.5 L32 17.5"
        stroke="url(#cr-gold)"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function CredenceWordmark() {
  return (
    <span className="flex items-center gap-2.5">
      <CredenceMark size={30} />
      <span className="display text-[1.15rem] tracking-[0.22em] text-foreground">
        CREDENCE
      </span>
    </span>
  );
}
