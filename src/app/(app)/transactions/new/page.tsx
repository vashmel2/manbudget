import { requireUserId } from "@/lib/require-user";
import { getCategories } from "@/lib/queries";
import { NewTxClient } from "./new-tx-client";

export default async function NewTxPage() {
  const userId = await requireUserId();
  const cats = await getCategories(userId);
  return <NewTxClient categories={cats.map((c) => ({ id: c.id, label: c.label, slug: c.slug, glyph: c.glyph }))} />;
}
