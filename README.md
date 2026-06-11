# ManBudget

A personal budget tracker built for "where did my money go?" insight. Single-user, mobile-friendly, deployed on Vercel.

Currency: Philippine Peso (₱). Aesthetic: dark, dense, data-forward.

## Stack

- Next.js 15 (App Router) + TypeScript
- Tailwind CSS + custom design tokens
- Recharts for the donut and progress visuals
- Neon Postgres + Drizzle ORM
- iron-session for PIN-based auth
- Vercel for hosting

## Local setup

```bash
npm install
cp .env.example .env.local
# fill in DATABASE_URL (pooled), DATABASE_URL_UNPOOLED, and SESSION_SECRET
npm run db:push
npm run dev
```

Then open http://localhost:3000 and set your PIN on first launch.

## Scripts

- `npm run dev` — start the dev server
- `npm run build` — production build
- `npm run db:push` — sync schema to Neon
- `npm run db:studio` — open Drizzle's visual table viewer

## Deploy

1. Push to GitHub
2. Import the repo into Vercel
3. Set the same three env vars in Vercel project settings
4. Deploy

## Features (v1)

- **Dashboard** — Net left this month, income/bills/spent stats, donut showing where income goes, bills due checklist, spending-by-category bars, savings goal progress
- **Bills** — Monthly, quarterly, semiannual, yearly cadences. Auto-deduct toggle for card-linked subscriptions/loans. Paid status tracked per period.
- **Income** — Primary recurring salary (monthly/bimonthly/quarterly) plus ad-hoc gig income
- **Transactions** — Quick expense/income entry with category chips, edit + delete
- **Budgets** — Per-category caps with "Sync caps to bills" one-click setup
- **Savings** — Goal tracking with progress ring and contribution log
- **Categories** — Add, rename, reorder, archive
- **CSV export** — Backup transactions and bills
- **PIN login** — Local PIN, single-user, schema-ready for multi-user later
