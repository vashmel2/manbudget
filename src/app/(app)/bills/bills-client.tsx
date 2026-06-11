"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { BillForm } from "./bill-form";
import { BillRow } from "./bill-row";
import { peso, pesoK } from "@/lib/peso";
import type { BillWithStatus } from "@/lib/queries";

type Category = { id: number; label: string; slug: string; glyph: string };

interface Props {
  bills: BillWithStatus[];
  categories: Category[];
}

export function BillsClient({ bills, categories }: Props) {
  const [editing, setEditing] = useState<BillWithStatus | null>(null);
  const [creating, setCreating] = useState(false);

  const monthly = bills.filter((b) => b.cadence === "monthly" || b.cadence === "bimonthly");
  const quarterly = bills.filter((b) => b.cadence === "quarterly");
  const semiannual = bills.filter((b) => b.cadence === "semiannual");
  const yearly = bills.filter((b) => b.cadence === "yearly");

  const paidCount = bills.filter((b) => b.paid).length;
  const remainingCents = bills.filter((b) => !b.paid).reduce((s, b) => s + b.amountCents, 0);
  const paidCents = bills.filter((b) => b.paid).reduce((s, b) => s + b.amountCents, 0);

  return (
    <div className="col fade-up" style={{ gap: "var(--pad-lg)" }}>
      <div className="row-sb">
        <div className="col" style={{ gap: 4 }}>
          <h2 style={{ margin: 0, fontSize: 22, fontWeight: 600, letterSpacing: "-0.02em" }}>Bills</h2>
          <div className="muted" style={{ fontSize: 12.5 }}>
            {paidCount} of {bills.length} paid · {peso(remainingCents)} remaining
          </div>
        </div>
        <button className="btn btn-primary" onClick={() => setCreating(true)}>
          <Plus size={16} strokeWidth={2.5} /> New bill
        </button>
      </div>

      {bills.length > 0 && (
        <div className="row" style={{ gap: "var(--gap)" }}>
          <div className="stat grow">
            <span className="tick" style={{ background: "var(--pos)" }} />
            <span className="label"><span className="dot" style={{ background: "var(--pos)" }} /><span className="label-txt">Paid</span></span>
            <span className="value pos">{pesoK(paidCents)}</span>
            <span className="sub">{paidCount} bills</span>
          </div>
          <div className="stat grow">
            <span className="tick" style={{ background: "var(--warn)" }} />
            <span className="label"><span className="dot" style={{ background: "var(--warn)" }} /><span className="label-txt">Unpaid</span></span>
            <span className="value warn">{pesoK(remainingCents)}</span>
            <span className="sub">{bills.length - paidCount} bills</span>
          </div>
        </div>
      )}

      {bills.length === 0 ? (
        <div className="card card-pad" style={{ textAlign: "center", padding: "40px 20px" }}>
          <div className="muted" style={{ marginBottom: 14, fontSize: 13.5 }}>No bills yet</div>
          <button className="btn btn-primary" onClick={() => setCreating(true)}>
            <Plus size={16} strokeWidth={2.5} /> Add your first bill
          </button>
        </div>
      ) : (
        <>
          {monthly.length > 0 && (
            <div className="col" style={{ gap: 8 }}>
              <div className="section-title"><h3>Monthly</h3><span className="meta">{monthly.length} bills</span></div>
              <div className="card">
                {monthly.map((b) => <BillRow key={b.id} bill={b} onEdit={() => setEditing(b)} />)}
              </div>
            </div>
          )}

          {quarterly.length > 0 && (
            <div className="col" style={{ gap: 8 }}>
              <div className="section-title"><h3>Quarterly</h3><span className="meta">{quarterly.length} bills</span></div>
              <div className="card">
                {quarterly.map((b) => <BillRow key={b.id} bill={b} onEdit={() => setEditing(b)} />)}
              </div>
            </div>
          )}

          {semiannual.length > 0 && (
            <div className="col" style={{ gap: 8 }}>
              <div className="section-title"><h3>Semiannual</h3><span className="meta">{semiannual.length} bills</span></div>
              <div className="card">
                {semiannual.map((b) => <BillRow key={b.id} bill={b} onEdit={() => setEditing(b)} />)}
              </div>
            </div>
          )}

          {yearly.length > 0 && (
            <div className="col" style={{ gap: 8 }}>
              <div className="section-title"><h3>Yearly</h3><span className="meta">{yearly.length} bills</span></div>
              <div className="card">
                {yearly.map((b) => <BillRow key={b.id} bill={b} onEdit={() => setEditing(b)} />)}
              </div>
            </div>
          )}
        </>
      )}

      <BillForm open={creating || !!editing} onClose={() => { setCreating(false); setEditing(null); }} categories={categories} editing={editing} />
    </div>
  );
}
