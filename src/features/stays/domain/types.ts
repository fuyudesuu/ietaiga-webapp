import type { DateOnly, UtcInstant } from "../../../lib/dates";
import type { Money } from "../../../lib/money";
import type { PaymentStatus } from "../../concerts/domain/types";

export interface Stay {
  id: string;
  tripId: string;
  hotel: string;
  city: string;
  checkIn: DateOnly;
  checkOut: DateOnly;
  timeZone: string;
  status: "booked" | "cancelled";
  payment: PaymentStatus;
  amount: Money | null;
  freeCancellationUntil: UtcInstant | null;
}
