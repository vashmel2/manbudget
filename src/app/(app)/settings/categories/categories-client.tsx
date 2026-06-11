"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { ArrowLeft, ArrowUp, ArrowDown, Pencil, Archive, ArchiveRestore, Plus } from "lucide-react";
import { peso } from "@/lib/peso";
import { archiveCategory, createCategory, moveCategory, unarchiveCategory, updateCategory } from "./actions";

type Row = {
  id: number;
  label: string;
  glyph: string;
  color: string | null;
  archived: boolean;
  budgetCents: number;
};

export function CategoriesClient({ categories }: { categories: Row[] }) {
  const active = categories.filter((c) => !c.archived);
  const archived = categories.filter((c) => c.archived);
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<Row | null>(null);
  const [showArchived, setShowArchived] = useState(false);

  return (
    <div className="col fade-up" style={{ gap: "var(--pad-lg)" }}>
      <div className="row-sb">
        <div className="col" style={{ gap: 4 }}>
          <div className="row" style={{ gap: 8 }}>
            <Link href="/settings" className="btn btn-ghost" style={{ height: 28, padding: "0 8px", fontSize: 11 }}>
              <ArrowLeft size={12} /> Settings
            </Link>
          </div>
          <h2 style={{ margin: 0, fontSize: 22, fontWeight: 600, letterSpacing: "-0.02em" }}>Categories</h2>
          <div className="muted" style={{ fontSize: 12.5 }}>
            {active.length} active{archived.length > 0 ? ` · ${archived.length} archived` : ""}
          </div>
        </div>
        <button className="btn btn-primary" onClick={() => setCreating(true)}>
          <Plus size={16} strokeWidth={2.5} /> New category
        </button>
      </div>

      <div className="card">
        {active.length === 0 ? (
          <div className="card-pad" style={{ textAlign: "center", padding: "32px 20px" }}>
            <div className="muted" style={{ fontSize: 13.5, marginBottom: 12 }}>No active categories</div>
            <button className="btn btn-primary" onClick={() => setCreating(true)}>
              <Plus size={14} strokeWidth={2.5} /> Add one
            </button>
          </div>
        ) : (
          active.map((c, i) => (
            <CategoryRow
              key={c.id}
              cat={c}
              isFirst={i === 0}
              isLast={i === active.length - 1}
              onEdit={() => setEditing(c)}
            />
          ))
        )}
      </div>

      {archived.length > 0 && (
        <div className="col" style={{ gap: 8 }}>
          <button
            className="btn btn-ghost"
            onClick={() => setShowArchived(!showArchived)}
            style={{ alignSelf: "flex-start", height: 32, fontSize: 12 }}
          >
            {showArchived ? "Hide" : "Show"} archived ({archived.length})
          </button>
          {showArchived && (
            <div className="card">
              {archived.map((c) => (
                <ArchivedRow key={c.id} cat={c} />
              ))}
            </div>
          )}
        </div>
      )}

      {(creating || editing) && (
        <CategoryForm
          editing={editing}
          onClose={() => {
            setCreating(false);
            setEditing(null);
          }}
        />
      )}
    </div>
  );
}

function CategoryRow({
  cat,
  isFirst,
  isLast,
  onEdit,
}: {
  cat: Row;
  isFirst: boolean;
  isLast: boolean;
  onEdit: () => void;
}) {
  const [pending, startTransition] = useTransition();

  function move(direction: "up" | "down") {
    startTransition(async () => {
      await moveCategory(cat.id, direction);
    });
  }

  function handleArchive() {
    if (!confirm(`Archive "${cat.label}"? Past transactions keep their link. New ones won't see it.`)) return;
    startTransition(async () => {
      await archiveCategory(cat.id);
    });
  }

  return (
    <div className="lrow" style={{ opacity: pending ? 0.5 : 1 }}>
      <div className="icn">{cat.glyph}</div>
      <div className="col grow" style={{ minWidth: 0 }}>
        <div className="nm">{cat.label}</div>
        <div className="sub">{cat.budgetCents > 0 ? `Budget ${peso(cat.budgetCents)}/mo` : "No budget set"}</div>
      </div>
      <div className="row" style={{ gap: 4, flex: "none" }}>
        <button
          className="btn btn-ghost"
          onClick={() => move("up")}
          disabled={pending || isFirst}
          style={{ height: 32, width: 32, padding: 0, opacity: isFirst ? 0.3 : 1 }}
          aria-label="Move up"
        >
          <ArrowUp size={13} />
        </button>
        <button
          className="btn btn-ghost"
          onClick={() => move("down")}
          disabled={pending || isLast}
          style={{ height: 32, width: 32, padding: 0, opacity: isLast ? 0.3 : 1 }}
          aria-label="Move down"
        >
          <ArrowDown size={13} />
        </button>
        <button
          className="btn btn-ghost"
          onClick={onEdit}
          disabled={pending}
          style={{ height: 32, width: 32, padding: 0 }}
          aria-label="Edit"
        >
          <Pencil size={13} />
        </button>
        <button
          className="btn btn-ghost"
          onClick={handleArchive}
          disabled={pending}
          style={{ height: 32, width: 32, padding: 0, color: "var(--text-faint)" }}
          aria-label="Archive"
        >
          <Archive size={13} />
        </button>
      </div>
    </div>
  );
}

function ArchivedRow({ cat }: { cat: Row }) {
  const [pending, startTransition] = useTransition();
  function restore() {
    startTransition(async () => {
      await unarchiveCategory(cat.id);
    });
  }
  return (
    <div className="lrow" style={{ opacity: pending ? 0.4 : 0.65 }}>
      <div className="icn">{cat.glyph}</div>
      <div className="col grow" style={{ minWidth: 0 }}>
        <div className="nm" style={{ textDecoration: "line-through" }}>{cat.label}</div>
        <div className="sub">Archived</div>
      </div>
      <button className="btn btn-ghost" onClick={restore} disabled={pending} style={{ height: 32, fontSize: 12 }}>
        <ArchiveRestore size={13} /> Restore
      </button>
    </div>
  );
}

function CategoryForm({ editing, onClose }: { editing: Row | null; onClose: () => void }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function submit(fd: FormData) {
    setError(null);
    startTransition(async () => {
      const res = editing ? await updateCategory(editing.id, fd) : await createCategory(fd);
      if (!res.ok) setError(res.error);
      else onClose();
    });
  }

  return (
    <div className="modal-scrim" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="card-pad">
          <div className="row-sb" style={{ marginBottom: 14 }}>
            <h3 style={{ margin: 0, fontSize: 15, fontWeight: 600 }}>
              {editing ? "Edit category" : "New category"}
            </h3>
            <button
              className="btn btn-ghost"
              onClick={onClose}
              style={{ height: 32, padding: "0 12px", fontSize: 12 }}
            >
              Cancel
            </button>
          </div>

          <form action={submit} className="col" style={{ gap: 12 }}>
            <div className="col" style={{ gap: 6 }}>
              <label className="eyebrow">Name</label>
              <input
                name="label"
                defaultValue={editing?.label || ""}
                className="input"
                placeholder="e.g. Pets, Subscriptions"
                required
                maxLength={40}
                autoFocus
              />
            </div>

            <div className="row" style={{ gap: 12 }}>
              <div className="col" style={{ gap: 6, width: 110 }}>
                <label className="eyebrow">Glyph</label>
                <input
                  name="glyph"
                  defaultValue={editing?.glyph || ""}
                  className="input num"
                  placeholder="PT"
                  maxLength={4}
                  style={{ textAlign: "center", textTransform: "uppercase" }}
                />
              </div>
              <div className="col grow" style={{ gap: 6 }}>
                <label className="eyebrow">
                  Monthly budget (₱){" "}
                  <span className="faint" style={{ textTransform: "none", letterSpacing: 0 }}>(optional)</span>
                </label>
                <input
                  name="budget"
                  type="number"
                  step="0.01"
                  min="0"
                  defaultValue={editing ? (editing.budgetCents / 100).toFixed(0) : ""}
                  className="input num"
                  placeholder="0"
                />
              </div>
            </div>

            <div className="muted" style={{ fontSize: 11.5 }}>
              Glyph is the 1–4 character tag shown in lists (e.g. RC, TX, PT). Leave blank for default ··.
            </div>

            {error && <div style={{ color: "var(--neg)", fontSize: 12 }}>{error}</div>}

            <button
              type="submit"
              disabled={pending}
              className="btn btn-primary btn-block"
              style={{ marginTop: 4 }}
            >
              {pending ? "Saving…" : editing ? "Save changes" : "Create category"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
