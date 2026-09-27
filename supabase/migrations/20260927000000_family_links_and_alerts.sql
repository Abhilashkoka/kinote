-- KINOTE backend: profiles, caregiver <-> senior links, invites, alerts.
-- Run in the Supabase SQL editor (or `supabase db push`).

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null default '',
  phone text,
  role text not null default 'family_caregiver'
    check (role in ('family_caregiver', 'senior_patient')),
  created_at timestamptz not null default now()
);

create table if not exists public.care_links (
  id uuid primary key default gen_random_uuid(),
  caregiver_id uuid not null references public.profiles (id) on delete cascade,
  senior_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (caregiver_id, senior_id),
  check (caregiver_id <> senior_id)
);

create table if not exists public.invites (
  code text primary key,
  caregiver_id uuid not null references public.profiles (id) on delete cascade,
  senior_phone text,
  expires_at timestamptz not null default now() + interval '48 hours',
  accepted_by uuid references public.profiles (id),
  accepted_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.alerts (
  id uuid primary key default gen_random_uuid(),
  senior_id uuid not null references public.profiles (id) on delete cascade,
  raised_by uuid not null references public.profiles (id) on delete cascade default auth.uid(),
  kind text not null check (kind in ('sos', 'vitals', 'fall', 'missed_dose', 'escalation')),
  severity text not null default 'critical' check (severity in ('info', 'warning', 'critical')),
  message text not null default '',
  vitals jsonb,
  location jsonb,
  status text not null default 'open' check (status in ('open', 'acknowledged', 'resolved')),
  acknowledged_by uuid references public.profiles (id),
  acknowledged_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists alerts_senior_created_idx on public.alerts (senior_id, created_at desc);

-- One row per call / SMS / push attempt made by the escalate-alert function.
create table if not exists public.alert_events (
  id bigint generated always as identity primary key,
  alert_id uuid not null references public.alerts (id) on delete cascade,
  channel text not null check (channel in ('call', 'sms', 'push')),
  recipient text not null,
  outcome text not null,
  detail jsonb,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------

-- True when the signed-in user is the senior or one of the senior's linked caregivers.
create or replace function public.can_see_senior(p_senior uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select p_senior = auth.uid()
      or exists (
        select 1 from public.care_links l
        where l.senior_id = p_senior and l.caregiver_id = auth.uid()
      );
$$;

-- Create a profile row for every new auth user (phone comes from phone sign-in).
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, phone, full_name, role)
  values (
    new.id,
    new.phone,
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    coalesce(new.raw_user_meta_data ->> 'role', 'family_caregiver')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Caregiver creates a 6-character invite code for a parent / loved one.
create or replace function public.create_invite(p_senior_phone text default null)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_code text;
  v_alphabet constant text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  i int;
begin
  if auth.uid() is null then
    raise exception 'Sign in first';
  end if;

  loop
    v_code := '';
    for i in 1..6 loop
      v_code := v_code || substr(v_alphabet, 1 + floor(random() * length(v_alphabet))::int, 1);
    end loop;
    exit when not exists (select 1 from public.invites where code = v_code);
  end loop;

  insert into public.invites (code, caregiver_id, senior_phone)
  values (v_code, auth.uid(), nullif(trim(p_senior_phone), ''));

  return v_code;
end;
$$;

-- Parent / loved one accepts an invite code; this creates the caregiver link.
create or replace function public.accept_invite(p_code text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_invite public.invites%rowtype;
begin
  if auth.uid() is null then
    raise exception 'Sign in first';
  end if;

  select * into v_invite
  from public.invites
  where code = upper(trim(p_code))
  for update;

  if not found then
    raise exception 'Invite code not found';
  end if;
  if v_invite.accepted_by is not null then
    raise exception 'Invite code already used';
  end if;
  if v_invite.expires_at < now() then
    raise exception 'Invite code has expired';
  end if;
  if v_invite.caregiver_id = auth.uid() then
    raise exception 'You cannot accept your own invite';
  end if;

  insert into public.care_links (caregiver_id, senior_id)
  values (v_invite.caregiver_id, auth.uid())
  on conflict (caregiver_id, senior_id) do nothing;

  update public.invites
  set accepted_by = auth.uid(), accepted_at = now()
  where code = v_invite.code;

  return v_invite.caregiver_id;
end;
$$;

revoke all on function public.create_invite(text) from public, anon;
revoke all on function public.accept_invite(text) from public, anon;
grant execute on function public.create_invite(text) to authenticated;
grant execute on function public.accept_invite(text) to authenticated;

-- ---------------------------------------------------------------------------
-- Row level security
-- ---------------------------------------------------------------------------

alter table public.profiles enable row level security;
alter table public.care_links enable row level security;
alter table public.invites enable row level security;
alter table public.alerts enable row level security;
alter table public.alert_events enable row level security;

-- Profiles: see yourself and anyone you are linked with; edit only yourself.
drop policy if exists profiles_select on public.profiles;
create policy profiles_select on public.profiles for select to authenticated
  using (
    id = auth.uid()
    or exists (
      select 1 from public.care_links l
      where (l.caregiver_id = auth.uid() and l.senior_id = profiles.id)
         or (l.senior_id = auth.uid() and l.caregiver_id = profiles.id)
    )
  );

drop policy if exists profiles_update on public.profiles;
create policy profiles_update on public.profiles for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid());

-- Links: both sides can see and remove a link. Links are only created by accept_invite().
drop policy if exists care_links_select on public.care_links;
create policy care_links_select on public.care_links for select to authenticated
  using (caregiver_id = auth.uid() or senior_id = auth.uid());

drop policy if exists care_links_delete on public.care_links;
create policy care_links_delete on public.care_links for delete to authenticated
  using (caregiver_id = auth.uid() or senior_id = auth.uid());

-- Invites: caregivers see their own invites. Created and accepted via functions only.
drop policy if exists invites_select on public.invites;
create policy invites_select on public.invites for select to authenticated
  using (caregiver_id = auth.uid());

-- Alerts: the senior and linked caregivers can see, raise and acknowledge.
drop policy if exists alerts_select on public.alerts;
create policy alerts_select on public.alerts for select to authenticated
  using (public.can_see_senior(senior_id));

drop policy if exists alerts_insert on public.alerts;
create policy alerts_insert on public.alerts for insert to authenticated
  with check (raised_by = auth.uid() and public.can_see_senior(senior_id));

drop policy if exists alerts_update on public.alerts;
create policy alerts_update on public.alerts for update to authenticated
  using (public.can_see_senior(senior_id))
  with check (public.can_see_senior(senior_id));

-- Alert events: readable by anyone who can see the alert; written by the server only.
drop policy if exists alert_events_select on public.alert_events;
create policy alert_events_select on public.alert_events for select to authenticated
  using (
    exists (
      select 1 from public.alerts a
      where a.id = alert_events.alert_id and public.can_see_senior(a.senior_id)
    )
  );

-- ---------------------------------------------------------------------------
-- Realtime: stream new alerts to linked caregivers' phones
-- ---------------------------------------------------------------------------

do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    begin
      alter publication supabase_realtime add table public.alerts;
    exception when duplicate_object then
      null;
    end;
  end if;
end;
$$;
