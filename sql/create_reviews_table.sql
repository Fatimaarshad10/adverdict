-- Run this in Supabase SQL editor to create the `reviews` table.
-- Adjust types/constraints to match your needs.

create extension if not exists pgcrypto;

create table if not exists reviews (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  input jsonb not null,
  result jsonb not null,
  mode text,
  room_id text,
  verdict text,
  overall numeric,
  -- optional: link review to an authenticated user
  user_id uuid
);

-- Create a GIN index for fast JSONB queries on the result column
create index if not exists idx_reviews_result_gin on reviews using gin (result jsonb_path_ops);
