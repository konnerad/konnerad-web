-- Run this in your Supabase project's SQL editor

create table if not exists projects (
  id           uuid default gen_random_uuid() primary key,
  label        text not null,
  year         text not null default '',
  tag          text not null default '',
  description  text not null default '',
  color        text not null default '#7F77DD',
  shape        text not null default 'circle',
  images       text[] not null default '{}',
  order_index  int not null default 0,
  created_at   timestamptz default now()
);

-- Allow public read access
alter table projects enable row level security;

create policy "Public read" on projects
  for select using (true);

-- Storage: create a bucket called "project-images"
-- Go to Storage in the Supabase dashboard, create a new public bucket named: project-images
