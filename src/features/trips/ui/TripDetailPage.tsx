import { useStore } from "../../../app/store";
import { Cover } from "../../../components/Cover";
import layout from "../../../components/layout.module.css";
import ui from "../../../components/ui.module.css";
import { formatDateOnly, formatInstant } from "../../../lib/dates";
import { formatMoney, type Money } from "../../../lib/money";
import { PAYMENT_LABELS } from "../../concerts/domain/types";
import { summarizeCosts } from "../domain/costs";

export function TripDetailPage({ id }: { id: string }) {
  const { data } = useStore();
  const trip = data.trips.find((candidate) => candidate.id === id);
  if (!trip) {
    return (
      <div className={ui.empty}>
        <p>This trip does not exist in this browser's demo data.</p>
        <a className={ui.button} href="#/wallet/trips">
          Back to trips
        </a>
      </div>
    );
  }
  const concerts = data.concerts
    .filter((concert) => concert.tripId === trip.id)
    .sort((a, b) => (a.date ?? "9999").localeCompare(b.date ?? "9999"));
  const concertIds = new Set(concerts.map((concert) => concert.id));
  const stays = data.stays.filter((stay) => stay.tripId === trip.id);
  const costs = summarizeCosts(
    data.rounds.filter((round) => concertIds.has(round.concertId)),
    stays,
  );

  return (
    <>
      <a className={layout.back} href="#/wallet/trips">
        ← Trips
      </a>
      <Cover hue={trip.coverHue} className={layout.detailHero}>
        <h1 className={layout.heroTitle}>{trip.title}</h1>
        <span>
          {formatDateOnly(trip.startDate)} – {formatDateOnly(trip.endDate)} · {trip.destinations.join(", ")}
        </span>
      </Cover>
      <div className={layout.meta}>
        <span className={ui.pill}>{trip.status}</span>
        {trip.notes && <span className={ui.pill}>{trip.notes}</span>}
      </div>

      <h2 className={ui.sectionTitle}>Costs</h2>
      <div className={`${ui.card} ${layout.totals}`}>
        <Totals label="Committed" amounts={costs.committed} />
        <Totals label="Paid" amounts={costs.paid} />
        {costs.unknownAmounts > 0 && (
          <p className={ui.muted}>
            {costs.unknownAmounts} committed {costs.unknownAmounts === 1 ? "item has" : "items have"} no price yet.
          </p>
        )}
      </div>

      <h2 className={ui.sectionTitle}>Concerts</h2>
      {concerts.length === 0 ? (
        <p className={ui.empty}>No concerts attached.</p>
      ) : (
        <ul className={layout.rowList}>
          {concerts.map((concert) => {
            const outside = concert.date !== null && (concert.date < trip.startDate || concert.date > trip.endDate);
            return (
              <li key={concert.id}>
                <a className={layout.rowLink} href={`#/concerts/${concert.id}`}>
                  <Cover hue={concert.coverHue} className={layout.thumb} />
                  <span className={layout.rowText}>
                    <span className={layout.rowTitle}>{concert.title}</span>
                    <br />
                    <span className={layout.rowMeta}>
                      {concert.date ? formatDateOnly(concert.date) : "Date TBA"} · {concert.venue}
                    </span>
                  </span>
                  {outside && <span className={ui.pillWarn}>Outside trip dates</span>}
                </a>
              </li>
            );
          })}
        </ul>
      )}

      <h2 className={ui.sectionTitle}>Hotels</h2>
      {stays.length === 0 ? (
        <p className={ui.empty}>No hotel stays yet.</p>
      ) : (
        <div className={layout.stack}>
          {stays.map((stay) => (
            <article key={stay.id} className={ui.card}>
              <div className={layout.roundHeader}>
                <h3>{stay.hotel}</h3>
                <span className={stay.status === "booked" ? ui.pillOk : ui.pill}>{stay.status}</span>
              </div>
              <ul className={layout.deadlines}>
                <li>
                  <span className={ui.muted}>Dates</span>
                  <span>
                    {formatDateOnly(stay.checkIn)} → {formatDateOnly(stay.checkOut)}
                  </span>
                </li>
                <li>
                  <span className={ui.muted}>Price</span>
                  <span>
                    {stay.amount ? formatMoney(stay.amount) : "Unknown"} · {PAYMENT_LABELS[stay.payment]}
                  </span>
                </li>
                <li>
                  <span className={ui.muted}>Free cancellation until</span>
                  <span>{stay.freeCancellationUntil ? formatInstant(stay.freeCancellationUntil, stay.timeZone) : "Not recorded"}</span>
                </li>
              </ul>
            </article>
          ))}
        </div>
      )}
    </>
  );
}

function Totals({ label, amounts }: { label: string; amounts: Money[] }) {
  return (
    <div>
      <div className={ui.muted}>{label}</div>
      {amounts.length === 0 ? (
        <div className={layout.total}>—</div>
      ) : (
        amounts.map((amount) => (
          <div key={amount.currency} className={layout.total}>
            {formatMoney(amount)}
          </div>
        ))
      )}
    </div>
  );
}
