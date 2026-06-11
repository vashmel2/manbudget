import { desc, eq } from "drizzle-orm";
import { db, transactions, categories } from "@/db";
import { requireUserId } from "@/lib/require-user";

function csvEscape(v: string | null | undefined): string {
  if (v == null) return "";
  const s = String(v);
  if (s.includes(",") || s.includes('"') || s.includes("\n") || s.includes("\r")) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

export async function GET() {
  const userId = await requireUserId();

  const rows = await db
    .select({
      id: transactions.id,
      occurredAt: transactions.occurredAt,
      label: transactions.label,
      amountCents: transactions.amountCents,
      categoryLabel: categories.label,
      note: transactions.note,
      createdAt: transactions.createdAt,
    })
    .from(transactions)
    .leftJoin(categories, eq(transactions.categoryId, categories.id))
    .where(eq(transactions.userId, userId))
    .orderBy(desc(transactions.occurredAt), desc(transactions.id));

  const header = "Date,Label,Amount (PHP),Type,Category,Note,Logged at\n";
  const body = rows
    .map((r) => {
      const amount = (r.amountCents / 100).toFixed(2);
      const type = r.amountCents < 0 ? "Expense" : "Income";
      const loggedAt = r.createdAt instanceof Date ? r.createdAt.toISOString() : String(r.createdAt);
      return [
        csvEscape(r.occurredAt),
        csvEscape(r.label),
        amount,
        type,
        csvEscape(r.categoryLabel),
        csvEscape(r.note),
        csvEscape(loggedAt),
      ].join(",");
    })
    .join("\n");

  const csv = header + body + (body ? "\n" : "");
  const today = new Date().toISOString().slice(0, 10);

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="manbudget-transactions-${today}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
