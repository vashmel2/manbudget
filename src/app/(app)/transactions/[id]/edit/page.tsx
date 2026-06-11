import { redirect } from "next/navigation";
import { and, eq } from "drizzle-orm";
import { db, transactions } from "@/db";
import { requireUserId } from "@/lib/require-user";
import { getCategories } from "@/lib/queries";
import { NewTxClient } from "../../new/new-tx-client";

export default async function EditTxPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const userId = await requireUserId();
  const txId = Number(id);
  if (!Number.isInteger(txId) || txId <= 0) redirect("/transactions");

  const [tx] = await db
    .select()
    .from(transactions)
    .where(and(eq(transactions.id, txId), eq(transactions.userId, userId)))
    .limit(1);

  if (!tx) redirect("/transactions");

  const cats = await getCategories(userId);

  return (
    <NewTxClient
      categories={cats.map((c) => ({ id: c.id, label: c.label, slug: c.slug, glyph: c.glyph }))}
      editing={{
        id: tx.id,
        label: tx.label,
        amountCents: tx.amountCents,
        categoryId: tx.categoryId,
        note: tx.note,
        occurredAt: tx.occurredAt,
      }}
    />
  );
}
