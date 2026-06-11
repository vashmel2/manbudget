export function Logo({ size = 28 }: { size?: number }) {
  return (
    <div
      className="flex items-center justify-center rounded-[8px]"
      style={{ width: size, height: size, background: "var(--pos)" }}
    >
      <svg width={size * 0.55} height={size * 0.55} viewBox="0 0 24 24" fill="none" stroke="#06140d" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="5" width="18" height="14" rx="2" />
        <path d="M3 10h18" />
      </svg>
    </div>
  );
}

export function Wordmark() {
  return (
    <div className="row" style={{ gap: 10 }}>
      <Logo size={26} />
      <span className="mono" style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.14em" }}>MANBUDGET</span>
    </div>
  );
}
