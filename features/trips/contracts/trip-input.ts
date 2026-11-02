import { z } from "zod";

// What a signed-in user may send to create or edit a trip. The owner, id and
// timestamps never come from the request: the database sets them from the
// verified session. Shared with forms for early feedback; the server parses
// again, and the database constraints have the final say.

const isoDate = z.iso.date();

export const tripStatuses = [
  "tentative",
  "confirmed",
  "completed",
  "cancelled",
] as const;

export const tripInput = z
  .object({
    title: z.string().trim().min(1, "Give the trip a name.").max(200),
    destinations: z.string().trim().max(200).default(""),
    startDate: isoDate.nullable().default(null),
    endDate: isoDate.nullable().default(null),
    status: z.enum(tripStatuses).default("tentative"),
    notes: z.string().max(5000).default(""),
  })
  .strict()
  .refine(
    (trip) =>
      !trip.startDate || !trip.endDate || trip.endDate >= trip.startDate,
    { message: "The trip can't end before it starts.", path: ["endDate"] },
  );

export type TripInput = z.infer<typeof tripInput>;
