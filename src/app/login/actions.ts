"use server";

import { db, users } from "@/db";
import { hashPin, verifyPin } from "@/lib/auth";
import { getSession } from "@/lib/session";
import { seedDefaultsForUser } from "@/lib/seed-defaults";
import { redirect } from "next/navigation";

export type LoginResult = { ok: true } | { ok: false; error: string };

export async function loginWithPin(pin: string): Promise<LoginResult> {
  if (!/^\d{4,8}$/.test(pin)) {
    return { ok: false, error: "PIN must be 4–8 digits" };
  }

  const existing = await db.select().from(users).limit(1);

  if (existing.length === 0) {
    const pinHash = hashPin(pin);
    const [created] = await db
      .insert(users)
      .values({ name: "You", pinHash })
      .returning();
    await seedDefaultsForUser(created.id);

    const session = await getSession();
    session.userId = created.id;
    session.userName = created.name;
    await session.save();
    return { ok: true };
  }

  const user = existing[0];
  if (!verifyPin(pin, user.pinHash)) {
    return { ok: false, error: "Wrong PIN" };
  }

  const session = await getSession();
  session.userId = user.id;
  session.userName = user.name;
  await session.save();
  return { ok: true };
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
