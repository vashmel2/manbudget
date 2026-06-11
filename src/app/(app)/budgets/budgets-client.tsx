"use client";

import { useState, useTransition } from "react";
import { Zap } from "lucide-react";
import { peso } from "@/lib/peso";
import { setBudget, syncBudgetsToBills } from "./actions";

type Row = { id: number; label: string; glyph: string; budgetCents: number; spentCents: number; billsCents: number; txCents: number };

export function BudgetsClient({ categories }: { categories: Row[] }) {
  const totalBudget = categories.reduce((s, c) => s + c.budgetCents, 0);
  const totalSpent = categories.reduce((s, c) => s + c.spentCents, 0);
  const [syncing, startSync] = useTransition();
  const [synced, setSynced] = useState<number | null>(null);

  function handleSync() {
    if (!confirm("Set each category's cap to match its current bills total? Categories without bills (Groceries, Dining, etc.) keep their caps.")) return;
    startSync(async () => {
      const res = await syncBudgetsToBills();
      if (res.ok) {
        setSynced(res.updated);
        setTimeout(() => setSynced(null), 2400);
      }
    });
  }

  return (
    <div className="col fade-up" style={{ gap: "var(--pad-lg)" }}>
      <div className="row-sb" style={{ alignItems: "flex-start" }}>
        <div className="col" style={{ gap: 4 }}>
          <h2 style={{ margin: 0, fontSize: 22, fontWeight: 600, letterSpacing: "-0.02em" }}>Budgets</h2>
          <div className="muted" style={{ fontSize: 12.5 }}>
            {peso(totalSpent)} spent of {peso(totalBudget)} budgeted
          </div>
          <div className="faint" style={{ fontSize: 11.5, marginTop: 4, maxWidth: 520 }}>
            "Spent" includes all bills in the category (committed) plus ad-hoc transactions. Leave cap at 0 if you just want to track without a limit.
          </div>
        </div>
        <button className="btn btn-ghost" onClick={handleSync} disabled={syncing} style={{ flex: "none" }}>
          <Zap size={14} /> {syncing ? "Syncing…" : synced !== null ? `Synced ${synced}` : "Sync caps to bills"}
        </button>
      </div>

      <div className="card">
        {categories.map((c) => <BudgetRow key={c.id} row={c} />)}
      </div>
    </div>
  );
}

function BudgetRow({ row }: { row: Row }) {
  const [value, setValue] = useState((row.budgetCents / 100).toFixed(0));
  const [pending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);

  const cap = parseFloat(value) || 0;
  const capCents = cap * 100;
  const pct = capCents > 0 ? Math.min(row.spentCents / capCents, 1.3) : 0;
  const over = capCents > 0 && row.spentCents > capCents;
  const noCapWithSpend = capCents === 0 && row.spentCents > 0;
  const color = over ? "var(--warn)" : pct > 0.85 ? "var(--cyan)" : "var(--pos)";
  const fillWidth = capCents > 0 ? Math.min(pct * 100 / 1.3, 100) : noCapWithSpend ? 100 : 0;

  function save() {
    const fd = new FormData();
    fd.set("categoryId", String(row.id));
    fd.set("amount", value || "0");
    startTransition(async () => {
      const res = await setBudget(fd);
      if (res.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 1400);
      }
    });
  }

  return (
    <div className="lrow" style={{ flexDirection: "column", alignItems: "stretch", padding: "var(--pad)", gap: 8 }}>
      <div className="row" style={{ gap: 12 }}>
        <div className="icn">{row.glyph}</div>
        <div className="col grow" style={{ minWidth: 0 }}>
          <div className="nm">{row.label}</div>
          <div className="sub">
            {peso(row.spentCents)} spent · {capCents > 0 ? Math.round((row.spentCents / capCents) * 100) + "%" : "no cap"}
            {row.billsCents > 0 && (
              <span className="faint"> · {peso(row.billsCents)} bills{row.txCents > 0 ? ` + ${peso(row.txCents)} ad-hoc` : ""}</span>
            )}
          </div>
        </div>
        <div className="row" style={{ gap: 6, flex: "none" }}>
          <span className="num" style={{ color: "var(--text-dim)", fontSize: 13 }}>₱</span>
          <input
            type="number"
            value={value}
            onChange={(e) => { setValue(e.target.value); setSaved(false); }}
            onBlur={save}
            min="0"
            step="100"
            className="input num"
            style={{ width: 100, height: 36, textAlign: "right" }}
            disabled={pending}
          />
        </div>
      </div>
      <div className="track" style={{ marginTop: 4 }}>
        <div className="fill" style={{ width: `${fillWidth}%`, background: noCapWithSpend ? "var(--cyan)" : color, opacity: noCapWithSpend ? 0.35 : 1 }} />
        {capCents > 0 && <div className="cap-mark" style={{ left: `${100 / 1.3}%` }} />}
      </div>
      {saved && <div style={{ fontSize: 11, color: "var(--pos)", textAlign: "right" }}>Saved</div>}
    </div>
  );
}
