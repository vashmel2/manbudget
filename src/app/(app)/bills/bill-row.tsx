"use client";

import { useState, useTransition } from "react";
import { Zap } from "lucide-react";
import { togglePaid } from "./actions";
import { peso } from "@/lib/peso";
import { ConfirmDialog } from "@/components/confirm-dialog";
import type { BillWithStatus } from "@/lib/queries";

interface Props {
  bill: BillWithStatus;
  onEdit?: () => void;
}

export function BillRow({ bill, onEdit }: Props) {
  const [pending, startTransition] = useTransition();
  const [confirming, setConfirming] = useState(false);

  function toggle(e: React.MouseEvent) {
    e.stopPropagation();
    setConfirming(true);
  }

  function handleConfirm() {
    setConfirming(false);
    startTransition(async () => {
      await togglePaid(bill.id, bill.cadence);
    });
  }

  return (
    <div className="lrow" onClick={onEdit} style={{ cursor: onEdit ? "pointer" : "default", opacity: pending ? 0.6 : 1 }}>
      <div className="icn">{bill.categoryGlyph || "··"}</div>
      <div className="col grow" style={{ minWidth: 0 }}>
        <div className="nm" style={{ textDecoration: bill.paid ? "line-through" : "none", opacity: bill.paid ? 0.5 : 1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
          {bill.name}
        </div>
        <div className="sub">
          Due day {bill.dueDay}{bill.payee ? " · " + bill.payee : ""}
        </div>
      </div>
      <div className="row" style={{ gap: 12, flex: "none" }}>
        <div className="col" style={{ alignItems: "flex-end", gap: 2 }}>
          <span className="amt" style={{ opacity: bill.paid ? 0.5 : 1 }}>{peso(bill.amountCents)}</span>
          {bill.autoDeduct ? (
            <span className={"tag " + (bill.paid ? "tag-cyan" : "tag-dim")} style={{ height: 17, padding: "0 6px", fontSize: 9 }}>
              {bill.paid ? "AUTO" : "DAY " + bill.dueDay}
            </span>
          ) : (
            <span className={"tag " + (bill.paid ? "tag-pos" : "tag-dim")} style={{ height: 17, padding: "0 6px", fontSize: 9 }}>
              {bill.paid ? "PAID" : "DUE"}
            </span>
          )}
        </div>
        {bill.autoDeduct ? (
          <span style={{ width: 24, height: 24, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--cyan)" }} aria-label="Auto-deducted">
            <Zap size={14} fill="currentColor" strokeWidth={0} />
          </span>
        ) : onEdit ? (
          <button className="chk" data-on={bill.paid} onClick={toggle} disabled={pending} aria-label={bill.paid ? "Mark unpaid" : "Mark paid"}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </button>
        ) : null}
      </div>

      <ConfirmDialog
        open={confirming}
        title={bill.paid ? `Mark ${bill.name} unpaid?` : `Mark ${bill.name} paid?`}
        message={bill.paid
          ? `This removes the paid status for this period. You can re-tick it later.`
          : `This marks ${peso(bill.amountCents)} as paid for ${bill.period}.`}
        confirmLabel={bill.paid ? "Mark unpaid" : "Mark paid"}
        onConfirm={handleConfirm}
        onCancel={() => setConfirming(false)}
      />
    </div>
  );
}
