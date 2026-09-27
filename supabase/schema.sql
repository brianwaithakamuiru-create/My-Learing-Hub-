-- My Learning Hub: Supabase schema
-- Run this once in the Supabase SQL Editor.

create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default 'Scholar',
  username text not null,
  normalized_username text not null unique,
  email text,
  country text default 'Kenya',
  academic_year text default 'Year 3 (2026/2027)',
  current_semester text default 'Trimester 2 - 2026',
  semester text default 'Trimester 2 - 2026',
  role text not null default 'student' check (role in ('student','researcher','admin')),
  account_status text not null default 'ACTIVE' check (account_status in ('ACTIVE','DISABLED','PENDING')),
  email_verified boolean not null default false,
  avatar_url text default '',
  photo_url text default '',
  preferences jsonb not null default '{"overlayStrength":60,"backgroundBlur":0,"clockAnimation":true,"backgroundPosition":"center"}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  last_login_at timestamptz
);

create table if not exists public.academic_records (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  kind text not null check (kind in ('document','class','assignment','note','goal','focus_session','exam','knowledge','revision','calendar','notification','timetable')),
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists academic_records_owner_kind_idx on public.academic_records(owner_id, kind);
create index if not exists academic_records_created_idx on public.academic_records(owner_id, created_at desc);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

drop trigger if exists academic_records_set_updated_at on public.academic_records;
create trigger academic_records_set_updated_at
before update on public.academic_records
for each row execute function public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  supplied_username text;
begin
  supplied_username := coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1));
  insert into public.profiles (
    id, full_name, username, normalized_username, email, country,
    academic_year, current_semester, semester, role, account_status,
    email_verified, preferences
  )
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', 'Scholar'),
    supplied_username,
    lower(supplied_username),
    new.email,
    coalesce(new.raw_user_meta_data->>'country', 'Kenya'),
    coalesce(new.raw_user_meta_data->>'academic_year', 'Year 3 (2026/2027)'),
    coalesce(new.raw_user_meta_data->>'semester', 'Trimester 2 - 2026'),
    coalesce(new.raw_user_meta_data->>'semester', 'Trimester 2 - 2026'),
    'student',
    'ACTIVE',
    false,
    '{"overlayStrength":60,"backgroundBlur":0,"clockAnimation":true,"backgroundPosition":"center"}'::jsonb
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

alter table public.profiles enable row level security;
alter table public.academic_records enable row level security;

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own" on public.profiles
for select using (id = auth.uid());

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own" on public.profiles
for insert with check (id = auth.uid() and role = 'student');

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles
for update using (id = auth.uid())
with check (id = auth.uid() and role = 'student' and account_status = 'ACTIVE');

drop policy if exists "records_select_own" on public.academic_records;
create policy "records_select_own" on public.academic_records
for select using (owner_id = auth.uid());

drop policy if exists "records_insert_own" on public.academic_records;
create policy "records_insert_own" on public.academic_records
for insert with check (owner_id = auth.uid());

drop policy if exists "records_update_own" on public.academic_records;
create policy "records_update_own" on public.academic_records
for update using (owner_id = auth.uid())
with check (owner_id = auth.uid());

drop policy if exists "records_delete_own" on public.academic_records;
create policy "records_delete_own" on public.academic_records
for delete using (owner_id = auth.uid());

insert into storage.buckets (id, name, public)
values ('academic-documents', 'academic-documents', false)
on conflict (id) do update set public = false;

drop policy if exists "academic_docs_select_own" on storage.objects;
create policy "academic_docs_select_own" on storage.objects
for select to authenticated
using (bucket_id = 'academic-documents' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "academic_docs_insert_own" on storage.objects;
create policy "academic_docs_insert_own" on storage.objects
for insert to authenticated
with check (bucket_id = 'academic-documents' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "academic_docs_update_own" on storage.objects;
create policy "academic_docs_update_own" on storage.objects
for update to authenticated
using (bucket_id = 'academic-documents' and (storage.foldername(name))[1] = auth.uid()::text)
with check (bucket_id = 'academic-documents' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "academic_docs_delete_own" on storage.objects;
create policy "academic_docs_delete_own" on storage.objects
for delete to authenticated
using (bucket_id = 'academic-documents' and (storage.foldername(name))[1] = auth.uid()::text);
