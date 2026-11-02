import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { TripInput } from "../contracts/trip-input";

import {
  COLUMNS,
  LIST_LIMIT,
  classifyError,
  toRow,
  toTripRecord,
  type RepositoryResult,
  type TripRecord,
  type TripRow,
} from "./trip-records";

// Owner-scoped trip storage. Every call runs through the request's Supabase
// client, so the database applies row-level security as the signed-in user;
// the explicit owner filter is a second, independent guard.

export async function listTrips(
  client: SupabaseClient,
  ownerId: string,
): Promise<RepositoryResult<TripRecord[]>> {
  const { data, error } = await client
    .from("trips")
    .select(COLUMNS)
    .eq("owner_id", ownerId)
    .is("archived_at", null)
    .order("start_date", { ascending: true, nullsFirst: false })
    .limit(LIST_LIMIT)
    .returns<TripRow[]>();
  if (error) return { ok: false, failure: classifyError(error.code) };
  return { ok: true, value: data.map(toTripRecord) };
}

export async function createTrip(
  client: SupabaseClient,
  input: TripInput,
): Promise<RepositoryResult<TripRecord>> {
  const { data, error } = await client
    .from("trips")
    .insert(toRow(input))
    .select(COLUMNS)
    .single<TripRow>();
  if (error) return { ok: false, failure: classifyError(error.code) };
  return { ok: true, value: toTripRecord(data) };
}

export async function updateTrip(
  client: SupabaseClient,
  ownerId: string,
  tripId: string,
  input: TripInput,
): Promise<RepositoryResult<TripRecord>> {
  const { data, error } = await client
    .from("trips")
    .update(toRow(input))
    .eq("id", tripId)
    .eq("owner_id", ownerId)
    .select(COLUMNS)
    .single<TripRow>();
  if (error) return { ok: false, failure: classifyError(error.code) };
  return { ok: true, value: toTripRecord(data) };
}
