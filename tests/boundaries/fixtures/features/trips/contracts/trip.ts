// Client-safe public contract of the trips feature.
import type { ConcertSummary } from "../../concerts/contracts/concert";
export type TripSummary = {
  id: string;
  title: string;
  concerts: ConcertSummary[];
};
