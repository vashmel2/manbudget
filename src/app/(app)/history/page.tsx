import { LineChart } from "lucide-react";

export default function HistoryPage() {
  return (
    <div className="col fade-up" style={{ gap: "var(--pad-lg)" }}>
      <div className="col" style={{ gap: 4 }}>
        <h2 style={{ margin: 0, fontSize: 22, fontWeight: 600, letterSpacing: "-0.02em" }}>History</h2>
        <div className="muted" style={{ fontSize: 12.5 }}>Month-over-month trends and category drift</div>
      </div>
      <div className="card card-pad" style={{ textAlign: "center", padding: "48px 24px" }}>
        <LineChart size={32} style={{ color: "var(--text-faint)", marginBottom: 14 }} />
        <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 6 }}>Not enough data yet</div>
        <div className="muted" style={{ fontSize: 12.5, maxWidth: 360, margin: "0 auto" }}>
          History needs at least one closed month to start showing trends. Charts will turn on automatically once you have transactions from a previous month.
        </div>
      </div>
    </div>
  );
}
