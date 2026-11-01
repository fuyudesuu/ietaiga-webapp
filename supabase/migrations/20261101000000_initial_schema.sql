-- Encore initial schema: private, owner-scoped planning records.
--
-- Security model (docs/engineering/DECISIONS.md, 2026-11-01):
-- * Every user table carries owner_id = the Supabase Auth user. Row-level
--   security is enabled and forced (forcing guards against a future owner role
--   without BYPASSRLS; on Supabase the API roles are what RLS restricts).
--   Signed-in users reach only their own rows.
--   Anonymous callers have no table privileges at all.
-- * Cross-record links (concert -> trip, application -> concert, hotel -> trip,
--   cover -> asset) use composite foreign keys on (owner_id, id), so a link to
--   another account's record fails in the database even with a guessed id.
-- * Cover images live in the private "covers" bucket under "<owner_id>/...".
-- * Deleting the auth user deletes every row they own and queues their cover
--   files for removal through the Storage API (private.storage_cleanup).
-- * The API roles get no default privileges: each later table or function
--   must be granted explicitly, so a forgotten revoke cannot expose it.
-- * Security review (tests/db/pentest.test.sql): primary keys are global, so a
--   guessed UUID can be confirmed to exist (no content); planner estimates
--   reveal rough row volume. Both accepted (DECISIONS.md, 2026-11-01).
--
-- Not yet applied anywhere. Once applied, change it only by adding migrations.

-- This migration must run as a role that bypasses RLS (Supabase: postgres):
-- the sign-up trigger writes profiles, which have no insert policy.
do $$
begin
  if not (select rolsuper or rolbypassrls from pg_roles where rolname = current_user) then
    raise exception 'run this migration as a role with BYPASSRLS (Supabase: postgres)';
  end if;
end;
$$;

-- New objects are not exposed to the API roles unless granted explicitly.
alter default privileges in schema public
  revoke all on tables from anon, authenticated;
alter default privileges in schema public
  revoke all on sequences from anon, authenticated;
alter default privileges in schema public
  revoke execute on functions from public, anon, authenticated;

-- Shared trigger: keep updated_at honest without trusting the client.
create function public.touch_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- Owner and id never change after insert: a row cannot be handed to another
-- account, and links keyed on (owner_id, id) stay valid.
create function public.keep_identity()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.id is distinct from old.id or new.owner_id is distinct from old.owner_id then
    raise exception 'id and owner_id cannot change' using errcode = '42501';
  end if;
  return new;
end;
$$;

-- Time zone columns must name a real IANA zone, or reminders and display
-- conversions would fail later. Arguments: the column names to check.
create function public.check_time_zones()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  column_name text;
  zone text;
begin
  foreach column_name in array tg_argv loop
    zone := to_jsonb(new) ->> column_name;
    if zone is not null and not exists (
      select 1 from pg_catalog.pg_timezone_names where name = zone
    ) then
      raise exception 'unknown time zone in %', column_name using errcode = '22023';
    end if;
  end loop;
  return new;
end;
$$;

-- A generous per-account row cap, so one account cannot flood the database.
-- Runs as the caller: under RLS the count covers only the caller's own rows.
-- Argument: the maximum number of rows per owner in this table.
create function public.enforce_owner_quota()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  existing bigint;
begin
  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(tg_table_name || new.owner_id::text, 0));
  execute format('select count(*) from %I.%I where owner_id = $1',
    tg_table_schema, tg_table_name)
    into existing using new.owner_id;
  if existing >= tg_argv[0]::bigint then
    raise exception 'limit of % % reached', tg_argv[0], tg_table_name
      using errcode = '54000';
  end if;
  return new;
end;
$$;

-- Profiles ------------------------------------------------------------------

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text check (char_length(display_name) <= 80),
  time_zone text not null default 'Asia/Tokyo'
    check (char_length(time_zone) between 1 and 64),
  default_currency text not null default 'JPY'
    check (default_currency in ('JPY', 'USD', 'AUD', 'SGD')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- A profile is created for each new auth user. The function runs as its
-- owner (security definer) because the new user has no session yet; it reads
-- nothing from the client except the user id and a length-limited name.
create function public.create_profile_for_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  -- Only a string name is used, without control or bidi-override characters.
  insert into public.profiles (id, display_name)
  values (
    new.id,
    case when jsonb_typeof(new.raw_user_meta_data -> 'full_name') = 'string' then
      left(nullif(btrim(regexp_replace(new.raw_user_meta_data ->> 'full_name',
        '[[:cntrl:]\u200e\u200f\u202a-\u202e\u2066-\u2069]', '', 'g')), ''), 80)
    end
  );
  return new;
end;
$$;
-- Supabase grants execute on new functions to its API roles by default.
revoke all on function public.create_profile_for_new_user()
  from public, anon, authenticated;

create trigger create_profile_after_signup
  after insert on auth.users
  for each row execute function public.create_profile_for_new_user();

create trigger touch_profiles
  before update on public.profiles
  for each row execute function public.touch_updated_at();

-- Assets (cover images) -------------------------------------------------------

create table public.assets (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  -- Object path inside the "covers" bucket; always under the owner's folder.
  object_key text not null unique
    check (char_length(object_key) <= 200)
    check (object_key ~ '^[0-9a-f-]{36}/[A-Za-z0-9_-]{1,100}\.(jpg|png|webp)$'),
  mime_type text not null check (mime_type in ('image/jpeg', 'image/png', 'image/webp')),
  byte_size integer not null check (byte_size > 0 and byte_size <= 12 * 1024 * 1024),
  width integer check (width between 1 and 10000),
  height integer check (height between 1 and 10000),
  created_at timestamptz not null default now(),
  unique (owner_id, id),
  check (split_part(object_key, '/', 1) = owner_id::text),
  check (
    (mime_type = 'image/jpeg' and object_key like '%.jpg')
    or (mime_type = 'image/png' and object_key like '%.png')
    or (mime_type = 'image/webp' and object_key like '%.webp')
  )
);

-- Trips -----------------------------------------------------------------------

create table public.trips (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  title text not null check (char_length(title) between 1 and 200),
  destinations text not null default '' check (char_length(destinations) <= 200),
  start_date date,
  end_date date,
  status text not null default 'tentative'
    check (status in ('tentative', 'confirmed', 'completed', 'cancelled')),
  notes text not null default '' check (char_length(notes) <= 5000),
  cover_asset_id uuid,
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (owner_id, id),
  check (end_date is null or start_date is null or end_date >= start_date),
  foreign key (owner_id, cover_asset_id) references public.assets (owner_id, id)
    on delete set null (cover_asset_id)
);
create index trips_owner_start on public.trips (owner_id, start_date);

-- Concerts --------------------------------------------------------------------

create table public.concerts (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  trip_id uuid,
  title text not null check (char_length(title) between 1 and 200),
  subtitle text not null default '' check (char_length(subtitle) <= 200),
  venue text not null default '' check (char_length(venue) <= 200),
  city text not null default '' check (char_length(city) <= 120),
  -- Date and time are local to the event's time zone; either may be unknown.
  local_date date,
  local_time time,
  time_zone text not null default 'Asia/Tokyo' check (char_length(time_zone) between 1 and 64),
  status text not null default 'planned' check (status in ('planned', 'cancelled', 'completed')),
  source_url text check (char_length(source_url) <= 2000 and source_url ~ '^https://'),
  notes text not null default '' check (char_length(notes) <= 5000),
  cover_asset_id uuid,
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (owner_id, id),
  check (local_time is null or local_date is not null),
  -- Deleting a trip keeps its concerts and detaches them.
  foreign key (owner_id, trip_id) references public.trips (owner_id, id)
    on delete set null (trip_id),
  foreign key (owner_id, cover_asset_id) references public.assets (owner_id, id)
    on delete set null (cover_asset_id)
);
create index concerts_owner_date on public.concerts (owner_id, local_date);
create index concerts_owner_trip on public.concerts (owner_id, trip_id);

-- Application rounds ----------------------------------------------------------

create table public.applications (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  concert_id uuid not null,
  provider text not null default '' check (char_length(provider) <= 120),
  round_name text not null check (char_length(round_name) between 1 and 200),
  -- Independent states: a passed result date never implies a win.
  application_state text not null default 'planned'
    check (application_state in ('planned', 'submitted', 'withdrawn')),
  result text not null default 'unknown'
    check (result in ('unknown', 'pending', 'won', 'lost', 'waitlisted')),
  payment text not null default 'not_required'
    check (payment in ('not_required', 'unpaid', 'paid', 'refunded')),
  collection text not null default 'not_ready'
    check (collection in ('not_ready', 'ready', 'collected')),
  -- Exact deadlines are UTC instants plus the time zone they were given in.
  applications_close_at timestamptz,
  result_at timestamptz,
  payment_due_at timestamptz,
  collection_from_at timestamptz,
  deadline_time_zone text not null default 'Asia/Tokyo'
    check (char_length(deadline_time_zone) between 1 and 64),
  -- Integer minor units; an unknown amount is null, never zero.
  amount_minor bigint check (amount_minor >= 0 and amount_minor <= 100000000000),
  currency text check (currency in ('JPY', 'USD', 'AUD', 'SGD')),
  source_url text check (char_length(source_url) <= 2000 and source_url ~ '^https://'),
  notes text not null default '' check (char_length(notes) <= 5000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (owner_id, id),
  check (amount_minor is null or currency is not null),
  foreign key (owner_id, concert_id) references public.concerts (owner_id, id)
    on delete cascade
);
create index applications_owner_concert on public.applications (owner_id, concert_id);

-- Hotel stays -----------------------------------------------------------------

create table public.hotels (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  trip_id uuid not null,
  name text not null check (char_length(name) between 1 and 200),
  location text not null default '' check (char_length(location) <= 200),
  check_in date not null,
  check_out date not null,
  time_zone text not null default 'Asia/Tokyo' check (char_length(time_zone) between 1 and 64),
  booking_url text check (char_length(booking_url) <= 2000 and booking_url ~ '^https://'),
  -- Private: never sent in reminders or shared messages.
  booking_reference text check (char_length(booking_reference) <= 200),
  cancellation_deadline_at timestamptz,
  amount_minor bigint check (amount_minor >= 0 and amount_minor <= 100000000000),
  currency text check (currency in ('JPY', 'USD', 'AUD', 'SGD')),
  payment text not null default 'unpaid'
    check (payment in ('not_required', 'unpaid', 'paid', 'refunded')),
  status text not null default 'booked' check (status in ('booked', 'cancelled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (owner_id, id),
  check (check_out > check_in),
  check (amount_minor is null or currency is not null),
  foreign key (owner_id, trip_id) references public.trips (owner_id, id)
    on delete cascade
);
create index hotels_owner_trip on public.hotels (owner_id, trip_id);

-- Triggers ----------------------------------------------------------------------

create trigger keep_trip_identity before update on public.trips
  for each row execute function public.keep_identity();
create trigger keep_concert_identity before update on public.concerts
  for each row execute function public.keep_identity();
create trigger keep_application_identity before update on public.applications
  for each row execute function public.keep_identity();
create trigger keep_hotel_identity before update on public.hotels
  for each row execute function public.keep_identity();
create trigger keep_asset_identity before update on public.assets
  for each row execute function public.keep_identity();

create trigger check_profile_time_zone before insert or update on public.profiles
  for each row execute function public.check_time_zones('time_zone');
create trigger check_concert_time_zone before insert or update on public.concerts
  for each row execute function public.check_time_zones('time_zone');
create trigger check_application_time_zone before insert or update on public.applications
  for each row execute function public.check_time_zones('deadline_time_zone');
create trigger check_hotel_time_zone before insert or update on public.hotels
  for each row execute function public.check_time_zones('time_zone');

-- Per-account caps: far above personal use, low enough to stop flooding.
create trigger trips_quota before insert on public.trips
  for each row execute function public.enforce_owner_quota('500');
create trigger concerts_quota before insert on public.concerts
  for each row execute function public.enforce_owner_quota('2000');
create trigger applications_quota before insert on public.applications
  for each row execute function public.enforce_owner_quota('5000');
create trigger hotels_quota before insert on public.hotels
  for each row execute function public.enforce_owner_quota('2000');
create trigger assets_quota before insert on public.assets
  for each row execute function public.enforce_owner_quota('1000');

create trigger touch_trips before update on public.trips
  for each row execute function public.touch_updated_at();
create trigger touch_concerts before update on public.concerts
  for each row execute function public.touch_updated_at();
create trigger touch_applications before update on public.applications
  for each row execute function public.touch_updated_at();
create trigger touch_hotels before update on public.hotels
  for each row execute function public.touch_updated_at();

-- Trigger functions are not API endpoints.
revoke all on function public.touch_updated_at(), public.keep_identity(),
  public.check_time_zones(), public.enforce_owner_quota()
  from public, anon, authenticated;

-- Privileges and row-level security --------------------------------------------

-- Supabase grants every role access to new public tables by default. Start
-- from nothing, then grant signed-in users exactly what the policies allow.
revoke all on public.profiles, public.assets, public.trips, public.concerts,
  public.applications, public.hotels from anon, authenticated;

grant select, update (display_name, time_zone, default_currency)
  on public.profiles to authenticated;
grant select, insert, delete on public.assets to authenticated;
grant select, insert, update, delete
  on public.trips, public.concerts, public.applications, public.hotels
  to authenticated;

alter table public.profiles enable row level security;
alter table public.profiles force row level security;
alter table public.assets enable row level security;
alter table public.assets force row level security;
alter table public.trips enable row level security;
alter table public.trips force row level security;
alter table public.concerts enable row level security;
alter table public.concerts force row level security;
alter table public.applications enable row level security;
alter table public.applications force row level security;
alter table public.hotels enable row level security;
alter table public.hotels force row level security;

create policy "profiles: owner reads" on public.profiles
  for select to authenticated using ((select auth.uid()) = id);
create policy "profiles: owner updates" on public.profiles
  for update to authenticated
  using ((select auth.uid()) = id) with check ((select auth.uid()) = id);

create policy "assets: owner reads" on public.assets
  for select to authenticated using ((select auth.uid()) = owner_id);
create policy "assets: owner adds" on public.assets
  for insert to authenticated with check ((select auth.uid()) = owner_id);
create policy "assets: owner deletes" on public.assets
  for delete to authenticated using ((select auth.uid()) = owner_id);

create policy "trips: owner reads" on public.trips
  for select to authenticated using ((select auth.uid()) = owner_id);
create policy "trips: owner adds" on public.trips
  for insert to authenticated with check ((select auth.uid()) = owner_id);
create policy "trips: owner edits" on public.trips
  for update to authenticated
  using ((select auth.uid()) = owner_id) with check ((select auth.uid()) = owner_id);
create policy "trips: owner deletes" on public.trips
  for delete to authenticated using ((select auth.uid()) = owner_id);

create policy "concerts: owner reads" on public.concerts
  for select to authenticated using ((select auth.uid()) = owner_id);
create policy "concerts: owner adds" on public.concerts
  for insert to authenticated with check ((select auth.uid()) = owner_id);
create policy "concerts: owner edits" on public.concerts
  for update to authenticated
  using ((select auth.uid()) = owner_id) with check ((select auth.uid()) = owner_id);
create policy "concerts: owner deletes" on public.concerts
  for delete to authenticated using ((select auth.uid()) = owner_id);

create policy "applications: owner reads" on public.applications
  for select to authenticated using ((select auth.uid()) = owner_id);
create policy "applications: owner adds" on public.applications
  for insert to authenticated with check ((select auth.uid()) = owner_id);
create policy "applications: owner edits" on public.applications
  for update to authenticated
  using ((select auth.uid()) = owner_id) with check ((select auth.uid()) = owner_id);
create policy "applications: owner deletes" on public.applications
  for delete to authenticated using ((select auth.uid()) = owner_id);

create policy "hotels: owner reads" on public.hotels
  for select to authenticated using ((select auth.uid()) = owner_id);
create policy "hotels: owner adds" on public.hotels
  for insert to authenticated with check ((select auth.uid()) = owner_id);
create policy "hotels: owner edits" on public.hotels
  for update to authenticated
  using ((select auth.uid()) = owner_id) with check ((select auth.uid()) = owner_id);
create policy "hotels: owner deletes" on public.hotels
  for delete to authenticated using ((select auth.uid()) = owner_id);

-- Supabase "anonymous sign-ins" create users with the authenticated role. They
-- are off for Encore; if ever turned on, they still reach no planning data.
create policy "profiles: no anonymous accounts" on public.profiles as restrictive
  for all to authenticated
  using (not coalesce(((select auth.jwt()) ->> 'is_anonymous')::boolean, false))
  with check (not coalesce(((select auth.jwt()) ->> 'is_anonymous')::boolean, false));
create policy "assets: no anonymous accounts" on public.assets as restrictive
  for all to authenticated
  using (not coalesce(((select auth.jwt()) ->> 'is_anonymous')::boolean, false))
  with check (not coalesce(((select auth.jwt()) ->> 'is_anonymous')::boolean, false));
create policy "trips: no anonymous accounts" on public.trips as restrictive
  for all to authenticated
  using (not coalesce(((select auth.jwt()) ->> 'is_anonymous')::boolean, false))
  with check (not coalesce(((select auth.jwt()) ->> 'is_anonymous')::boolean, false));
create policy "concerts: no anonymous accounts" on public.concerts as restrictive
  for all to authenticated
  using (not coalesce(((select auth.jwt()) ->> 'is_anonymous')::boolean, false))
  with check (not coalesce(((select auth.jwt()) ->> 'is_anonymous')::boolean, false));
create policy "applications: no anonymous accounts" on public.applications as restrictive
  for all to authenticated
  using (not coalesce(((select auth.jwt()) ->> 'is_anonymous')::boolean, false))
  with check (not coalesce(((select auth.jwt()) ->> 'is_anonymous')::boolean, false));
create policy "hotels: no anonymous accounts" on public.hotels as restrictive
  for all to authenticated
  using (not coalesce(((select auth.jwt()) ->> 'is_anonymous')::boolean, false))
  with check (not coalesce(((select auth.jwt()) ->> 'is_anonymous')::boolean, false));

-- Account deletion: cover files ---------------------------------------------------

-- Storage objects are not rows the database can cascade (the files live in
-- object storage). Deleting an auth user queues their folder; the account
-- deletion worker removes it through the Storage API with the service role,
-- then clears the queue entry. The private schema is not exposed to the API.
create schema private;
revoke all on schema private from public, anon, authenticated;
create table private.storage_cleanup (
  owner_id uuid primary key,
  requested_at timestamptz not null default now()
);
create function private.queue_storage_cleanup()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into private.storage_cleanup (owner_id) values (old.id)
  on conflict do nothing;
  return old;
end;
$$;
revoke all on function private.queue_storage_cleanup() from public, anon, authenticated;
create trigger queue_storage_cleanup after delete on auth.users
  for each row execute function private.queue_storage_cleanup();

-- Private cover storage ---------------------------------------------------------

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('covers', 'covers', false, 12 * 1024 * 1024,
        array['image/jpeg', 'image/png', 'image/webp']);

-- Objects live under "<owner_id>/<file>". Only the owner can read, add,
-- replace or remove them; the bucket is never public.
create policy "covers: owner reads" on storage.objects
  for select to authenticated
  using (bucket_id = 'covers' and (storage.foldername(name))[1] = (select auth.uid())::text);
-- The number of cover files in the caller's own folder. Definer rights only
-- so the storage policy can count without recursing into its own policies; it
-- takes no input and counts nothing but the caller's folder.
create function public.own_cover_file_count()
returns bigint
language sql
stable
security definer
set search_path = ''
as $$
  select count(*) from storage.objects
  where bucket_id = 'covers'
    and (storage.foldername(name))[1] = (select auth.uid())::text
$$;
revoke all on function public.own_cover_file_count() from public, anon;
grant execute on function public.own_cover_file_count() to authenticated;

-- Writes must also use the asset key shape (one folder, image extension only)
-- and stay under a per-account file cap. Content checks happen in the upload
-- route before the file is stored; the session token never reaches page scripts.
create policy "covers: owner adds" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'covers'
    and (storage.foldername(name))[1] = (select auth.uid())::text
    and name ~ '^[0-9a-f-]{36}/[A-Za-z0-9_-]{1,100}\.(jpg|png|webp)$'
    and public.own_cover_file_count() < 1000
  );
create policy "covers: owner replaces" on storage.objects
  for update to authenticated
  using (bucket_id = 'covers' and (storage.foldername(name))[1] = (select auth.uid())::text)
  with check (
    bucket_id = 'covers'
    and (storage.foldername(name))[1] = (select auth.uid())::text
    and name ~ '^[0-9a-f-]{36}/[A-Za-z0-9_-]{1,100}\.(jpg|png|webp)$'
  );
create policy "covers: owner removes" on storage.objects
  for delete to authenticated
  using (bucket_id = 'covers' and (storage.foldername(name))[1] = (select auth.uid())::text);
