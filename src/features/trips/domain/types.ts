import type { DateOnly } from "../../../lib/dates";

export type TripStatus = "tentative" | "confirmed" | "completed" | "cancelled";

export interface Trip {
  id: string;
  title: string;
  destinations: string[];
  startDate: DateOnly;
  endDate: DateOnly;
  status: TripStatus;
  archived: boolean;
  notes: string;
  coverHue: number;
}
