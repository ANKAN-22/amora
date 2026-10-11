-- Admin delete, ban, and unban. Run this again in the Supabase SQL editor.
-- Safe to run again. It does not delete any account by itself.

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

revoke all on function public.admin_delete_account(uuid, text) from public;
revoke all on function public.admin_ban_account(uuid, text) from public;
revoke all on function public.admin_unban_account(uuid) from public;
grant execute on function public.admin_delete_account(uuid, text) to authenticated;
grant execute on function public.admin_ban_account(uuid, text) to authenticated;
grant execute on function public.admin_unban_account(uuid) to authenticated;

drop policy if exists "admin delete enrollment files" on storage.objects;
create policy "admin delete enrollment files" on storage.objects
  for delete to authenticated
  using (bucket_id = 'enrollment' and public.is_admin());

drop policy if exists "admin delete photo files" on storage.objects;
create policy "admin delete photo files" on storage.objects
  for delete to authenticated
  using (bucket_id = 'photos' and public.is_admin());
