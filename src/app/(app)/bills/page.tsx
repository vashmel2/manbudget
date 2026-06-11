import { requireActor } from "@/lib/require-user";
import { getBillsWithStatus, getCategories } from "@/lib/queries";
import { BillsClient } from "./bills-client";

export default async function BillsPage() {
  const { ownerId, role } = await requireActor();
  const [bills, cats] = await Promise.all([
    getBillsWithStatus(ownerId),
    getCategories(ownerId),
  ]);

  return <BillsClient bills={bills} categories={cats.map((c) => ({ id: c.id, label: c.label, slug: c.slug, glyph: c.glyph }))} canEdit={role === "owner"} />;
}
