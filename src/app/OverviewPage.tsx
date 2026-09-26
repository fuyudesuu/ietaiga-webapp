import { Cover } from "../components/Cover";
import layout from "../components/layout.module.css";
import ui from "../components/ui.module.css";
import { formatDateOnly } from "../lib/dates";
import { buildAttention } from "../features/reminders/domain/attention";
import { AttentionList } from "../features/reminders/ui/AttentionList";
import { useNow, useStore } from "./store";

export function OverviewPage() {
  const { data } = useStore();
  const now = useNow();
  const localTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const today = now.toISOString().slice(0, 10);

  const attention = buildAttention({ ...data, now });
  const nextTrip = data.trips
    .filter((trip) => !trip.archived && trip.status !== "cancelled" && trip.endDate >= today)
    .sort((a, b) => a.startDate.localeCompare(b.startDate))[0];
  const upcoming = data.concerts
    .filter((concert) => !concert.archived && concert.status === "planned")
    .sort((a, b) => (a.date ?? "9999").localeCompare(b.date ?? "9999"))
    .slice(0, 5);

  return (
    <>
      <h1 className={layout.pageTitle}>What needs you</h1>
      <p className={layout.lede}>
        {attention.length} {attention.length === 1 ? "item" : "items"} to act on · times shown in the event's zone and{" "}
        {localTimeZone}
      </p>
      <div className={layout.grid}>
        <section aria-labelledby="attention-heading">
          <h2 id="attention-heading" className={ui.sectionTitle}>
            Attention
          </h2>
          <AttentionList items={attention} now={now} localTimeZone={localTimeZone} />
        </section>
        <div>
          <section aria-labelledby="trip-heading">
            <h2 id="trip-heading" className={ui.sectionTitle}>
              Next trip
            </h2>
            {nextTrip ? (
              <a href={`#/trips/${nextTrip.id}`} style={{ textDecoration: "none" }}>
                <Cover hue={nextTrip.coverHue} className={layout.hero}>
                  <span className={layout.heroTitle}>{nextTrip.title}</span>
                  <span>
                    {formatDateOnly(nextTrip.startDate)} – {formatDateOnly(nextTrip.endDate)}
                  </span>
                </Cover>
              </a>
            ) : (
              <p className={ui.empty}>No upcoming trip.</p>
            )}
          </section>
          <section aria-labelledby="upcoming-heading">
            <h2 id="upcoming-heading" className={ui.sectionTitle}>
              Upcoming concerts
            </h2>
            <ul className={layout.rowList}>
              {upcoming.map((concert) => (
                <li key={concert.id}>
                  <a className={layout.rowLink} href={`#/concerts/${concert.id}`}>
                    <Cover hue={concert.coverHue} className={layout.thumb} />
                    <span className={layout.rowText}>
                      <span className={layout.rowTitle}>{concert.title}</span>
                      <br />
                      <span className={layout.rowMeta}>
                        {concert.date ? formatDateOnly(concert.date) : "Date TBA"} · {concert.city}
                      </span>
                    </span>
                  </a>
                </li>
              ))}
            </ul>
          </section>
        </div>
      </div>
    </>
  );
}
