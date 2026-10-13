-- One match per student pair, including when both likes arrive at the same time.
-- Run this in the Supabase SQL editor. Safe to run again. It does not delete matches.

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conrelid = 'public.matches'::regclass
      and contype = 'c'
      and pg_get_constraintdef(oid) ilike '%user_a%<%user_b%'
  ) then
    alter table public.matches
      add constraint matches_user_a_lt_user_b check (user_a < user_b);
  end if;
exception
  when duplicate_object then null;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conrelid = 'public.matches'::regclass
      and contype = 'u'
      and pg_get_constraintdef(oid) ilike '%user_a%'
      and pg_get_constraintdef(oid) ilike '%user_b%'
  ) then
    alter table public.matches
      add constraint matches_user_a_user_b_key unique (user_a, user_b);
  end if;
exception
  when duplicate_object then null;
end $$;

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

  pair_a := least(me, target);
  pair_b := greatest(me, target);
  perform pg_advisory_xact_lock(hashtextextended(pair_a::text || ':' || pair_b::text, 0));

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

  insert into public.matches (user_a, user_b) values (pair_a, pair_b)
  on conflict (user_a, user_b) do nothing;

  select id into match_id from public.matches where user_a = pair_a and user_b = pair_b;
  return match_id;
end;
$$;

revoke all on function public.like_student(uuid) from public;
grant execute on function public.like_student(uuid) to authenticated;
