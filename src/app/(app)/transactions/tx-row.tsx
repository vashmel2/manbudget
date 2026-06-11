"use client";

import Link from "next/link";
import { useTransition } from "react";
import { Pencil, Trash2 } from "lucide-react";
import { deleteTransaction } from "./actions";
import { peso } from "@/lib/peso";

type Tx = {
  id: number;
  label: string;
  amountCents: number;
  note: string | null;
  occurredAt: string;
  categoryLabel: string | null;
  categoryGlyph: string | null;
  addedByUserId: number | null;
  addedByName: string | null;
};

export function TxRow({ tx, role, ownerId }: { tx: Tx; role: "owner" | "helper"; ownerId: number }) {
  const [pending, startTransition] = useTransition();
  const positive = tx.amountCents > 0;
  const isOwner = role === "owner";
  const addedByHelper = tx.addedByUserId != null && tx.addedByUserId !== ownerId;

  function handleDelete(e: React.MouseEvent) {
    e.stopPropagation();
    if (!confirm("Delete this transaction?")) return;
    startTransition(async () => { await deleteTransaction(tx.id); });
  }

  return (
    <div className="lrow" style={{ opacity: pending ? 0.5 : 1 }}>
      <div className="icn" style={{ background: positive ? "var(--pos-soft)" : "var(--surface-2)", color: positive ? "var(--pos)" : "var(--text-dim)" }}>
        {tx.categoryGlyph || (positive ? "+" : "··")}
      </div>
      <div className="col grow" style={{ minWidth: 0 }}>
        <div className="nm" style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{tx.label}</div>
        <div className="sub">
          {new Date(tx.occurredAt).toLocaleDateString("en-PH", { month: "short", day: "numeric" })}
          {tx.categoryLabel ? " · " + tx.categoryLabel : ""}
          {addedByHelper && tx.addedByName ? " · added by " + tx.addedByName : ""}
          {tx.note ? " · " + tx.note : ""}
        </div>
      </div>
      <div className="row" style={{ gap: 6 }}>
        <span className={"num " + (positive ? "pos" : "")} style={{ fontSize: 14, fontWeight: 600 }}>
          {positive ? "+" : "−"}{peso(Math.abs(tx.amountCents))}
        </span>
        {isOwner && (
          <>
            <Link href={`/transactions/${tx.id}/edit`} className="btn btn-ghost" style={{ height: 32, width: 32, padding: 0, color: "var(--text-faint)" }}>
              <Pencil size={13} />
            </Link>
            <button className="btn btn-ghost" onClick={handleDelete} disabled={pending} style={{ height: 32, width: 32, padding: 0, color: "var(--text-faint)" }}>
              <Trash2 size={13} />
            </button>
          </>
        )}
      </div>
    </div>
  );
}
