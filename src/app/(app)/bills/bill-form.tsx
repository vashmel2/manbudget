"use client";

import { useState, useTransition } from "react";
import { createBill, updateBill, deleteBill } from "./actions";
import type { BillWithStatus } from "@/lib/queries";

type Category = { id: number; label: string; slug: string; glyph: string };

interface Props {
  open: boolean;
  onClose: () => void;
  categories: Category[];
  editing?: BillWithStatus | null;
}

export function BillForm({ open, onClose, categories, editing }: Props) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  if (!open) return null;

  const isEdit = !!editing;

  function submit(fd: FormData) {
    setError(null);
    startTransition(async () => {
      const res = isEdit ? await updateBill(editing!.id, fd) : await createBill(fd);
      if (!res.ok) setError(res.error);
      else onClose();
    });
  }

  function handleDelete() {
    if (!editing) return;
    if (!confirm("Delete this bill? Past payment history is kept.")) return;
    startTransition(async () => {
      await deleteBill(editing.id);
      onClose();
    });
  }

  return (
    <div className="modal-scrim" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="card-pad">
          <div className="row-sb" style={{ marginBottom: 14 }}>
            <h3 style={{ margin: 0, fontSize: 15, fontWeight: 600 }}>{isEdit ? "Edit bill" : "New bill"}</h3>
            <button className="btn btn-ghost" onClick={onClose} style={{ height: 32, padding: "0 12px", fontSize: 12 }}>Cancel</button>
          </div>

          <form action={submit} className="col" style={{ gap: 12 }}>
            <div className="col" style={{ gap: 6 }}>
              <label className="eyebrow">Name</label>
              <input name="name" defaultValue={editing?.name || ""} className="input" placeholder="e.g. Electricity" required maxLength={80} />
            </div>

            <div className="col" style={{ gap: 6 }}>
              <label className="eyebrow">Payee <span className="faint" style={{ textTransform: "none", letterSpacing: 0 }}>(optional)</span></label>
              <input name="payee" defaultValue={editing?.payee || ""} className="input" placeholder="e.g. Meralco" maxLength={80} />
            </div>

            <div className="row" style={{ gap: 12 }}>
              <div className="col grow" style={{ gap: 6 }}>
                <label className="eyebrow">Amount (₱)</label>
                <input name="amount" type="number" step="0.01" min="0" defaultValue={editing ? (editing.amountCents / 100).toFixed(2) : ""} className="input num" placeholder="0.00" required />
              </div>
              <div className="col" style={{ gap: 6, width: 100 }}>
                <label className="eyebrow">Due day</label>
                <input name="dueDay" type="number" min="1" max="31" defaultValue={editing?.dueDay || ""} className="input num" placeholder="15" required />
              </div>
            </div>

            <div className="col" style={{ gap: 6 }}>
              <label className="eyebrow">Cadence</label>
              <select name="cadence" defaultValue={editing?.cadence || "monthly"} className="input">
                <option value="monthly">Monthly</option>
                <option value="quarterly">Quarterly</option>
                <option value="semiannual">Semiannual (every 6 months)</option>
                <option value="yearly">Yearly</option>
              </select>
              <div className="faint" style={{ fontSize: 11 }}>
                Semiannual and yearly bills count as 1/6 and 1/12 of their amount per month in budgets, but paid status is tracked once per half/year.
              </div>
            </div>

            <div className="col" style={{ gap: 6 }}>
              <label className="eyebrow">Category</label>
              <select name="categoryId" defaultValue={editing?.categoryId?.toString() || ""} className="input">
                <option value="">— None —</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.label}</option>
                ))}
              </select>
            </div>

            <label className="row" style={{ gap: 10, cursor: "pointer", padding: "6px 0", alignItems: "flex-start" }}>
              <input
                type="checkbox"
                name="autoDeduct"
                defaultChecked={editing?.autoDeduct ?? false}
                style={{ width: 18, height: 18, marginTop: 2, accentColor: "var(--pos)", flex: "none" }}
              />
              <div className="col" style={{ gap: 2 }}>
                <span style={{ fontSize: 13, fontWeight: 500 }}>Auto-deduct</span>
                <span className="faint" style={{ fontSize: 11 }}>
                  For subscriptions, loans, or insurance that pull from your card automatically. Skips the manual paid checkbox — always counted as paid.
                </span>
              </div>
            </label>

            {error && <div style={{ color: "var(--neg)", fontSize: 12 }}>{error}</div>}

            <div className="row" style={{ gap: 10, marginTop: 6 }}>
              {isEdit && (
                <button type="button" onClick={handleDelete} disabled={pending} className="btn" style={{ color: "var(--neg)" }}>
                  Delete
                </button>
              )}
              <button type="submit" disabled={pending} className="btn btn-primary grow">
                {pending ? "Saving…" : isEdit ? "Save changes" : "Create bill"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
