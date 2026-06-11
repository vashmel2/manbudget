import Link from "next/link";
import { peso } from "@/lib/peso";

interface Props {
  label: string;
  glyph?: string;
  spentCents: number;
  capCents: number;
  billsCents?: number;
  href?: string;
}

export function CategoryBar({ label, glyph, spentCents, capCents, billsCents, href }: Props) {
  const pct = capCents > 0 ? spentCents / capCents : 0;
  const over = capCents > 0 && spentCents > capCents;
  const noCapWithSpend = capCents === 0 && spentCents > 0;
  const color = over ? "var(--warn)" : pct > 0.85 ? "var(--cyan)" : "var(--pos)";
  const fillWidth = capCents > 0 ? Math.min(pct, 1.3) * (100 / 1.3) : noCapWithSpend ? 100 : 0;

  const inner = (
    <div className="catbar">
      <div className="head">
        <span className="nm">
          {glyph && <span className="mono faint" style={{ fontSize: 10, marginRight: 6 }}>{glyph}</span>}
          {label}
        </span>
        <span className="fig">
          {peso(spentCents)}{capCents > 0 && <span className="faint"> / {peso(capCents)}</span>}
        </span>
      </div>
      <div className="track">
        <div className="fill" style={{ width: `${fillWidth}%`, background: noCapWithSpend ? "var(--cyan)" : color, opacity: noCapWithSpend ? 0.35 : 1 }} />
        {capCents > 0 && <div className="cap-mark" style={{ left: `${100 / 1.3}%` }} />}
      </div>
      {billsCents != null && billsCents > 0 && (
        <div className="fig faint" style={{ fontSize: 10, marginTop: 2 }}>
          {peso(billsCents)} bills{spentCents - billsCents > 0 ? ` + ${peso(spentCents - billsCents)} ad-hoc` : ""}
        </div>
      )}
    </div>
  );

  if (href) {
    return (
      <Link href={href} style={{ display: "block", textDecoration: "none", color: "inherit", cursor: "pointer" }}>
        {inner}
      </Link>
    );
  }
  return inner;
}
