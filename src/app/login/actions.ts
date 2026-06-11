"use server";

import { db, users } from "@/db";
import { hashPin, verifyPin } from "@/lib/auth";
import { getSession } from "@/lib/session";
import { seedDefaultsForUser } from "@/lib/seed-defaults";
import { requireUserId, requireOwner } from "@/lib/require-user";
import { eq, or } from "drizzle-orm";
import { redirect } from "next/navigation";
import { z } from "zod";

export type LoginResult = { ok: true } | { ok: false; error: string };

export async function loginWithPin(pin: string): Promise<LoginResult> {
  if (!/^\d{4,8}$/.test(pin)) {
    return { ok: false, error: "PIN must be 4–8 digits" };
  }

  const existing = await db.select().from(users);

  if (existing.length === 0) {
    const pinHash = hashPin(pin);
    const [created] = await db
      .insert(users)
      .values({ name: "You", pinHash, role: "owner" })
      .returning();
    await seedDefaultsForUser(created.id);

    const session = await getSession();
    session.userId = created.id;
    session.actualUserId = created.id;
    session.userName = created.name;
    session.role = "owner";
    await session.save();
    return { ok: true };
  }

  // Try the PIN against every user — first match wins
  for (const u of existing) {
    if (verifyPin(pin, u.pinHash)) {
      const session = await getSession();
      const isHelper = u.role === "helper" && u.linkedToUserId != null;
      session.userId = isHelper ? u.linkedToUserId! : u.id;
      session.actualUserId = u.id;
      session.userName = u.name;
      session.role = isHelper ? "helper" : "owner";
      await session.save();
      return { ok: true };
    }
  }

  return { ok: false, error: "Wrong PIN" };
}

export async function logout() {
  const session = await getSession();
  session.destroy();
  redirect("/login");
}

export async function checkSetupState(): Promise<{ needsSetup: boolean }> {
  const existing = await db.select({ id: users.id }).from(users).limit(1);
  return { needsSetup: existing.length === 0 };
}

const memberSchema = z.object({
  name: z.string().trim().min(1, "Name required").max(40),
  pin: z.string().regex(/^\d{4,8}$/, "PIN must be 4–8 digits"),
});

export async function addHouseholdMember(formData: FormData) {
  const ownerId = await requireOwner();
  const parsed = memberSchema.safeParse({
    name: formData.get("name"),
    pin: formData.get("pin"),
  });
  if (!parsed.success) return { ok: false as const, error: parsed.error.issues[0].message };

  const { name, pin } = parsed.data;

  const all = await db.select().from(users);
  for (const u of all) {
    if (verifyPin(pin, u.pinHash)) {
      return { ok: false as const, error: "Someone already uses that PIN. Pick a different one." };
    }
  }

  const [created] = await db
    .insert(users)
    .values({ name, pinHash: hashPin(pin), role: "helper", linkedToUserId: ownerId })
    .returning();

  return { ok: true as const, userId: created.id };
}

export async function listMembers() {
  const ownerId = await requireUserId();
  return db
    .select({ id: users.id, name: users.name, role: users.role, linkedToUserId: users.linkedToUserId })
    .from(users)
    .where(or(eq(users.id, ownerId), eq(users.linkedToUserId, ownerId)))
    .orderBy(users.id);
}

export async function removeMember(id: number) {
  const ownerId = await requireOwner();
  if (ownerId === id) return { ok: false as const, error: "Can't remove the account owner." };
  await db.delete(users).where(eq(users.id, id));
  return { ok: true as const };
}
