-- One row per account holding that person's planner, synced across their devices.
create table if not exists public.planner_state (
  user_id uuid primary key references auth.users (id) on delete cascade,
  data jsonb not null,
  version integer not null default 1,
  updated_at timestamptz not null default now()
);

-- Row-level security: every account can only ever see and change its own row.
alter table public.planner_state enable row level security;

create policy "Read own planner" on public.planner_state
  for select using (auth.uid() = user_id);

create policy "Create own planner" on public.planner_state
  for insert with check (auth.uid() = user_id);

create policy "Update own planner" on public.planner_state
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "Delete own planner" on public.planner_state
  for delete using (auth.uid() = user_id);
