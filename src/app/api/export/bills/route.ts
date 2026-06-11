import { desc, eq } from "drizzle-orm";
import { db, bills, categories } from "@/db";
import { requireUserId } from "@/lib/require-user";

function csvEscape(v: string | null | undefined | boolean): string {
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
      id: bills.id,
      name: bills.name,
      payee: bills.payee,
      amountCents: bills.amountCents,
      dueDay: bills.dueDay,
      cadence: bills.cadence,
      autoDeduct: bills.autoDeduct,
      active: bills.active,
      categoryLabel: categories.label,
      createdAt: bills.createdAt,
    })
    .from(bills)
    .leftJoin(categories, eq(bills.categoryId, categories.id))
    .where(eq(bills.userId, userId))
    .orderBy(desc(bills.active), desc(bills.id));

  const header = "Name,Payee,Amount (PHP),Due Day,Cadence,Auto-deduct,Active,Category,Created at\n";
  const body = rows
    .map((r) => {
      const amount = (r.amountCents / 100).toFixed(2);
      const createdAt = r.createdAt instanceof Date ? r.createdAt.toISOString() : String(r.createdAt);
      return [
        csvEscape(r.name),
        csvEscape(r.payee),
        amount,
        String(r.dueDay),
        csvEscape(r.cadence),
        r.autoDeduct ? "yes" : "no",
        r.active ? "yes" : "no",
        csvEscape(r.categoryLabel),
        csvEscape(createdAt),
      ].join(",");
    })
    .join("\n");

  const csv = header + body + (body ? "\n" : "");
  const today = new Date().toISOString().slice(0, 10);

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="manbudget-bills-${today}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
