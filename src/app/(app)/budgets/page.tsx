import { requireActor } from "@/lib/require-user";
import { getCategories, getBudgets, getCategorySpendBreakdown } from "@/lib/queries";
import { BudgetsClient } from "./budgets-client";

export default async function BudgetsPage() {
  const { ownerId: userId, role } = await requireActor();
  const [cats, bgs, breakdown] = await Promise.all([
    getCategories(userId),
    getBudgets(userId),
    getCategorySpendBreakdown(userId),
  ]);

  const budgetMap = new Map(bgs.map((b) => [b.categoryId, b.amountCents]));

  const rows = cats
    .map((c) => {
      const b = breakdown.get(c.id) ?? { billsCents: 0, txCents: 0 };
      return {
        id: c.id,
        label: c.label,
        glyph: c.glyph,
        budgetCents: budgetMap.get(c.id) || 0,
        spentCents: b.billsCents + b.txCents,
        billsCents: b.billsCents,
        txCents: b.txCents,
      };
    })
    .sort((a, b) => (b.spentCents - a.spentCents) || (b.budgetCents - a.budgetCents));

  return <BudgetsClient categories={rows} canEdit={role === "owner"} />;
}
