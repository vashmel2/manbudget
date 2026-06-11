"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

interface Props {
  open: boolean;
  title: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: "default" | "danger";
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  tone = "default",
  onConfirm,
  onCancel,
}: Props) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!open || !mounted) return null;

  const dialog = (
    <div className="modal-scrim" onClick={onCancel}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="card-pad col" style={{ gap: 14 }}>
          <div style={{ fontSize: 16, fontWeight: 600, letterSpacing: "-0.01em" }}>{title}</div>
          {message && (
            <div className="muted" style={{ fontSize: 13.5, lineHeight: 1.5 }}>{message}</div>
          )}
          <div className="row" style={{ gap: 10, marginTop: 4 }}>
            <button onClick={onCancel} className="btn grow">
              {cancelLabel}
            </button>
            <button
              onClick={onConfirm}
              className={"btn grow " + (tone === "danger" ? "" : "btn-primary")}
              style={tone === "danger" ? { background: "var(--neg)", borderColor: "var(--neg)", color: "#1a0606" } : undefined}
            >
              {confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(dialog, document.body);
}
