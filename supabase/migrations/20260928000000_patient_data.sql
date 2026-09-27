-- KINOTE backend, part 2: the patient's health data in the cloud.
-- Run after 20260927000000_family_links_and_alerts.sql (Supabase SQL editor or `supabase db push`).
--
-- Who can see a patient: the caregiver who created it (owner), the patient's own account (senior)
-- once they accept an invite for that patient, and every caregiver linked to that senior.

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

create table if not exists public.patients (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles (id) on delete cascade default auth.uid(),
  senior_id uuid references public.profiles (id) on delete set null,
  local_id text not null,                 -- the app's own id for this patient on the owner's device
  full_name text not null default '',
  relationship text not null default '',
  age int,
  gender text not null default '',
  room_or_unit text not null default '',
  primary_condition text not null default '',
  avatar_bg text not null default '',
  location jsonb,
  latest_vitals jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (owner_id, local_id)
);

create index if not exists patients_senior_idx on public.patients (senior_id);

-- One row per patient: the alert limits the caregiver set.
create table if not exists public.thresholds (
  patient_id uuid primary key references public.patients (id) on delete cascade,
  limits jsonb not null,
  updated_at timestamptz not null default now()
);

create table if not exists public.emergency_contacts (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.patients (id) on delete cascade,
  local_id text not null,
  name text not null default '',
  relation text not null default '',
  phone text not null default '',
  email text not null default '',
  priority_order int not null default 1,
  data jsonb not null,                    -- full contact as the app stores it
  unique (patient_id, local_id)
);

create table if not exists public.medications (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.patients (id) on delete cascade,
  local_id text not null,
  name text not null default '',
  dosage text not null default '',
  frequency text not null default '',
  pills_remaining int,
  refill_remaining_days int,
  data jsonb not null,
  unique (patient_id, local_id)
);

create table if not exists public.dose_logs (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.patients (id) on delete cascade,
  local_id text not null,
  medication_local_id text not null default '',
  scheduled_date date,
  scheduled_time text not null default '',
  status text not null default '',
  logged_at timestamptz,
  data jsonb not null,
  unique (patient_id, local_id)
);

create index if not exists dose_logs_patient_date_idx on public.dose_logs (patient_id, scheduled_date desc);

create table if not exists public.devices (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.patients (id) on delete cascade,
  local_id text not null,
  name text not null default '',
  brand text not null default '',
  category text not null default '',
  connected boolean not null default false,
  last_sync text not null default '',
  data jsonb not null,
  unique (patient_id, local_id)
);

-- Vital-sign history (the app saves at most one reading per patient per minute).
create table if not exists public.readings (
  id bigint generated always as identity primary key,
  patient_id uuid not null references public.patients (id) on delete cascade,
  recorded_at timestamptz not null default now(),
  heart_rate numeric,
  bp_systolic numeric,
  bp_diastolic numeric,
  spo2 numeric,
  respiratory_rate numeric,
  glucose numeric,
  temperature numeric,
  fall_detected boolean not null default false,
  source text not null default 'app',
  recorded_by uuid references public.profiles (id) default auth.uid()
);

create index if not exists readings_patient_time_idx on public.readings (patient_id, recorded_at desc);

-- Plans are written by the payment webhook (server side) only; users can read their own.
create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  provider text not null default 'none' check (provider in ('none', 'razorpay', 'stripe')),
  provider_customer_id text,
  provider_subscription_id text,
  plan_tier text not null default 'family_basic',
  status text not null default 'trial' check (status in ('trial', 'active', 'past_due', 'cancelled')),
  current_period_end timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id)
);

-- Invites can now name the patient the new account will be linked to.
alter table public.invites add column if not exists patient_id uuid references public.patients (id) on delete set null;

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------

create or replace function public.can_access_patient(p_patient uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.patients p
    where p.id = p_patient
      and (
        p.owner_id = auth.uid()
        or (p.senior_id is not null and public.can_see_senior(p.senior_id))
      )
  );
$$;

-- Save a whole patient (profile, thresholds, contacts, medications, devices, dose logs) in one go.
-- Runs as the caller, so row level security decides what they may change.
create or replace function public.save_patient(p jsonb)
returns uuid
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_id uuid;
  v_local_ids text[];
begin
  if auth.uid() is null then
    raise exception 'Sign in first';
  end if;

  if nullif(p ->> 'cloud_id', '') is not null then
    v_id := (p ->> 'cloud_id')::uuid;
    update public.patients set
      full_name = coalesce(p ->> 'full_name', full_name),
      relationship = coalesce(p ->> 'relationship', relationship),
      age = coalesce((p ->> 'age')::int, age),
      gender = coalesce(p ->> 'gender', gender),
      room_or_unit = coalesce(p ->> 'room_or_unit', room_or_unit),
      primary_condition = coalesce(p ->> 'primary_condition', primary_condition),
      avatar_bg = coalesce(p ->> 'avatar_bg', avatar_bg),
      location = coalesce(p -> 'location', location),
      latest_vitals = coalesce(p -> 'latest_vitals', latest_vitals),
      updated_at = now()
    where id = v_id;
    if not found then
      raise exception 'Patient not found or not shared with you';
    end if;
  else
    insert into public.patients as t (
      owner_id, local_id, full_name, relationship, age, gender, room_or_unit,
      primary_condition, avatar_bg, location, latest_vitals
    ) values (
      auth.uid(), p ->> 'local_id', coalesce(p ->> 'full_name', ''), coalesce(p ->> 'relationship', ''),
      (p ->> 'age')::int, coalesce(p ->> 'gender', ''), coalesce(p ->> 'room_or_unit', ''),
      coalesce(p ->> 'primary_condition', ''), coalesce(p ->> 'avatar_bg', ''), p -> 'location', p -> 'latest_vitals'
    )
    on conflict (owner_id, local_id) do update set
      full_name = excluded.full_name,
      relationship = excluded.relationship,
      age = excluded.age,
      gender = excluded.gender,
      room_or_unit = excluded.room_or_unit,
      primary_condition = excluded.primary_condition,
      avatar_bg = excluded.avatar_bg,
      location = excluded.location,
      latest_vitals = coalesce(excluded.latest_vitals, t.latest_vitals),
      updated_at = now()
    returning id into v_id;
  end if;

  if p ? 'thresholds' then
    insert into public.thresholds (patient_id, limits, updated_at)
    values (v_id, p -> 'thresholds', now())
    on conflict (patient_id) do update set limits = excluded.limits, updated_at = now();
  end if;

  -- Contacts, medications and devices: the list sent is the full list.
  if p ? 'contacts' then
    select coalesce(array_agg(x ->> 'id'), '{}') into v_local_ids from jsonb_array_elements(p -> 'contacts') x;
    delete from public.emergency_contacts where patient_id = v_id and not (local_id = any (v_local_ids));
    insert into public.emergency_contacts (patient_id, local_id, name, relation, phone, email, priority_order, data)
    select v_id, x ->> 'id', coalesce(x ->> 'name', ''), coalesce(x ->> 'relation', ''), coalesce(x ->> 'phone', ''),
           coalesce(x ->> 'email', ''), coalesce((x ->> 'priorityOrder')::int, 1), x
    from jsonb_array_elements(p -> 'contacts') x
    on conflict (patient_id, local_id) do update set
      name = excluded.name, relation = excluded.relation, phone = excluded.phone, email = excluded.email,
      priority_order = excluded.priority_order, data = excluded.data;
  end if;

  if p ? 'medications' then
    select coalesce(array_agg(x ->> 'id'), '{}') into v_local_ids from jsonb_array_elements(p -> 'medications') x;
    delete from public.medications where patient_id = v_id and not (local_id = any (v_local_ids));
    insert into public.medications (patient_id, local_id, name, dosage, frequency, pills_remaining, refill_remaining_days, data)
    select v_id, x ->> 'id', coalesce(x ->> 'name', ''), coalesce(x ->> 'dosage', ''), coalesce(x ->> 'frequency', ''),
           (x ->> 'pillsRemaining')::int, (x ->> 'refillRemainingDays')::int, x
    from jsonb_array_elements(p -> 'medications') x
    on conflict (patient_id, local_id) do update set
      name = excluded.name, dosage = excluded.dosage, frequency = excluded.frequency,
      pills_remaining = excluded.pills_remaining, refill_remaining_days = excluded.refill_remaining_days, data = excluded.data;
  end if;

  if p ? 'devices' then
    select coalesce(array_agg(x ->> 'id'), '{}') into v_local_ids from jsonb_array_elements(p -> 'devices') x;
    delete from public.devices where patient_id = v_id and not (local_id = any (v_local_ids));
    insert into public.devices (patient_id, local_id, name, brand, category, connected, last_sync, data)
    select v_id, x ->> 'id', coalesce(x ->> 'name', ''), coalesce(x ->> 'brand', ''), coalesce(x ->> 'category', ''),
           coalesce((x ->> 'connected')::boolean, false), coalesce(x ->> 'lastSync', ''), x
    from jsonb_array_elements(p -> 'devices') x
    on conflict (patient_id, local_id) do update set
      name = excluded.name, brand = excluded.brand, category = excluded.category,
      connected = excluded.connected, last_sync = excluded.last_sync, data = excluded.data;
  end if;

  -- Dose logs are a history: add new ones and update changed ones, never delete.
  if p ? 'dose_logs' then
    insert into public.dose_logs (patient_id, local_id, medication_local_id, scheduled_date, scheduled_time, status, logged_at, data)
    select v_id, x ->> 'id', coalesce(x ->> 'medicationId', ''),
           case when (x ->> 'scheduledDate') ~ '^\d{4}-\d{2}-\d{2}$' then (x ->> 'scheduledDate')::date end,
           coalesce(x ->> 'scheduledTime', ''), coalesce(x ->> 'status', ''),
           case when nullif(x ->> 'loggedAt', '') is not null then (x ->> 'loggedAt')::timestamptz end,
           x
    from jsonb_array_elements(p -> 'dose_logs') x
    on conflict (patient_id, local_id) do update set
      status = excluded.status, logged_at = excluded.logged_at, data = excluded.data;
  end if;

  return v_id;
end;
$$;

-- Caregiver creates an invite for a specific patient; accepting it links that account to the patient.
create or replace function public.create_patient_invite(p_patient_local_id text, p_senior_phone text default null)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_code text;
  v_patient uuid;
begin
  v_code := public.create_invite(p_senior_phone);
  if p_patient_local_id ~ '^cloud-[0-9a-f-]{36}$' then
    -- A patient shared with this caregiver shows up in the app as "cloud-<id>".
    select id into v_patient from public.patients
    where id = substr(p_patient_local_id, 7)::uuid and public.can_access_patient(id);
  else
    select id into v_patient from public.patients
    where local_id = p_patient_local_id and owner_id = auth.uid();
  end if;
  update public.invites set patient_id = v_patient where code = v_code;
  return v_code;
end;
$$;

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

  -- The account that accepted becomes the patient the invite was made for.
  if v_invite.patient_id is not null then
    update public.patients set senior_id = auth.uid(), updated_at = now()
    where id = v_invite.patient_id and senior_id is null;
  end if;

  return v_invite.caregiver_id;
end;
$$;

revoke all on function public.save_patient(jsonb) from public, anon;
revoke all on function public.create_patient_invite(text, text) from public, anon;
grant execute on function public.save_patient(jsonb) to authenticated;
grant execute on function public.create_patient_invite(text, text) to authenticated;

-- Keep the subscriptions row in step with new accounts (14-day trial).
create or replace function public.handle_new_profile_subscription()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.subscriptions (user_id, status, current_period_end)
  values (new.id, 'trial', now() + interval '14 days')
  on conflict (user_id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_profile_created_subscription on public.profiles;
create trigger on_profile_created_subscription
  after insert on public.profiles
  for each row execute function public.handle_new_profile_subscription();

insert into public.subscriptions (user_id, status, current_period_end)
select id, 'trial', now() + interval '14 days' from public.profiles
on conflict (user_id) do nothing;

-- ---------------------------------------------------------------------------
-- Row level security
-- ---------------------------------------------------------------------------

alter table public.patients enable row level security;
alter table public.thresholds enable row level security;
alter table public.emergency_contacts enable row level security;
alter table public.medications enable row level security;
alter table public.dose_logs enable row level security;
alter table public.devices enable row level security;
alter table public.readings enable row level security;
alter table public.subscriptions enable row level security;

drop policy if exists patients_select on public.patients;
create policy patients_select on public.patients for select to authenticated
  using (owner_id = auth.uid() or public.can_access_patient(id));

drop policy if exists patients_insert on public.patients;
create policy patients_insert on public.patients for insert to authenticated
  with check (owner_id = auth.uid());

drop policy if exists patients_update on public.patients;
create policy patients_update on public.patients for update to authenticated
  using (owner_id = auth.uid() or public.can_access_patient(id))
  with check (owner_id = auth.uid() or public.can_access_patient(id));

drop policy if exists patients_delete on public.patients;
create policy patients_delete on public.patients for delete to authenticated
  using (owner_id = auth.uid());

-- Child tables: anyone who can see the patient can read and edit these.
do $$
declare
  t text;
begin
  foreach t in array array['thresholds', 'emergency_contacts', 'medications', 'dose_logs', 'devices'] loop
    execute format('drop policy if exists %I on public.%I', t || '_all', t);
    execute format(
      'create policy %I on public.%I for all to authenticated using (public.can_access_patient(patient_id)) with check (public.can_access_patient(patient_id))',
      t || '_all', t
    );
  end loop;
end;
$$;

-- Readings: read and add, never edit or delete from the app.
drop policy if exists readings_select on public.readings;
create policy readings_select on public.readings for select to authenticated
  using (public.can_access_patient(patient_id));

drop policy if exists readings_insert on public.readings;
create policy readings_insert on public.readings for insert to authenticated
  with check (public.can_access_patient(patient_id) and recorded_by = auth.uid());

drop policy if exists subscriptions_select on public.subscriptions;
create policy subscriptions_select on public.subscriptions for select to authenticated
  using (user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- Realtime: push patient edits to every linked phone
-- ---------------------------------------------------------------------------

do $$
declare
  t text;
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    foreach t in array array['patients', 'readings'] loop
      begin
        execute format('alter publication supabase_realtime add table public.%I', t);
      exception when duplicate_object then
        null;
      end;
    end loop;
  end if;
end;
$$;
