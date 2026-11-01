"use client";
import { useState } from "react";
import {
  CheckCircle2,
  ChevronRight,
  Clock3,
  Luggage,
  Ticket,
} from "lucide-react";
import { usePlanner } from "@/lib/encore/store";
import {
  appStatus,
  countOf,
  day,
  due,
  money,
  nextPaymentDue,
  ticketApplication,
  DEMO_NOW,
  type Application,
  type Concert,
  type Trip,
} from "@/lib/encore/model";
import {
  applicationTone,
  ConcertMark,
  DateTile,
  PageHeading,
  Pill,
  RoundAddButton,
  phoneColumnClass,
} from "@/components/encore-ui/ui";
import { walletCardHref } from "@/features/wallet";
import { cn } from "@/lib/utils";

type PlanFilter = "all" | "concerts" | "trips";
type PlanEntry =
  | { kind: "concert"; date: string; concert: Concert }
  | { kind: "trip"; date: string; trip: Trip };

const filters: { value: PlanFilter; label: string; icon?: typeof Ticket }[] = [
  { value: "all", label: "All" },
  { value: "concerts", label: "Concerts", icon: Ticket },
  { value: "trips", label: "Trips", icon: Luggage },
];
const rowClass =
  "grid min-h-[88px] grid-cols-[40px_40px_minmax(0,1fr)_16px] items-center gap-3 border-b border-border py-4 text-foreground last:border-0";
const markClass = "h-11 w-10";

const tripsFirst = (entry: PlanEntry) => (entry.kind === "trip" ? -1 : 1);
function monthLabel(date: string) {
  return date
    ? day(date, { month: "long", year: "numeric" })
    : "Date to be announced";
}

/**
 * The phone home screen: everything coming up, concerts and trips in one
 * dated list. Each row opens its card in the Concerts or Trips deck.
 */
export function MobileOverview() {
  const { state, setEditor } = usePlanner();
  const [filter, setFilter] = useState<PlanFilter>("all");
  const entries: PlanEntry[] = [
    ...state.concerts.map((concert): PlanEntry => ({
      kind: "concert",
      date: concert.date,
      concert,
    })),
    ...state.trips.map((trip): PlanEntry => ({
      kind: "trip",
      date: trip.start,
      trip,
    })),
  ]
    .filter(
      (entry) =>
        filter === "all" ||
        (filter === "concerts"
          ? entry.kind === "concert"
          : entry.kind === "trip"),
    )
    // Undated concerts go last; a trip starts before the concerts in it.
    .sort(
      (first, second) =>
        (first.date || "9999").localeCompare(second.date || "9999") ||
        tripsFirst(first) - tripsFirst(second),
    );
  const months = entries.reduce<{ label: string; entries: PlanEntry[] }[]>(
    (groups, entry) => {
      const label = monthLabel(entry.date);
      const last = groups.at(-1);
      if (last?.label === label) last.entries.push(entry);
      else groups.push({ label, entries: [entry] });
      return groups;
    },
    [],
  );
  const counts: Record<PlanFilter, number> = {
    all: state.concerts.length + state.trips.length,
    concerts: state.concerts.length,
    trips: state.trips.length,
  };
  const payment = nextPaymentDue(state);
  const paymentConcert = state.concerts.find(
    (concert) => concert.id === payment?.concertId,
  );

  return (
    <section className={phoneColumnClass}>
      <PageHeading
        title="Your plans"
        subtitle={`${day(DEMO_NOW, { weekday: "short", day: "numeric", month: "short" })} · Concerts and journeys ahead`}
        action={
          <RoundAddButton
            label="Add concert"
            onClick={() => setEditor({ type: "concert" })}
          />
        }
      />
      {payment && paymentConcert ? (
        <a
          className="flex w-full items-center gap-3 border-y border-border py-4 text-left"
          href={walletCardHref("tickets", payment.concertId)}
        >
          <Clock3 size={20} className="text-amber-text" />
          <span className="min-w-0 flex-1">
            <strong className="block text-body font-semibold">
              Payment due · {money(payment.amount, payment.currency)}
            </strong>
            <small className="mt-0.5 block text-caption wrap-anywhere text-muted-foreground">
              {paymentConcert.title} · {due(payment.paymentDeadline)}
            </small>
          </span>
          <ChevronRight size={18} className="text-muted-foreground" />
        </a>
      ) : (
        <div className="flex items-center gap-2.5 border-y border-border py-3 text-small text-muted-foreground">
          <CheckCircle2 size={18} />
          <span>No unpaid winning tickets.</span>
        </div>
      )}
      <div
        className="mt-6 flex gap-1 rounded-lg bg-secondary p-1"
        role="group"
        aria-label="Show"
      >
        {filters.map(({ value, label, icon: Icon }) => (
          <button
            key={value}
            type="button"
            aria-pressed={filter === value}
            onClick={() => setFilter(value)}
            className="flex min-h-11 flex-1 items-center justify-center gap-1.5 rounded-md text-small font-semibold text-muted-foreground aria-pressed:bg-card aria-pressed:text-foreground aria-pressed:shadow-[0_2px_5px_#14233e0d]"
          >
            {Icon && <Icon size={16} />}
            {label}
            <span className="text-caption font-medium text-muted-foreground">
              {counts[value]}
            </span>
          </button>
        ))}
      </div>
      {months.map((month) => (
        <section key={month.label} className="mt-6">
          <h2 className="border-b border-border pb-2 text-label font-semibold tracking-wide text-muted-foreground uppercase">
            {month.label}
          </h2>
          {month.entries.map((entry) =>
            entry.kind === "concert" ? (
              <ConcertRow
                key={"c-" + entry.concert.id}
                concert={entry.concert}
                application={ticketApplication(state, entry.concert.id)}
              />
            ) : (
              <TripRow
                key={"t-" + entry.trip.id}
                trip={entry.trip}
                concerts={
                  state.concerts.filter(
                    (concert) => concert.tripId === entry.trip.id,
                  ).length
                }
                stays={
                  state.hotels.filter((hotel) => hotel.tripId === entry.trip.id)
                    .length
                }
              />
            ),
          )}
        </section>
      ))}
      {!entries.length && (
        <p className="py-8 text-small text-muted-foreground">
          Nothing here yet. Use + to add your first plan.
        </p>
      )}
    </section>
  );
}

function ConcertRow({
  concert,
  application,
}: {
  concert: Concert;
  application: Application | undefined;
}) {
  return (
    <a href={walletCardHref("tickets", concert.id)} className={rowClass}>
      <DateTile date={concert.date} className="w-auto min-w-0" />
      <ConcertMark concert={concert} className={markClass} />
      <span className="min-w-0">
        <strong className="block truncate text-body font-semibold">
          {concert.title}
        </strong>
        <span className="mt-0.5 block truncate text-label text-muted-foreground">
          {concert.venue} · {concert.city}
        </span>
        <Pill tone={applicationTone(application)} className="mt-2 text-caption">
          {application ? appStatus(application) : "On the wishlist"}
        </Pill>
      </span>
      <ChevronRight size={16} className="text-muted-foreground" />
    </a>
  );
}

function TripRow({
  trip,
  concerts,
  stays,
}: {
  trip: Trip;
  concerts: number;
  stays: number;
}) {
  return (
    <a href={walletCardHref("trips", trip.id)} className={rowClass}>
      <DateTile date={trip.start} className="w-auto min-w-0" />
      <span
        aria-hidden
        className={cn(
          "grid place-items-center rounded-md bg-blue-bg text-blue-text",
          markClass,
        )}
      >
        <Luggage size={20} strokeWidth={1.6} />
      </span>
      <span className="min-w-0">
        <strong className="block truncate text-body font-semibold">
          {trip.cities}
        </strong>
        <span className="mt-0.5 block truncate text-label text-muted-foreground">
          To {day(trip.end)} · {countOf(concerts, "concert")} ·{" "}
          {countOf(stays, "stay")}
        </span>
        <Pill
          tone={trip.status === "Confirmed" ? "mint" : "neutral"}
          className="mt-2 text-caption"
        >
          Trip · {trip.status}
        </Pill>
      </span>
      <ChevronRight size={16} className="text-muted-foreground" />
    </a>
  );
}
