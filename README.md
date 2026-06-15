# Stimuli CRM

A lean, modern CRM for psychology and therapy centers — purpose-built for the small-team workflow that goes from Meta Ads → DM → "I'm thinking about it" → enrolled student. Multi-tenant SaaS architecture, Georgian-first UI, designed to replace a paper notebook in 30 minutes.

## Stack

- **Next.js 15** (App Router) + **React 19** + **TypeScript 5**
- **Tailwind CSS v4** (CSS-first config, OKLCH design tokens)
- **Supabase** — Postgres 16 + Auth + Storage, with **Row Level Security** enforcing tenant isolation
- **Drizzle ORM** for type-safe schema + queries
- **dnd-kit** for the kanban
- **Sonner** toasts, **Lucide** icons, **Geist** font

## Features

**Tenant CRM**
- Glass-style leads pipeline kanban with 5 stages (New / Contacted / Thinking / Enrolled / Lost)
- Lead detail with photo upload (Supabase Storage), full edit form, activity timeline
- Manual reminders + auto reminders for leads stuck >7 days
- Calendar view with click-to-add reminders
- Follow-ups page sectioned by overdue / today / upcoming / done
- Customers explorer with search + interest filter
- Email templates editor (sending via Brevo — Phase 3)
- Programs catalog with type-specific icons
- Dashboard with stage / source / revenue charts
- ⌘K command palette searching everything
- Light/dark theme with liquid glass animations

**Platform**
- Past-due banner, payment-required gate
- Mirror trigger from `auth.users` to `public.users`
- RLS bypass for server-side Drizzle writes (server actions still enforce tenant scoping)

## Quick start

See [SETUP.md](./SETUP.md) for full instructions. Short version:

```bash
npm install --legacy-peer-deps     # React 19 peer dep notice
cp .env.example .env.local         # then paste your Supabase keys
npm run setup                      # schema + RLS + Mindspace tenant + programs
npm run dev                        # open http://localhost:3000
```

For Windows PowerShell, also run once:
```powershell
Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned
```

## Project structure

```
app/
  (app)/                     tenant routes (sidebar + topbar shell)
    leads/                   pipeline kanban + lead detail
    customers/               directory with search + filter
    programs/                catalog
    dashboard/               metrics + charts
    follow-ups/              reminder management
    calendar/                month grid with quick-add
    templates/               email template editor
    settings/                tenant settings + users
  sign-in/  sign-up/  no-tenant/  payment-required/  setup-required/
  api/webhooks/meta/         Meta Lead Ads webhook (Phase 2)

components/
  ui/                        shadcn-style primitives
  shell/                     sidebar, topbar, command palette
  leads/                     kanban, lead form, reminder form, activity card
  providers/                 theme, spotlight tracker

lib/
  db/                        Drizzle schema + RLS SQL
  supabase/                  browser, server, service clients
  actions/                   server actions (leads, reminders, templates, settings, search, notifications, auto-reminders)
  auth.ts                    requireUser() helper
  env.ts                     env validation
  utils.ts                   cn, initials, formatGEL, relativeTime

scripts/
  setup.ts                   one-shot install
  seed.ts                    legacy seed
  apply-rls.ts               idempotent RLS applier
  clean-demo-data.sql        wipe demo leads + replace programs

drizzle/migrations/          generated migrations
```

## Roadmap (Phases from PROJECT_BRIEF_2.md)

- ✅ Phase 0 — repo, schema, auth, tenant scaffold, RLS
- ✅ Phase 1 — leads CRUD, kanban, programs, lead detail, activity log
- ⏳ Phase 2 — Meta Lead Ads Graph API fetch, dedupe (webhook skeleton exists)
- ⏳ Phase 3 — Brevo email send, follow-up cron (Supabase pg_cron)
- ⏳ Phase 4 — `/platform` super admin (tenant management, suspend, impersonate, audit)
- ⏳ Phase 5 — i18n (ka + en via next-intl), realtime kanban sync (Supabase Realtime)

## License

Private. © 2026 Gio.
