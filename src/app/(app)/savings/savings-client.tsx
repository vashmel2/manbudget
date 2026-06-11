"use client";

import { useState, useTransition } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { peso } from "@/lib/peso";
import { ProgressRing } from "@/components/progress-ring";
import { upsertGoal, addContribution, deleteContribution } from "./actions";

type Goal = {
  id: number;
  name: string;
  targetCents: number;
  targetDate: string | null;
  currentCents: number;
  contributions: Array<{ id: number; label: string | null; amountCents: number; occurredAt: string }>;
} | null;

export function SavingsClient({ goal }: { goal: Goal }) {
  const [editing, setEditing] = useState(false);
  const [adding, setAdding] = useState(false);

  if (!goal) {
    return (
      <div className="col fade-up" style={{ gap: "var(--pad-lg)" }}>
        <h2 style={{ margin: 0, fontSize: 22, fontWeight: 600, letterSpacing: "-0.02em" }}>Savings</h2>
        <div className="card card-pad" style={{ textAlign: "center", padding: "40px 20px" }}>
          <div className="muted" style={{ marginBottom: 14, fontSize: 13.5 }}>No savings goal yet</div>
          <button className="btn btn-primary" onClick={() => setEditing(true)}>
            <Plus size={16} strokeWidth={2.5} /> Set up a goal
          </button>
        </div>
        {editing && <GoalForm goal={null} onClose={() => setEditing(false)} />}
      </div>
    );
  }

  const pct = goal.targetCents > 0 ? goal.currentCents / goal.targetCents : 0;
  const remaining = Math.max(0, goal.targetCents - goal.currentCents);

  return (
    <div className="col fade-up" style={{ gap: "var(--pad-lg)" }}>
      <div className="row-sb">
        <div className="col" style={{ gap: 4 }}>
          <h2 style={{ margin: 0, fontSize: 22, fontWeight: 600, letterSpacing: "-0.02em" }}>Savings</h2>
          <div className="muted" style={{ fontSize: 12.5 }}>{goal.name}{goal.targetDate ? ` · by ${new Date(goal.targetDate).toLocaleDateString("en-PH", { month: "short", year: "numeric" })}` : ""}</div>
        </div>
        <button className="btn btn-primary" onClick={() => setAdding(true)}>
          <Plus size={16} strokeWidth={2.5} /> Contribute
        </button>
      </div>

      <div className="card card-pad row" style={{ gap: 20, alignItems: "center" }}>
        <ProgressRing pct={pct} size={120} stroke={10} color="var(--pos)">
          <span className="num" style={{ fontSize: 22, fontWeight: 600 }}>{Math.round(pct * 100)}%</span>
        </ProgressRing>
        <div className="col grow" style={{ gap: 8 }}>
          <div className="row-sb">
            <span className="muted" style={{ fontSize: 12 }}>Saved</span>
            <span className="num">{peso(goal.currentCents)}</span>
          </div>
          <div className="row-sb">
            <span className="muted" style={{ fontSize: 12 }}>Target</span>
            <span className="num faint">{peso(goal.targetCents)}</span>
          </div>
          <div className="row-sb">
            <span className="muted" style={{ fontSize: 12 }}>To go</span>
            <span className="num cyan">{peso(remaining)}</span>
          </div>
          <button className="btn btn-ghost" onClick={() => setEditing(true)} style={{ height: 32, fontSize: 12, marginTop: 4 }}>
            <Pencil size={12} /> Edit goal
          </button>
        </div>
      </div>

      <div className="col" style={{ gap: 8 }}>
        <div className="section-title">
          <h3>Contributions</h3>
          <span className="meta">{goal.contributions.length} entries</span>
        </div>
        {goal.contributions.length === 0 ? (
          <div className="card card-pad" style={{ textAlign: "center", padding: "26px 20px" }}>
            <div className="muted" style={{ fontSize: 13.5 }}>No contributions yet</div>
          </div>
        ) : (
          <div className="card">
            {goal.contributions.map((c) => <ContribRow key={c.id} c={c} />)}
          </div>
        )}
      </div>

      {editing && <GoalForm goal={goal} onClose={() => setEditing(false)} />}
      {adding && <ContribForm goalId={goal.id} onClose={() => setAdding(false)} />}
    </div>
  );
}

function ContribRow({ c }: { c: { id: number; label: string | null; amountCents: number; occurredAt: string } }) {
  const [pending, startTransition] = useTransition();
  function handleDelete(e: React.MouseEvent) {
    e.stopPropagation();
    if (!confirm("Remove this contribution?")) return;
    startTransition(async () => { await deleteContribution(c.id); });
  }
  return (
    <div className="lrow" style={{ opacity: pending ? 0.5 : 1 }}>
      <div className="icn" style={{ background: "var(--pos-soft)", color: "var(--pos)" }}>$</div>
      <div className="col grow" style={{ minWidth: 0 }}>
        <div className="nm">{c.label || "Contribution"}</div>
        <div className="sub">{new Date(c.occurredAt).toLocaleDateString("en-PH", { month: "short", day: "numeric" })}</div>
      </div>
      <div className="row" style={{ gap: 8 }}>
        <span className="num pos" style={{ fontSize: 14, fontWeight: 600 }}>+{peso(c.amountCents)}</span>
        <button className="btn btn-ghost" onClick={handleDelete} disabled={pending} style={{ height: 32, width: 32, padding: 0, color: "var(--text-faint)" }}>
          <Trash2 size={13} />
        </button>
      </div>
    </div>
  );
}

function GoalForm({ goal, onClose }: { goal: NonNullable<Goal> | null; onClose: () => void }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function submit(fd: FormData) {
    setError(null);
    startTransition(async () => {
      const res = await upsertGoal(fd);
      if (!res.ok) setError(res.error);
      else onClose();
    });
  }

  return (
    <div className="modal-scrim" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="card-pad">
          <div className="row-sb" style={{ marginBottom: 14 }}>
            <h3 style={{ margin: 0, fontSize: 15, fontWeight: 600 }}>{goal ? "Edit goal" : "New savings goal"}</h3>
            <button className="btn btn-ghost" onClick={onClose} style={{ height: 32, padding: "0 12px", fontSize: 12 }}>Cancel</button>
          </div>
          <form action={submit} className="col" style={{ gap: 12 }}>
            <div className="col" style={{ gap: 6 }}>
              <label className="eyebrow">Goal name</label>
              <input name="name" defaultValue={goal?.name || "Family Emergency Fund"} className="input" required maxLength={80} />
            </div>
            <div className="col" style={{ gap: 6 }}>
              <label className="eyebrow">Target amount (₱)</label>
              <input name="target" type="number" step="0.01" min="0" defaultValue={goal ? (goal.targetCents / 100).toFixed(0) : "150000"} className="input num" required />
            </div>
            <div className="col" style={{ gap: 6 }}>
              <label className="eyebrow">Target date <span className="faint" style={{ textTransform: "none", letterSpacing: 0 }}>(optional)</span></label>
              <input name="targetDate" type="date" defaultValue={goal?.targetDate || ""} className="input num" />
            </div>
            {error && <div style={{ color: "var(--neg)", fontSize: 12 }}>{error}</div>}
            <button type="submit" disabled={pending} className="btn btn-primary btn-block" style={{ marginTop: 4 }}>
              {pending ? "Saving…" : "Save goal"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

function ContribForm({ goalId, onClose }: { goalId: number; onClose: () => void }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const today = new Date().toISOString().split("T")[0];

  function submit(fd: FormData) {
    setError(null);
    fd.set("goalId", String(goalId));
    startTransition(async () => {
      const res = await addContribution(fd);
      if (!res.ok) setError(res.error);
      else onClose();
    });
  }

  return (
    <div className="modal-scrim" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="card-pad">
          <div className="row-sb" style={{ marginBottom: 14 }}>
            <h3 style={{ margin: 0, fontSize: 15, fontWeight: 600 }}>Add contribution</h3>
            <button className="btn btn-ghost" onClick={onClose} style={{ height: 32, padding: "0 12px", fontSize: 12 }}>Cancel</button>
          </div>
          <form action={submit} className="col" style={{ gap: 12 }}>
            <div className="col" style={{ gap: 6 }}>
              <label className="eyebrow">Amount (₱)</label>
              <input name="amount" type="number" step="0.01" min="0" className="input num" required autoFocus />
            </div>
            <div className="col" style={{ gap: 6 }}>
              <label className="eyebrow">Note <span className="faint" style={{ textTransform: "none", letterSpacing: 0 }}>(optional)</span></label>
              <input name="label" className="input" placeholder="e.g. Auto-transfer, gig surplus" maxLength={80} />
            </div>
            <div className="col" style={{ gap: 6 }}>
              <label className="eyebrow">Date</label>
              <input name="date" type="date" defaultValue={today} className="input num" required />
            </div>
            {error && <div style={{ color: "var(--neg)", fontSize: 12 }}>{error}</div>}
            <button type="submit" disabled={pending} className="btn btn-primary btn-block" style={{ marginTop: 4 }}>
              {pending ? "Saving…" : "Add"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
