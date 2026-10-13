-- Delete conversation hides the current messages from both students and keeps the match.
-- The message rows stay so a reviewer can still read them.
-- Run this after 20261014050000_unmatch.sql. Safe to run again.

alter table public.matches add column if not exists active boolean not null default true;
alter table public.matches add column if not exists history_cutoff timestamptz not null default '-infinity';

create or replace function public.clear_conversation(match_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  me uuid := auth.uid();
  pair_a uuid;
  pair_b uuid;
  open_match boolean;
begin
  if me is null or match_id is null or not public.can_use_chat() then
    return;
  end if;

  select user_a, user_b, active
    into pair_a, pair_b, open_match
  from public.matches
  where id = match_id;

  if pair_a is null or not (me in (pair_a, pair_b)) or not open_match then
    return;
  end if;

  if exists (
    select 1 from public.blocks
    where (blocker_id = pair_a and blocked_id = pair_b)
       or (blocker_id = pair_b and blocked_id = pair_a)
  ) then
    return;
  end if;

  perform pg_advisory_xact_lock(hashtextextended(pair_a::text || ':' || pair_b::text, 0));

  select active into open_match
  from public.matches
  where id = match_id
    and me in (user_a, user_b);

  if not coalesce(open_match, false) then
    return;
  end if;

  if exists (
    select 1 from public.blocks
    where (blocker_id = pair_a and blocked_id = pair_b)
       or (blocker_id = pair_b and blocked_id = pair_a)
  ) then
    return;
  end if;

  perform set_config('amora.match_write', 'on', true);
  update public.matches
  set history_cutoff = coalesce(
    (select max(created_at) from public.messages where messages.match_id = clear_conversation.match_id),
    clock_timestamp()
  )
  where id = match_id and active;
end;
$$;

create or replace function public.guard_message_insert()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  pair_a uuid;
  pair_b uuid;
  cutoff timestamptz;
begin
  select user_a, user_b into pair_a, pair_b
  from public.matches
  where id = new.match_id;

  if pair_a is not null then
    perform pg_advisory_xact_lock(hashtextextended(pair_a::text || ':' || pair_b::text, 0));
  end if;

  select history_cutoff into cutoff from public.matches where id = new.match_id;
  new.created_at := greatest(clock_timestamp(), coalesce(cutoff, '-infinity'::timestamptz) + interval '1 microsecond');
  return new;
end;
$$;

drop trigger if exists guard_message_insert on public.messages;
create trigger guard_message_insert
  before insert on public.messages
  for each row execute function public.guard_message_insert();

revoke all on function public.clear_conversation(uuid) from public;
revoke all on function public.guard_message_insert() from public;
grant execute on function public.clear_conversation(uuid) to authenticated;
grant execute on function public.guard_message_insert() to authenticated;

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
  if current_setting('amora.match_write', true) is distinct from 'on' then
    new.active := old.active;
    new.history_cutoff := old.history_cutoff;
    if auth.uid() = old.user_a then
      new.seen_b := old.seen_b;
    elsif auth.uid() = old.user_b then
      new.seen_a := old.seen_a;
    end if;
  end if;

  return new;
end;
$$;

revoke delete on public.messages from authenticated;
drop policy if exists "messages delete" on public.messages;

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
          and matches.active
          and messages.created_at > matches.history_cutoff
          and not exists (
            select 1 from public.blocks
            where (blocker_id = matches.user_a and blocked_id = matches.user_b)
               or (blocker_id = matches.user_b and blocked_id = matches.user_a)
          )
      )
    )
  );
