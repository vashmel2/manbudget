import { asc, eq } from "drizzle-orm";
import { db, categories, budgets } from "@/db";
import { requireUserId } from "@/lib/require-user";
import { CategoriesClient } from "./categories-client";

export default async function CategoriesPage() {
  const userId = await requireUserId();

  const cats = await db
    .select()
    .from(categories)
    .where(eq(categories.userId, userId))
    .orderBy(asc(categories.sortOrder), asc(categories.label));

  const bgs = await db
    .select({ categoryId: budgets.categoryId, amountCents: budgets.amountCents })
    .from(budgets)
    .where(eq(budgets.userId, userId));

  const budgetMap = new Map(bgs.map((b) => [b.categoryId, b.amountCents]));

  const rows = cats.map((c) => ({
    id: c.id,
    label: c.label,
    glyph: c.glyph,
    color: c.color,
    archived: c.archivedAt !== null,
    budgetCents: budgetMap.get(c.id) ?? 0,
  }));

  return <CategoriesClient categories={rows} />;
}
