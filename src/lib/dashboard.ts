import { getBillsWithStatus, getBudgets, getCategorySpendBreakdown, getMonthSpend, getRecurringIncome, getSavingsGoal } from "./queries";
import { db, savingsContributions, savingsGoals } from "@/db";
import { and, eq, gte, lte } from "drizzle-orm";

export type DashboardData = Awaited<ReturnType<typeof getDashboardData>>;

export async function getDashboardData(userId: number, ref: Date = new Date()) {
  const y = ref.getFullYear();
  const m = ref.getMonth();
  const day = ref.getDate();
  const daysInMonth = new Date(y, m + 1, 0).getDate();
  const startISO = `${y}-${String(m + 1).padStart(2, "0")}-01`;
  const endISO = `${y}-${String(m + 1).padStart(2, "0")}-${String(daysInMonth).padStart(2, "0")}`;
  const monthLabel = ref.toLocaleString("en-PH", { month: "long", year: "numeric" });

  const [bills, budgets, spend, breakdown, incomes, goal, allCats] = await Promise.all([
    getBillsWithStatus(userId, ref),
    getBudgets(userId),
    getMonthSpend(userId, ref),
    getCategorySpendBreakdown(userId, ref),
    getRecurringIncome(userId),
    getSavingsGoal(userId),
    // pull category labels so we can include uncapped-but-spending categories
    (async () => {
      const { categories } = await import("@/db");
      const { eq, and, asc, sql } = await import("drizzle-orm");
      return db
        .select()
        .from(categories)
        .where(and(eq(categories.userId, userId), sql`${categories.archivedAt} IS NULL`))
        .orderBy(asc(categories.sortOrder), asc(categories.label));
    })(),
  ]);

  const todayDay = ref.getDate();
  const incomeReceivedFrom = (i: typeof incomes[number]): number => {
    if (i.cadence === "bimonthly") {
      const half = Math.round(i.amountCents / 2);
      let received = 0;
      if (todayDay >= (i.firstDay ?? 15)) received += half;
      if (todayDay >= (i.secondDay ?? 30)) received += half;
      return received;
    }
    return todayDay >= (i.firstDay ?? 1) ? i.amountCents : 0;
  };
  const nextPaydayFor = (i: typeof incomes[number]): number | null => {
    const fd = i.firstDay ?? 1;
    if (i.cadence === "bimonthly") {
      const sd = i.secondDay ?? 30;
      if (todayDay < fd) return fd;
      if (todayDay < sd) return sd;
      return null;
    }
    return todayDay < fd ? fd : null;
  };

  const primaryIncomeExpected = incomes.reduce((s, i) => s + i.amountCents, 0);
  const primaryIncomeReceived = incomes.reduce((s, i) => s + incomeReceivedFrom(i), 0);
  const upcomingPaydays = incomes
    .map(nextPaydayFor)
    .filter((d): d is number => d !== null)
    .sort((a, b) => a - b);
  const nextPayday = upcomingPaydays[0] ?? null;
  const gigIncomeMTD = spend.reduce((s, r) => s + r.incomeTotal, 0);
  const incomeMTD = primaryIncomeExpected + gigIncomeMTD;
  const incomeReceived = primaryIncomeReceived + gigIncomeMTD;
  const hasPrimaryIncome = incomes.length > 0;

  const monthlyEquiv = (b: typeof bills[number]) =>
    b.cadence === "yearly" ? Math.round(b.amountCents / 12) :
    b.cadence === "semiannual" ? Math.round(b.amountCents / 6) :
    b.cadence === "quarterly" ? Math.round(b.amountCents / 3) :
    b.amountCents;
  const billsTotal = bills.reduce((s, b) => s + monthlyEquiv(b), 0);
  const billsPaidTotal = bills.filter((b) => b.paid).reduce((s, b) => s + monthlyEquiv(b), 0);
  const billsPaidCount = bills.filter((b) => b.paid).length;
  const billsTotalCount = bills.length;

  const spentMTD = spend.reduce((s, r) => s + r.total, 0);
  const budgetTotal = budgets.reduce((s, b) => s + b.amountCents, 0);

  const budgetMap = new Map(budgets.map((b) => [b.categoryId, b]));
  const spentByCat = allCats
    .map((c) => {
      const cap = budgetMap.get(c.id)?.amountCents ?? 0;
      const b = breakdown.get(c.id) ?? { billsCents: 0, txCents: 0 };
      return {
        categoryId: c.id,
        label: c.label,
        glyph: c.glyph,
        capCents: cap,
        billsCents: b.billsCents,
        txCents: b.txCents,
        spentCents: b.billsCents + b.txCents,
      };
    })
    .filter((c) => c.capCents > 0 || c.spentCents > 0);

  const netLeft = incomeMTD - billsTotal - spentMTD;
  const dayRatio = day / daysInMonth;
  const projectedSpend = dayRatio > 0 ? spentMTD / dayRatio : 0;
  const projectedEOM = incomeMTD - billsTotal - projectedSpend;

  let savedThisMonth = 0;
  if (goal) {
    const rows = await db
      .select({ amountCents: savingsContributions.amountCents })
      .from(savingsContributions)
      .where(
        and(
          eq(savingsContributions.goalId, goal.id),
          gte(savingsContributions.occurredAt, startISO),
          lte(savingsContributions.occurredAt, endISO),
        ),
      );
    savedThisMonth = rows.reduce((s, r) => s + r.amountCents, 0);
  }

  const upcomingBills = bills
    .slice()
    .sort((a, b) => Number(a.paid) - Number(b.paid) || a.dueDay - b.dueDay)
    .slice(0, 5);

  return {
    monthLabel,
    day,
    daysInMonth,
    incomeMTD,
    incomeReceived,
    nextPayday,
    hasPrimaryIncome,
    primaryIncome: primaryIncomeExpected,
    gigIncomeMTD,
    billsTotal,
    billsPaidTotal,
    billsPaidCount,
    billsTotalCount,
    spentMTD,
    budgetTotal,
    spentByCat,
    netLeft,
    projectedEOM,
    savedThisMonth,
    savings: goal ? { current: goal.currentCents, target: goal.targetCents, name: goal.name, targetDate: goal.targetDate } : null,
    upcomingBills,
  };
}
