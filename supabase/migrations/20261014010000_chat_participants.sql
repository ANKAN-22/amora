-- Only the two people on a match can read or send its messages.
-- A student cannot create a match row directly. Reciprocal likes still create matches
-- through like_student. Run this in the Supabase SQL editor. Safe to run again.

alter table public.profiles add column if not exists account_status text not null default 'ACTIVE';

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

revoke all on function public.can_use_chat() from public;
grant execute on function public.can_use_chat() to authenticated;

drop policy if exists "matches insert" on public.matches;
revoke insert on public.matches from authenticated;
revoke insert on public.matches from anon;

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

revoke update on public.messages from authenticated;
revoke update on public.messages from anon;
