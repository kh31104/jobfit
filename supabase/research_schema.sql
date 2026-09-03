-- Jobfit central research database v1
-- Research-only data: demographics, approved assessment scores, and progress.
-- Student activity narratives are not represented in this schema.

create extension if not exists pgcrypto;

create table if not exists public.research_cohorts (
  id uuid primary key default gen_random_uuid(),
  cohort_code text not null unique check (char_length(cohort_code) between 2 and 80),
  institution_code text,
  title text,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.research_instructors (
  cohort_id uuid not null references public.research_cohorts(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'viewer' check (role in ('viewer','researcher','owner')),
  created_at timestamptz not null default now(),
  primary key (cohort_id,user_id)
);

create table if not exists public.research_participants (
  id uuid primary key default gen_random_uuid(),
  cohort_id uuid not null references public.research_cohorts(id) on delete restrict,
  participant_code text not null check (char_length(participant_code) between 4 and 40),
  sync_token_hash text not null check (char_length(sync_token_hash)=64),
  first_received_at timestamptz not null default now(),
  last_received_at timestamptz not null default now(),
  unique (cohort_id,participant_code)
);

create table if not exists public.research_consents (
  id bigint generated always as identity primary key,
  participant_id uuid not null references public.research_participants(id) on delete cascade,
  consent_version text not null check (char_length(consent_version) between 3 and 100),
  consented boolean not null,
  consented_at timestamptz not null,
  received_at timestamptz not null default now()
);

create table if not exists public.research_snapshots (
  id bigint generated always as identity primary key,
  participant_id uuid not null references public.research_participants(id) on delete cascade,
  schema_version text not null,
  demographics jsonb not null default '{}'::jsonb,
  work24_interest jsonb,
  work24_values jsonb,
  pre_measurements jsonb,
  post_measurements jsonb,
  progress jsonb not null default '{}'::jsonb,
  source_exported_at timestamptz,
  received_at timestamptz not null default now(),
  constraint research_snapshots_no_activity_text check (
    not (demographics ?| array['experiences','ai_conversations','resume','cover_letter','interview_answers'])
  )
);

create index if not exists research_snapshots_participant_received_idx
  on public.research_snapshots(participant_id,received_at desc);
create index if not exists research_consents_participant_received_idx
  on public.research_consents(participant_id,received_at desc);
create index if not exists research_instructors_user_idx
  on public.research_instructors(user_id,cohort_id);

alter table public.research_cohorts enable row level security;
alter table public.research_instructors enable row level security;
alter table public.research_participants enable row level security;
alter table public.research_consents enable row level security;
alter table public.research_snapshots enable row level security;

drop policy if exists "instructors read assigned cohorts" on public.research_cohorts;
drop policy if exists "instructors read own memberships" on public.research_instructors;
drop policy if exists "instructors read assigned participants" on public.research_participants;
drop policy if exists "instructors read assigned consents" on public.research_consents;
drop policy if exists "instructors read assigned snapshots" on public.research_snapshots;

create policy "instructors read assigned cohorts"
  on public.research_cohorts for select to authenticated
  using (exists (
    select 1 from public.research_instructors i
    where i.cohort_id=research_cohorts.id
      and i.user_id=(select auth.uid())
  ));

create policy "instructors read own memberships"
  on public.research_instructors for select to authenticated
  using (user_id=(select auth.uid()));

create policy "instructors read assigned participants"
  on public.research_participants for select to authenticated
  using (exists (
    select 1 from public.research_instructors i
    where i.cohort_id=research_participants.cohort_id
      and i.user_id=(select auth.uid())
  ));

create policy "instructors read assigned consents"
  on public.research_consents for select to authenticated
  using (exists (
    select 1
    from public.research_participants p
    join public.research_instructors i on i.cohort_id=p.cohort_id
    where p.id=research_consents.participant_id
      and i.user_id=(select auth.uid())
  ));

create policy "instructors read assigned snapshots"
  on public.research_snapshots for select to authenticated
  using (exists (
    select 1
    from public.research_participants p
    join public.research_instructors i on i.cohort_id=p.cohort_id
    where p.id=research_snapshots.participant_id
      and i.user_id=(select auth.uid())
  ));

-- Do not expose research tables over the Data API. The Edge Function uses the
-- service role for writes, and instructors use the narrow RPC below for reads.
revoke all on table public.research_cohorts from anon, authenticated;
revoke all on table public.research_instructors from anon, authenticated;
revoke all on table public.research_participants from anon, authenticated;
revoke all on table public.research_consents from anon, authenticated;
revoke all on table public.research_snapshots from anon, authenticated;
revoke all on sequence public.research_consents_id_seq from anon, authenticated;
revoke all on sequence public.research_snapshots_id_seq from anon, authenticated;

-- Authenticated instructors receive only the columns required by the narrow
-- dashboard RPC. RLS still limits every row to their assigned cohort.
grant usage on schema public to authenticated;
grant select (id,cohort_code,institution_code,title,is_active)
  on table public.research_cohorts to authenticated;
grant select (cohort_id,user_id,role)
  on table public.research_instructors to authenticated;
grant select (id,cohort_id,participant_code)
  on table public.research_participants to authenticated;
grant select (participant_id,schema_version,demographics,pre_measurements,
  post_measurements,progress,source_exported_at,received_at)
  on table public.research_snapshots to authenticated;

create or replace function public.get_research_dashboard(p_cohort_code text)
returns table(research_record jsonb)
language sql
stable
security invoker
set search_path = ''
as $$
  select jsonb_build_object(
    'schema_version',s.schema_version,
    'participant_code',p.participant_code,
    'context',jsonb_build_object(
      'cohort_id',c.cohort_code,
      'institution_code',c.institution_code,
      'collected_at',coalesce(s.source_exported_at,s.received_at)
    ),
    'demographics',s.demographics,
    'pre_measurements',s.pre_measurements,
    'post_measurements',s.post_measurements,
    'progress',s.progress,
    'export_metadata',jsonb_build_object(
      'export_type','research-only',
      'exported_at',s.received_at,
      'excludes_activity_text',true
    )
  ) as research_record
  from public.research_cohorts c
  join public.research_participants p on p.cohort_id=c.id
  join lateral (
    select
      rs.schema_version,
      rs.demographics,
      rs.pre_measurements,
      rs.post_measurements,
      rs.progress,
      rs.source_exported_at,
      rs.received_at
    from public.research_snapshots rs
    where rs.participant_id=p.id
    order by rs.received_at desc
    limit 1
  ) s on true
  where c.cohort_code=p_cohort_code
    and c.is_active=true
    and (select auth.uid()) is not null
    and exists (
      select 1 from public.research_instructors i
      where i.cohort_id=c.id
        and i.user_id=(select auth.uid())
    )
  order by p.participant_code;
$$;

revoke all on function public.get_research_dashboard(text) from public, anon;
grant execute on function public.get_research_dashboard(text) to authenticated;

insert into public.research_cohorts(cohort_code,institution_code,title,is_active)
values ('INJE2026','인제대학교','2026 인제대학교 Jobfit',true)
on conflict (cohort_code) do update set
  institution_code=excluded.institution_code,
  title=excluded.title,
  is_active=excluded.is_active;

-- No anonymous table policy or grant exists. Anonymous student submissions go
-- only through research-sync, which validates origin, consent version, token,
-- payload size, schema version, and an explicit field allow-list.
