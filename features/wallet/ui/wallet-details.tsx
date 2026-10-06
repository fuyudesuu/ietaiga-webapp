"use client";
import { useState } from "react";
import { ArrowUpRight, ChevronRight, Hotel, ImagePlus } from "lucide-react";
import { usePlanner } from "@/lib/encore/store";
import {
  appStatus,
  costs,
  day,
  instant,
  money,
  type Concert,
  type Currency,
  type Trip,
} from "@/lib/encore/model";
import { withBasePath } from "@/lib/encore/paths";

const detailHeadingClass =
  "flex flex-wrap items-center justify-between gap-x-2 gap-y-1";
const detailTitleClass = "text-lead font-[650] tracking-[-0.02em]";
const textButtonClass =
  "inline-flex min-h-11 items-center gap-1.5 text-left text-label font-[550] text-primary";
export const walletPrimaryClass =
  "flex min-h-12 w-full items-center justify-center rounded-md bg-primary px-4 py-3 text-small font-semibold text-primary-foreground";
const linkedRowClass =
  "flex w-full items-center gap-3 border-b border-border py-4 text-left";
const linkedRowNoteClass = "my-[3px] block text-caption text-muted-foreground";
const linkedRowTitleClass = "block text-[0.9375rem] font-[570] wrap-anywhere";
const fullLinkClass =
  "flex min-h-[52px] items-center gap-2 text-small font-[550] text-primary";
const emptyCopyClass = "py-4 text-small text-muted-foreground";
const factLabelClass = "mb-1 text-caption text-muted-foreground";
const innerTabClass =
  "min-h-11 border-b-2 border-transparent text-small text-muted-foreground aria-pressed:border-primary aria-pressed:text-primary";
const totalLabelClass = "text-caption text-muted-foreground";
const totalAmountClass =
  "mt-1.25 block text-body font-semibold text-foreground";

export function TicketDetails({
  concert,
  openTrip,
}: {
  concert: Concert;
  openTrip: (id: string) => void;
}) {
  const { state, setEditor, setApplication, notify } = usePlanner();
  const applications = state.applications.filter(
    (a) => a.concertId === concert.id,
  );
  const trip = state.trips.find((t) => t.id === concert.tripId);
  return (
    <>
      <div className={detailHeadingClass}>
        <h2 className={detailTitleClass}>Concert details</h2>
        <button
          className={textButtonClass}
          onClick={() => setEditor({ type: "concert", id: concert.id })}
        >
          <ImagePlus size={16} />
          Edit / image
        </button>
      </div>
      <dl className="mt-2.5 mb-5 grid grid-cols-2 gap-4 text-small">
        <div>
          <dt className={factLabelClass}>When</dt>
          <dd className="m-0 wrap-anywhere">
            {day(concert.date)} ·{" "}
            {concert.time ? `${concert.time} JST` : "Time TBA"}
          </dd>
        </div>
        <div>
          <dt className={factLabelClass}>Venue</dt>
          <dd className="m-0 wrap-anywhere">{concert.venue}</dd>
        </div>
      </dl>
      {applications.length ? (
        applications.map((application) => (
          <section
            className="border-t border-border py-4.5"
            key={application.id}
          >
            <div className="flex flex-wrap justify-between gap-2">
              <h3 className="text-[0.9375rem] font-[650]">
                {application.provider}
              </h3>
              <span className="text-caption text-muted-foreground">
                {appStatus(application)}
              </span>
            </div>
            <p className="mt-1.25 text-label text-muted-foreground">
              {application.round}
            </p>
            {application.result === "Won" &&
            application.payment === "Unpaid" ? (
              <>
                <p className="my-3 text-label text-amber-text">
                  Payment due {instant(application.paymentDeadline)}
                </p>
                <button
                  className={walletPrimaryClass}
                  onClick={() => {
                    setApplication(application.id, { payment: "Paid" });
                    notify("Payment recorded. Your trip totals are updated.");
                  }}
                >
                  Record payment ·{" "}
                  {money(application.amount, application.currency)}
                </button>
              </>
            ) : (
              <button
                className={textButtonClass}
                onClick={() =>
                  setEditor({
                    type: "application",
                    id: application.id,
                    concertId: concert.id,
                  })
                }
              >
                Update application <ChevronRight size={16} />
              </button>
            )}
          </section>
        ))
      ) : (
        <button
          className={walletPrimaryClass}
          onClick={() =>
            setEditor({ type: "application", concertId: concert.id })
          }
        >
          Add ticket application
        </button>
      )}
      {trip && (
        <button className={linkedRowClass} onClick={() => openTrip(trip.id)}>
          <span className="min-w-0 flex-1">
            <small className={linkedRowNoteClass}>Part of your trip</small>
            <strong className={linkedRowTitleClass}>{trip.cities}</strong>
          </span>
          <ChevronRight size={18} className="text-muted-foreground" />
        </button>
      )}
      <a
        className={fullLinkClass}
        href={withBasePath(`/concerts/${concert.id}`)}
      >
        Open full concert <ArrowUpRight size={16} />
      </a>
      <p className="text-caption leading-[1.6] text-muted-foreground">
        Planning record only. Use the ticket provider’s app for admission.
      </p>
    </>
  );
}

export function TripDetails({
  trip,
  openTicket,
}: {
  trip: Trip;
  openTicket: (id: string) => void;
}) {
  const { state, setEditor } = usePlanner();
  const [view, setView] = useState<"concerts" | "stays">("concerts");
  const concerts = state.concerts
    .filter((c) => c.tripId === trip.id)
    .sort((a, b) => (a.date || "9999").localeCompare(b.date || "9999"));
  const stays = state.hotels
    .filter((h) => h.tripId === trip.id)
    .sort((a, b) => a.checkIn.localeCompare(b.checkIn));
  return (
    <>
      <div className={detailHeadingClass}>
        <h2 className={detailTitleClass}>Your journey</h2>
        <button
          className={textButtonClass}
          onClick={() => setEditor({ type: "trip", id: trip.id })}
        >
          <ImagePlus size={16} />
          Edit / image
        </button>
      </div>
      <p className="mb-3.5 text-small text-muted-foreground">{trip.title}</p>
      <div
        className="flex gap-6 border-b border-border"
        role="group"
        aria-label="Trip details"
      >
        <button
          className={innerTabClass}
          aria-pressed={view === "concerts"}
          onClick={() => setView("concerts")}
        >
          Concerts · {concerts.length}
        </button>
        <button
          className={innerTabClass}
          aria-pressed={view === "stays"}
          onClick={() => setView("stays")}
        >
          Stays · {stays.length}
        </button>
      </div>
      {view === "concerts" ? (
        <div>
          {concerts.map((c) => (
            <button
              key={c.id}
              className={linkedRowClass}
              onClick={() => openTicket(c.id)}
            >
              <span className="min-w-0 flex-1">
                <small className={linkedRowNoteClass}>
                  {day(c.date)} · {c.city}
                </small>
                <strong className={linkedRowTitleClass}>{c.title}</strong>
              </span>
              <ChevronRight size={18} className="text-muted-foreground" />
            </button>
          ))}
          {!concerts.length && (
            <p className={emptyCopyClass}>
              No concerts attached to this trip yet.
            </p>
          )}
          <button
            className={textButtonClass}
            onClick={() => setEditor({ type: "concert", tripId: trip.id })}
          >
            Add concert to trip
          </button>
        </div>
      ) : (
        <div>
          {stays.map((h) => (
            <button
              key={h.id}
              className={linkedRowClass}
              onClick={() => setEditor({ type: "hotel", id: h.id })}
            >
              <Hotel size={18} />
              <span className="min-w-0 flex-1">
                <strong className={linkedRowTitleClass}>{h.name}</strong>
                <small className={linkedRowNoteClass}>
                  {day(h.checkIn)} – {day(h.checkOut)} · {h.payment}
                </small>
              </span>
              <ChevronRight size={18} className="text-muted-foreground" />
            </button>
          ))}
          {!stays.length && (
            <p className={emptyCopyClass}>No stays booked yet.</p>
          )}
          <button
            className={textButtonClass}
            onClick={() => setEditor({ type: "hotel", tripId: trip.id })}
          >
            Add hotel stay
          </button>
        </div>
      )}
      <div>
        {Object.entries(costs(state, trip.id)).map(([currency, value]) => (
          <div
            key={currency}
            className="flex justify-between gap-3.5 border-y border-border py-4.5"
          >
            <span className={totalLabelClass}>
              Planned{" "}
              <strong className={totalAmountClass}>
                {money(value.total, currency as Currency)}
              </strong>
            </span>
            <span className={totalLabelClass}>
              Paid{" "}
              <strong className={totalAmountClass}>
                {money(value.paid, currency as Currency)}
              </strong>
            </span>
          </div>
        ))}
      </div>
      <a className={fullLinkClass} href={withBasePath(`/trips/${trip.id}`)}>
        Open full trip <ArrowUpRight size={16} />
      </a>
    </>
  );
}
