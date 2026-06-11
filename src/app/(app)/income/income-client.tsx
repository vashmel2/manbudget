"use client";

import { useState, useTransition } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { upsertPrimaryIncome, logGigIncome, deleteGigIncome } from "./actions";
import { peso } from "@/lib/peso";
import type { RecurringIncome } from "@/db/schema";

type GigTx = {
  id: number;
  label: string;
  amountCents: number;
  occurredAt: string;
  categoryLabel: string | null;
  categoryGlyph: string | null;
};

type Category = { id: number; label: string; slug: string; glyph: string };

interface Props {
  primary: RecurringIncome | null;
  gigs: GigTx[];
  categories: Category[];
}

export function IncomeClient({ primary, gigs, categories }: Props) {
  const [editingPrimary, setEditingPrimary] = useState(false);
  const [loggingGig, setLoggingGig] = useState(false);

  const gigTotal = gigs.reduce((s, g) => s + g.amountCents, 0);
  const totalExpected = (primary?.amountCents || 0) + gigTotal;

  return (
    <div className="col fade-up" style={{ gap: "var(--pad-lg)" }}>
      <div className="row-sb">
        <div className="col" style={{ gap: 4 }}>
          <h2 style={{ margin: 0, fontSize: 22, fontWeight: 600, letterSpacing: "-0.02em" }}>Income</h2>
          <div className="muted" style={{ fontSize: 12.5 }}>
            {peso(totalExpected)} this month · {peso(gigTotal)} from gigs
          </div>
        </div>
        <button className="btn btn-primary" onClick={() => setLoggingGig(true)}>
          <Plus size={16} strokeWidth={2.5} /> Log gig
        </button>
      </div>

      <div className="col" style={{ gap: 8 }}>
        <div className="section-title">
          <h3>Primary income</h3>
          {primary && <span className="meta">{primary.cadence}</span>}
        </div>

        {primary ? (
          <div className="card card-pad row-sb">
            <div className="row" style={{ gap: 12 }}>
              <div className="icn" style={{ width: 40, height: 40, borderRadius: 10, background: "var(--pos-soft)", color: "var(--pos)" }}>$</div>
              <div className="col" style={{ gap: 2 }}>
                <div style={{ fontSize: 14, fontWeight: 600 }}>{primary.name}</div>
                <div className="sub">{primary.payer || "—"}</div>
              </div>
            </div>
            <div className="row" style={{ gap: 12 }}>
              <div className="num pos" style={{ fontSize: 22, fontWeight: 600 }}>+{peso(primary.amountCents)}</div>
              <button className="btn btn-ghost" onClick={() => setEditingPrimary(true)} style={{ height: 36, width: 36, padding: 0 }}>
                <Pencil size={14} />
              </button>
            </div>
          </div>
        ) : (
          <div className="card card-pad" style={{ textAlign: "center", padding: "30px 20px" }}>
            <div className="muted" style={{ marginBottom: 14, fontSize: 13.5 }}>No primary income set</div>
            <button className="btn btn-primary" onClick={() => setEditingPrimary(true)}>
              <Plus size={16} strokeWidth={2.5} /> Set up monthly salary
            </button>
          </div>
        )}
      </div>

      <div className="col" style={{ gap: 8 }}>
        <div className="section-title">
          <h3>Gig & one-off income</h3>
          <span className="meta">{gigs.length > 0 ? peso(gigTotal) + " this month" : ""}</span>
        </div>
        {gigs.length === 0 ? (
          <div className="card card-pad" style={{ textAlign: "center", padding: "26px 20px" }}>
            <div className="muted" style={{ fontSize: 13.5 }}>No gig income logged yet</div>
          </div>
        ) : (
          <div className="card">
            {gigs.map((g) => <GigRow key={g.id} gig={g} />)}
          </div>
        )}
      </div>

      {editingPrimary && (
        <PrimaryForm primary={primary} onClose={() => setEditingPrimary(false)} />
      )}
      {loggingGig && (
        <GigForm categories={categories} onClose={() => setLoggingGig(false)} />
      )}
    </div>
  );
}

function GigRow({ gig }: { gig: GigTx }) {
  const [pending, startTransition] = useTransition();
  function handleDelete(e: React.MouseEvent) {
    e.stopPropagation();
    if (!confirm("Remove this gig income entry?")) return;
    startTransition(async () => { await deleteGigIncome(gig.id); });
  }
  return (
    <div className="lrow" style={{ opacity: pending ? 0.5 : 1 }}>
      <div className="icn" style={{ background: "var(--pos-soft)", color: "var(--pos)" }}>{gig.categoryGlyph || "+"}</div>
      <div className="col grow" style={{ minWidth: 0 }}>
        <div className="nm" style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{gig.label}</div>
        <div className="sub">{new Date(gig.occurredAt).toLocaleDateString("en-PH", { month: "short", day: "numeric" })}{gig.categoryLabel ? " · " + gig.categoryLabel : ""}</div>
      </div>
      <div className="row" style={{ gap: 8 }}>
        <span className="num pos" style={{ fontSize: 14, fontWeight: 600 }}>+{peso(gig.amountCents)}</span>
        <button className="btn btn-ghost" onClick={handleDelete} disabled={pending} style={{ height: 32, width: 32, padding: 0, color: "var(--text-faint)" }}>
          <Trash2 size={13} />
        </button>
      </div>
    </div>
  );
}

function PrimaryForm({ primary, onClose }: { primary: RecurringIncome | null; onClose: () => void }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [cadence, setCadence] = useState<string>(primary?.cadence || "bimonthly");

  function submit(fd: FormData) {
    setError(null);
    startTransition(async () => {
      const res = await upsertPrimaryIncome(fd);
      if (!res.ok) setError(res.error);
      else onClose();
    });
  }

  return (
    <div className="modal-scrim" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="card-pad">
          <div className="row-sb" style={{ marginBottom: 14 }}>
            <h3 style={{ margin: 0, fontSize: 15, fontWeight: 600 }}>Primary income</h3>
            <button className="btn btn-ghost" onClick={onClose} style={{ height: 32, padding: "0 12px", fontSize: 12 }}>Cancel</button>
          </div>

          <form action={submit} className="col" style={{ gap: 12 }}>
            <div className="col" style={{ gap: 6 }}>
              <label className="eyebrow">Income name</label>
              <input name="name" defaultValue={primary?.name || "Net Salary"} className="input" required maxLength={80} />
            </div>
            <div className="col" style={{ gap: 6 }}>
              <label className="eyebrow">Payer <span className="faint" style={{ textTransform: "none", letterSpacing: 0 }}>(optional)</span></label>
              <input name="payer" defaultValue={primary?.payer || ""} className="input" placeholder="e.g. Aboitiz Construction" maxLength={80} />
            </div>
            <div className="col" style={{ gap: 6 }}>
              <label className="eyebrow">Total per month (₱)</label>
              <input name="amount" type="number" step="0.01" min="0" defaultValue={primary ? (primary.amountCents / 100).toFixed(2) : ""} className="input num" placeholder="0.00" required />
            </div>
            <div className="col" style={{ gap: 6 }}>
              <label className="eyebrow">Cadence</label>
              <select name="cadence" value={cadence} onChange={(e) => setCadence(e.target.value)} className="input">
                <option value="monthly">Monthly (once)</option>
                <option value="bimonthly">Bimonthly (twice a month)</option>
                <option value="quarterly">Quarterly</option>
              </select>
            </div>
            <div className="row" style={{ gap: 12 }}>
              <div className="col grow" style={{ gap: 6 }}>
                <label className="eyebrow">{cadence === "bimonthly" ? "First payday" : "Payday"}</label>
                <input name="firstDay" type="number" min="1" max="31" defaultValue={primary?.firstDay || 15} className="input num" />
              </div>
              {cadence === "bimonthly" && (
                <div className="col grow" style={{ gap: 6 }}>
                  <label className="eyebrow">Second payday</label>
                  <input name="secondDay" type="number" min="1" max="31" defaultValue={primary?.secondDay || 30} className="input num" />
                </div>
              )}
            </div>

            {error && <div style={{ color: "var(--neg)", fontSize: 12 }}>{error}</div>}

            <button type="submit" disabled={pending} className="btn btn-primary btn-block" style={{ marginTop: 4 }}>
              {pending ? "Saving…" : primary ? "Save changes" : "Set income"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

function GigForm({ categories, onClose }: { categories: Category[]; onClose: () => void }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const today = new Date().toISOString().split("T")[0];

  function submit(fd: FormData) {
    setError(null);
    startTransition(async () => {
      const res = await logGigIncome(fd);
      if (!res.ok) setError(res.error);
      else onClose();
    });
  }

  return (
    <div className="modal-scrim" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="card-pad">
          <div className="row-sb" style={{ marginBottom: 14 }}>
            <h3 style={{ margin: 0, fontSize: 15, fontWeight: 600 }}>Log gig income</h3>
            <button className="btn btn-ghost" onClick={onClose} style={{ height: 32, padding: "0 12px", fontSize: 12 }}>Cancel</button>
          </div>

          <form action={submit} className="col" style={{ gap: 12 }}>
            <div className="col" style={{ gap: 6 }}>
              <label className="eyebrow">What was it?</label>
              <input name="label" className="input" placeholder="e.g. Grab driving — weekend" required maxLength={80} />
            </div>
            <div className="row" style={{ gap: 12 }}>
              <div className="col grow" style={{ gap: 6 }}>
                <label className="eyebrow">Amount (₱)</label>
                <input name="amount" type="number" step="0.01" min="0" className="input num" placeholder="0.00" required />
              </div>
              <div className="col" style={{ gap: 6, width: 140 }}>
                <label className="eyebrow">Date</label>
                <input name="date" type="date" defaultValue={today} className="input num" required />
              </div>
            </div>
            <div className="col" style={{ gap: 6 }}>
              <label className="eyebrow">Category <span className="faint" style={{ textTransform: "none", letterSpacing: 0 }}>(optional)</span></label>
              <select name="categoryId" className="input" defaultValue="">
                <option value="">— None —</option>
                {categories.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
              </select>
            </div>

            {error && <div style={{ color: "var(--neg)", fontSize: 12 }}>{error}</div>}

            <button type="submit" disabled={pending} className="btn btn-primary btn-block" style={{ marginTop: 4 }}>
              {pending ? "Saving…" : "Log income"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
