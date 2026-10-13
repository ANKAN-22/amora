-- Amora database. Run this in the Supabase SQL editor.
-- Safe to run again. It updates the rules without deleting student accounts.
--
-- Before sign-up works on localhost:
-- Authentication → Providers → Email → turn off "Confirm email".
--
-- After you create the reviewer account (Authentication → Users → Add user),
-- mark it as admin. Replace the email, then run:
--   update public.profiles set is_admin = true where email = 'you@email.com';

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null unique,
  name text not null default '',
  age integer not null default 0,
  department text not null default '',
  year text not null default '',
  student_id text not null default '',
  verification_status text not null default 'PENDING'
    check (verification_status in ('PENDING', 'APPROVED', 'REJECTED', 'RESUBMISSION_REQUIRED', 'SUSPENDED')),
  review_note text not null default '',
  screenshot_path text,
  submitted_at timestamptz,
  bio text not null default '',
  prompts jsonb not null default '[]'::jsonb,
  interests text[] not null default '{}',
  gender text not null default '',
  looking_for text not null default '',
  age_min integer not null default 18,
  age_max integer not null default 26,
  photo_paths text[] not null default '{}',
  show_age boolean not null default true,
  show_campus boolean not null default true,
  notify_likes boolean not null default true,
  notify_matches boolean not null default true,
  notify_messages boolean not null default true,
  is_admin boolean not null default false,
  created_at timestamptz not null default now()
);

create unique index if not exists profiles_student_id_unique
  on public.profiles (student_id)
  where student_id <> '';

create table if not exists public.likes (
  from_id uuid not null references public.profiles (id) on delete cascade,
  to_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (from_id, to_id),
  check (from_id <> to_id)
);

create table if not exists public.passes (
  from_id uuid not null references public.profiles (id) on delete cascade,
  to_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (from_id, to_id)
);

create table if not exists public.hides (
  user_id uuid not null references public.profiles (id) on delete cascade,
  hidden_id uuid not null references public.profiles (id) on delete cascade,
  primary key (user_id, hidden_id)
);

create table if not exists public.blocks (
  blocker_id uuid not null references public.profiles (id) on delete cascade,
  blocked_id uuid not null references public.profiles (id) on delete cascade,
  primary key (blocker_id, blocked_id),
  check (blocker_id <> blocked_id)
);

create table if not exists public.matches (
  id uuid primary key default gen_random_uuid(),
  user_a uuid not null references public.profiles (id) on delete cascade,
  user_b uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  seen_a boolean not null default false,
  seen_b boolean not null default false,
  check (user_a < user_b),
  unique (user_a, user_b)
);

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  match_id uuid not null references public.matches (id) on delete cascade,
  sender_id uuid not null references public.profiles (id) on delete cascade,
  body text not null check (char_length(body) between 1 and 500),
  created_at timestamptz not null default now()
);

create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references public.profiles (id) on delete cascade,
  target_id uuid not null references public.profiles (id) on delete cascade,
  match_id uuid,
  message_id uuid,
  reason text not null,
  resolved boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists likes_to_idx on public.likes (to_id);
create index if not exists matches_user_b_idx on public.matches (user_b);
create index if not exists messages_match_idx on public.messages (match_id);

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce((select is_admin from public.profiles where id = auth.uid()), false);
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, name)
  values (new.id, coalesce(new.email, ''), coalesce(new.raw_user_meta_data->>'name', ''));
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

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

drop trigger if exists protect_profile on public.profiles;
create trigger protect_profile
  before update on public.profiles
  for each row execute function public.protect_profile();

create or replace function public.like_student(target uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  me uuid := auth.uid();
  pair_a uuid;
  pair_b uuid;
  match_id uuid;
begin
  if me is null or target is null or target = me then
    return null;
  end if;

  if not exists (
    select 1 from public.profiles
    where id = target and verification_status = 'APPROVED' and is_admin = false
  ) then
    return null;
  end if;

  if exists (
    select 1 from public.blocks
    where (blocker_id = me and blocked_id = target)
       or (blocker_id = target and blocked_id = me)
  ) then
    return null;
  end if;

  insert into public.likes (from_id, to_id) values (me, target)
  on conflict do nothing;

  delete from public.passes where from_id = me and to_id = target;
  delete from public.hides where user_id = me and hidden_id = target;

  if not exists (select 1 from public.likes where from_id = target and to_id = me) then
    return null;
  end if;

  if me < target then
    pair_a := me;
    pair_b := target;
  else
    pair_a := target;
    pair_b := me;
  end if;

  insert into public.matches (user_a, user_b) values (pair_a, pair_b)
  on conflict (user_a, user_b) do nothing;

  select id into match_id from public.matches where user_a = pair_a and user_b = pair_b;
  return match_id;
end;
$$;

create or replace function public.block_student(target uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  me uuid := auth.uid();
begin
  if me is null or target is null or target = me then
    return;
  end if;

  insert into public.blocks (blocker_id, blocked_id) values (me, target)
  on conflict do nothing;

  delete from public.hides where user_id = me and hidden_id = target;
  delete from public.likes
  where (from_id = me and to_id = target) or (from_id = target and to_id = me);
  delete from public.matches
  where user_a = least(me, target) and user_b = greatest(me, target);
end;
$$;

create or replace function public.delete_own_account()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    return;
  end if;
  delete from auth.users where id = auth.uid();
end;
$$;

-- Permanent admin delete. Removes the login, which cascades the profile, likes,
-- matches, messages and reports. The website removes photos first.
create or replace function public.admin_delete_account(target uuid, confirm_email text)
returns text[]
language plpgsql
security definer
set search_path = public
as $$
declare
  warnings text[] := array[]::text[];
  target_email text;
  target_admin boolean;
  admin_count integer;
begin
  if auth.uid() is null or not public.is_admin() then
    raise exception 'Admin permission required.';
  end if;
  if target is null or target = auth.uid() then
    raise exception 'You cannot delete your own account from the admin panel.';
  end if;

  select email, is_admin into target_email, target_admin
  from public.profiles
  where id = target;

  if target_email is null then
    raise exception 'That account no longer exists.';
  end if;
  if lower(trim(confirm_email)) <> lower(trim(target_email)) then
    raise exception 'The confirmation email does not match this account.';
  end if;
  if target_admin then
    select count(*) into admin_count from public.profiles where is_admin = true;
    if admin_count <= 1 then
      raise exception 'This is the last administrator and cannot be deleted.';
    end if;
  end if;

  begin
    delete from storage.objects
    where bucket_id in ('enrollment', 'photos')
      and split_part(name, '/', 1) = target::text;
  exception
    when others then
      warnings := array_append(warnings, 'Photos or the enrollment screenshot could not be removed.');
  end;

  delete from auth.users where id = target;
  delete from public.profiles where id = target;

  return warnings;
end;
$$;

create or replace function public.admin_ban_account(target uuid, reason text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  target_admin boolean;
  target_status text;
  current_status text;
begin
  if auth.uid() is null or not public.is_admin() then
    raise exception 'Admin permission required.';
  end if;
  if target is null or target = auth.uid() then
    raise exception 'You cannot ban your own account.';
  end if;

  select is_admin, verification_status, account_status
    into target_admin, current_status, target_status
  from public.profiles
  where id = target;

  if current_status is null then
    raise exception 'That account no longer exists.';
  end if;
  if target_admin then
    raise exception 'Administrators cannot be banned. Remove admin access first.';
  end if;
  if target_status = 'BANNED' then
    raise exception 'This account is already banned.';
  end if;

  update auth.users
  set banned_until = now() + interval '100 years'
  where id = target;

  update public.profiles
  set account_status = 'BANNED',
      ban_reason = left(coalesce(reason, ''), 300),
      pre_ban_status = current_status,
      verification_status = 'SUSPENDED',
      review_note = 'This account has been banned.'
  where id = target;
end;
$$;

create or replace function public.admin_unban_account(target uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  current_status text;
  previous_status text;
  restored text;
begin
  if auth.uid() is null or not public.is_admin() then
    raise exception 'Admin permission required.';
  end if;

  select account_status, pre_ban_status into current_status, previous_status
  from public.profiles
  where id = target;

  if current_status is null then
    raise exception 'That account no longer exists.';
  end if;
  if current_status <> 'BANNED' then
    raise exception 'This account is not banned.';
  end if;

  restored := case
    when previous_status is null or previous_status = 'SUSPENDED' then 'PENDING'
    else previous_status
  end;

  update auth.users
  set banned_until = null
  where id = target;

  update public.profiles
  set account_status = 'ACTIVE',
      ban_reason = '',
      pre_ban_status = null,
      verification_status = restored,
      review_note = ''
  where id = target;
end;
$$;

alter table public.profiles add column if not exists account_status text not null default 'ACTIVE';

-- Chat is limited to a signed-in student who is approved, 18 or older, and not banned.
create or replace function public.can_use_chat()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and is_admin = false
      and verification_status = 'APPROVED'
      and age >= 18
      and account_status = 'ACTIVE'
  );
$$;

revoke all on function public.is_admin() from public;
revoke all on function public.like_student(uuid) from public;
revoke all on function public.block_student(uuid) from public;
revoke all on function public.delete_own_account() from public;
revoke all on function public.admin_delete_account(uuid, text) from public;
revoke all on function public.admin_ban_account(uuid, text) from public;
revoke all on function public.admin_unban_account(uuid) from public;
revoke all on function public.can_use_chat() from public;
grant execute on function public.is_admin() to authenticated;
grant execute on function public.like_student(uuid) to authenticated;
grant execute on function public.block_student(uuid) to authenticated;
grant execute on function public.delete_own_account() to authenticated;
grant execute on function public.admin_delete_account(uuid, text) to authenticated;
grant execute on function public.admin_ban_account(uuid, text) to authenticated;
grant execute on function public.admin_unban_account(uuid) to authenticated;
grant execute on function public.can_use_chat() to authenticated;

alter table public.profiles enable row level security;
alter table public.likes enable row level security;
alter table public.passes enable row level security;
alter table public.hides enable row level security;
alter table public.blocks enable row level security;
alter table public.matches enable row level security;
alter table public.messages enable row level security;
alter table public.reports enable row level security;

grant select, update on public.profiles to authenticated;
grant select, insert, delete on public.likes to authenticated;
grant select, insert, delete on public.passes to authenticated;
grant select, insert, delete on public.hides to authenticated;
grant select, insert, delete on public.blocks to authenticated;
grant select, insert, update, delete on public.matches to authenticated;
grant select, insert, delete on public.messages to authenticated;
grant select, insert, update on public.reports to authenticated;

drop policy if exists "profiles read" on public.profiles;
create policy "profiles read" on public.profiles
  for select to authenticated
  using (id = auth.uid() or public.is_admin());

drop policy if exists "profiles update" on public.profiles;
create policy "profiles update" on public.profiles
  for update to authenticated
  using (id = auth.uid() or public.is_admin())
  with check (id = auth.uid() or public.is_admin());

drop policy if exists "likes read" on public.likes;
create policy "likes read" on public.likes
  for select to authenticated
  using (from_id = auth.uid() or to_id = auth.uid() or public.is_admin());

drop policy if exists "likes insert" on public.likes;
create policy "likes insert" on public.likes
  for insert to authenticated
  with check (from_id = auth.uid());

drop policy if exists "likes delete" on public.likes;
create policy "likes delete" on public.likes
  for delete to authenticated
  using (from_id = auth.uid() or public.is_admin());

drop policy if exists "passes read" on public.passes;
create policy "passes read" on public.passes
  for select to authenticated
  using (from_id = auth.uid());

drop policy if exists "passes insert" on public.passes;
create policy "passes insert" on public.passes
  for insert to authenticated
  with check (from_id = auth.uid());

drop policy if exists "passes delete" on public.passes;
create policy "passes delete" on public.passes
  for delete to authenticated
  using (from_id = auth.uid());

drop policy if exists "hides read" on public.hides;
create policy "hides read" on public.hides
  for select to authenticated
  using (user_id = auth.uid());

drop policy if exists "hides insert" on public.hides;
create policy "hides insert" on public.hides
  for insert to authenticated
  with check (user_id = auth.uid());

drop policy if exists "hides delete" on public.hides;
create policy "hides delete" on public.hides
  for delete to authenticated
  using (user_id = auth.uid());

drop policy if exists "blocks read" on public.blocks;
create policy "blocks read" on public.blocks
  for select to authenticated
  using (blocker_id = auth.uid() or blocked_id = auth.uid() or public.is_admin());

drop policy if exists "blocks insert" on public.blocks;
create policy "blocks insert" on public.blocks
  for insert to authenticated
  with check (blocker_id = auth.uid());

drop policy if exists "blocks delete" on public.blocks;
create policy "blocks delete" on public.blocks
  for delete to authenticated
  using (blocker_id = auth.uid());

drop policy if exists "matches read" on public.matches;
create policy "matches read" on public.matches
  for select to authenticated
  using (auth.uid() in (user_a, user_b) or public.is_admin());

drop policy if exists "matches insert" on public.matches;
create policy "matches insert" on public.matches
  for insert to authenticated
  with check (auth.uid() in (user_a, user_b));

drop policy if exists "matches update" on public.matches;
create policy "matches update" on public.matches
  for update to authenticated
  using (auth.uid() in (user_a, user_b))
  with check (auth.uid() in (user_a, user_b));

drop policy if exists "matches delete" on public.matches;
create policy "matches delete" on public.matches
  for delete to authenticated
  using (auth.uid() in (user_a, user_b));

create or replace function public.protect_match()
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
  new.user_a := old.user_a;
  new.user_b := old.user_b;
  new.created_at := old.created_at;

  if auth.uid() = old.user_a then
    new.seen_b := old.seen_b;
  elsif auth.uid() = old.user_b then
    new.seen_a := old.seen_a;
  end if;

  return new;
end;
$$;

drop trigger if exists protect_match on public.matches;
create trigger protect_match
  before update on public.matches
  for each row execute function public.protect_match();

drop policy if exists "messages read" on public.messages;
create policy "messages read" on public.messages
  for select to authenticated
  using (
    public.is_admin()
    or (
      public.can_use_chat()
      and exists (
        select 1 from public.matches
        where matches.id = messages.match_id
          and auth.uid() in (matches.user_a, matches.user_b)
      )
    )
  );

drop policy if exists "messages insert" on public.messages;
create policy "messages insert" on public.messages
  for insert to authenticated
  with check (
    public.can_use_chat()
    and sender_id = auth.uid()
    and exists (
      select 1 from public.matches
      where matches.id = messages.match_id
        and auth.uid() in (matches.user_a, matches.user_b)
    )
  );

drop policy if exists "messages delete" on public.messages;
create policy "messages delete" on public.messages
  for delete to authenticated
  using (
    exists (
      select 1 from public.matches
      where matches.id = messages.match_id
        and auth.uid() in (matches.user_a, matches.user_b)
    )
  );

drop policy if exists "reports read" on public.reports;
create policy "reports read" on public.reports
  for select to authenticated
  using (reporter_id = auth.uid() or public.is_admin());

drop policy if exists "reports insert" on public.reports;
create policy "reports insert" on public.reports
  for insert to authenticated
  with check (reporter_id = auth.uid());

drop policy if exists "reports update" on public.reports;
create policy "reports update" on public.reports
  for update to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create or replace view public.directory
with (security_invoker = false) as
select
  id,
  name,
  age,
  department,
  year,
  bio,
  prompts,
  interests,
  gender,
  looking_for,
  age_min,
  age_max,
  photo_paths,
  verification_status
from public.profiles
where is_admin = false
  and verification_status = 'APPROVED';

grant select on public.directory to authenticated;

insert into storage.buckets (id, name, public)
values ('enrollment', 'enrollment', false), ('photos', 'photos', false)
on conflict (id) do nothing;

drop policy if exists "enrollment insert own" on storage.objects;
create policy "enrollment insert own" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'enrollment'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "enrollment update own" on storage.objects;
create policy "enrollment update own" on storage.objects
  for update to authenticated
  using (
    bucket_id = 'enrollment'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "enrollment read own or admin" on storage.objects;
create policy "enrollment read own or admin" on storage.objects
  for select to authenticated
  using (
    bucket_id = 'enrollment'
    and (
      (storage.foldername(name))[1] = auth.uid()::text
      or public.is_admin()
    )
  );

drop policy if exists "enrollment delete own" on storage.objects;
create policy "enrollment delete own" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'enrollment'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "admin delete enrollment files" on storage.objects;
create policy "admin delete enrollment files" on storage.objects
  for delete to authenticated
  using (bucket_id = 'enrollment' and public.is_admin());

drop policy if exists "photos insert own" on storage.objects;
create policy "photos insert own" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "photos update own" on storage.objects;
create policy "photos update own" on storage.objects
  for update to authenticated
  using (
    bucket_id = 'photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "photos delete own" on storage.objects;
create policy "photos delete own" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "admin delete photo files" on storage.objects;
create policy "admin delete photo files" on storage.objects
  for delete to authenticated
  using (bucket_id = 'photos' and public.is_admin());

create or replace function public.can_read_photo(owner_id text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.is_admin()
    or owner_id = auth.uid()::text
    or exists (
      select 1 from public.profiles
      where id::text = owner_id
        and is_admin = false
        and verification_status = 'APPROVED'
    );
$$;

revoke all on function public.can_read_photo(text) from public;
grant execute on function public.can_read_photo(text) to authenticated;

drop policy if exists "photos read signed in" on storage.objects;
create policy "photos read signed in" on storage.objects
  for select to authenticated
  using (
    bucket_id = 'photos'
    and public.can_read_photo((storage.foldername(name))[1])
  );

do $$
begin
  alter publication supabase_realtime add table public.profiles;
exception
  when duplicate_object then null;
end $$;

do $$
begin
  alter publication supabase_realtime add table public.messages;
exception
  when duplicate_object then null;
end $$;

do $$
begin
  alter publication supabase_realtime add table public.likes;
exception
  when duplicate_object then null;
end $$;

do $$
begin
  alter publication supabase_realtime add table public.matches;
exception
  when duplicate_object then null;
end $$;
