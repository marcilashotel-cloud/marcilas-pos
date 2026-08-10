# Marcillas Hotel — Restaurant POS & Kitchen Management System

Internal POS, Kitchen Display, and back-office system for Marcillas Hotel, built with
React + TypeScript + Vite + Tailwind CSS, backed by Supabase (Auth, Postgres, Realtime).

## Getting started (one manual step, then it's automatic)

**Step 1 — the one unavoidable manual step:** run `supabase/COMPLETE_SETUP.sql` once,
in your Supabase project's **SQL Editor** (Dashboard → SQL Editor → paste the whole
file → Run). It's a single, idempotent script that creates every table, security
policy, trigger, and function this app needs, plus default menu categories. Safe to
run more than once.

This is genuinely the only manual step, and it can't be automated away: creating
tables and security policies requires elevated database privileges, and the browser
app deliberately never holds a credential with that level of access (holding one
would let anyone with dev tools open take over the database). If you skip this step,
the app itself tells you so — it shows an in-app **"One-Time Database Setup"** screen
with these exact instructions instead of a blank page or a confusing error, and a
button to re-check once you've run it.

**Step 2 — nothing.** Once that script has been run, reload the app. From here
everything is automatic:
- The three demo staff accounts (below) are created for you on first load.
- Every signed-in user automatically gets a matching staff profile — created on the
  spot if it's somehow missing (self-healing), so login never dead-ends.
- Role-based redirects and permissions just work.

If you'd rather use the Supabase CLI / migration history instead of the one-file
script, `supabase/migrations/` contains the equivalent changes split into individual,
timestamped, idempotent files — run `supabase db push`, or apply them in order via the
SQL Editor.

## Demo accounts

The app automatically creates these three demo staff accounts the first time it loads
against a freshly set-up database (see `src/lib/demoBootstrap.ts` — best-effort, once
per browser, no action needed from you). All three share the same password:

| Role    | Email                   | Password          |
|---------|-------------------------|--------------------|
| Admin   | `admin@marcillas.com`   | `Marcillas2026!`  |
| Cashier | `cashier@marcillas.com` | `Marcillas2026!`  |
| Kitchen | `kitchen@marcillas.com` | `Marcillas2026!`  |

After signing in, each account is redirected automatically based on its role:
- **Admin** → `/admin` (Admin Dashboard)
- **Cashier** → `/cashier` (Cashier POS)
- **Kitchen** → `/kitchen` (Kitchen Display)

> These are demo credentials for evaluation only. Change or remove them before any
> real production use — see "Going to production" below.

One caveat outside the app's control: **if your Supabase project has "Confirm email"
enabled** (Authentication → Providers → Email), the demo accounts are created but
can't sign in until confirmed. For a demo/internal system, either disable email
confirmation for this project, or confirm the three accounts once in Supabase
Dashboard → Authentication → Users.

## Environment variables

Create a `.env` file (or set these in your hosting provider, e.g. Vercel → Project
Settings → Environment Variables):

```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

Both come from your Supabase project → Settings → API. If either is missing, the app
shows a clear "Configuration Required" screen instead of a blank page.

## Staff profiles

Every authenticated user has exactly one row in `profiles`:

| Column      | Meaning                                      |
|-------------|-----------------------------------------------|
| `full_name` | Display name                                  |
| `email`     | Matches the Auth account's email              |
| `role`      | `admin`, `cashier`, or `kitchen`              |
| `is_active` | Deactivated accounts are signed out and blocked from logging back in |

If a signed-in user somehow has no `profiles` row (e.g. an account created before the
trigger existed), the app **self-heals**: it creates one automatically on next login
instead of showing an error.

Admins can manage all of the above from **Staff Management** in the Admin Dashboard —
including deactivating an account (they can't deactivate or demote themselves).

## Role permissions

Enforced both in the UI (route guards) and at the database level (Row Level Security),
so permissions can't be bypassed by calling Supabase directly:

- **Admin**: everything — menu, categories, staff, inventory, analytics, Z Report,
  order history.
- **Cashier**: POS, table management, create/send orders, mark orders paid/unpaid.
  Cannot manage menu/categories, staff, or view the Z Report.
- **Kitchen**: Kitchen Display only — receive orders in real time and update their
  status. Cannot manage menu/categories.

## Menu images

Admins can attach a photo to any menu item either by pasting a URL or uploading a
file directly from Menu Management — uploads go to a public `menu-images` Storage
bucket (created by `COMPLETE_SETUP.sql`), readable by anyone but writable only by
admins.

## Payments

Cashiers can mark any active order Paid/Unpaid from the Cashier Dashboard
(`orders.payment_status`), independent of its kitchen status.

## Local development

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

## Deployment (Vercel)

The project deploys as a static Vite build. `vercel.json` already includes the SPA
rewrite needed for client-side routing. Make sure the two environment variables above
are set in your Vercel project before deploying.

## Going to production

Before using this for a real restaurant:
- Remove or rotate the demo accounts and password.
- Turn off (or keep, per your policy) email confirmation in Supabase Auth settings.
- Review the RLS policies in `supabase/COMPLETE_SETUP.sql` (or `supabase/migrations/`)
  against your actual staffing model.
