"use server";

import { db, categories, budgets } from "@/db";
import { and, asc, desc, eq, gt, isNull, lt, max, ne, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireOwner } from "@/lib/require-user";

const slugify = (s: string) =>
  s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 40) || "cat";

const schema = z.object({
  label: z.string().trim().min(1, "Name required").max(40),
  glyph: z.string().trim().min(1).max(4).default("··"),
  color: z.string().trim().max(20).optional().nullable(),
  budget: z.coerce.number().min(0).optional().nullable(),
});

async function ensureUniqueSlug(userId: number, base: string, excludeId?: number) {
  let slug = base;
  let n = 2;
  while (true) {
    const conds = [eq(categories.userId, userId), eq(categories.slug, slug)];
    const existing = await db
      .select({ id: categories.id })
      .from(categories)
      .where(and(...conds))
      .limit(1);
    if (existing.length === 0 || (excludeId && existing[0].id === excludeId)) return slug;
    slug = `${base}-${n++}`;
  }
}

export async function createCategory(formData: FormData) {
  const userId = await requireOwner();
  const parsed = schema.safeParse({
    label: formData.get("label"),
    glyph: formData.get("glyph") || "··",
    color: formData.get("color") || null,
    budget: formData.get("budget") || null,
  });
  if (!parsed.success) return { ok: false as const, error: parsed.error.issues[0].message };

  const d = parsed.data;
  const baseSlug = slugify(d.label);
  const slug = await ensureUniqueSlug(userId, baseSlug);

  const [{ maxOrder }] = await db
    .select({ maxOrder: max(categories.sortOrder) })
    .from(categories)
    .where(eq(categories.userId, userId));

  const [created] = await db
    .insert(categories)
    .values({
      userId,
      slug,
      label: d.label,
      glyph: d.glyph || "··",
      color: d.color || null,
      sortOrder: (maxOrder ?? -1) + 1,
    })
    .returning();

  if (d.budget != null && d.budget > 0) {
    await db.insert(budgets).values({ userId, categoryId: created.id, amountCents: Math.round(d.budget * 100) });
  }

  revalidatePath("/settings/categories");
  revalidatePath("/budgets");
  revalidatePath("/dashboard");
  return { ok: true as const };
}

export async function updateCategory(id: number, formData: FormData) {
  const userId = await requireOwner();
  const parsed = schema.safeParse({
    label: formData.get("label"),
    glyph: formData.get("glyph") || "··",
    color: formData.get("color") || null,
    budget: formData.get("budget") || null,
  });
  if (!parsed.success) return { ok: false as const, error: parsed.error.issues[0].message };

  const d = parsed.data;
  const baseSlug = slugify(d.label);
  const slug = await ensureUniqueSlug(userId, baseSlug, id);

  await db
    .update(categories)
    .set({ label: d.label, glyph: d.glyph || "··", color: d.color || null, slug })
    .where(and(eq(categories.id, id), eq(categories.userId, userId)));

  if (d.budget != null) {
    const [existing] = await db
      .select()
      .from(budgets)
      .where(and(eq(budgets.userId, userId), eq(budgets.categoryId, id)))
      .limit(1);
    const cents = Math.round(d.budget * 100);
    if (existing) {
      if (cents === 0) {
        await db.delete(budgets).where(eq(budgets.id, existing.id));
      } else {
        await db.update(budgets).set({ amountCents: cents }).where(eq(budgets.id, existing.id));
      }
    } else if (cents > 0) {
      await db.insert(budgets).values({ userId, categoryId: id, amountCents: cents });
    }
  }

  revalidatePath("/settings/categories");
  revalidatePath("/budgets");
  revalidatePath("/dashboard");
  revalidatePath("/bills");
  revalidatePath("/transactions");
  return { ok: true as const };
}

export async function archiveCategory(id: number) {
  const userId = await requireOwner();
  await db
    .update(categories)
    .set({ archivedAt: new Date() })
    .where(and(eq(categories.id, id), eq(categories.userId, userId)));
  revalidatePath("/settings/categories");
  revalidatePath("/budgets");
  revalidatePath("/dashboard");
  return { ok: true as const };
}

export async function unarchiveCategory(id: number) {
  const userId = await requireOwner();
  await db
    .update(categories)
    .set({ archivedAt: null })
    .where(and(eq(categories.id, id), eq(categories.userId, userId)));
  revalidatePath("/settings/categories");
  return { ok: true as const };
}

export async function moveCategory(id: number, direction: "up" | "down") {
  const userId = await requireOwner();
  const [current] = await db
    .select()
    .from(categories)
    .where(and(eq(categories.id, id), eq(categories.userId, userId)))
    .limit(1);
  if (!current) return { ok: false as const, error: "Category not found" };

  const neighbor = await db
    .select()
    .from(categories)
    .where(
      and(
        eq(categories.userId, userId),
        isNull(categories.archivedAt),
        ne(categories.id, id),
        direction === "up" ? lt(categories.sortOrder, current.sortOrder) : gt(categories.sortOrder, current.sortOrder),
      ),
    )
    .orderBy(direction === "up" ? desc(categories.sortOrder) : asc(categories.sortOrder))
    .limit(1);

  if (neighbor.length === 0) return { ok: true as const };

  const other = neighbor[0];
  // swap sort orders via a temp value to avoid unique-index collisions (none on sortOrder, but safer pattern)
  await db.update(categories).set({ sortOrder: -1 }).where(eq(categories.id, current.id));
  await db.update(categories).set({ sortOrder: current.sortOrder }).where(eq(categories.id, other.id));
  await db.update(categories).set({ sortOrder: other.sortOrder }).where(eq(categories.id, current.id));

  revalidatePath("/settings/categories");
  revalidatePath("/budgets");
  revalidatePath("/dashboard");
  return { ok: true as const };
}
