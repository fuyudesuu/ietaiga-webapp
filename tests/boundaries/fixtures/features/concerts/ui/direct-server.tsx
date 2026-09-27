// FORBIDDEN: client UI imports a server module directly (relative path).
import { loadTrips } from "../../trips/server/trip-repository";
export const trips = loadTrips;
