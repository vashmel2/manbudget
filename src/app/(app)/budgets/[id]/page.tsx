import Link from "next/link";
import { redirect } from "next/navigation";
import { and, asc, desc, eq, gte, lte } from "drizzle-orm";
import { ArrowLeft, Plus } from "lucide-react";
import { db, bills, transactions, categories, budgets } from "@/db";
import { requireActor } from "@/lib/require-user";
import { peso, pesoK } from "@/lib/peso";
import { CategoryBar } from "@/components/category-bar";

export default async function CategoryDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { ownerId } = await requireActor();
  const categoryId = Number(id);
  if (!Number.isInteger(categoryId) || categoryId <= 0) redirect("/budgets");

  const [cat] = await db
    .select()
    .from(categories)
    .where(and(eq(categories.id, categoryId), eq(categories.userId, ownerId)))
    .limit(1);
  if (!cat) redirect("/budgets");

  const [budget] = await db
    .select()
    .from(budgets)
    .where(and(eq(budgets.userId, ownerId), eq(budgets.categoryId, categoryId)))
    .limit(1);

  const catBills = await db
    .select()
    .from(bills)
    .where(and(eq(bills.userId, ownerId), eq(bills.categoryId, categoryId), eq(bills.active, true)))
    .orderBy(asc(bills.dueDay), asc(bills.name));

  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth();
  const start = `${y}-${String(m + 1).padStart(2, "0")}-01`;
  const endDate = new Date(y, m + 1, 0);
  const end = `${y}-${String(m + 1).padStart(2, "0")}-${String(endDate.getDate()).padStart(2, "0")}`;
  const monthLabel = now.toLocaleString("en-PH", { month: "long", year: "numeric" });

  const catTxs = await db
    .select()
    .from(transactions)
    .where(and(
      eq(transactions.userId, ownerId),
      eq(transactions.categoryId, categoryId),
      gte(transactions.occurredAt, start),
      lte(transactions.occurredAt, end),
    ))
    .orderBy(desc(transactions.occurredAt), desc(transactions.id));

  const monthlyEquiv = (c: string, amt: number) =>
    c === "yearly" ? Math.round(amt / 12)
    : c === "semiannual" ? Math.round(amt / 6)
    : c === "quarterly" ? Math.round(amt / 3)
    : amt;

  const billsCents = catBills.reduce((s, b) => s + monthlyEquiv(b.cadence, b.amountCents), 0);
  const txExpenseCents = catTxs.filter((t) => t.amountCents < 0).reduce((s, t) => s + Math.abs(t.amountCents), 0);
  const totalSpent = billsCents + txExpenseCents;
  const cap = budget?.amountCents ?? 0;

  return (
    <div className="col fade-up" style={{ gap: "var(--pad-lg)" }}>
      <div className="row" style={{ gap: 8 }}>
        <Link href="/dashboard" className="btn btn-ghost" style={{ height: 32, padding: "0 10px", fontSize: 12 }}>
          <ArrowLeft size={13} /> Back
        </Link>
      </div>

      <div className="col" style={{ gap: 6 }}>
        <div className="eyebrow">{monthLabel} · category breakdown</div>
        <h2 style={{ margin: 0, fontSize: 24, fontWeight: 600, letterSpacing: "-0.02em", display: "flex", alignItems: "center", gap: 10 }}>
          <span className="mono faint" style={{ fontSize: 13 }}>{cat.glyph}</span>
          {cat.label}
        </h2>
      </div>

      <div className="card card-pad col" style={{ gap: 10 }}>
        <CategoryBar label={cat.label} glyph={cat.glyph} spentCents={totalSpent} capCents={cap} billsCents={billsCents} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "var(--gap)" }}>
        <Stat label="Bills (monthly equiv)" value={pesoK(billsCents)} sub={catBills.length === 1 ? "1 bill" : `${catBills.length} bills`} tone="cyan" />
        <Stat label="Ad-hoc this month" value={pesoK(txExpenseCents)} sub={`${catTxs.filter((t) => t.amountCents < 0).length} expenses`} tone="warn" />
        <Stat
          label="Cap"
          value={cap > 0 ? pesoK(cap) : "—"}
          sub={cap > 0 ? `${Math.round((totalSpent / cap) * 100)}% used` : "not set"}
          tone="neutral"
        />
      </div>

      <div className="col" style={{ gap: 8 }}>
        <div className="section-title">
          <h3>Bills in this category</h3>
          <span className="meta">{catBills.length} {catBills.length === 1 ? "bill" : "bills"}</span>
        </div>
        {catBills.length === 0 ? (
          <div className="card card-pad" style={{ textAlign: "center", padding: "26px 20px" }}>
            <div className="muted" style={{ fontSize: 13.5 }}>No bills tagged with this category</div>
          </div>
        ) : (
          <div className="card">
            {catBills.map((b) => {
              const monthly = monthlyEquiv(b.cadence, b.amountCents);
              const showMonthlyHint = b.cadence !== "monthly";
              return (
                <div key={b.id} className="lrow">
                  <div className="icn">{cat.glyph}</div>
                  <div className="col grow" style={{ minWidth: 0 }}>
                    <div className="nm">{b.name}</div>
                    <div className="sub">
                      {b.cadence === "monthly" ? "Monthly" : b.cadence === "yearly" ? "Yearly" : b.cadence === "semiannual" ? "Semiannual" : b.cadence === "quarterly" ? "Quarterly" : "Bimonthly"} · due day {b.dueDay}{b.payee ? " · " + b.payee : ""}{b.autoDeduct ? " · auto-deduct" : ""}
                    </div>
                  </div>
                  <div className="col" style={{ alignItems: "flex-end", gap: 2, flex: "none" }}>
                    <span className="amt">{peso(b.amountCents)}</span>
                    {showMonthlyHint && (
                      <span className="num faint" style={{ fontSize: 10.5 }}>={peso(monthly)}/mo</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="col" style={{ gap: 8 }}>
        <div className="section-title">
          <h3>Transactions this month</h3>
          <span className="meta">{catTxs.length} {catTxs.length === 1 ? "entry" : "entries"}</span>
        </div>
        {catTxs.length === 0 ? (
          <div className="card card-pad" style={{ textAlign: "center", padding: "26px 20px" }}>
            <div className="muted" style={{ fontSize: 13.5, marginBottom: 12 }}>No transactions tagged this category yet this month</div>
            <Link href="/transactions/new" className="btn btn-ghost">
              <Plus size={14} /> Add transaction
            </Link>
          </div>
        ) : (
          <div className="card">
            {catTxs.map((t) => {
              const positive = t.amountCents > 0;
              return (
                <div key={t.id} className="lrow">
                  <div className="icn" style={{ background: positive ? "var(--pos-soft)" : "var(--surface-2)", color: positive ? "var(--pos)" : "var(--text-dim)" }}>
                    {positive ? "+" : cat.glyph}
                  </div>
                  <div className="col grow" style={{ minWidth: 0 }}>
                    <div className="nm">{t.label}</div>
                    <div className="sub">
                      {new Date(t.occurredAt).toLocaleDateString("en-PH", { month: "short", day: "numeric" })}
                      {t.note ? " · " + t.note : ""}
                    </div>
                  </div>
                  <span className={"num " + (positive ? "pos" : "")} style={{ fontSize: 14, fontWeight: 600 }}>
                    {positive ? "+" : "−"}{peso(Math.abs(t.amountCents))}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
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
