-- The Matches list needs the latest message, not the whole history.
-- An open chat loads older messages by match and time.
-- Run this in the Supabase SQL editor. Safe to run again.

drop index if exists public.messages_match_idx;

create index if not exists messages_match_created_idx
  on public.messages (match_id, created_at desc, id desc);

create or replace function public.match_previews()
returns table (
  match_id uuid,
  has_incoming boolean,
  message_id uuid,
  sender_id uuid,
  body text,
  created_at timestamptz
)
language sql
stable
security invoker
set search_path = public
as $$
  select
    m.id,
    exists (
      select 1
      from public.messages as msg
      where msg.match_id = m.id
        and msg.sender_id is distinct from auth.uid()
    ),
    latest.id,
    latest.sender_id,
    latest.body,
    latest.created_at
  from public.matches as m
  left join lateral (
    select msg.id, msg.sender_id, msg.body, msg.created_at
    from public.messages as msg
    where msg.match_id = m.id
    order by msg.created_at desc, msg.id desc
    limit 1
  ) as latest on true;
$$;

revoke all on function public.match_previews() from public;
grant execute on function public.match_previews() to authenticated;
