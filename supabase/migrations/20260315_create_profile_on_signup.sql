-- Run this in your Supabase SQL editor or include in a migration.

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

  profile_username := coalesce(
    new.raw_user_meta_data ->> 'username',
    split_part(new.email, '@', 1),
    new.id::text
  );
  profile_name := coalesce(
    new.raw_user_meta_data ->> 'name',
    profile_username
  );

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
