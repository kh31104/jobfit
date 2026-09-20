-- Jobfit operational teaching-data store.
-- Research data remains in research_* tables and is governed separately.

create table if not exists public.jobfit_participants (
  id uuid primary key default gen_random_uuid(),
  course_code text not null check (char_length(course_code) between 2 and 80),
  participant_code text not null check (char_length(participant_code) between 4 and 40),
  sync_token_hash text not null check (char_length(sync_token_hash)=64),
  first_received_at timestamptz not null default now(),
  last_received_at timestamptz not null default now(),
  unique (course_code, participant_code)
);

create table if not exists public.jobfit_snapshots (
  id bigint generated always as identity primary key,
  participant_id uuid not null references public.jobfit_participants(id) on delete cascade,
  schema_version text not null,
  active_step smallint not null check (active_step between 0 and 13),
  payload jsonb not null default '{}'::jsonb,
  client_saved_at timestamptz,
  received_at timestamptz not null default now()
);

create index if not exists jobfit_snapshots_participant_received_idx
  on public.jobfit_snapshots(participant_id, received_at desc);

create table if not exists public.jobfit_step_events (
  id bigint generated always as identity primary key,
  participant_id uuid not null references public.jobfit_participants(id) on delete cascade,
  step_no smallint not null check (step_no between 0 and 13),
  event_type text not null check (event_type in ('save','complete','open')),
  client_event_at timestamptz,
  received_at timestamptz not null default now()
);

create index if not exists jobfit_step_events_participant_step_idx
  on public.jobfit_step_events(participant_id, step_no, received_at desc);

alter table public.jobfit_participants enable row level security;
alter table public.jobfit_snapshots enable row level security;
alter table public.jobfit_step_events enable row level security;

revoke all on table public.jobfit_participants from anon, authenticated;
revoke all on table public.jobfit_snapshots from anon, authenticated;
revoke all on table public.jobfit_step_events from anon, authenticated;
