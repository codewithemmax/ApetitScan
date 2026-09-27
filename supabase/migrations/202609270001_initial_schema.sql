create extension if not exists pgcrypto;
create table if not exists users (id uuid primary key default gen_random_uuid(), name text not null, created_at timestamptz not null default now());
create table if not exists allergy_profiles (id uuid primary key default gen_random_uuid(), user_id uuid not null references users(id), allergen text not null);
create table if not exists dish_cache (id uuid primary key default gen_random_uuid(), dish_name text not null unique, verified boolean not null default false);
create table if not exists dish_ingredients (id uuid primary key default gen_random_uuid(), dish_cache_id uuid not null references dish_cache(id), ingredient text not null, tier text not null check (tier in ('always','commonly','sometimes')), allergen_category text not null, regional_note text);
create table if not exists scans (id uuid primary key default gen_random_uuid(), user_id uuid references users(id), image_url text, matched_dish text, source text not null check (source in ('cache','llm_fallback')), created_at timestamptz not null default now());
