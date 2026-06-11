import { and, desc, eq, gte, lte } from "drizzle-orm";
import { db, transactions, categories } from "@/db";
import { requireUserId } from "@/lib/require-user";
import { getRecurringIncome, getCategories } from "@/lib/queries";
import { IncomeClient } from "./income-client";

export default async function IncomePage() {
  const userId = await requireUserId();

  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth();
  const start = `${y}-${String(m + 1).padStart(2, "0")}-01`;
  const endDate = new Date(y, m + 1, 0);
  const end = `${y}-${String(m + 1).padStart(2, "0")}-${String(endDate.getDate()).padStart(2, "0")}`;

  const [primaries, cats] = await Promise.all([
    getRecurringIncome(userId),
    getCategories(userId),
  ]);

  const gigs = await db
    .select({
      id: transactions.id,
      label: transactions.label,
      amountCents: transactions.amountCents,
      occurredAt: transactions.occurredAt,
      categoryLabel: categories.label,
      categoryGlyph: categories.glyph,
    })
    .from(transactions)
    .leftJoin(categories, eq(transactions.categoryId, categories.id))
    .where(
      and(
        eq(transactions.userId, userId),
        gte(transactions.occurredAt, start),
        lte(transactions.occurredAt, end),
      ),
    )
    .orderBy(desc(transactions.occurredAt), desc(transactions.id));

  const positiveGigs = gigs.filter((g) => g.amountCents > 0);

  return (
    <IncomeClient
      primary={primaries[0] || null}
      gigs={positiveGigs}
      categories={cats.map((c) => ({ id: c.id, label: c.label, slug: c.slug, glyph: c.glyph }))}
    />
  );
}
