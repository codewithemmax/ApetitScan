-- Corrective additive migration for projects that applied the original
-- migration before the Auth foreign-key retrofit.

alter table public.scans
  drop constraint if exists scans_user_id_fkey;

alter table public.allergy_profiles
  drop constraint if exists allergy_profiles_user_id_fkey;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conrelid = 'public.scans'::regclass
      and conname = 'scans_user_id_auth_users_fkey'
  ) then
    alter table public.scans
      add constraint scans_user_id_auth_users_fkey
      foreign key (user_id) references auth.users(id) on delete cascade;
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conrelid = 'public.allergy_profiles'::regclass
      and conname = 'allergy_profiles_user_id_auth_users_fkey'
  ) then
    alter table public.allergy_profiles
      add constraint allergy_profiles_user_id_auth_users_fkey
      foreign key (user_id) references auth.users(id) on delete cascade;
  end if;
end $$;
