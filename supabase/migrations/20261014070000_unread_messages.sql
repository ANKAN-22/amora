-- A new message marks the conversation unread for the recipient only.
-- Opening the chat is what marks it read again. Run this in the Supabase SQL editor. Safe to run again.

create or replace function public.unread_recipient()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  pair_a uuid;
  pair_b uuid;
begin
  select user_a, user_b into pair_a, pair_b
  from public.matches
  where id = new.match_id;

  if pair_a is null then
    return new;
  end if;

  perform set_config('amora.match_write', 'on', true);
  if new.sender_id = pair_a then
    update public.matches set seen_b = false where id = new.match_id and seen_b;
  elsif new.sender_id = pair_b then
    update public.matches set seen_a = false where id = new.match_id and seen_a;
  end if;

  return new;
end;
$$;

drop trigger if exists unread_recipient on public.messages;
create trigger unread_recipient
  after insert on public.messages
  for each row execute function public.unread_recipient();

revoke all on function public.unread_recipient() from public;
grant execute on function public.unread_recipient() to authenticated;

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
