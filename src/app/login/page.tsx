"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Wordmark } from "@/components/logo";
import { loginWithPin, checkSetupState } from "./actions";

export default function LoginPage() {
  const router = useRouter();
  const [pin, setPin] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [shake, setShake] = useState(false);
  const [needsSetup, setNeedsSetup] = useState<boolean | null>(null);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    checkSetupState().then((s) => setNeedsSetup(s.needsSetup));
  }, []);

  function tryLogin(p: string) {
    startTransition(async () => {
      const res = await loginWithPin(p);
      if (res.ok) {
        router.push("/dashboard");
        router.refresh();
      } else {
        setError(res.error);
        setShake(true);
        setTimeout(() => setShake(false), 400);
        setTimeout(() => { setPin(""); setError(null); }, 600);
      }
    });
  }

  function press(d: string) {
    if (pending) return;
    setError(null);
    setPin((cur) => {
      if (cur.length >= 8) return cur;
      const next = cur + d;
      if (next.length === 4 && needsSetup === false) tryLogin(next);
      return next;
    });
  }
  function backspace() { setPin((c) => c.slice(0, -1)); setError(null); }
  function submit() { if (pin.length >= 4) tryLogin(pin); }

  return (
    <div style={{ minHeight: "100dvh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "24px 18px", maxWidth: 360, margin: "0 auto" }}>
      <div className="col" style={{ alignItems: "center", gap: 14, marginBottom: 28 }}>
        <Wordmark />
        <div className="muted" style={{ fontSize: 12.5, textAlign: "center" }}>
          {needsSetup === null ? "Loading…" : needsSetup ? "Set a 4–8 digit PIN to start" : "Enter PIN to unlock"}
        </div>
      </div>

      <div className={"pindots fade-up " + (shake ? "shake" : "")} style={{ marginBottom: 8 }}>
        {[0, 1, 2, 3].map((i) => (
          <span key={i} className="pd" data-on={i < pin.length} />
        ))}
        {pin.length > 4 && (
          <span style={{ fontSize: 11, color: "var(--text-faint)", marginLeft: 6, alignSelf: "center" }}>+{pin.length - 4}</span>
        )}
      </div>

      <div style={{ height: 22, fontSize: 12, color: "var(--neg)", marginBottom: 12 }}>{error || ""}</div>

      <div className="numpad" style={{ width: "100%", maxWidth: 280 }}>
        {["1","2","3","4","5","6","7","8","9"].map((d) => (
          <button key={d} onClick={() => press(d)} disabled={pending}>{d}</button>
        ))}
        <button onClick={needsSetup ? submit : backspace} disabled={pending} style={{ fontSize: 13 }}>
          {needsSetup ? "OK" : "←"}
        </button>
        <button onClick={() => press("0")} disabled={pending}>0</button>
        <button onClick={backspace} disabled={pending} style={{ fontSize: 18 }}>←</button>
      </div>

      <div className="faint" style={{ fontSize: 10.5, marginTop: 22, textAlign: "center", letterSpacing: "0.06em", textTransform: "uppercase" }}>
        {needsSetup ? "First run · this PIN unlocks your data" : "ManBudget · personal budget"}
      </div>

      <style jsx>{`
        .shake { animation: shake .4s cubic-bezier(.2,.8,.2,1); }
        @keyframes shake { 10%,90%{transform:translateX(-2px)} 20%,80%{transform:translateX(3px)} 30%,50%,70%{transform:translateX(-5px)} 40%,60%{transform:translateX(5px)} }
      `}</style>
    </div>
  );
}
