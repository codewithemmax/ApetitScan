-- Unit 2: additive ApetitScan schema and row-level security.
-- Legacy tables and columns remain in place; this migration only adds the new model.

create table if not exists public.foods (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  category text not null check (category in ('carb_staple', 'protein', 'vegetable', 'stew_soup', 'other')),
  is_main_carb boolean not null default false,
  verified boolean not null default false
);

create table if not exists public.food_nutrition (
  id uuid primary key default gen_random_uuid(),
  food_id uuid not null references public.foods(id) on delete cascade,
  preparation text not null,
  portion_size text not null check (portion_size in ('small', 'medium', 'large')),
  carbs_low_g numeric not null check (carbs_low_g >= 0),
  carbs_high_g numeric not null check (carbs_high_g >= carbs_low_g),
  gi_category text check (gi_category in ('low', 'medium', 'high')),
  gi_source text,
  source_note text not null,
  entry_confidence integer not null check (entry_confidence between 0 and 100),
  unique (food_id, preparation, portion_size),
  check (gi_category is null or nullif(btrim(gi_source), '') is not null)
);

create index if not exists food_nutrition_food_id_idx on public.food_nutrition (food_id);

alter table public.scans
  alter column source drop not null;

alter table public.scans
  add column if not exists status text not null default 'needs_input' check (status in ('needs_input', 'complete')),
  add column if not exists components jsonb,
  add column if not exists carbs_low_g numeric,
  add column if not exists carbs_high_g numeric,
  add column if not exists spoons_low numeric,
  add column if not exists spoons_high numeric,
  add column if not exists meal_impact text,
  add column if not exists confidence_overall integer,
  add column if not exists confidence_breakdown jsonb,
  add column if not exists meal_prepared boolean,
  add column if not exists buffer_actions jsonb;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.scans'::regclass and conname = 'scans_carbohydrate_range_check'
  ) then
    alter table public.scans add constraint scans_carbohydrate_range_check
      check ((carbs_low_g is null and carbs_high_g is null) or (carbs_low_g >= 0 and carbs_high_g >= carbs_low_g));
  end if;
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.scans'::regclass and conname = 'scans_spoon_range_check'
  ) then
    alter table public.scans add constraint scans_spoon_range_check
      check ((spoons_low is null and spoons_high is null) or (spoons_low >= 0 and spoons_high >= spoons_low));
  end if;
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.scans'::regclass and conname = 'scans_meal_impact_check'
  ) then
    alter table public.scans add constraint scans_meal_impact_check
      check (meal_impact is null or meal_impact in ('low', 'moderate', 'high'));
  end if;
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.scans'::regclass and conname = 'scans_confidence_overall_check'
  ) then
    alter table public.scans add constraint scans_confidence_overall_check
      check (confidence_overall is null or confidence_overall between 0 and 100);
  end if;
end $$;

create index if not exists scans_user_created_at_idx on public.scans (user_id, created_at desc);

create table if not exists public.scan_corrections (
  id uuid primary key default gen_random_uuid(),
  scan_id uuid not null references public.scans(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  step text not null check (step in ('food', 'portion', 'preparation', 'main_carbohydrate')),
  original jsonb not null,
  corrected jsonb not null,
  created_at timestamptz not null default now()
);

create index if not exists scan_corrections_scan_id_idx on public.scan_corrections (scan_id);
create index if not exists scan_corrections_user_created_at_idx on public.scan_corrections (user_id, created_at desc);

alter table public.scans enable row level security;
alter table public.scan_corrections enable row level security;

drop policy if exists scans_select_own on public.scans;
create policy scans_select_own on public.scans
  for select to authenticated using ((select auth.uid()) = user_id);

drop policy if exists scans_insert_own on public.scans;
create policy scans_insert_own on public.scans
  for insert to authenticated with check ((select auth.uid()) = user_id);

drop policy if exists scans_update_own on public.scans;
create policy scans_update_own on public.scans
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists scans_delete_own on public.scans;
create policy scans_delete_own on public.scans
  for delete to authenticated using ((select auth.uid()) = user_id);

drop policy if exists scan_corrections_select_own on public.scan_corrections;
create policy scan_corrections_select_own on public.scan_corrections
  for select to authenticated using ((select auth.uid()) = user_id);

drop policy if exists scan_corrections_insert_own on public.scan_corrections;
create policy scan_corrections_insert_own on public.scan_corrections
  for insert to authenticated with check ((select auth.uid()) = user_id);

drop policy if exists scan_corrections_update_own on public.scan_corrections;
create policy scan_corrections_update_own on public.scan_corrections
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists scan_corrections_delete_own on public.scan_corrections;
create policy scan_corrections_delete_own on public.scan_corrections
  for delete to authenticated using ((select auth.uid()) = user_id);
