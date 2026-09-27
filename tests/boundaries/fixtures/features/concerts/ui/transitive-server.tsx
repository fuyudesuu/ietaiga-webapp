// FORBIDDEN: reaches the server module only through a re-export.
import { loadTrips } from "../model";
export const trips = loadTrips;
