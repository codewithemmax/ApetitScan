-- Unit 2: retrofit the legacy demo schema onto Supabase Auth.
-- The original migration remains unchanged; this migration preserves rows.

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null,
  created_at timestamptz not null default now()
);

alter table public.allergy_profiles
  add column if not exists id uuid default gen_random_uuid();
alter table public.allergy_profiles alter column id set not null;

do $$
begin
  if not exists (select 1 from pg_constraint where conrelid = 'public.allergy_profiles'::regclass and contype = 'p') then
    alter table public.allergy_profiles add primary key (id);
  end if;
end $$;

alter table public.scans add column if not exists flags jsonb not null default '[]'::jsonb;

do $$
declare constraint_name text;
begin
  for constraint_name in select c.conname from pg_constraint c where c.conrelid = 'public.allergy_profiles'::regclass and c.contype = 'f' and pg_get_constraintdef(c.oid) like '%REFERENCES public.users(%'
  loop execute format('alter table public.allergy_profiles drop constraint %I', constraint_name); end loop;
end $$;

do $$
declare constraint_name text;
begin
  for constraint_name in select c.conname from pg_constraint c where c.conrelid = 'public.scans'::regclass and c.contype = 'f' and pg_get_constraintdef(c.oid) like '%REFERENCES public.users(%'
  loop execute format('alter table public.scans drop constraint %I', constraint_name); end loop;
end $$;

do $$
begin
  if not exists (select 1 from pg_constraint where conrelid = 'public.allergy_profiles'::regclass and conname = 'allergy_profiles_user_id_auth_users_fkey') then
    alter table public.allergy_profiles add constraint allergy_profiles_user_id_auth_users_fkey foreign key (user_id) references auth.users(id) on delete cascade;
  end if;
end $$;

do $$
begin
  if not exists (select 1 from pg_constraint where conrelid = 'public.scans'::regclass and conname = 'scans_user_id_auth_users_fkey') then
    alter table public.scans add constraint scans_user_id_auth_users_fkey foreign key (user_id) references auth.users(id) on delete cascade;
  end if;
end $$;

alter table public.profiles enable row level security;
alter table public.allergy_profiles enable row level security;
alter table public.scans enable row level security;

drop policy if exists profiles_select_own on public.profiles;
create policy profiles_select_own on public.profiles for select using (auth.uid() = id);
drop policy if exists profiles_insert_own on public.profiles;
create policy profiles_insert_own on public.profiles for insert with check (auth.uid() = id);
drop policy if exists profiles_update_own on public.profiles;
create policy profiles_update_own on public.profiles for update using (auth.uid() = id) with check (auth.uid() = id);

drop policy if exists allergy_profiles_select_own on public.allergy_profiles;
create policy allergy_profiles_select_own on public.allergy_profiles for select using (auth.uid() = user_id);
drop policy if exists allergy_profiles_insert_own on public.allergy_profiles;
create policy allergy_profiles_insert_own on public.allergy_profiles for insert with check (auth.uid() = user_id);
drop policy if exists allergy_profiles_update_own on public.allergy_profiles;
create policy allergy_profiles_update_own on public.allergy_profiles for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists allergy_profiles_delete_own on public.allergy_profiles;
create policy allergy_profiles_delete_own on public.allergy_profiles for delete using (auth.uid() = user_id);

drop policy if exists scans_select_own on public.scans;
create policy scans_select_own on public.scans for select using (auth.uid() = user_id);
drop policy if exists scans_insert_own on public.scans;
create policy scans_insert_own on public.scans for insert with check (auth.uid() = user_id);
drop policy if exists scans_delete_own on public.scans;
create policy scans_delete_own on public.scans for delete using (auth.uid() = user_id);
