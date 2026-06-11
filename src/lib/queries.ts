import { db, bills, billPayments, categories, transactions, recurringIncome, budgets, savingsGoals, savingsContributions } from "@/db";
import { and, asc, desc, eq, gte, lte, sql } from "drizzle-orm";
import { currentPeriod, currentQuarter, currentYear, currentHalf } from "./utils";

export async function getCategories(userId: number) {
  return db
    .select()
    .from(categories)
    .where(and(eq(categories.userId, userId), sql`${categories.archivedAt} IS NULL`))
    .orderBy(asc(categories.sortOrder), asc(categories.label));
}

export type BillWithStatus = Awaited<ReturnType<typeof getBillsWithStatus>>[number];

export async function getBillsWithStatus(userId: number, ref: Date = new Date()) {
  const period = currentPeriod(ref);
  const quarter = currentQuarter(ref);
  const year = currentYear(ref);
  const half = currentHalf(ref);

  const rows = await db
    .select({
      id: bills.id,
      name: bills.name,
      payee: bills.payee,
      amountCents: bills.amountCents,
      dueDay: bills.dueDay,
      cadence: bills.cadence,
      categoryId: bills.categoryId,
      active: bills.active,
      autoDeduct: bills.autoDeduct,
      categorySlug: categories.slug,
      categoryLabel: categories.label,
      categoryGlyph: categories.glyph,
    })
    .from(bills)
    .leftJoin(categories, eq(bills.categoryId, categories.id))
    .where(and(eq(bills.userId, userId), eq(bills.active, true)))
    .orderBy(asc(bills.dueDay), asc(bills.name));

  const payments = await db
    .select()
    .from(billPayments)
    .where(sql`${billPayments.billId} IN (SELECT id FROM ${bills} WHERE ${bills.userId} = ${userId})`);

  const today = ref.getDate();
  return rows.map((b) => {
    const target =
      b.cadence === "quarterly" ? quarter :
      b.cadence === "yearly" ? year :
      b.cadence === "semiannual" ? half :
      period;
    const payment = payments.find((p) => p.billId === b.id && p.period === target);
    const autoCanBePaid = b.autoDeduct && (
      (b.cadence === "monthly" || b.cadence === "bimonthly")
        ? today >= b.dueDay
        : true
    );
    const paid = !!payment || autoCanBePaid;
    return { ...b, paid, paidAt: payment?.paidAt ?? null, period: target };
  });
}

export async function getRecurringIncome(userId: number) {
  return db
    .select()
    .from(recurringIncome)
    .where(and(eq(recurringIncome.userId, userId), eq(recurringIncome.active, true)));
}

export async function getBudgets(userId: number) {
  return db
    .select({
      categoryId: budgets.categoryId,
      amountCents: budgets.amountCents,
      slug: categories.slug,
      label: categories.label,
      glyph: categories.glyph,
    })
    .from(budgets)
    .innerJoin(categories, eq(budgets.categoryId, categories.id))
    .where(eq(budgets.userId, userId));
}

export async function getRecentTransactions(userId: number, limit = 20) {
  return db
    .select({
      id: transactions.id,
      label: transactions.label,
      amountCents: transactions.amountCents,
      note: transactions.note,
      occurredAt: transactions.occurredAt,
      categoryId: transactions.categoryId,
      categorySlug: categories.slug,
      categoryLabel: categories.label,
      categoryGlyph: categories.glyph,
    })
    .from(transactions)
    .leftJoin(categories, eq(transactions.categoryId, categories.id))
    .where(eq(transactions.userId, userId))
    .orderBy(desc(transactions.occurredAt), desc(transactions.id))
    .limit(limit);
}

export async function getCategorySpendBreakdown(userId: number, ref: Date = new Date()) {
  const y = ref.getFullYear();
  const m = ref.getMonth();
  const start = `${y}-${String(m + 1).padStart(2, "0")}-01`;
  const endDate = new Date(y, m + 1, 0);
  const end = `${y}-${String(m + 1).padStart(2, "0")}-${String(endDate.getDate()).padStart(2, "0")}`;

  const billRows = await db
    .select({
      categoryId: bills.categoryId,
      billsCents: sql<number>`COALESCE(SUM(
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

  const txRows = await db
    .select({
      categoryId: transactions.categoryId,
      txCents: sql<number>`COALESCE(SUM(CASE WHEN ${transactions.amountCents} < 0 THEN -${transactions.amountCents} ELSE 0 END), 0)::int`,
    })
    .from(transactions)
    .where(
      and(
        eq(transactions.userId, userId),
        gte(transactions.occurredAt, start),
        lte(transactions.occurredAt, end),
        sql`${transactions.categoryId} IS NOT NULL`,
      ),
    )
    .groupBy(transactions.categoryId);

  const map = new Map<number, { billsCents: number; txCents: number }>();
  for (const r of billRows) {
    if (r.categoryId != null) map.set(r.categoryId, { billsCents: r.billsCents, txCents: 0 });
  }
  for (const r of txRows) {
    if (r.categoryId != null) {
      const existing = map.get(r.categoryId);
      if (existing) existing.txCents = r.txCents;
      else map.set(r.categoryId, { billsCents: 0, txCents: r.txCents });
    }
  }
  return map;
}

export async function getMonthSpend(userId: number, ref: Date = new Date()) {
  const y = ref.getFullYear();
  const m = ref.getMonth();
  const start = `${y}-${String(m + 1).padStart(2, "0")}-01`;
  const endDate = new Date(y, m + 1, 0);
  const end = `${y}-${String(m + 1).padStart(2, "0")}-${String(endDate.getDate()).padStart(2, "0")}`;

  const rows = await db
    .select({
      categoryId: transactions.categoryId,
      categorySlug: categories.slug,
      total: sql<number>`COALESCE(SUM(CASE WHEN ${transactions.amountCents} < 0 THEN -${transactions.amountCents} ELSE 0 END), 0)::int`,
      incomeTotal: sql<number>`COALESCE(SUM(CASE WHEN ${transactions.amountCents} > 0 THEN ${transactions.amountCents} ELSE 0 END), 0)::int`,
    })
    .from(transactions)
    .leftJoin(categories, eq(transactions.categoryId, categories.id))
    .where(and(eq(transactions.userId, userId), gte(transactions.occurredAt, start), lte(transactions.occurredAt, end)))
    .groupBy(transactions.categoryId, categories.slug);

  return rows;
}

export async function getSavingsGoal(userId: number) {
  const [goal] = await db
    .select()
    .from(savingsGoals)
    .where(and(eq(savingsGoals.userId, userId), eq(savingsGoals.active, true)))
    .limit(1);

  if (!goal) return null;

  const contribs = await db
    .select()
    .from(savingsContributions)
    .where(eq(savingsContributions.goalId, goal.id))
    .orderBy(desc(savingsContributions.occurredAt));

  const current = contribs.reduce((sum, c) => sum + c.amountCents, 0);
  return { ...goal, currentCents: current, contributions: contribs };
}
