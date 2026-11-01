-- Assertions for the policy tests. Each prints "ok - ..." or raises, which
-- stops psql (ON_ERROR_STOP) and fails the run.
create schema tests;
grant usage on schema tests to anon, authenticated;

create function tests.ok(condition boolean, description text) returns void
language plpgsql as $$
begin
  if condition is not true then
    raise exception 'not ok - %', description;
  end if;
  raise notice 'ok - %', description;
end;
$$;

-- Runs a statement as the current role and expects it to fail with the given
-- SQLSTATE (42501 insufficient privilege / RLS, 23503 foreign key, 23514 check).
create function tests.throws(statement text, expected_state text, description text)
returns void language plpgsql as $$
begin
  begin
    execute statement;
  exception when others then
    if sqlstate = expected_state then
      raise notice 'ok - %', description;
      return;
    end if;
    raise exception 'not ok - % (got %: %)', description, sqlstate, sqlerrm;
  end;
  raise exception 'not ok - % (no error)', description;
end;
$$;

-- Number of rows a query returns for the current role.
create function tests.count(query text) returns bigint
language plpgsql as $$
declare
  result bigint;
begin
  execute 'select count(*) from (' || query || ') as counted' into result;
  return result;
end;
$$;

-- Number of rows a data-changing statement affected for the current role.
create function tests.affected(statement text) returns bigint
language plpgsql as $$
declare
  result bigint;
begin
  execute statement;
  get diagnostics result = row_count;
  return result;
end;
$$;

-- Sets the request identity the way Supabase does for an API call.
create function tests.claims(user_id uuid) returns void
language sql as $$
  select set_config('request.jwt.claims',
    case when user_id is null then '{"role":"anon"}'
         else json_build_object('sub', user_id, 'role', 'authenticated')::text end,
    false);
$$;

grant execute on all functions in schema tests to anon, authenticated;
