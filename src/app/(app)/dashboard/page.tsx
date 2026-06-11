import Link from "next/link";
import { Plus } from "lucide-react";
import { requireUserId } from "@/lib/require-user";
import { getDashboardData } from "@/lib/dashboard";
import { peso, pesoK } from "@/lib/peso";
import { Donut } from "@/components/donut";
import { CategoryBar } from "@/components/category-bar";
import { ProgressRing } from "@/components/progress-ring";
import { BillRow } from "../bills/bill-row";

export default async function DashboardPage() {
  const userId = await requireUserId();
  const m = await getDashboardData(userId);

  const upBeats = m.netLeft >= 0;
  const onPace = m.budgetTotal > 0 ? m.spentMTD <= m.budgetTotal * (m.day / m.daysInMonth) * 1.05 : true;

  const empty = m.billsTotalCount === 0 && m.incomeMTD === 0 && m.spentMTD === 0;
  if (empty) return <EmptyDashboard month={m.monthLabel} />;

  return (
    <div className="col fade-up" style={{ gap: "var(--pad-lg)" }}>
      {/* Hero */}
      <div className="col" style={{ gap: 8 }}>
        <div className="row" style={{ gap: 9, flexWrap: "wrap" }}>
          <span className="eyebrow">{m.monthLabel} · Net</span>
          <span className={"tag " + (upBeats ? "tag-pos" : "tag-warn")}>{upBeats ? "On track" : "Tight"}</span>
        </div>
        <div className="row" style={{ alignItems: "flex-end", gap: 14, flexWrap: "wrap" }}>
          <BigPeso cents={m.netLeft} size={48} color={upBeats ? "var(--text)" : "var(--warn)"} />
        </div>
        <div className="muted" style={{ fontSize: 12.5 }}>
          Money left to spend or save · day {m.day} of {m.daysInMonth}
        </div>
      </div>

      {/* Stats grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: "var(--gap)" }}>
        <Stat
          label="Income this month"
          value={pesoK(m.incomeMTD)}
          sub={m.incomeReceived > 0 ? pesoK(m.incomeReceived) + " in the bank" : "nothing received yet"}
          tone="pos"
        />
        <Stat
          label="Bills this month"
          value={pesoK(m.billsTotal)}
          sub={`${pesoK(m.billsPaidTotal)} paid · ${m.billsPaidCount}/${m.billsTotalCount}`}
          tone="cyan"
        />
        <Stat
          label="Spent so far"
          value={pesoK(m.spentMTD)}
          sub={m.budgetTotal > 0 ? `${Math.round(m.spentMTD / m.budgetTotal * 100)}% of total budget` : "no budget set"}
          tone={onPace ? "neutral" : "warn"}
        />
        <Stat
          label="Month-end forecast"
          value={pesoK(m.projectedEOM)}
          sub={m.projectedEOM >= 0 ? "projected leftover" : "projected shortfall"}
          tone={m.projectedEOM >= 0 ? "pos" : "warn"}
        />
      </div>

      {/* Donut where income goes */}
      <div className="card card-pad">
        <div className="section-title">
          <h3>Where income goes</h3>
          <span className="meta">of {pesoK(Math.max(m.incomeMTD, 1))}</span>
        </div>
        <div className="row" style={{ gap: 24, alignItems: "center", flexWrap: "wrap" }}>
          <Donut
            size={180}
            segments={[
              { key: "Bills",    value: m.billsTotal,        color: "#38bdf8" },
              { key: "Spending", value: m.spentMTD,          color: "#fbbf24" },
              { key: "Savings",  value: m.savedThisMonth,    color: "#34d399" },
              { key: "Left",     value: Math.max(0, m.netLeft), color: "rgba(255,255,255,0.18)" },
            ]}
            innerLabel={
              <div className="col" style={{ gap: 2 }}>
                <span className="eyebrow">Left</span>
                <span className="num" style={{ fontSize: 18, fontWeight: 600 }}>{pesoK(Math.max(0, m.netLeft))}</span>
              </div>
            }
          />
          <div className="col" style={{ gap: 10, flex: "0 1 280px", minWidth: 220, maxWidth: 320 }}>
            <LegendRow color="#38bdf8" label="Bills" value={peso(m.billsTotal)} />
            <LegendRow color="#fbbf24" label="Spending" value={peso(m.spentMTD)} />
            <LegendRow color="#34d399" label="Savings" value={peso(m.savedThisMonth)} />
            <LegendRow color="rgba(255,255,255,0.45)" label="Left" value={peso(Math.max(0, m.netLeft))} />
          </div>
        </div>
      </div>

      {/* Two-column on desktop */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "var(--gap)", alignItems: "start" }}>
        {/* Bills due */}
        <div className="card">
          <div className="card-pad" style={{ paddingBottom: 4 }}>
            <div className="section-title">
              <h3>Bills due this month</h3>
              <span className="meta">{peso(m.billsTotal - m.billsPaidTotal)} left</span>
            </div>
          </div>
          {m.upcomingBills.length === 0 ? (
            <div className="card-pad" style={{ paddingTop: 0 }}>
              <div className="muted" style={{ fontSize: 13, textAlign: "center", padding: "16px 0" }}>No bills set up yet</div>
              <Link href="/bills" className="btn btn-ghost btn-block"><Plus size={14} /> Add a bill</Link>
            </div>
          ) : (
            <>
              {m.upcomingBills.map((b) => <BillRow key={b.id} bill={b} />)}
              <div className="card-pad" style={{ paddingTop: 10 }}>
                <Link href="/bills" className="btn btn-ghost btn-block">View all bills</Link>
              </div>
            </>
          )}
        </div>

        {/* Categories */}
        <div className="card card-pad">
          <div className="section-title">
            <h3>Spending by category</h3>
            <span className="meta">{peso(m.spentMTD)} / {peso(m.budgetTotal)}</span>
          </div>
          <div>
            {m.spentByCat
              .slice()
              .sort((a, b) => (b.spentCents - a.spentCents) || (b.capCents - a.capCents))
              .slice(0, 6)
              .map((c) => (
                <CategoryBar key={c.categoryId} label={c.label} glyph={c.glyph} spentCents={c.spentCents} capCents={c.capCents} billsCents={c.billsCents} />
              ))}
          </div>
          <Link href="/budgets" className="btn btn-ghost btn-block" style={{ marginTop: 8 }}>Manage budgets</Link>
        </div>
      </div>

      {/* Savings */}
      {m.savings && (
        <Link href="/savings" className="card card-pad row" style={{ gap: 16, textDecoration: "none", color: "inherit" }}>
          <div className="col grow" style={{ gap: 6 }}>
            <div className="section-title" style={{ margin: 0 }}>
              <h3>{m.savings.name}</h3>
              {m.savings.targetDate && <span className="meta">by {new Date(m.savings.targetDate).toLocaleDateString("en-PH", { month: "short", year: "numeric" })}</span>}
            </div>
            <div className="row-sb"><span className="muted" style={{ fontSize: 12 }}>Saved</span><span className="num">{peso(m.savings.current)}</span></div>
            <div className="row-sb"><span className="muted" style={{ fontSize: 12 }}>Target</span><span className="num faint">{peso(m.savings.target)}</span></div>
            <div className="row-sb"><span className="muted" style={{ fontSize: 12 }}>To go</span><span className="num cyan">{peso(Math.max(0, m.savings.target - m.savings.current))}</span></div>
          </div>
          <ProgressRing pct={m.savings.target > 0 ? m.savings.current / m.savings.target : 0} size={92} stroke={9} color="var(--pos)">
            <span className="num" style={{ fontSize: 16, fontWeight: 600 }}>{Math.round((m.savings.current / Math.max(m.savings.target, 1)) * 100)}%</span>
          </ProgressRing>
        </Link>
      )}
    </div>
  );
}

function BigPeso({ cents, size = 44, color = "var(--text)" }: { cents: number; size?: number; color?: string }) {
  const neg = cents < 0;
  return (
    <span className="num" style={{ fontSize: size, fontWeight: 600, color, lineHeight: 1, letterSpacing: "-0.04em", display: "inline-flex", alignItems: "baseline" }}>
      <span style={{ fontSize: size * 0.52, opacity: 0.6, marginRight: 2 }}>{neg ? "−₱" : "₱"}</span>
      {Math.abs(Math.round(cents / 100)).toLocaleString("en-PH")}
    </span>
  );
}

function Stat({ label, value, sub, tone }: { label: string; value: string; sub: string; tone: "pos" | "cyan" | "warn" | "neutral" }) {
  const colors = { pos: "var(--pos)", cyan: "var(--cyan)", warn: "var(--warn)", neutral: "var(--text-dim)" };
  const tick = colors[tone];
  return (
    <div className="stat">
      <span className="tick" style={{ background: tick }} />
      <div className="label"><span className="dot" style={{ background: tick }} /><span className="label-txt">{label}</span></div>
      <span className="value">{value}</span>
      <span className="sub">{sub}</span>
    </div>
  );
}

function LegendRow({ color, label, value }: { color: string; label: string; value: string }) {
  return (
    <div className="row" style={{ gap: 9 }}>
      <span className="dot" style={{ background: color, width: 9, height: 9 }} />
      <span className="grow" style={{ fontSize: 12.5, color: "var(--text-dim)" }}>{label}</span>
      <span className="num" style={{ fontSize: 12.5, color: "var(--text)" }}>{value}</span>
    </div>
  );
}

function EmptyDashboard({ month }: { month: string }) {
  return (
    <div className="col fade-up" style={{ gap: "var(--pad-lg)" }}>
      <div className="col" style={{ gap: 8 }}>
        <div className="row" style={{ gap: 9 }}><span className="eyebrow">{month} · Net</span></div>
        <BigPeso cents={0} size={48} />
        <div className="muted" style={{ fontSize: 12.5 }}>Set up your income and bills below to see your numbers.</div>
      </div>
      <div className="card card-pad">
        <div className="section-title"><h3>Quick start</h3></div>
        <div className="col" style={{ gap: 10 }}>
          <Link href="/income" className="btn btn-block btn-ghost" style={{ justifyContent: "space-between" }}>
            <span>1. Set up your monthly salary</span><span className="faint">→</span>
          </Link>
          <Link href="/bills" className="btn btn-block btn-ghost" style={{ justifyContent: "space-between" }}>
            <span>2. Add your recurring bills</span><span className="faint">→</span>
          </Link>
          <Link href="/budgets" className="btn btn-block btn-ghost" style={{ justifyContent: "space-between" }}>
            <span>3. Set spending caps per category</span><span className="faint">→</span>
          </Link>
          <Link href="/savings" className="btn btn-block btn-ghost" style={{ justifyContent: "space-between" }}>
            <span>4. Adjust your savings goal</span><span className="faint">→</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
