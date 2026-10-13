-- A block closes the match and removes likes, but it keeps messages for reviewers.
-- Students cannot read, send, or delete those messages while the block exists.
-- Run this in the Supabase SQL editor. Safe to run again.

alter table public.matches add column if not exists active boolean not null default true;
alter table public.matches add column if not exists history_cutoff timestamptz not null default '-infinity';

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
  match_active boolean;
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

  select id, active into match_id, match_active
  from public.matches
  where user_a = pair_a and user_b = pair_b;

  if match_id is null then
    return null;
  end if;

  if not match_active then
    perform set_config('amora.match_write', 'on', true);
    update public.matches
    set active = true,
        history_cutoff = now(),
        seen_a = false,
        seen_b = false
    where id = match_id;
  end if;

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
  pair_a uuid;
  pair_b uuid;
begin
  if me is null or target is null or target = me then
    return;
  end if;

  if not exists (
    select 1 from public.profiles where id = target and is_admin = false
  ) then
    return;
  end if;

  pair_a := least(me, target);
  pair_b := greatest(me, target);
  perform pg_advisory_xact_lock(hashtextextended(pair_a::text || ':' || pair_b::text, 0));

  insert into public.blocks (blocker_id, blocked_id) values (me, target)
  on conflict do nothing;
end;
$$;

create or replace function public.enforce_block()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  pair_a uuid := least(new.blocker_id, new.blocked_id);
  pair_b uuid := greatest(new.blocker_id, new.blocked_id);
begin
  perform pg_advisory_xact_lock(hashtextextended(pair_a::text || ':' || pair_b::text, 0));

  delete from public.hides
  where user_id = new.blocker_id and hidden_id = new.blocked_id;

  delete from public.likes
  where (from_id = new.blocker_id and to_id = new.blocked_id)
     or (from_id = new.blocked_id and to_id = new.blocker_id);

  perform set_config('amora.match_write', 'on', true);
  update public.matches
  set active = false
  where user_a = pair_a and user_b = pair_b and active;

  return new;
end;
$$;

drop trigger if exists enforce_block on public.blocks;
create trigger enforce_block
  after insert on public.blocks
  for each row execute function public.enforce_block();

revoke all on function public.enforce_block() from public;
grant execute on function public.enforce_block() to authenticated;

revoke all on function public.like_student(uuid) from public;
revoke all on function public.block_student(uuid) from public;
grant execute on function public.like_student(uuid) to authenticated;
grant execute on function public.block_student(uuid) to authenticated;

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

revoke update on public.matches from authenticated;
grant update (seen_a, seen_b) on public.matches to authenticated;

drop policy if exists "likes read" on public.likes;
create policy "likes read" on public.likes
  for select to authenticated
  using (
    public.is_admin()
    or (
      (from_id = auth.uid() or to_id = auth.uid())
      and not exists (
        select 1 from public.blocks
        where (blocker_id = likes.from_id and blocked_id = likes.to_id)
           or (blocker_id = likes.to_id and blocked_id = likes.from_id)
      )
    )
  );

drop policy if exists "likes insert" on public.likes;
create policy "likes insert" on public.likes
  for insert to authenticated
  with check (
    from_id = auth.uid()
    and not exists (
      select 1 from public.blocks
      where (blocker_id = likes.from_id and blocked_id = likes.to_id)
         or (blocker_id = likes.to_id and blocked_id = likes.from_id)
    )
  );

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

drop policy if exists "matches update" on public.matches;
create policy "matches update" on public.matches
  for update to authenticated
  using (
    auth.uid() in (user_a, user_b)
    and active
    and not exists (
      select 1 from public.blocks
      where (blocker_id = matches.user_a and blocked_id = matches.user_b)
         or (blocker_id = matches.user_b and blocked_id = matches.user_a)
    )
  )
  with check (auth.uid() in (user_a, user_b));

drop policy if exists "matches delete" on public.matches;
create policy "matches delete" on public.matches
  for delete to authenticated
  using (
    auth.uid() in (user_a, user_b)
    and active
    and not exists (
      select 1 from public.blocks
      where (blocker_id = matches.user_a and blocked_id = matches.user_b)
         or (blocker_id = matches.user_b and blocked_id = matches.user_a)
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

drop policy if exists "messages delete" on public.messages;
create policy "messages delete" on public.messages
  for delete to authenticated
  using (
    exists (
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
