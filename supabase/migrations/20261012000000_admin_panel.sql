-- Amora admin panel migration.
-- Run this in the Supabase SQL editor AFTER supabase/schema.sql. Safe to run again.
--
-- What it adds:
--   1. profiles.account_status / ban_reason / pre_ban_status  (ban support)
--   2. subscriptions and payments tables (none existed before)
--   3. admin_audit_log (written only by the Edge Function)
--   4. reports.reviewed_at / reviewed_by / action_taken
--   5. protect_profile() now also stops students from editing the ban columns
--
-- It does NOT insert any subscription or payment rows. Those tables stay empty
-- until your real payment flow (or a webhook running with the service role) writes to them.

-- 1. Ban support ------------------------------------------------------------

alter table public.profiles add column if not exists account_status text not null default 'ACTIVE';
alter table public.profiles add column if not exists ban_reason text not null default '';
alter table public.profiles add column if not exists pre_ban_status text;

do $$
begin
  alter table public.profiles
    add constraint profiles_account_status_check check (account_status in ('ACTIVE', 'BANNED'));
exception
  when duplicate_object then null;
end $$;

create or replace function public.protect_profile()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null or public.is_admin() then
    return new;
  end if;

  new.id := old.id;
  new.email := old.email;
  new.is_admin := old.is_admin;
  new.created_at := old.created_at;
  new.account_status := old.account_status;
  new.ban_reason := old.ban_reason;
  new.pre_ban_status := old.pre_ban_status;

  if old.verification_status in ('PENDING', 'REJECTED', 'RESUBMISSION_REQUIRED')
     and new.verification_status = 'PENDING'
     and coalesce(new.screenshot_path, '') <> '' then
    new.review_note := '';
  else
    new.verification_status := old.verification_status;
    new.review_note := old.review_note;
  end if;

  return new;
end;
$$;

-- 2. Subscriptions and payments ----------------------------------------------

create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  plan text not null default 'premium',
  status text not null default 'ACTIVE' check (status in ('ACTIVE', 'CANCELED', 'EXPIRED')),
  started_at timestamptz not null default now(),
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists subscriptions_user_idx on public.subscriptions (user_id);

-- Payments are financial records. They must survive account deletion, so user_id is
-- set to null (not cascaded) and payer_ref keeps a one-way hash for audit matching.
create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles (id) on delete set null,
  subscription_id uuid references public.subscriptions (id) on delete set null,
  payer_ref text not null default '',
  provider text not null default '',
  transaction_id text not null unique,
  amount_minor bigint not null check (amount_minor >= 0),
  currency text not null default 'INR',
  status text not null check (status in ('PENDING', 'SUCCEEDED', 'FAILED', 'REFUNDED')),
  method text,
  paid_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists payments_user_idx on public.payments (user_id);
create index if not exists payments_status_idx on public.payments (status);

create or replace function public.set_payer_ref()
returns trigger
language plpgsql
as $$
begin
  if new.user_id is not null and coalesce(new.payer_ref, '') = '' then
    new.payer_ref := substr(encode(sha256(convert_to(new.user_id::text, 'UTF8')), 'hex'), 1, 12);
  end if;
  return new;
end;
$$;

drop trigger if exists payments_set_payer_ref on public.payments;
create trigger payments_set_payer_ref
  before insert on public.payments
  for each row execute function public.set_payer_ref();

alter table public.subscriptions enable row level security;
alter table public.payments enable row level security;

-- Admins may change only status and expiry. Students never write here.
grant select on public.subscriptions to authenticated;
grant update (status, expires_at, updated_at) on public.subscriptions to authenticated;
grant select on public.payments to authenticated;

drop policy if exists "subscriptions read" on public.subscriptions;
create policy "subscriptions read" on public.subscriptions
  for select to authenticated
  using (user_id = auth.uid() or public.is_admin());

drop policy if exists "subscriptions admin update" on public.subscriptions;
create policy "subscriptions admin update" on public.subscriptions
  for update to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "payments admin read" on public.payments;
create policy "payments admin read" on public.payments
  for select to authenticated
  using (public.is_admin());

-- No insert/update/delete policy or grant exists for payments on purpose:
-- only a server process using the service-role key can record or change a payment.

-- 3. Admin audit log ----------------------------------------------------------

create table if not exists public.admin_audit_log (
  id uuid primary key default gen_random_uuid(),
  admin_id uuid,
  action text not null,
  target_id uuid,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.admin_audit_log enable row level security;
grant select on public.admin_audit_log to authenticated;

drop policy if exists "audit admin read" on public.admin_audit_log;
create policy "audit admin read" on public.admin_audit_log
  for select to authenticated
  using (public.is_admin());

-- 4. Report review trail ------------------------------------------------------

alter table public.reports add column if not exists reviewed_at timestamptz;
alter table public.reports add column if not exists reviewed_by uuid;
alter table public.reports add column if not exists action_taken text not null default '';
