"use client";

import { useState, useTransition } from "react";
import { Plus, Trash2 } from "lucide-react";
import { addHouseholdMember, removeMember } from "@/app/login/actions";

type Member = { id: number; name: string };

export function MembersClient({ currentId, initialMembers }: { currentId: number; initialMembers: Member[] }) {
  const [members, setMembers] = useState<Member[]>(initialMembers);
  const [adding, setAdding] = useState(false);

  return (
    <>
      <div className="card">
        {members.map((m) => (
          <MemberRow key={m.id} member={m} isCurrent={m.id === currentId} onRemoved={() => setMembers((cur) => cur.filter((x) => x.id !== m.id))} />
        ))}
      </div>

      <button className="btn btn-primary" onClick={() => setAdding(true)}>
        <Plus size={16} strokeWidth={2.5} /> Add a household member
      </button>

      {adding && (
        <AddMemberModal
          onClose={() => setAdding(false)}
          onAdded={(m) => { setMembers((cur) => [...cur, m]); setAdding(false); }}
        />
      )}
    </>
  );
}

function MemberRow({ member, isCurrent, onRemoved }: { member: Member; isCurrent: boolean; onRemoved: () => void }) {
  const [pending, startTransition] = useTransition();
  function handleRemove() {
    if (!confirm(`Remove "${member.name}"? Their bills, transactions, and savings will also be deleted.`)) return;
    startTransition(async () => {
      const res = await removeMember(member.id);
      if (res.ok) onRemoved();
      else alert(res.error);
    });
  }
  return (
    <div className="lrow" style={{ opacity: pending ? 0.5 : 1 }}>
      <div className="icn">{member.name.slice(0, 2).toUpperCase()}</div>
      <div className="col grow" style={{ minWidth: 0 }}>
        <div className="nm">{member.name}</div>
        <div className="sub">{isCurrent ? "Currently signed in" : "Signs in with their own PIN"}</div>
      </div>
      {!isCurrent && (
        <button className="btn btn-ghost" onClick={handleRemove} disabled={pending} style={{ height: 36, width: 36, padding: 0, color: "var(--text-faint)" }}>
          <Trash2 size={14} />
        </button>
      )}
    </div>
  );
}

function AddMemberModal({ onClose, onAdded }: { onClose: () => void; onAdded: (m: Member) => void }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [pin, setPin] = useState("");

  function submit(fd: FormData) {
    setError(null);
    startTransition(async () => {
      const res = await addHouseholdMember(fd);
      if (!res.ok) setError(res.error);
      else onAdded({ id: res.userId, name });
    });
  }

  return (
    <div className="modal-scrim" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="card-pad">
          <div className="row-sb" style={{ marginBottom: 14 }}>
            <h3 style={{ margin: 0, fontSize: 15, fontWeight: 600 }}>Add household member</h3>
            <button className="btn btn-ghost" onClick={onClose} style={{ height: 32, padding: "0 12px", fontSize: 12 }}>Cancel</button>
          </div>

          <form action={submit} className="col" style={{ gap: 12 }}>
            <div className="col" style={{ gap: 6 }}>
              <label className="eyebrow">Name</label>
              <input
                name="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="input"
                placeholder="e.g. Marimel"
                required
                maxLength={40}
                autoFocus
              />
            </div>
            <div className="col" style={{ gap: 6 }}>
              <label className="eyebrow">PIN (4–8 digits)</label>
              <input
                name="pin"
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 8))}
                className="input num"
                placeholder="••••"
                required
                inputMode="numeric"
                pattern="\d{4,8}"
                maxLength={8}
              />
              <div className="faint" style={{ fontSize: 11 }}>
                Must be different from any existing member's PIN. They'll use this to sign in.
              </div>
            </div>

            {error && <div style={{ color: "var(--neg)", fontSize: 12 }}>{error}</div>}

            <button type="submit" disabled={pending} className="btn btn-primary btn-block" style={{ marginTop: 4 }}>
              {pending ? "Adding…" : "Add member"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
