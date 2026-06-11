import Link from "next/link";
import { Tags, ChevronRight, Download } from "lucide-react";
import { getSession } from "@/lib/session";
import { logout } from "@/app/login/actions";

export default async function SettingsPage() {
  const session = await getSession();
  return (
    <div className="col fade-up" style={{ gap: "var(--pad-lg)" }}>
      <div className="col" style={{ gap: 4 }}>
        <h2 style={{ margin: 0, fontSize: 22, fontWeight: 600, letterSpacing: "-0.02em" }}>Settings</h2>
        <div className="muted" style={{ fontSize: 12.5 }}>Signed in as {session.userName}</div>
      </div>

      <div className="card">
        <Link href="/settings/categories" className="lrow" style={{ cursor: "pointer", textDecoration: "none", color: "inherit" }}>
          <div className="icn"><Tags size={16} /></div>
          <div className="col grow" style={{ minWidth: 0 }}>
            <div className="nm">Categories</div>
            <div className="sub">Add, rename, reorder, archive</div>
          </div>
          <ChevronRight size={16} style={{ color: "var(--text-faint)" }} />
        </Link>
      </div>

      <div className="card card-pad col" style={{ gap: 12 }}>
        <div className="section-title"><h3>Account</h3></div>
        <div className="row-sb">
          <div className="col" style={{ gap: 2 }}>
            <span style={{ fontSize: 13.5, fontWeight: 500 }}>Sign out</span>
            <span className="sub">Locks the app. PIN required to come back in.</span>
          </div>
          <form action={logout}>
            <button type="submit" className="btn btn-ghost">Lock</button>
          </form>
        </div>
      </div>

      <div className="card card-pad col" style={{ gap: 12 }}>
        <div className="section-title"><h3>Export data</h3></div>
        <div className="muted" style={{ fontSize: 12, marginBottom: 4 }}>
          Download your data as CSV — backup, open in Excel, or move to another app.
        </div>
        <div className="row" style={{ gap: 10, flexWrap: "wrap" }}>
          <a href="/api/export/transactions" download className="btn btn-ghost">
            <Download size={14} /> Transactions CSV
          </a>
          <a href="/api/export/bills" download className="btn btn-ghost">
            <Download size={14} /> Bills CSV
          </a>
        </div>
      </div>

      <div className="card card-pad" style={{ textAlign: "center", padding: "26px 20px" }}>
        <div className="muted" style={{ fontSize: 12.5 }}>
          PIN change and theme switching coming soon.
        </div>
      </div>
    </div>
  );
}
