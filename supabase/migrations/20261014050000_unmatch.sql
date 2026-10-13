-- Unmatch closes the match for both students and removes both likes.
-- The match row and its messages stay, so a reviewer can still see them.
-- Run this after 20261014040000_block_enforcement.sql. Safe to run again.

alter table public.matches add column if not exists active boolean not null default true;
alter table public.matches add column if not exists history_cutoff timestamptz not null default '-infinity';

create or replace function public.unmatch_student(match_id uuid)
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
  if me is null or match_id is null then
    return;
  end if;

  select user_a, user_b, active
    into pair_a, pair_b, open_match
  from public.matches
  where id = match_id;

  if pair_a is null or not (me in (pair_a, pair_b)) or not open_match then
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

  perform set_config('amora.match_write', 'on', true);
  update public.matches
  set active = false
  where id = match_id and active;

  delete from public.likes
  where (from_id = pair_a and to_id = pair_b)
     or (from_id = pair_b and to_id = pair_a);
end;
$$;

revoke all on function public.unmatch_student(uuid) from public;
grant execute on function public.unmatch_student(uuid) to authenticated;

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

revoke delete on public.matches from authenticated;
revoke update on public.matches from authenticated;
grant update (seen_a, seen_b) on public.matches to authenticated;
drop policy if exists "matches delete" on public.matches;

drop policy if exists "matches read" on public.matches;
create policy "matches read" on public.matches
  for select to authenticated
  using (
    public.is_admin()
    or (
      auth.uid() in (user_a, user_b)
      and active
      and not exists (
        select 1 from public.blocks
        where (blocker_id = matches.user_a and blocked_id = matches.user_b)
           or (blocker_id = matches.user_b and blocked_id = matches.user_a)
      )
    )
  );

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
        and matches.active
        and not exists (
          select 1 from public.blocks
          where (blocker_id = matches.user_a and blocked_id = matches.user_b)
             or (blocker_id = matches.user_b and blocked_id = matches.user_a)
        )
    )
  );
