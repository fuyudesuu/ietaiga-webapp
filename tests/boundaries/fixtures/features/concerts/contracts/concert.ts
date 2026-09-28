// Deliberate cycle with trips/contracts: concerts -> trips -> concerts.
import { emptyTrip } from "../../trips/contracts/trip-defaults";
export type ConcertSummary = { id: string; title: string };
export const defaultTrip = emptyTrip;
