"use client";
import { commitAndNavigate, useRecordId } from "@/lib/encore/navigation";
import { useState } from "react";
import {
  ArrowLeft,
  ArrowUpRight,
  CalendarDays,
  MapPin,
  Ticket,
  Hotel as HotelIcon,
  Pencil,
  Plus,
  Check,
  Trash2,
  Luggage,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";
import { usePlanner } from "@/lib/encore/store";
import {
  type Hotel,
  type Currency,
  day,
  money,
  costs,
  instant,
} from "@/lib/encore/model";
import {
  PageHeading,
  AddButton,
  Pill,
  ConcertMark,
  Empty,
  Choice,
} from "@/components/encore-ui/ui";
import { withBasePath } from "@/lib/encore/paths";
export function Trips() {
  const { state, setEditor } = usePlanner();
  return (
    <>
      <PageHeading
        eyebrow="NEAR, FAR & EVERYWHERE BETWEEN"
        title="Trips"
        subtitle="Your concerts and hotel stays, organized by journey."
        action={
          <AddButton onClick={() => setEditor({ type: "trip" })}>
            Create trip
          </AddButton>
        }
      />
      <div className="trip-grid">
        {state.trips.map((t) => (
          <a
            key={t.id}
            href={withBasePath("/trips/" + t.id)}
            className="trip-card panel"
          >
            <div
              className={
                "trip-card-cover " +
                (t.cities.toLowerCase().includes("tokyo")
                  ? "photo-cover"
                  : "plain-cover")
              }
            >
              {t.cities.toLowerCase().includes("tokyo") && (
                <img src={withBasePath("/tokyo.jpg")} alt="Tokyo at dusk" />
              )}
              <span className="glass-tag">
                <MapPin size={14} />
                {t.cities}
              </span>
              {!t.cities.toLowerCase().includes("tokyo") && (
                <Luggage size={48} />
              )}
              <span className="trip-cover-date">
                {day(t.start, { month: "long" })}
                <strong>
                  {day(t.start, { day: "2-digit" })}—
                  {day(t.end, { day: "2-digit" })}
                </strong>
              </span>
            </div>
            <div className="trip-card-body">
              <div className="section-title">
                <span className="trip-year">
                  {day(t.start, { year: "numeric" })} · JAPAN
                </span>
                <Pill tone={t.status === "Confirmed" ? "mint" : "neutral"}>
                  {t.status}
                </Pill>
              </div>
              <h2>{t.title}</h2>
              <p>{t.notes}</p>
              <div className="trip-card-meta">
                <span>
                  <Ticket size={16} />
                  {state.concerts.filter((c) => c.tripId === t.id).length}{" "}
                  concerts
                </span>
                <span>
                  <HotelIcon size={16} />
                  {state.hotels.filter((h) => h.tripId === t.id).length} stays
                </span>
                <ArrowUpRight size={19} />
              </div>
            </div>
          </a>
        ))}
        <button
          className="new-trip-card"
          onClick={() => setEditor({ type: "trip" })}
        >
          <span>
            <Plus size={23} />
          </span>
          <h3>Where to next?</h3>
          <p>Start a new journey.</p>
        </button>
      </div>
    </>
  );
}
export function TripDetail() {
  const recordId = useRecordId();
  const { state, setEditor, update, notify } = usePlanner();
  const t = state.trips.find((t) => t.id === recordId);
  if (!t)
    return (
      <Empty
        title="Trip not found"
        description="Your other journeys are waiting."
        action={
          <Button asChild>
            <a href={withBasePath("/trips")}>Back to trips</a>
          </Button>
        }
      />
    );
  const concerts = state.concerts
    .filter((c) => c.tripId === t.id)
    .sort((a, b) => a.date.localeCompare(b.date));
  const hotels = state.hotels.filter((h) => h.tripId === t.id);
  const summary = costs(state, t.id);
  const dates = [
    ...new Set([
      t.start,
      ...concerts.map((c) => c.date).filter(Boolean),
      ...hotels.flatMap((h) => [h.checkIn, h.checkOut]),
      t.end,
    ]),
  ].sort();
  const unlinked = state.concerts.filter((c) => c.tripId !== t.id);
  return (
    <>
      <a href={withBasePath("/trips")} className="back-link">
        <ArrowLeft size={16} />
        My trips
      </a>
      <div className="trip-detail-hero">
        {t.cities.toLowerCase().includes("tokyo") && (
          <img src={withBasePath("/tokyo.jpg")} alt="Tokyo skyline" />
        )}
        <div className="trip-hero-shade" />
        <div className="trip-detail-title">
          <Pill tone="glass">{t.status}</Pill>
          <h1>{t.title}</h1>
          <div className="hero-meta">
            <span>
              <MapPin size={16} />
              {t.cities}
            </span>
            <span>
              <CalendarDays size={16} />
              {day(t.start)} — {day(t.end)}, {day(t.end, { year: "numeric" })}
            </span>
          </div>
        </div>
        <Button
          className="hero-edit"
          variant="outline"
          onClick={() => setEditor({ type: "trip", id: t.id })}
        >
          <Pencil size={15} />
          Edit trip
        </Button>
      </div>
      <div className="detail-grid trip-detail-grid">
        <div>
          <Tabs defaultValue="itinerary">
            <div className="trip-tabs-heading">
              <TabsList className="encore-tabs">
                <TabsTrigger value="itinerary">Itinerary</TabsTrigger>
                <TabsTrigger value="stays">
                  Stays <span className="count-label">{hotels.length}</span>
                </TabsTrigger>
                <TabsTrigger value="expenses">Expenses</TabsTrigger>
              </TabsList>
              <Button
                variant="outline"
                onClick={() => setEditor({ type: "concert", tripId: t.id })}
              >
                <Plus size={15} />
                Concert
              </Button>
            </div>
            <TabsContent value="itinerary">
              <div className="itinerary">
                {dates.map((date) => (
                  <section className="itinerary-day" key={date}>
                    <div className="itinerary-date">
                      <strong>{day(date, { day: "2-digit" })}</strong>
                      <span>
                        {day(date, { month: "short" })}
                        <small>{day(date, { weekday: "short" })}</small>
                      </span>
                    </div>
                    <div className="day-content">
                      {date === t.start && (
                        <div className="day-intro">
                          <Luggage size={18} />
                          <h3>The journey begins</h3>
                        </div>
                      )}
                      {hotels
                        .filter((h) => h.checkOut === date)
                        .map((h) => (
                          <div
                            className="itinerary-item stay-item"
                            key={"out" + h.id}
                          >
                            <HotelIcon size={20} />
                            <div>
                              <span className="trip-year">CHECK OUT</span>
                              <h3>{h.name}</h3>
                              <p>{h.city}</p>
                            </div>
                            <Button
                              variant="ghost"
                              onClick={() =>
                                setEditor({ type: "hotel", id: h.id })
                              }
                            >
                              Details
                            </Button>
                          </div>
                        ))}
                      {hotels
                        .filter((h) => h.checkIn === date)
                        .map((h) => (
                          <div className="itinerary-item stay-item" key={h.id}>
                            <HotelIcon size={20} />
                            <div>
                              <span className="trip-year">
                                CHECK IN ·{" "}
                                {Math.round(
                                  (new Date(h.checkOut).getTime() -
                                    new Date(h.checkIn).getTime()) /
                                    86400000,
                                )}{" "}
                                NIGHTS
                              </span>
                              <h3>{h.name}</h3>
                              <p>{h.city}</p>
                            </div>
                            <Pill
                              tone={h.payment === "Paid" ? "mint" : "neutral"}
                            >
                              {h.payment}
                            </Pill>
                          </div>
                        ))}
                      {concerts
                        .filter((c) => c.date === date)
                        .map((c) => (
                          <a
                            href={withBasePath("/concerts/" + c.id)}
                            className="itinerary-item show-item"
                            key={c.id}
                          >
                            <ConcertMark concert={c} />
                            <div>
                              <span className="trip-year">
                                {c.time
                                  ? c.time + " JST"
                                  : "TIME NOT ANNOUNCED"}{" "}
                                · LIVE
                              </span>
                              <h3>{c.title}</h3>
                              <p>{c.venue}</p>
                            </div>
                            <ArrowUpRight size={18} />
                          </a>
                        ))}
                      {date === t.end && (
                        <div className="day-intro">
                          <Check size={18} />
                          <h3>Until the next encore.</h3>
                        </div>
                      )}
                    </div>
                  </section>
                ))}
              </div>
            </TabsContent>
            <TabsContent value="stays">
              <div className="stays-list">
                {hotels.map((h) => (
                  <HotelCard key={h.id} hotel={h} />
                ))}
                <Button
                  className="add-full"
                  variant="outline"
                  onClick={() => setEditor({ type: "hotel", tripId: t.id })}
                >
                  <Plus size={16} />
                  Add hotel stay
                </Button>
              </div>
            </TabsContent>
            <TabsContent value="expenses">
              <section className="panel expense-list">
                <div className="section-title">
                  <h2>Every cost, in its own currency.</h2>
                </div>
                {state.applications
                  .filter(
                    (a) =>
                      concerts.some((c) => c.id === a.concertId) &&
                      a.result === "Won",
                  )
                  .map((a) => (
                    <div className="expense-row" key={a.id}>
                      <Ticket size={18} />
                      <span>
                        {
                          state.concerts.find((c) => c.id === a.concertId)
                            ?.title
                        }
                        <small>{a.round}</small>
                      </span>
                      <Pill tone={a.payment === "Paid" ? "mint" : "amber"}>
                        {a.payment}
                      </Pill>
                      <strong>{money(a.amount, a.currency)}</strong>
                    </div>
                  ))}
                {hotels.map((h) => (
                  <div className="expense-row" key={h.id}>
                    <HotelIcon size={18} />
                    <span>
                      {h.name}
                      <small>Hotel stay</small>
                    </span>
                    <Pill tone={h.payment === "Paid" ? "mint" : "amber"}>
                      {h.payment}
                    </Pill>
                    <strong>{money(h.amount, h.currency)}</strong>
                  </div>
                ))}
                {Object.entries(summary).map(([c, v]) => (
                  <div className="expense-total" key={c}>
                    <span>Total · {c}</span>
                    <strong>{money(v.total, c as Currency)}</strong>
                  </div>
                ))}
                <p className="form-help">
                  Only winning ticket applications and hotel stays are included.
                  Refunded costs are excluded from totals.
                </p>
              </section>
            </TabsContent>
          </Tabs>
        </div>
        <aside className="detail-aside">
          <section className="panel side-section">
            <h2>Your trip, at a glance</h2>
            <div className="trip-stats">
              <span>
                <Ticket size={17} />
                {concerts.length} concerts
              </span>
              <span>
                <HotelIcon size={17} />
                {hotels.length} hotel stays
              </span>
              <span>
                <CalendarDays size={17} />
                {Math.round(
                  (new Date(t.end).getTime() - new Date(t.start).getTime()) /
                    86400000,
                ) + 1}{" "}
                days away
              </span>
            </div>
            <p className="notes-copy">{t.notes}</p>
          </section>
          <section className="panel side-section">
            <h2>Add to this journey</h2>
            <Button
              variant="outline"
              onClick={() => setEditor({ type: "hotel", tripId: t.id })}
            >
              <HotelIcon size={16} />
              Add hotel stay
            </Button>
            <Choice
              value="none"
              label="Attach an existing concert"
              onChange={(id) => {
                if (id === "none") return;
                update((s) => ({
                  ...s,
                  concerts: s.concerts.map((c) =>
                    c.id === id ? { ...c, tripId: t.id } : c,
                  ),
                }));
                notify("Concert added to this trip.");
              }}
              options={[
                { value: "none", label: "Attach existing concert" },
                ...unlinked.map((c) => ({ value: c.id, label: c.title })),
              ]}
            />
          </section>
          {concerts.some(
            (c) => c.date && (c.date < t.start || c.date > t.end),
          ) && (
            <div className="form-callout">
              <strong>Check your trip dates</strong>
              <p>A linked concert falls outside this trip.</p>
            </div>
          )}
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="ghost" className="delete-trip">
                <Trash2 size={15} />
                Delete this demo trip
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete this trip?</AlertDialogTitle>
                <AlertDialogDescription>
                  Its hotel stays will be removed. Concerts and their
                  application history will be kept and detached from the trip.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Keep trip</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => {
                    commitAndNavigate(
                      () =>
                        update((s) => ({
                          ...s,
                          trips: s.trips.filter((v) => v.id !== t.id),
                          hotels: s.hotels.filter((h) => h.tripId !== t.id),
                          concerts: s.concerts.map((c) =>
                            c.tripId === t.id ? { ...c, tripId: "" } : c,
                          ),
                        })),
                      "/trips",
                    );
                  }}
                >
                  Delete trip
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </aside>
      </div>
    </>
  );
}
function HotelCard({ hotel: h }: { hotel: Hotel }) {
  const { setEditor, update, notify } = usePlanner();
  const [show, setShow] = useState(false);
  return (
    <article className="panel hotel-card">
      <div className="section-title">
        <div className="hotel-name">
          <span className="action-icon blue">
            <HotelIcon size={23} />
          </span>
          <div>
            <h3>{h.name}</h3>
            <p className="secondary">{h.city}</p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          aria-label={"Edit " + h.name}
          onClick={() => setEditor({ type: "hotel", id: h.id })}
        >
          <Pencil size={16} />
        </Button>
      </div>
      <div className="hotel-dates">
        <div>
          <span>CHECK IN</span>
          <strong>{day(h.checkIn)}</strong>
        </div>
        <ArrowUpRight size={18} />
        <div>
          <span>CHECK OUT</span>
          <strong>{day(h.checkOut)}</strong>
        </div>
        <Pill tone={h.payment === "Paid" ? "mint" : "amber"}>{h.payment}</Pill>
      </div>
      <p className="cancellation-note">
        {h.cancellation
          ? "Free cancellation until " + instant(h.cancellation)
          : "Cancellation terms not recorded"}
      </p>
      <footer>
        <strong>{money(h.amount, h.currency)}</strong>
        <Button variant="ghost" onClick={() => setShow(!show)}>
          {show ? h.reference || "No reference added" : "Show reference"}
        </Button>
        <Button
          variant="outline"
          onClick={() => {
            update((s) => ({
              ...s,
              hotels: s.hotels.map((v) =>
                v.id === h.id
                  ? { ...v, payment: v.payment === "Paid" ? "Unpaid" : "Paid" }
                  : v,
              ),
            }));
            notify("Hotel payment updated.");
          }}
        >
          {h.payment === "Paid" ? "Mark unpaid" : "Record payment"}
        </Button>
      </footer>
    </article>
  );
}
