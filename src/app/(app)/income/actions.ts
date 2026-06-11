"use server";

import { db, recurringIncome, transactions } from "@/db";
import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireOwner } from "@/lib/require-user";

const salarySchema = z.object({
  name: z.string().trim().min(1).max(80),
  payer: z.string().trim().max(80).optional().nullable(),
  amount: z.coerce.number().positive(),
  cadence: z.enum(["monthly", "bimonthly", "quarterly"]),
  firstDay: z.coerce.number().int().min(1).max(31).optional().nullable(),
  secondDay: z.coerce.number().int().min(1).max(31).optional().nullable(),
});

export async function upsertPrimaryIncome(formData: FormData) {
  const userId = await requireOwner();
  const parsed = salarySchema.safeParse({
    name: formData.get("name"),
    payer: formData.get("payer") || null,
    amount: formData.get("amount"),
    cadence: formData.get("cadence"),
    firstDay: formData.get("firstDay") || null,
    secondDay: formData.get("secondDay") || null,
  });
  if (!parsed.success) return { ok: false as const, error: parsed.error.issues[0].message };

  const d = parsed.data;
  const [existing] = await db
    .select()
    .from(recurringIncome)
    .where(and(eq(recurringIncome.userId, userId), eq(recurringIncome.active, true)))
    .limit(1);

  const values = {
    userId,
    name: d.name,
    payer: d.payer || null,
    amountCents: Math.round(d.amount * 100),
    cadence: d.cadence,
    firstDay: d.firstDay || null,
    secondDay: d.cadence === "bimonthly" ? d.secondDay || null : null,
    active: true,
  };

  if (existing) {
    await db.update(recurringIncome).set(values).where(eq(recurringIncome.id, existing.id));
  } else {
    await db.insert(recurringIncome).values(values);
  }
  revalidatePath("/income");
  revalidatePath("/dashboard");
  return { ok: true as const };
}

const gigSchema = z.object({
  label: z.string().trim().min(1).max(80),
  amount: z.coerce.number().positive(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  categoryId: z.coerce.number().int().optional().nullable(),
});

export async function logGigIncome(formData: FormData) {
  const userId = await requireOwner();
  const parsed = gigSchema.safeParse({
    label: formData.get("label"),
    amount: formData.get("amount"),
    date: formData.get("date"),
    categoryId: formData.get("categoryId") || null,
  });
  if (!parsed.success) return { ok: false as const, error: parsed.error.issues[0].message };

  const d = parsed.data;
  await db.insert(transactions).values({
    userId,
    label: d.label,
    amountCents: Math.round(d.amount * 100),
    categoryId: d.categoryId || null,
    occurredAt: d.date,
  });
  revalidatePath("/income");
  revalidatePath("/dashboard");
  revalidatePath("/transactions");
  return { ok: true as const };
}

export async function deleteGigIncome(id: number) {
  const userId = await requireOwner();
  await db.delete(transactions).where(and(eq(transactions.id, id), eq(transactions.userId, userId)));
  revalidatePath("/income");
  revalidatePath("/dashboard");
  revalidatePath("/transactions");
  return { ok: true as const };
}
