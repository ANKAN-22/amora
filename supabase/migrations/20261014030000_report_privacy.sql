-- Reports stay with the person who filed them and with reviewers.
-- A reported message is copied onto the report so a later delete does not erase the evidence.
-- Run this in the Supabase SQL editor. Safe to run again.

alter table public.reports add column if not exists reviewed_at timestamptz;
alter table public.reports add column if not exists reviewed_by uuid;
alter table public.reports add column if not exists action_taken text not null default '';
alter table public.reports add column if not exists message_excerpt text not null default '';

update public.reports as report
set message_excerpt = message.body
from public.messages as message
where report.message_id = message.id
  and report.message_excerpt = '';

create or replace function public.protect_report()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  message_match uuid;
  message_sender uuid;
  message_body text;
begin
  if auth.uid() is null or new.reporter_id is distinct from auth.uid() then
    raise exception 'You can only file your own report.';
  end if;
  if new.target_id is null or new.target_id = new.reporter_id then
    raise exception 'Choose the student you are reporting.';
  end if;
  if not exists (
    select 1 from public.profiles
    where id = new.target_id and is_admin = false
  ) then
    raise exception 'That student cannot be reported.';
  end if;

  new.resolved := false;
  new.reviewed_at := null;
  new.reviewed_by := null;
  new.action_taken := '';
  new.message_excerpt := '';

  if new.message_id is not null then
    select match_id, sender_id, body
      into message_match, message_sender, message_body
    from public.messages
    where id = new.message_id;
    if message_match is null or message_sender is distinct from new.target_id then
      raise exception 'That message cannot be reported.';
    end if;
    if not exists (
      select 1 from public.matches
      where id = message_match
        and new.reporter_id in (user_a, user_b)
    ) then
      raise exception 'That message cannot be reported.';
    end if;
    new.match_id := message_match;
    new.message_excerpt := message_body;
  elsif new.match_id is not null then
    if not exists (
      select 1 from public.matches
      where id = new.match_id
        and new.reporter_id in (user_a, user_b)
        and new.target_id in (user_a, user_b)
    ) then
      raise exception 'That conversation cannot be reported.';
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists protect_report on public.reports;
create trigger protect_report
  before insert on public.reports
  for each row execute function public.protect_report();

revoke all on function public.protect_report() from public;
grant execute on function public.protect_report() to authenticated;

revoke all on public.reports from authenticated;
revoke all on public.reports from anon;
grant select (
  id, reporter_id, target_id, match_id, message_id, reason, resolved, created_at
) on public.reports to authenticated;
grant insert (reporter_id, target_id, match_id, message_id, reason) on public.reports to authenticated;
grant update (resolved, reviewed_at, reviewed_by, action_taken) on public.reports to authenticated;

create or replace view public.report_reviews
with (security_invoker = false) as
select
  id,
  reporter_id,
  target_id,
  match_id,
  message_id,
  message_excerpt,
  reason,
  resolved,
  created_at,
  reviewed_at,
  reviewed_by,
  action_taken
from public.reports
where public.is_admin();

grant select on public.report_reviews to authenticated;

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
