import {
  pgTable,
  serial,
  text,
  integer,
  boolean,
  timestamp,
  date,
  uniqueIndex,
  index,
  pgEnum,
} from "drizzle-orm/pg-core";

export const cadenceEnum = pgEnum("cadence", ["monthly", "quarterly", "bimonthly", "yearly", "semiannual"]);

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  pinHash: text("pin_hash").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const categories = pgTable(
  "categories",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
    slug: text("slug").notNull(),
    label: text("label").notNull(),
    glyph: text("glyph").notNull().default("··"),
    color: text("color"),
    sortOrder: integer("sort_order").notNull().default(0),
    archivedAt: timestamp("archived_at", { withTimezone: true }),
  },
  (t) => [uniqueIndex("categories_user_slug_idx").on(t.userId, t.slug)],
);

export const bills = pgTable(
  "bills",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
    name: text("name").notNull(),
    payee: text("payee"),
    amountCents: integer("amount_cents").notNull(),
    dueDay: integer("due_day").notNull(),
    cadence: cadenceEnum("cadence").notNull().default("monthly"),
    categoryId: integer("category_id").references(() => categories.id, { onDelete: "set null" }),
    autoDeduct: boolean("auto_deduct").notNull().default(false),
    active: boolean("active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [index("bills_user_idx").on(t.userId)],
);

export const billPayments = pgTable(
  "bill_payments",
  {
    id: serial("id").primaryKey(),
    billId: integer("bill_id").references(() => bills.id, { onDelete: "cascade" }).notNull(),
    period: text("period").notNull(),
    paidAt: timestamp("paid_at", { withTimezone: true }).defaultNow().notNull(),
    amountCents: integer("amount_cents"),
  },
  (t) => [uniqueIndex("bill_payments_bill_period_idx").on(t.billId, t.period)],
);

export const transactions = pgTable(
  "transactions",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
    label: text("label").notNull(),
    amountCents: integer("amount_cents").notNull(),
    categoryId: integer("category_id").references(() => categories.id, { onDelete: "set null" }),
    note: text("note"),
    occurredAt: date("occurred_at").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    index("transactions_user_occurred_idx").on(t.userId, t.occurredAt),
    index("transactions_category_idx").on(t.categoryId),
  ],
);

export const recurringIncome = pgTable("recurring_income", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  name: text("name").notNull(),
  payer: text("payer"),
  amountCents: integer("amount_cents").notNull(),
  cadence: cadenceEnum("cadence").notNull().default("monthly"),
  firstDay: integer("first_day"),
  secondDay: integer("second_day"),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const budgets = pgTable(
  "budgets",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
    categoryId: integer("category_id").references(() => categories.id, { onDelete: "cascade" }).notNull(),
    amountCents: integer("amount_cents").notNull(),
  },
  (t) => [uniqueIndex("budgets_user_cat_idx").on(t.userId, t.categoryId)],
);

export const savingsGoals = pgTable("savings_goals", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  name: text("name").notNull(),
  targetCents: integer("target_cents").notNull(),
  targetDate: date("target_date"),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const savingsContributions = pgTable(
  "savings_contributions",
  {
    id: serial("id").primaryKey(),
    goalId: integer("goal_id").references(() => savingsGoals.id, { onDelete: "cascade" }).notNull(),
    label: text("label"),
    amountCents: integer("amount_cents").notNull(),
    occurredAt: date("occurred_at").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [index("savings_contributions_goal_idx").on(t.goalId)],
);

export type User = typeof users.$inferSelect;
export type Category = typeof categories.$inferSelect;
export type Bill = typeof bills.$inferSelect;
export type BillPayment = typeof billPayments.$inferSelect;
export type Transaction = typeof transactions.$inferSelect;
export type RecurringIncome = typeof recurringIncome.$inferSelect;
export type Budget = typeof budgets.$inferSelect;
export type SavingsGoal = typeof savingsGoals.$inferSelect;
export type SavingsContribution = typeof savingsContributions.$inferSelect;
