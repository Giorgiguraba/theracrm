-- Stimuli CRM initial schema. Idempotent — safe to re-run.

-- enums
do $$ begin
  if not exists (select 1 from pg_type where typname = 'tenant_status') then
    create type tenant_status as enum ('active','past_due','suspended','cancelled');
  end if;
  if not exists (select 1 from pg_type where typname = 'user_role') then
    create type user_role as enum ('platform_admin','admin','operator');
  end if;
  if not exists (select 1 from pg_type where typname = 'program_type') then
    create type program_type as enum ('therapy','course','internship');
  end if;
  if not exists (select 1 from pg_type where typname = 'lead_source') then
    create type lead_source as enum ('fb_ads','ig_ads','manual','referral');
  end if;
  if not exists (select 1 from pg_type where typname = 'lead_stage') then
    create type lead_stage as enum ('new','contacted','thinking','enrolled','lost');
  end if;
  if not exists (select 1 from pg_type where typname = 'activity_type') then
    create type activity_type as enum ('note','call','email_sent','stage_change','reminder');
  end if;
  if not exists (select 1 from pg_type where typname = 'reminder_status') then
    create type reminder_status as enum ('pending','done','snoozed');
  end if;
  if not exists (select 1 from pg_type where typname = 'invoice_status') then
    create type invoice_status as enum ('unpaid','paid','void');
  end if;
  if not exists (select 1 from pg_type where typname = 'email_status') then
    create type email_status as enum ('queued','sent','delivered','bounced','failed');
  end if;
end $$;

-- tables
create table if not exists tenants (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  status tenant_status not null default 'active',
  plan text not null default 'pro',
  paid_until date,
  grace_days integer not null default 7,
  created_at timestamptz not null default now()
);

create table if not exists tenant_settings (
  tenant_id uuid primary key references tenants(id) on delete cascade,
  followup_hours integer not null default 48,
  locale text not null default 'ka',
  ad_spend_monthly numeric(10,2),
  auto_followup_email boolean not null default false
);

create table if not exists users (
  id uuid primary key,
  tenant_id uuid references tenants(id) on delete cascade,
  role user_role not null default 'operator',
  full_name text not null,
  email text not null,
  phone text,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);
create index if not exists users_tenant_idx on users(tenant_id);

create table if not exists programs (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  name text not null,
  type program_type not null,
  price numeric(10,2) not null default 0,
  currency varchar(3) not null default 'GEL',
  start_date date,
  capacity integer,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);
create index if not exists programs_tenant_idx on programs(tenant_id);

create table if not exists leads (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  full_name text not null,
  phone text,
  email text,
  source lead_source not null default 'manual',
  meta_lead_id text,
  program_id uuid references programs(id) on delete set null,
  stage lead_stage not null default 'new',
  stage_changed_at timestamptz not null default now(),
  assigned_to uuid references users(id) on delete set null,
  notes text,
  photo_url text,
  birth_date date,
  city text,
  occupation text,
  deleted_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists leads_tenant_stage_idx on leads(tenant_id, stage);
create unique index if not exists leads_meta_lead_id_uq on leads(meta_lead_id) where meta_lead_id is not null;

-- Add columns if leads table predates this migration
alter table leads add column if not exists photo_url text;
alter table leads add column if not exists birth_date date;
alter table leads add column if not exists city text;
alter table leads add column if not exists occupation text;

create table if not exists activities (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  lead_id uuid not null references leads(id) on delete cascade,
  user_id uuid references users(id) on delete set null,
  type activity_type not null,
  payload jsonb,
  created_at timestamptz not null default now()
);
create index if not exists activities_lead_created_idx on activities(lead_id, created_at);

create table if not exists email_templates (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  key text not null,
  subject text not null,
  body_html text not null,
  locale text not null default 'ka',
  is_active boolean not null default true
);
create unique index if not exists email_tpl_uq on email_templates(tenant_id, key, locale);

create table if not exists email_log (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  lead_id uuid references leads(id) on delete set null,
  template_key text,
  status email_status not null default 'queued',
  provider_id text,
  error_message text,
  sent_at timestamptz
);

create table if not exists reminders (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  lead_id uuid not null references leads(id) on delete cascade,
  due_at timestamptz not null,
  status reminder_status not null default 'pending',
  created_by_system boolean not null default false,
  created_by_user_id uuid references users(id) on delete set null
);
create index if not exists reminders_due_status_idx on reminders(due_at, status);

create table if not exists invoices (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  period text not null,
  amount numeric(10,2) not null,
  currency varchar(3) not null default 'GEL',
  status invoice_status not null default 'unpaid',
  paid_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists platform_audit (
  id uuid primary key default gen_random_uuid(),
  actor_user_id uuid references users(id) on delete set null,
  tenant_id uuid references tenants(id) on delete set null,
  action text not null,
  payload jsonb,
  created_at timestamptz not null default now()
);

create table if not exists feature_flags (
  tenant_id uuid not null references tenants(id) on delete cascade,
  flag text not null,
  enabled boolean not null default false,
  primary key (tenant_id, flag)
);

create table if not exists webhook_log (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid references tenants(id) on delete set null,
  source text not null,
  payload jsonb,
  status text not null,
  error_message text,
  created_at timestamptz not null default now()
);
