create extension if not exists pgcrypto;

create table if not exists properties (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  address text,
  contact_phone text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists residential_units (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references properties(id),
  tower text,
  unit_number text not null,
  display_label text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (property_id, tower, unit_number)
);

create table if not exists residents (
  id uuid primary key default gen_random_uuid(),
  unit_id uuid not null references residential_units(id),
  full_name text not null,
  document_id text,
  email text,
  resident_type text not null default 'owner',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists resident_contacts (
  id uuid primary key default gen_random_uuid(),
  resident_id uuid not null references residents(id),
  contact_type text not null default 'primary',
  phone_e164 text not null,
  whatsapp_enabled boolean not null default true,
  call_enabled boolean not null default true,
  priority int not null default 1,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists app_users (
  id uuid primary key default gen_random_uuid(),
  property_id uuid references properties(id),
  resident_id uuid references residents(id),
  username text not null unique,
  password_hash text not null,
  role text not null,
  is_active boolean not null default true,
  failed_login_attempts int not null default 0,
  last_login_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table app_users
  add column if not exists resident_id uuid references residents(id);

create table if not exists visitors (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references properties(id),
  full_name text not null,
  document_id text,
  phone text,
  visitor_type text not null default 'guest',
  notes text,
  is_restricted boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists access_authorizations (
  id uuid primary key default gen_random_uuid(),
  unit_id uuid not null references residential_units(id),
  visitor_id uuid references visitors(id),
  authorized_by_resident_id uuid references residents(id),
  authorization_type text not null,
  status text not null default 'pending',
  valid_from timestamptz,
  valid_until timestamptz,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists access_events (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references properties(id),
  unit_id uuid references residential_units(id),
  visitor_id uuid references visitors(id),
  authorization_id uuid references access_authorizations(id),
  registered_by uuid references app_users(id),
  event_type text not null,
  status text not null,
  occurred_at timestamptz not null default now(),
  notes text
);

create table if not exists call_logs (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references properties(id),
  unit_id uuid references residential_units(id),
  contact_id uuid references resident_contacts(id),
  visitor_id uuid references visitors(id),
  initiated_by uuid references app_users(id),
  status text not null default 'initiated',
  started_at timestamptz not null default now(),
  ended_at timestamptz,
  notes text
);

create table if not exists whatsapp_threads (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references properties(id),
  unit_id uuid not null references residential_units(id),
  contact_id uuid references resident_contacts(id),
  visitor_id uuid references visitors(id),
  status text not null default 'open',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists whatsapp_messages (
  id uuid primary key default gen_random_uuid(),
  thread_id uuid not null references whatsapp_threads(id),
  direction text not null,
  provider_message_id text,
  body text not null,
  sent_by uuid references app_users(id),
  sent_at timestamptz not null default now(),
  delivered_at timestamptz,
  read_at timestamptz
);

create table if not exists security_reports (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references properties(id),
  unit_id uuid references residential_units(id),
  reported_by uuid references app_users(id),
  report_type text not null,
  description text not null,
  status text not null default 'open',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists audit_events (
  id uuid primary key default gen_random_uuid(),
  property_id uuid references properties(id),
  actor_user_id uuid references app_users(id),
  action text not null,
  entity_type text,
  entity_id uuid,
  metadata jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_units_property on residential_units(property_id);
create index if not exists idx_residents_unit on residents(unit_id);
create index if not exists idx_contacts_resident on resident_contacts(resident_id);
create index if not exists idx_visitors_property_document on visitors(property_id, document_id);
create index if not exists idx_access_events_property_time on access_events(property_id, occurred_at desc);
create index if not exists idx_call_logs_property_time on call_logs(property_id, started_at desc);
create index if not exists idx_whatsapp_messages_thread_time on whatsapp_messages(thread_id, sent_at asc);
create index if not exists idx_audit_events_property_time on audit_events(property_id, created_at desc);
