"use server";

import { db, savingsGoals, savingsContributions } from "@/db";
import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireUserId } from "@/lib/require-user";

const goalSchema = z.object({
  name: z.string().trim().min(1).max(80),
  target: z.coerce.number().positive(),
  targetDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable(),
});

export async function upsertGoal(formData: FormData) {
  const userId = await requireUserId();
  const parsed = goalSchema.safeParse({
    name: formData.get("name"),
    target: formData.get("target"),
    targetDate: formData.get("targetDate") || null,
  });
  if (!parsed.success) return { ok: false as const, error: parsed.error.issues[0].message };

  const d = parsed.data;
  const [existing] = await db
    .select()
    .from(savingsGoals)
    .where(and(eq(savingsGoals.userId, userId), eq(savingsGoals.active, true)))
    .limit(1);

  const values = {
    userId,
    name: d.name,
    targetCents: Math.round(d.target * 100),
    targetDate: d.targetDate || null,
    active: true,
  };

  if (existing) {
    await db.update(savingsGoals).set(values).where(eq(savingsGoals.id, existing.id));
  } else {
    await db.insert(savingsGoals).values(values);
  }
  revalidatePath("/savings");
  revalidatePath("/dashboard");
  return { ok: true as const };
}

const contribSchema = z.object({
  goalId: z.coerce.number().int().positive(),
  amount: z.coerce.number().positive(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  label: z.string().trim().max(80).optional().nullable(),
});

export async function addContribution(formData: FormData) {
  await requireUserId();
  const parsed = contribSchema.safeParse({
    goalId: formData.get("goalId"),
    amount: formData.get("amount"),
    date: formData.get("date"),
    label: formData.get("label") || null,
  });
  if (!parsed.success) return { ok: false as const, error: parsed.error.issues[0].message };

  const d = parsed.data;
  await db.insert(savingsContributions).values({
    goalId: d.goalId,
    amountCents: Math.round(d.amount * 100),
    occurredAt: d.date,
    label: d.label || null,
  });
  revalidatePath("/savings");
  revalidatePath("/dashboard");
  return { ok: true as const };
}

export async function deleteContribution(id: number) {
  await requireUserId();
  await db.delete(savingsContributions).where(eq(savingsContributions.id, id));
  revalidatePath("/savings");
  revalidatePath("/dashboard");
  return { ok: true as const };
}
