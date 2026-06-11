"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";
import { createTransaction, updateTransaction } from "../actions";

type Category = { id: number; label: string; slug: string; glyph: string };

type EditingTx = {
  id: number;
  label: string;
  amountCents: number;
  categoryId: number | null;
  note: string | null;
  occurredAt: string;
};

export function NewTxClient({ categories, editing }: { categories: Category[]; editing?: EditingTx }) {
  const router = useRouter();
  const initialType: "expense" | "income" = editing ? (editing.amountCents < 0 ? "expense" : "income") : "expense";
  const [type, setType] = useState<"expense" | "income">(initialType);
  const [categoryId, setCategoryId] = useState<number | null>(editing?.categoryId ?? null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const today = new Date().toISOString().split("T")[0];

  function submit(fd: FormData) {
    setError(null);
    fd.set("type", type);
    if (categoryId !== null) fd.set("categoryId", String(categoryId));
    startTransition(async () => {
      const res = editing ? await updateTransaction(editing.id, fd) : await createTransaction(fd);
      if (res && !res.ok) setError(res.error);
    });
  }

  const isEdit = !!editing;
  const initialAmount = editing ? (Math.abs(editing.amountCents) / 100).toFixed(2) : "";

  return (
    <div className="col fade-up" style={{ gap: "var(--pad-lg)", maxWidth: 520, margin: "0 auto" }}>
      <div className="row-sb">
        <h2 style={{ margin: 0, fontSize: 22, fontWeight: 600, letterSpacing: "-0.02em" }}>
          {isEdit ? "Edit transaction" : "Add transaction"}
        </h2>
        <button className="btn btn-ghost" onClick={() => router.back()} style={{ width: 36, height: 36, padding: 0 }}>
          <X size={16} />
        </button>
      </div>

      <form action={submit} className="col" style={{ gap: 16 }}>
        <div className="seg" style={{ alignSelf: "center" }}>
          <button type="button" data-on={type === "expense"} onClick={() => setType("expense")}>Expense</button>
          <button type="button" data-on={type === "income"} onClick={() => setType("income")}>Income</button>
        </div>

        <div className="card card-pad col" style={{ gap: 6, alignItems: "center", padding: "26px var(--pad)" }}>
          <span className="eyebrow">Amount</span>
          <div className="row" style={{ alignItems: "baseline", gap: 4 }}>
            <span className="num" style={{ fontSize: 28, fontWeight: 500, color: type === "expense" ? "var(--neg)" : "var(--pos)" }}>{type === "expense" ? "−₱" : "+₱"}</span>
            <input
              name="amount"
              type="number"
              step="0.01"
              min="0"
              required
              autoFocus
              inputMode="decimal"
              placeholder="0"
              defaultValue={initialAmount}
              className="num"
              style={{ background: "transparent", border: "none", outline: "none", color: "var(--text)", fontSize: 44, fontWeight: 600, letterSpacing: "-0.04em", width: 220, textAlign: "left" }}
            />
          </div>
        </div>

        <div className="col" style={{ gap: 8 }}>
          <label className="eyebrow">Category</label>
          <div className="row wrap" style={{ gap: 8 }}>
            {categories.map((c) => (
              <span key={c.id} className="chip" data-on={categoryId === c.id} onClick={() => setCategoryId(categoryId === c.id ? null : c.id)}>
                <span className="mono" style={{ fontSize: 10, color: "var(--text-faint)" }}>{c.glyph}</span>
                {c.label}
              </span>
            ))}
          </div>
        </div>

        <div className="col" style={{ gap: 6 }}>
          <label className="eyebrow">What was it?</label>
          <input name="label" defaultValue={editing?.label ?? ""} className="input" placeholder="e.g. Puregold groceries" required maxLength={80} />
        </div>

        <div className="col" style={{ gap: 6 }}>
          <label className="eyebrow">Note <span className="faint" style={{ textTransform: "none", letterSpacing: 0 }}>(optional)</span></label>
          <textarea name="note" defaultValue={editing?.note ?? ""} className="input" rows={2} maxLength={280} placeholder="Weekly run, rice 25kg…" />
        </div>

        <div className="col" style={{ gap: 6 }}>
          <label className="eyebrow">Date</label>
          <input name="date" type="date" defaultValue={editing?.occurredAt ?? today} className="input num" required />
        </div>

        {error && <div style={{ color: "var(--neg)", fontSize: 12 }}>{error}</div>}

        <button type="submit" disabled={pending} className="btn btn-primary btn-lg btn-block">
          {pending ? "Saving…" : isEdit ? "Save changes" : `Save ${type}`}
        </button>
      </form>
    </div>
  );
}
