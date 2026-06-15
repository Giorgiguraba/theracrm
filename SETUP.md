# Stimuli CRM — Setup

This is **Phase 0 + Phase 1** of the build. After setup you'll have a running CRM with auth, leads CRUD, drag-and-drop kanban, programs, lead detail with activity log, and a basic dashboard — backed by Supabase with proper Row-Level Security.

## 1. Prerequisites

- **Node.js 20+** (`node -v`)
- **npm** (or pnpm / bun — adapt commands)
- A **Supabase account** — https://supabase.com (free tier is enough for dev)

## 2. Install dependencies

```bash
cd C:\Users\Giorgi\Documents\Projects\CRM
npm install
```

## 3. Create your Supabase project

1. Go to https://supabase.com/dashboard → **New project**
2. Region: pick the closest to Georgia (e.g. `eu-central-1` Frankfurt)
3. Save the **database password** somewhere — you'll need it
4. Wait ~2 minutes for the project to provision

## 4. Fill `.env.local`

Copy the example and fill the values:

```bash
cp .env.example .env.local
```

Open `.env.local` and from your Supabase project's **Settings → API**:
- `NEXT_PUBLIC_SUPABASE_URL` → "Project URL"
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` → "anon public" key
- `SUPABASE_SERVICE_ROLE_KEY` → "service_role" key  ⚠️ **server-side only, never expose**

From **Settings → Database → Connection string → URI (direct connection)**:
- `DATABASE_URL` → the full `postgresql://postgres:...` URI (paste your DB password into `[PASSWORD]`)

Leave the Brevo / Meta keys blank for now — those are Phase 2 / Phase 3.

## 5. Create the schema

```bash
npm run db:generate    # generates SQL migrations from lib/db/schema.ts
npm run db:push        # applies them to Supabase
```

If `db:push` complains, you can run `db:migrate` against the migration files instead.

## 6. Apply RLS policies

```bash
npm run db:rls
```

This runs `lib/db/rls.sql` — enables RLS on every tenant table, creates the
`current_tenant_id()` helper, and installs the `auth.users → public.users`
mirror trigger.

## 7. Seed demo data

```bash
npm run db:seed
```

This creates a tenant called **"Mindspace Tbilisi"**, 4 programs, and 10 sample leads. It prints the tenant UUID — copy it, you'll need it in the next step.

## 8. Create your admin user

1. Supabase Dashboard → **Authentication → Users → Add user → Create new user**
2. Email + password
3. Click the new user → **Raw user meta data** tab → **Edit**
4. In the `app_metadata` JSON, set:

```json
{
  "tenant_id": "PASTE-THE-TENANT-UUID-FROM-SEED",
  "role": "admin"
}
```

> The trigger we installed in step 6 will automatically create a matching row
> in `public.users` with role = `admin` and the correct tenant.

## 9. Run the app

```bash
npm run dev
```

Open http://localhost:3000 → you'll be redirected to `/sign-in`. Sign in with the user you just created. The kanban board should appear with the seeded leads.

---

## What's built (Phase 0 + 1)

- Next.js 15 + React 19 + TypeScript 5
- Tailwind v4 (CSS-first config, OKLCH design tokens)
- Supabase (auth + DB) with **RLS enforcing tenant isolation**
- Drizzle ORM + migrations
- Sign in / sign up / payment-required screens
- Middleware: blocks suspended tenants, gates routes
- App shell: sidebar, top bar, light + dark theme toggle
- **Leads kanban with drag-and-drop** (dnd-kit) + optimistic moves
- Leads table view
- Lead detail page with activity log + note form + stage switcher
- Programs catalog
- Mini dashboard (by stage, by source, revenue)
- Users & roles list
- Meta Lead Ads webhook endpoint (verification only — Graph fetch in Phase 2)

## What's next

- **Phase 2** — wire the Meta Graph API fetch + tenant mapping, dedupe leads
- **Phase 3** — Brevo email integration + follow-up cron (Supabase pg_cron)
- **Phase 4** — platform super admin (`/platform` route group) for tenant + billing management, support impersonation, audit log
- **Phase 5** — i18n (ka primary, en secondary via next-intl), realtime kanban sync (Supabase Realtime), corporate B2B module

## File map

```
app/
├─ layout.tsx, page.tsx, globals.css
├─ sign-in/, sign-up/, payment-required/
├─ (app)/                       # tenant routes, share sidebar+topbar layout
│  ├─ layout.tsx                # loads user + tenant + role
│  ├─ leads/page.tsx            # kanban + table
│  ├─ leads/[id]/               # detail, note form, stage switcher
│  ├─ programs/page.tsx
│  ├─ dashboard/page.tsx
│  └─ settings/users/page.tsx
└─ api/webhooks/meta/route.ts

components/
├─ ui/ (button, input, label, dialog, select-stage)
├─ shell/ (sidebar, topbar)
├─ leads/ (kanban, lead-form)
└─ providers/theme-provider.tsx

lib/
├─ db/ (schema.ts, index.ts, rls.sql)
├─ supabase/ (client.ts, server.ts, service.ts, middleware.ts)
├─ actions/leads.ts
├─ auth.ts
└─ utils.ts

scripts/
├─ seed.ts       # demo tenant + programs + leads
└─ apply-rls.ts  # applies rls.sql

drizzle/migrations/   # generated SQL migrations
designs/              # original landing.html + app.html mockups
```

## Verifying tenant isolation works

```sql
-- In Supabase SQL editor, as the anon role (set request.jwt.claims),
-- a query against leads should return ONLY rows where tenant_id matches.
-- Try it from two different tenants and confirm zero crossover.
```

Write a vitest/playwright test for this before going to production — the brief
requires "a test that proves it" in Section 8.
