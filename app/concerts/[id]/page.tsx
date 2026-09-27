import { ConcertDetail } from "@/components/encore/concerts";
import { seed } from "@/lib/encore/fixtures";
import { RECORD_FALLBACK_ID } from "@/lib/encore/paths";
export function generateStaticParams() {
  return [
    ...seed.concerts.map((concert) => concert.id),
    RECORD_FALLBACK_ID,
  ].map((id) => ({ id }));
}
export default function Page() {
  return <ConcertDetail />;
}
