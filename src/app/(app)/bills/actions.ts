"use server";

import { db, bills, billPayments } from "@/db";
import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireOwner } from "@/lib/require-user";
import { currentPeriod, currentQuarter, currentYear, currentHalf } from "@/lib/utils";

const billSchema = z.object({
  name: z.string().trim().min(1, "Name required").max(80),
  payee: z.string().trim().max(80).optional().nullable(),
  amount: z.coerce.number().positive("Amount must be > 0"),
  dueDay: z.coerce.number().int().min(1).max(31),
  cadence: z.enum(["monthly", "quarterly", "semiannual", "yearly"]),
  categoryId: z.coerce.number().int().nullable().optional(),
});

export async function createBill(formData: FormData) {
  const userId = await requireOwner();
  const parsed = billSchema.safeParse({
    name: formData.get("name"),
    payee: formData.get("payee") || null,
    amount: formData.get("amount"),
    dueDay: formData.get("dueDay"),
    cadence: formData.get("cadence"),
    categoryId: formData.get("categoryId") || null,
  });
  if (!parsed.success) return { ok: false as const, error: parsed.error.issues[0].message };

  const d = parsed.data;
  const autoDeduct = formData.get("autoDeduct") === "on";
  await db.insert(bills).values({
    userId,
    name: d.name,
    payee: d.payee || null,
    amountCents: Math.round(d.amount * 100),
    dueDay: d.dueDay,
    cadence: d.cadence,
    categoryId: d.categoryId || null,
    autoDeduct,
  });
  revalidatePath("/bills");
  revalidatePath("/dashboard");
  return { ok: true as const };
}

export async function updateBill(id: number, formData: FormData) {
  const userId = await requireOwner();
  const parsed = billSchema.safeParse({
    name: formData.get("name"),
    payee: formData.get("payee") || null,
    amount: formData.get("amount"),
    dueDay: formData.get("dueDay"),
    cadence: formData.get("cadence"),
    categoryId: formData.get("categoryId") || null,
  });
  if (!parsed.success) return { ok: false as const, error: parsed.error.issues[0].message };

  const d = parsed.data;
  const autoDeduct = formData.get("autoDeduct") === "on";
  await db
    .update(bills)
    .set({
      name: d.name,
      payee: d.payee || null,
      amountCents: Math.round(d.amount * 100),
      dueDay: d.dueDay,
      cadence: d.cadence,
      categoryId: d.categoryId || null,
      autoDeduct,
    })
    .where(and(eq(bills.id, id), eq(bills.userId, userId)));

  revalidatePath("/bills");
  revalidatePath("/dashboard");
  return { ok: true as const };
}

export async function deleteBill(id: number) {
  const userId = await requireOwner();
  await db
    .update(bills)
    .set({ active: false })
    .where(and(eq(bills.id, id), eq(bills.userId, userId)));
  revalidatePath("/bills");
  revalidatePath("/dashboard");
  return { ok: true as const };
}

export async function togglePaid(billId: number, cadence: "monthly" | "quarterly" | "bimonthly" | "yearly" | "semiannual") {
  const userId = await requireOwner();
  const [bill] = await db.select().from(bills).where(and(eq(bills.id, billId), eq(bills.userId, userId))).limit(1);
  if (!bill) return { ok: false as const, error: "Bill not found" };

  const period =
    cadence === "quarterly" ? currentQuarter() :
    cadence === "yearly" ? currentYear() :
    cadence === "semiannual" ? currentHalf() :
    currentPeriod();

  const [existing] = await db
    .select()
    .from(billPayments)
    .where(and(eq(billPayments.billId, billId), eq(billPayments.period, period)))
    .limit(1);

  if (existing) {
    await db.delete(billPayments).where(eq(billPayments.id, existing.id));
  } else {
    await db.insert(billPayments).values({ billId, period, amountCents: bill.amountCents });
  }

  revalidatePath("/bills");
  revalidatePath("/dashboard");
  return { ok: true as const };
}
