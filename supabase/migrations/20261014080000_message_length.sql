-- Reject blank messages and messages over 500 characters, after trimming spaces.
-- Run this in the Supabase SQL editor. Safe to run again.

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conrelid = 'public.messages'::regclass
      and contype = 'c'
      and pg_get_constraintdef(oid) ilike '%char_length(body)%'
  ) then
    alter table public.messages
      add constraint messages_body_length check (char_length(body) between 1 and 500);
  end if;
exception
  when duplicate_object then null;
end $$;

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
  new.body := btrim(coalesce(new.body, ''));
  if char_length(new.body) < 1 or char_length(new.body) > 500 then
    raise exception 'Message must be between 1 and 500 characters.'
      using errcode = '23514';
  end if;

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
