-- Lets an admin permanently delete a student account from the Users page.
-- Run this once in the Supabase SQL editor. Safe to run again.

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
      warnings := warnings || 'The account was removed, but some photos or the enrollment screenshot may still be in storage.';
  end;

  delete from auth.users where id = target;
  delete from public.profiles where id = target;

  return warnings;
end;
$$;

revoke all on function public.admin_delete_account(uuid, text) from public;
grant execute on function public.admin_delete_account(uuid, text) to authenticated;
