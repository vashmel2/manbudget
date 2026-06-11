import { db } from "@/db";
import { categories, budgets, savingsGoals } from "@/db/schema";

export const DEFAULT_CATEGORIES = [
  { slug: "groceries", label: "Groceries & Rice", glyph: "RC", budgetCents: 900_000 },
  { slug: "transport", label: "Transport",        glyph: "TX", budgetCents: 320_000 },
  { slug: "dining",    label: "Dining Out",       glyph: "DN", budgetCents: 250_000 },
  { slug: "school",    label: "School & Kids",    glyph: "SK", budgetCents: 200_000 },
  { slug: "health",    label: "Health & Meds",    glyph: "HP", budgetCents: 180_000 },
  { slug: "load",      label: "Load & Data",      glyph: "LD", budgetCents: 120_000 },
  { slug: "household", label: "Household",        glyph: "HH", budgetCents: 160_000 },
  { slug: "misc",      label: "Misc",             glyph: "··", budgetCents: 150_000 },
];

export async function seedDefaultsForUser(userId: number) {
  const rows = DEFAULT_CATEGORIES.map((c, i) => ({
    userId,
    slug: c.slug,
    label: c.label,
    glyph: c.glyph,
    sortOrder: i,
  }));
  const inserted = await db.insert(categories).values(rows).returning();

  const budgetRows = inserted.map((cat) => {
    const def = DEFAULT_CATEGORIES.find((d) => d.slug === cat.slug)!;
    return { userId, categoryId: cat.id, amountCents: def.budgetCents };
  });
  await db.insert(budgets).values(budgetRows);

  await db.insert(savingsGoals).values({
    userId,
    name: "Family Emergency Fund",
    targetCents: 15_000_000,
    targetDate: "2026-12-31",
  });
}
