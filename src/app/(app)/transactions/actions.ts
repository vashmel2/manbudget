"use server";

import { db, transactions } from "@/db";
import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireUserId } from "@/lib/require-user";

const txSchema = z.object({
  label: z.string().trim().min(1, "Label required").max(80),
  amount: z.coerce.number().positive("Amount must be > 0"),
  type: z.enum(["expense", "income"]),
  categoryId: z.coerce.number().int().optional().nullable(),
  note: z.string().trim().max(280).optional().nullable(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date"),
});

export async function createTransaction(formData: FormData): Promise<{ ok: false; error: string } | never> {
  const userId = await requireUserId();
  const parsed = txSchema.safeParse({
    label: formData.get("label"),
    amount: formData.get("amount"),
    type: formData.get("type"),
    categoryId: formData.get("categoryId") || null,
    note: formData.get("note") || null,
    date: formData.get("date"),
  });
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };

  const d = parsed.data;
  const cents = Math.round(d.amount * 100) * (d.type === "expense" ? -1 : 1);

  await db.insert(transactions).values({
    userId,
    label: d.label,
    amountCents: cents,
    categoryId: d.categoryId || null,
    note: d.note || null,
    occurredAt: d.date,
  });

  revalidatePath("/dashboard");
  revalidatePath("/transactions");
  revalidatePath("/income");
  redirect("/transactions");
}

export async function deleteTransaction(id: number) {
  const userId = await requireUserId();
  await db.delete(transactions).where(and(eq(transactions.id, id), eq(transactions.userId, userId)));
  revalidatePath("/dashboard");
  revalidatePath("/transactions");
  revalidatePath("/income");
  return { ok: true as const };
}

export async function updateTransaction(id: number, formData: FormData): Promise<{ ok: false; error: string } | never> {
  const userId = await requireUserId();
  const parsed = txSchema.safeParse({
    label: formData.get("label"),
    amount: formData.get("amount"),
    type: formData.get("type"),
    categoryId: formData.get("categoryId") || null,
    note: formData.get("note") || null,
    date: formData.get("date"),
  });
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };

  const d = parsed.data;
  const cents = Math.round(d.amount * 100) * (d.type === "expense" ? -1 : 1);

  await db
    .update(transactions)
    .set({
      label: d.label,
      amountCents: cents,
      categoryId: d.categoryId || null,
      note: d.note || null,
      occurredAt: d.date,
    })
    .where(and(eq(transactions.id, id), eq(transactions.userId, userId)));

  revalidatePath("/dashboard");
  revalidatePath("/transactions");
  revalidatePath("/income");
  redirect("/transactions");
}
