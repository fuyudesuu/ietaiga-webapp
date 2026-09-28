import { TripDetail } from "@/features/trips";
import { seed } from "@/lib/encore/fixtures";
import { RECORD_FALLBACK_ID } from "@/lib/encore/paths";
export function generateStaticParams() {
  return [...seed.trips.map((trip) => trip.id), RECORD_FALLBACK_ID].map(
    (id) => ({ id }),
  );
}
export default function Page() {
  return <TripDetail />;
}
