alter table public.scans
  add column if not exists ingredients jsonb not null default '[]'::jsonb;
