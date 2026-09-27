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
      <div className="wallet-detail-heading">
        <h2>Concert details</h2>
        <button
          className="wallet-text-button"
          onClick={() => setEditor({ type: "concert", id: concert.id })}
        >
          <ImagePlus size={16} />
          Edit / image
        </button>
      </div>
      <dl className="wallet-facts">
        <div>
          <dt>When</dt>
          <dd>
            {day(concert.date)} ·{" "}
            {concert.time ? `${concert.time} JST` : "Time TBA"}
          </dd>
        </div>
        <div>
          <dt>Venue</dt>
          <dd>{concert.venue}</dd>
        </div>
      </dl>
      {applications.length ? (
        applications.map((application) => (
          <section className="wallet-round" key={application.id}>
            <div>
              <h3>{application.provider}</h3>
              <span>{appStatus(application)}</span>
            </div>
            <p>{application.round}</p>
            {application.result === "Won" &&
            application.payment === "Unpaid" ? (
              <>
                <p className="wallet-payment-time">
                  Payment due {instant(application.paymentDeadline)}
                </p>
                <button
                  className="wallet-primary"
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
                className="wallet-text-button"
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
          className="wallet-primary"
          onClick={() =>
            setEditor({ type: "application", concertId: concert.id })
          }
        >
          Add ticket application
        </button>
      )}
      {trip && (
        <button className="wallet-linked-row" onClick={() => openTrip(trip.id)}>
          <span>
            <small>Part of your trip</small>
            <strong>{trip.cities}</strong>
          </span>
          <ChevronRight size={18} />
        </button>
      )}
      <a
        className="wallet-full-link"
        href={withBasePath(`/concerts/${concert.id}`)}
      >
        Open full concert <ArrowUpRight size={16} />
      </a>
      <p className="wallet-disclaimer">
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
      <div className="wallet-detail-heading">
        <h2>Your journey</h2>
        <button
          className="wallet-text-button"
          onClick={() => setEditor({ type: "trip", id: trip.id })}
        >
          <ImagePlus size={16} />
          Edit / image
        </button>
      </div>
      <p className="wallet-trip-title">{trip.title}</p>
      <div className="wallet-inner-tabs" role="group" aria-label="Trip details">
        <button
          aria-pressed={view === "concerts"}
          onClick={() => setView("concerts")}
        >
          Concerts · {concerts.length}
        </button>
        <button
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
              className="wallet-linked-row"
              onClick={() => openTicket(c.id)}
            >
              <span>
                <small>
                  {day(c.date)} · {c.city}
                </small>
                <strong>{c.title}</strong>
              </span>
              <ChevronRight size={18} />
            </button>
          ))}
          {!concerts.length && (
            <p className="wallet-empty-copy">
              No concerts attached to this trip yet.
            </p>
          )}
          <button
            className="wallet-text-button"
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
              className="wallet-linked-row"
              onClick={() => setEditor({ type: "hotel", id: h.id })}
            >
              <Hotel size={18} />
              <span>
                <strong>{h.name}</strong>
                <small>
                  {day(h.checkIn)} – {day(h.checkOut)} · {h.payment}
                </small>
              </span>
              <ChevronRight size={18} />
            </button>
          ))}
          {!stays.length && (
            <p className="wallet-empty-copy">No stays booked yet.</p>
          )}
          <button
            className="wallet-text-button"
            onClick={() => setEditor({ type: "hotel", tripId: trip.id })}
          >
            Add hotel stay
          </button>
        </div>
      )}
      <div className="wallet-totals">
        {Object.entries(costs(state, trip.id)).map(([currency, value]) => (
          <div key={currency}>
            <span>
              Planned{" "}
              <strong>{money(value.total, currency as Currency)}</strong>
            </span>
            <span>
              Paid <strong>{money(value.paid, currency as Currency)}</strong>
            </span>
          </div>
        ))}
      </div>
      <a className="wallet-full-link" href={withBasePath(`/trips/${trip.id}`)}>
        Open full trip <ArrowUpRight size={16} />
      </a>
    </>
  );
}
