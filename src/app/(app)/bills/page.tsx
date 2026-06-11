import { requireUserId } from "@/lib/require-user";
import { getBillsWithStatus, getCategories } from "@/lib/queries";
import { BillsClient } from "./bills-client";

export default async function BillsPage() {
  const userId = await requireUserId();
  const [bills, cats] = await Promise.all([
    getBillsWithStatus(userId),
    getCategories(userId),
  ]);

  return <BillsClient bills={bills} categories={cats.map((c) => ({ id: c.id, label: c.label, slug: c.slug, glyph: c.glyph }))} />;
}
