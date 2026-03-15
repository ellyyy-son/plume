-- Make profile creation on auth signup deterministic:
-- - use raw username exactly as provided by auth metadata
-- - trim whitespace
-- - reject duplicate usernames (case-insensitive) instead of auto-altering the value
create or replace function public.handle_new_auth_user_profile()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  profile_username text;
  profile_name text;
begin
  set row_security = off;

  profile_username := nullif(btrim(new.raw_user_meta_data ->> 'username'), '');
  profile_name := nullif(btrim(new.raw_user_meta_data ->> 'name'), '');

  if profile_username is null or btrim(profile_username) = '' then
    raise exception 'Username is required in signup metadata.';
  end if;

  if profile_name is null or btrim(profile_name) = '' then
    raise exception 'Name is required in signup metadata.';
  end if;

  if exists (
    select 1
    from public.profile p
    where lower(p.username) = lower(profile_username)
      and p.user_id <> new.id
  ) then
    raise exception 'Username "%" is already taken.', profile_username
      using errcode = '23505';
  end if;

  insert into public.profile (user_id, username, name)
  values (
    new.id,
    profile_username,
    profile_name
  )
  on conflict (user_id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_create_profile on auth.users;

create trigger on_auth_user_create_profile
after insert on auth.users
for each row execute function public.handle_new_auth_user_profile();
