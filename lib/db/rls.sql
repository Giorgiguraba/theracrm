-- =====================================================================
-- Stimuli CRM — RLS policies
-- Apply AFTER drizzle migrations have created the tables.
-- Idempotent: safe to re-run.
-- =====================================================================

-- Helper: pull tenant_id out of the JWT app_metadata
create or replace function public.current_tenant_id() returns uuid as $$
  select nullif(
    coalesce(
      (current_setting('request.jwt.claims', true)::jsonb -> 'app_metadata' ->> 'tenant_id'),
      (current_setting('request.jwt.claims', true)::jsonb ->> 'tenant_id')
    ),
    ''
  )::uuid;
$$ language sql stable security definer;

create or replace function public.current_role_safe() returns text as $$
  select coalesce(
    (current_setting('request.jwt.claims', true)::jsonb -> 'app_metadata' ->> 'role'),
    'operator'
  );
$$ language sql stable security definer;

create or replace function public.is_platform_admin() returns boolean as $$
  select public.current_role_safe() = 'platform_admin';
$$ language sql stable security definer;

-- Helper: is this query running as a trusted server-side role?
-- Server actions connect via Drizzle as `postgres` / `service_role`.
-- Application code enforces tenant scoping (requireUser + where tenant_id = ...).
create or replace function public.is_server_role() returns boolean as $$
  select session_user in ('postgres','supabase_admin','service_role')
      or current_user in ('postgres','supabase_admin','service_role');
$$ language sql stable security definer;

-- =====================================================================
-- Mirror auth.users -> public.users automatically
-- =====================================================================
create or replace function public.handle_new_auth_user() returns trigger as $$
begin
  insert into public.users (id, tenant_id, role, full_name, email)
  values (
    new.id,
    nullif(new.raw_app_meta_data ->> 'tenant_id', '')::uuid,
    coalesce(new.raw_app_meta_data ->> 'role', 'operator')::public.user_role,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.email),
    new.email
  )
  on conflict (id) do update set
    email = excluded.email,
    full_name = coalesce(excluded.full_name, public.users.full_name);
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_auth_user();

-- =====================================================================
-- Enable RLS on every tenant table
-- =====================================================================
alter table tenants            enable row level security;
alter table tenant_settings    enable row level security;
alter table users              enable row level security;
alter table programs           enable row level security;
alter table leads              enable row level security;
alter table activities         enable row level security;
alter table email_templates    enable row level security;
alter table email_log          enable row level security;
alter table reminders          enable row level security;
alter table invoices           enable row level security;
alter table platform_audit     enable row level security;
alter table feature_flags      enable row level security;
alter table webhook_log        enable row level security;

-- =====================================================================
-- Policy: tenant-scoped reads/writes
-- Pattern: tenant_id = current_tenant_id()  OR  is_platform_admin()
-- =====================================================================

-- TENANTS: a member can see their own tenant row; server role can do anything
drop policy if exists tenants_select on tenants;
create policy tenants_select on tenants for select
  using (id = public.current_tenant_id() or public.is_platform_admin() or public.is_server_role());

drop policy if exists tenants_server on tenants;
create policy tenants_server on tenants for all
  using (public.is_server_role()) with check (public.is_server_role());

-- TENANT_SETTINGS
drop policy if exists tenant_settings_all on tenant_settings;
create policy tenant_settings_all on tenant_settings for all
  using (tenant_id = public.current_tenant_id() or public.is_platform_admin() or public.is_server_role())
  with check (tenant_id = public.current_tenant_id() or public.is_platform_admin() or public.is_server_role());

-- USERS
drop policy if exists users_select on users;
create policy users_select on users for select
  using (tenant_id = public.current_tenant_id() or public.is_platform_admin() or id = auth.uid() or public.is_server_role());

drop policy if exists users_update_self on users;
create policy users_update_self on users for update
  using (id = auth.uid() or public.is_platform_admin() or public.is_server_role())
  with check (id = auth.uid() or public.is_platform_admin() or public.is_server_role());

drop policy if exists users_server on users;
create policy users_server on users for all
  using (public.is_server_role()) with check (public.is_server_role());

-- PROGRAMS, LEADS, ACTIVITIES, EMAIL_TEMPLATES, EMAIL_LOG, REMINDERS — same pattern,
-- now with server-role bypass so Drizzle-driven server actions can write.
do $$ declare t text;
begin
  for t in select unnest(array[
    'programs','leads','activities','email_templates','email_log',
    'reminders','invoices','feature_flags','webhook_log'
  ]) loop
    execute format($f$
      drop policy if exists %1$s_all on %1$s;
      create policy %1$s_all on %1$s for all
        using (
          tenant_id = public.current_tenant_id()
          or public.is_platform_admin()
          or public.is_server_role()
        )
        with check (
          tenant_id = public.current_tenant_id()
          or public.is_platform_admin()
          or public.is_server_role()
        );
    $f$, t);
  end loop;
end $$;

-- PLATFORM_AUDIT: only platform admins or server role
drop policy if exists platform_audit_all on platform_audit;
create policy platform_audit_all on platform_audit for all
  using (public.is_platform_admin() or public.is_server_role())
  with check (public.is_platform_admin() or public.is_server_role());

-- =====================================================================
-- Service role bypass: server-side code using the service-role key
-- already bypasses RLS by default; no extra grants needed.
-- =====================================================================
