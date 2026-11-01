-- Account isolation: two signed-in users and an anonymous caller, using the
-- same roles and JWT claims the Supabase Data API uses for app requests.

\set alice '''aaaaaaaa-0000-4000-8000-000000000001'''
\set bob '''bbbbbbbb-0000-4000-8000-000000000002'''
\set as_alice 'reset role; select tests.claims(' :alice '); set role authenticated;'
\set as_bob 'reset role; select tests.claims(' :bob '); set role authenticated;'
\set as_anon 'reset role; select tests.claims(null); set role anon;'
\set as_admin 'reset role;'

-- Sign-up creates each user's profile. -----------------------------------------
:as_admin
insert into auth.users (id, email, raw_user_meta_data) values
  (:alice, 'alice@example.test', '{"full_name": "Alice"}'),
  (:bob, 'bob@example.test', '{}');
select tests.ok((select count(*) from public.profiles) = 2, 'sign-up creates a profile per user');
select tests.ok(
  (select display_name from public.profiles where id = :alice) = 'Alice',
  'the profile takes the Discord display name');

-- Alice plans a trip. -------------------------------------------------------------
:as_alice
insert into public.trips (id, title, destinations, start_date, end_date)
values ('a1000000-0000-4000-8000-000000000001', 'Tokyo autumn', 'Tokyo', '2026-10-09', '2026-10-13');
insert into public.concerts (id, trip_id, title, local_date, local_time)
values ('a2000000-0000-4000-8000-000000000001', 'a1000000-0000-4000-8000-000000000001',
        'Love Live!', '2026-10-11', '18:00');
insert into public.applications (id, concert_id, provider, round_name, result, payment, amount_minor, currency)
values ('a3000000-0000-4000-8000-000000000001', 'a2000000-0000-4000-8000-000000000001',
        'l-tike', 'Official advance lottery', 'won', 'unpaid', 12000, 'JPY');
insert into public.hotels (id, trip_id, name, check_in, check_out, booking_reference)
values ('a4000000-0000-4000-8000-000000000001', 'a1000000-0000-4000-8000-000000000001',
        'The Tokyo Stay', '2026-10-09', '2026-10-11', 'SECRET-REF-123');
insert into public.assets (id, object_key, mime_type, byte_size)
values ('a5000000-0000-4000-8000-000000000001',
        'aaaaaaaa-0000-4000-8000-000000000001/cover-1.webp', 'image/webp', 1024);
update public.trips set cover_asset_id = 'a5000000-0000-4000-8000-000000000001'
where id = 'a1000000-0000-4000-8000-000000000001';
insert into storage.objects (bucket_id, name)
values ('covers', 'aaaaaaaa-0000-4000-8000-000000000001/cover-1.webp');

select tests.ok(tests.count('select * from public.trips') = 1, 'alice sees her trip');
select tests.ok(
  (select owner_id from public.trips) = :alice,
  'owner_id defaults to the signed-in user');
select tests.ok(tests.count('select * from public.profiles') = 1, 'alice sees only her own profile');

-- Bob cannot read, change or delete anything of Alice's. --------------------------
:as_bob
select tests.ok(tests.count('select * from public.trips') = 0, 'bob sees no trips');
select tests.ok(tests.count('select * from public.concerts') = 0, 'bob sees no concerts');
select tests.ok(tests.count('select * from public.applications') = 0, 'bob sees no applications');
select tests.ok(tests.count('select * from public.hotels') = 0, 'bob sees no hotels or booking references');
select tests.ok(tests.count('select * from public.assets') = 0, 'bob sees no assets');
select tests.ok(tests.count('select * from public.profiles where id = ' || quote_literal(:alice)) = 0,
  'bob cannot read alice''s profile');
select tests.ok(tests.count($$select * from storage.objects where bucket_id = 'covers'$$) = 0,
  'bob cannot list alice''s cover files');

select tests.ok(tests.affected($$update public.trips set title = 'hijacked'$$) = 0,
  'bob cannot edit alice''s trip');
select tests.ok(tests.affected($$update public.applications set payment = 'paid'$$) = 0,
  'bob cannot record payment on alice''s application');
select tests.ok(tests.affected($$update public.profiles set display_name = 'x' where id = 'aaaaaaaa-0000-4000-8000-000000000001'$$) = 0,
  'bob cannot edit alice''s profile');
select tests.ok(tests.affected('delete from public.trips') = 0, 'bob cannot delete alice''s trip');
select tests.ok(tests.affected('delete from public.hotels') = 0, 'bob cannot delete alice''s hotel');
select tests.ok(tests.affected($$delete from storage.objects where bucket_id = 'covers'$$) = 0,
  'bob cannot delete alice''s cover file');

-- Forged ownership and forged links, with guessed ids.
select tests.throws(
  $$insert into public.trips (owner_id, title) values ('aaaaaaaa-0000-4000-8000-000000000001', 'planted')$$,
  '42501', 'bob cannot create a row owned by alice');
select tests.throws(
  $$insert into public.concerts (trip_id, title) values ('a1000000-0000-4000-8000-000000000001', 'gatecrash')$$,
  '23503', 'bob cannot attach his concert to alice''s trip');
select tests.throws(
  $$insert into public.applications (concert_id, round_name) values ('a2000000-0000-4000-8000-000000000001', 'x')$$,
  '23503', 'bob cannot add a round to alice''s concert');
select tests.throws(
  $$insert into public.hotels (trip_id, name, check_in, check_out) values ('a1000000-0000-4000-8000-000000000001', 'x', '2026-10-09', '2026-10-10')$$,
  '23503', 'bob cannot add a stay to alice''s trip');
select tests.throws(
  $$insert into public.trips (title, cover_asset_id) values ('mine', 'a5000000-0000-4000-8000-000000000001')$$,
  '23503', 'bob cannot use alice''s image as his cover');
select tests.throws(
  $$insert into public.assets (object_key, mime_type, byte_size) values ('aaaaaaaa-0000-4000-8000-000000000001/stolen.webp', 'image/webp', 10)$$,
  '23514', 'bob cannot register an asset in alice''s folder');
select tests.throws(
  $$insert into storage.objects (bucket_id, name) values ('covers', 'aaaaaaaa-0000-4000-8000-000000000001/planted.webp')$$,
  '42501', 'bob cannot upload into alice''s cover folder');
select tests.throws(
  $$insert into public.profiles (id) values ('cccccccc-0000-4000-8000-000000000003')$$,
  '42501', 'bob cannot create profiles');

-- Bob's own data works, and stays his.
insert into public.trips (id, title) values ('b1000000-0000-4000-8000-000000000001', 'Osaka');
insert into public.concerts (id, title) values ('b2000000-0000-4000-8000-000000000001', '=LOVE');
select tests.throws(
  $$update public.concerts set trip_id = 'a1000000-0000-4000-8000-000000000001' where id = 'b2000000-0000-4000-8000-000000000001'$$,
  '23503', 'bob cannot move his concert into alice''s trip');
select tests.throws(
  $$update public.trips set owner_id = 'aaaaaaaa-0000-4000-8000-000000000001'$$,
  '42501', 'bob cannot hand his trip to alice');
select tests.throws(
  $$update public.trips set id = 'a1000000-0000-4000-8000-000000000001'$$,
  '42501', 'bob cannot change a trip id');
insert into storage.objects (bucket_id, name)
values ('covers', 'bbbbbbbb-0000-4000-8000-000000000002/cover.webp');
select tests.ok(tests.count('select * from storage.objects') = 1, 'bob sees only his own cover file');

-- Alice cannot reach Bob's data either.
:as_alice
select tests.ok(tests.count('select * from public.trips') = 1, 'alice still sees only her trip');
select tests.ok(tests.count('select * from storage.objects') = 1, 'alice sees only her cover file');
select tests.ok(
  (select title from public.trips) = 'Tokyo autumn',
  'alice''s trip was not changed by bob');
select tests.ok(
  (select payment from public.applications) = 'unpaid',
  'alice''s payment state was not changed by bob');

-- Signed-out callers reach nothing. ----------------------------------------------
:as_anon
select tests.throws('select * from public.trips', '42501', 'anonymous cannot read trips');
select tests.throws('select * from public.concerts', '42501', 'anonymous cannot read concerts');
select tests.throws('select * from public.applications', '42501', 'anonymous cannot read applications');
select tests.throws('select * from public.hotels', '42501', 'anonymous cannot read hotels');
select tests.throws('select * from public.assets', '42501', 'anonymous cannot read assets');
select tests.throws('select * from public.profiles', '42501', 'anonymous cannot read profiles');
select tests.throws($$insert into public.trips (title) values ('x')$$, '42501', 'anonymous cannot create trips');
select tests.ok(tests.count('select * from storage.objects') = 0, 'anonymous cannot list cover files');
select tests.throws(
  $$insert into storage.objects (bucket_id, name) values ('covers', 'aaaaaaaa-0000-4000-8000-000000000001/x.webp')$$,
  '42501', 'anonymous cannot upload covers');
select tests.throws(
  'select public.create_profile_for_new_user()', '42501',
  'anonymous cannot call the profile trigger function');

-- Integrity rules hold for the owner too. ------------------------------------------
:as_alice
select tests.throws(
  $$insert into public.trips (title, start_date, end_date) values ('x', '2026-10-13', '2026-10-09')$$,
  '23514', 'a trip cannot end before it starts');
select tests.throws(
  $$insert into public.hotels (trip_id, name, check_in, check_out) values ('a1000000-0000-4000-8000-000000000001', 'x', '2026-10-11', '2026-10-11')$$,
  '23514', 'check-out must be after check-in');
select tests.throws(
  $$insert into public.applications (concert_id, round_name, amount_minor) values ('a2000000-0000-4000-8000-000000000001', 'x', 100)$$,
  '23514', 'an amount needs a currency');
select tests.throws(
  $$insert into public.applications (concert_id, round_name, amount_minor, currency) values ('a2000000-0000-4000-8000-000000000001', 'x', -1, 'JPY')$$,
  '23514', 'amounts cannot be negative');
select tests.throws(
  $$insert into public.concerts (title, source_url) values ('x', 'javascript:alert(1)')$$,
  '23514', 'source links must be https');
select tests.throws(
  $$insert into public.assets (object_key, mime_type, byte_size) values ('aaaaaaaa-0000-4000-8000-000000000001/x.svg', 'image/svg+xml', 10)$$,
  '23514', 'only raster image types are accepted');
select tests.throws(
  $$insert into public.assets (object_key, mime_type, byte_size) values ('aaaaaaaa-0000-4000-8000-000000000001/../bbbbbbbb-0000-4000-8000-000000000002/x.webp', 'image/webp', 10)$$,
  '23514', 'asset keys cannot climb out of the owner folder');
select tests.throws(
  $$insert into public.assets (object_key, mime_type, byte_size) values ('aaaaaaaa-0000-4000-8000-000000000001/huge.webp', 'image/webp', 13000000)$$,
  '23514', 'assets are limited to 12 MB');
select tests.throws(
  $$insert into public.concerts (title, local_time) values ('x', '18:00')$$,
  '23514', 'a time needs a date');
select tests.ok(
  (select payment from public.applications where round_name = 'Official advance lottery') = 'unpaid'
  and (select result from public.applications where round_name = 'Official advance lottery') = 'won',
  'result and payment are stored independently');

-- Deleting a trip detaches its concerts and removes its stays. --------------------
delete from public.trips where id = 'a1000000-0000-4000-8000-000000000001';
select tests.ok(
  (select trip_id from public.concerts where id = 'a2000000-0000-4000-8000-000000000001') is null
  and (select owner_id from public.concerts where id = 'a2000000-0000-4000-8000-000000000001') = :alice,
  'deleting a trip keeps its concerts, detached, with their owner');
select tests.ok(tests.count('select * from public.hotels') = 0, 'deleting a trip removes its stays');

-- Deleting the account removes everything the user owns. ---------------------------
:as_admin
delete from auth.users where id = :alice;
select tests.ok(
  (select count(*) from public.concerts where owner_id = :alice)
  + (select count(*) from public.applications where owner_id = :alice)
  + (select count(*) from public.assets where owner_id = :alice)
  + (select count(*) from public.profiles where id = :alice) = 0,
  'account deletion removes all of alice''s rows');
select tests.ok(
  (select count(*) from public.trips where owner_id = :bob) = 1,
  'bob''s data is untouched by alice''s deletion');
