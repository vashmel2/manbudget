"use server";

import { db, budgets, bills } from "@/db";
import { and, eq, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireOwner } from "@/lib/require-user";

const schema = z.object({
  categoryId: z.coerce.number().int().positive(),
  amount: z.coerce.number().min(0),
});

export async function setBudget(formData: FormData) {
  const userId = await requireOwner();
  const parsed = schema.safeParse({
    categoryId: formData.get("categoryId"),
    amount: formData.get("amount"),
  });
  if (!parsed.success) return { ok: false as const, error: parsed.error.issues[0].message };

  const { categoryId, amount } = parsed.data;
  const cents = Math.round(amount * 100);

  const [existing] = await db
    .select()
    .from(budgets)
    .where(and(eq(budgets.userId, userId), eq(budgets.categoryId, categoryId)))
    .limit(1);

  if (existing) {
    await db.update(budgets).set({ amountCents: cents }).where(eq(budgets.id, existing.id));
  } else {
    await db.insert(budgets).values({ userId, categoryId, amountCents: cents });
  }
  revalidatePath("/budgets");
  revalidatePath("/dashboard");
  return { ok: true as const };
}

export async function syncBudgetsToBills() {
  const userId = await requireOwner();

  const billTotals = await db
    .select({
      categoryId: bills.categoryId,
      total: sql<number>`COALESCE(SUM(
        CASE
          WHEN ${bills.cadence} = 'yearly' THEN ${bills.amountCents} / 12
          WHEN ${bills.cadence} = 'semiannual' THEN ${bills.amountCents} / 6
          WHEN ${bills.cadence} = 'quarterly' THEN ${bills.amountCents} / 3
          ELSE ${bills.amountCents}
        END
      ), 0)::int`,
    })
    .from(bills)
    .where(and(eq(bills.userId, userId), eq(bills.active, true), sql`${bills.categoryId} IS NOT NULL`))
    .groupBy(bills.categoryId);

  let updated = 0;
  for (const r of billTotals) {
    if (r.categoryId == null || r.total <= 0) continue;

    const [existing] = await db
      .select()
      .from(budgets)
      .where(and(eq(budgets.userId, userId), eq(budgets.categoryId, r.categoryId)))
      .limit(1);

    if (existing) {
      await db.update(budgets).set({ amountCents: r.total }).where(eq(budgets.id, existing.id));
    } else {
      await db.insert(budgets).values({ userId, categoryId: r.categoryId, amountCents: r.total });
    }
    updated++;
  }

  revalidatePath("/budgets");
  revalidatePath("/dashboard");
  return { ok: true as const, updated };
}
