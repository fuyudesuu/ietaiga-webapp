-- Regression review (2026-11-01, third pass): findings R-1 to R-4 about the
-- first round of fixes, each asserting the corrected behaviour.
\set as_admin 'reset role;'
\set rosa '''aaaaaaaa-0000-4000-8000-00000000000a'''
:as_admin
insert into auth.users (id) values (:rosa);

-- R-2: a function a later migration creates in public must not be executable
-- by the API roles until granted. A per-schema REVOKE cannot remove the
-- built-in global EXECUTE-to-PUBLIC default (PostgreSQL ALTER DEFAULT
-- PRIVILEGES notes), so anon and authenticated inherit it through PUBLIC.
create function public.review_later_function() returns int language sql as 'select 1';
select tests.ok(
  not has_function_privilege('anon', 'public.review_later_function()', 'EXECUTE')
  and not has_function_privilege('authenticated', 'public.review_later_function()', 'EXECUTE'),
  'R-2: new public functions are not executable by anon/authenticated by default');
drop function public.review_later_function();

-- R-3: a Supabase anonymous-sign-in account cannot store cover files.
reset role;
select tests.anonymous_account_claims(:rosa);
set role authenticated;
select tests.throws(
  $$insert into storage.objects (bucket_id, name) values ('covers', 'aaaaaaaa-0000-4000-8000-00000000000a/a.webp')$$,
  '42501', 'R-3: anonymous accounts cannot upload cover files');

-- R-4: renaming one's own cover to a non-image name is rejected (the
-- "owner replaces" check exists but no test covered it).
reset role;
select tests.claims(:rosa);
set role authenticated;
insert into storage.objects (bucket_id, name) values ('covers', 'aaaaaaaa-0000-4000-8000-00000000000a/b.webp');
select tests.throws(
  $$update storage.objects set name = 'aaaaaaaa-0000-4000-8000-00000000000a/b.html'
    where name = 'aaaaaaaa-0000-4000-8000-00000000000a/b.webp'$$,
  '42501', 'R-4: a cover cannot be renamed to a non-image name');

-- R-1: the time-zone trigger must not make bulk writes pathologically slow.
-- One pg_timezone_names lookup reads the whole zone database (~5 ms), so a
-- 2000-row PATCH costs ~11 s of database time (statement_timeout territory).
:as_admin
insert into public.concerts (owner_id, title)
select :rosa, 'c' || n from generate_series(1, 500) as n;
reset role;
select tests.claims(:rosa);
set role authenticated;
select clock_timestamp() as started \gset
update public.concerts set notes = 'x';
select tests.ok(clock_timestamp() - :'started'::timestamptz < interval '1500 milliseconds',
  'R-1: updating 500 own concerts (no time-zone change) takes under 1.5 s (about 10 ms expected; the trigger took ~2.5 s), took '
  || (extract(epoch from clock_timestamp() - :'started'::timestamptz) * 1000)::int || ' ms');
