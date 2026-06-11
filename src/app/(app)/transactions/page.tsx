import Link from "next/link";
import { Plus } from "lucide-react";
import { requireUserId } from "@/lib/require-user";
import { getRecentTransactions } from "@/lib/queries";
import { peso } from "@/lib/peso";
import { TxRow } from "./tx-row";

export default async function TransactionsPage() {
  const userId = await requireUserId();
  const txs = await getRecentTransactions(userId, 100);

  const totalIn = txs.filter((t) => t.amountCents > 0).reduce((s, t) => s + t.amountCents, 0);
  const totalOut = txs.filter((t) => t.amountCents < 0).reduce((s, t) => s + Math.abs(t.amountCents), 0);

  return (
    <div className="col fade-up" style={{ gap: "var(--pad-lg)" }}>
      <div className="row-sb">
        <div className="col" style={{ gap: 4 }}>
          <h2 style={{ margin: 0, fontSize: 22, fontWeight: 600, letterSpacing: "-0.02em" }}>Transactions</h2>
          <div className="muted" style={{ fontSize: 12.5 }}>
            Last {txs.length} · in {peso(totalIn)} · out {peso(totalOut)}
          </div>
        </div>
        <Link href="/transactions/new" className="btn btn-primary">
          <Plus size={16} strokeWidth={2.5} /> Add
        </Link>
      </div>

      {txs.length === 0 ? (
        <div className="card card-pad" style={{ textAlign: "center", padding: "40px 20px" }}>
          <div className="muted" style={{ marginBottom: 14, fontSize: 13.5 }}>No transactions yet</div>
          <Link href="/transactions/new" className="btn btn-primary">
            <Plus size={16} strokeWidth={2.5} /> Add your first transaction
          </Link>
        </div>
      ) : (
        <div className="card">
          {txs.map((t) => <TxRow key={t.id} tx={t} />)}
        </div>
      )}
    </div>
  );
}
