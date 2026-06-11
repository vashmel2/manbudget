import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { requireUserId } from "@/lib/require-user";
import { listMembers } from "@/app/login/actions";
import { MembersClient } from "./members-client";

export default async function MembersPage() {
  const currentId = await requireUserId();
  const members = await listMembers();
  return (
    <div className="col fade-up" style={{ gap: "var(--pad-lg)" }}>
      <div className="row" style={{ gap: 8 }}>
        <Link href="/settings" className="btn btn-ghost" style={{ height: 28, padding: "0 8px", fontSize: 11 }}>
          <ArrowLeft size={12} /> Settings
        </Link>
      </div>
      <div className="col" style={{ gap: 4 }}>
        <h2 style={{ margin: 0, fontSize: 22, fontWeight: 600, letterSpacing: "-0.02em" }}>Household members</h2>
        <div className="muted" style={{ fontSize: 12.5 }}>
          Each member has their own PIN and their own private data — bills, transactions, budgets, savings.
        </div>
      </div>
      <MembersClient currentId={currentId} initialMembers={members} />
    </div>
  );
}
