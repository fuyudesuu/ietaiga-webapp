"use client";
import { MobileWallet } from "./wallet/mobile-wallet";
import { useState } from "react";
import {
  ArrowRight,
  ArrowUpRight,
  Bell,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronRight,
  Clock3,
  Hotel,
  Luggage,
  Ticket,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { usePlanner } from "@/lib/encore/store";
import {
  money,
  costs,
  instant,
  due,
  day,
  appStatus,
  DEMO_NOW,
  type Currency,
} from "@/lib/encore/model";
import {
  PageHeading,
  AddButton,
  Pill,
  SectionTitle,
  DateTile,
  ConcertMark,
} from "./ui";

export function Overview() {
  return (
    <>
      <div className="desktop-overview">
        <DesktopOverview />
      </div>
      <MobileWallet />
    </>
  );
}

function DesktopOverview() {
  const { state, setEditor, setApplication, notify } = usePlanner();
  const [calendarView, setCalendarView] = useState("upcoming");
  const today = DEMO_NOW.slice(0, 10);
  const next = [...state.trips]
    .filter((t) => t.end >= today)
    .sort((a, b) => a.start.localeCompare(b.start))[0];
  const upcoming = [...state.concerts]
    .filter((c) => calendarView === "all" || (c.date && c.date >= today))
    .sort((a, b) => (a.date || "9999").localeCompare(b.date || "9999"));
  const attention = state.applications
    .flatMap((a) => {
      const concert = state.concerts.find((c) => c.id === a.concertId);
      if (!concert) return [];
      const payment = a.result === "Won" && a.payment === "Unpaid";
      const result =
        a.result === "Pending" &&
        a.submitted &&
        a.resultDate &&
        a.resultDate <= DEMO_NOW;
      const application = !a.submitted && a.result === "Pending";
      if (!payment && !result && !application) return [];
      return [
        {
          application: a,
          concert,
          kind: payment ? "payment" : result ? "result" : "application",
          date: payment
            ? a.paymentDeadline
            : result
              ? a.resultDate
              : a.deadline,
        },
      ];
    })
    .sort((a, b) => (a.date || "9999").localeCompare(b.date || "9999"));
  const tripConcerts = next
    ? state.concerts
        .filter((c) => c.tripId === next.id)
        .sort((a, b) => (a.date || "9999").localeCompare(b.date || "9999"))
    : [];
  const stays = next
    ? state.hotels
        .filter((h) => h.tripId === next.id)
        .sort((a, b) => a.checkIn.localeCompare(b.checkIn))
    : [];
  const summary = next ? costs(state, next.id) : {};
  return (
    <>
      <PageHeading
        title="Overview"
        subtitle="Thursday, 1 October 2026 · Demo timeline"
        action={
          <div className="heading-actions">
            <Button
              variant="outline"
              onClick={() => setEditor({ type: "trip" })}
            >
              <Luggage size={16} />
              New trip
            </Button>
            <AddButton onClick={() => setEditor({ type: "concert" })}>
              Add concert
            </AddButton>
          </div>
        }
      />
      <div className="agenda-layout">
        <div className="agenda-column">
          <section aria-labelledby="attention-title">
            <div className="section-title">
              <h2 id="attention-title">
                Needs your attention{" "}
                <span className="count-label">{attention.length}</span>
              </h2>
              <span className="secondary">Japan time</span>
            </div>
            <div className="deadline-list">
              {attention.map(({ application: a, concert: c, kind, date }) => (
                <article
                  className={`deadline-row ${kind === "payment" ? "payment-due" : ""}`}
                  key={a.id}
                >
                  <div className="deadline-symbol">
                    {kind === "payment" ? (
                      <Clock3 size={18} />
                    ) : kind === "result" ? (
                      <Ticket size={18} />
                    ) : (
                      <CalendarDays size={18} />
                    )}
                  </div>
                  <div className="deadline-details">
                    <a className="deadline-title" href={"/concerts/" + c.id}>
                      {kind === "payment"
                        ? "Ticket payment due"
                        : kind === "result"
                          ? "Check your lottery result"
                          : "Application closes"}
                    </a>
                    <p>
                      {c.title} <span>· {a.provider}</span>
                    </p>
                    <p className="deadline-time">
                      {instant(date)}
                      {date && (
                        <span>
                          {" "}
                          · {kind === "result" ? "Ready to check" : due(date)}
                        </span>
                      )}
                    </p>
                  </div>
                  <div className="deadline-action">
                    {kind === "payment" && (
                      <strong>{money(a.amount, a.currency)}</strong>
                    )}
                    {kind === "payment" ? (
                      <Button
                        size="sm"
                        onClick={() => {
                          setApplication(a.id, { payment: "Paid" });
                          notify(
                            "Payment recorded. Your trip totals are updated.",
                          );
                        }}
                      >
                        Record payment
                      </Button>
                    ) : (
                      <a href={"/concerts/" + c.id} className="text-link">
                        {kind === "result" ? "Check result" : "View round"}
                        <ChevronRight size={15} />
                      </a>
                    )}
                  </div>
                </article>
              ))}
              {!attention.length && (
                <div className="clear-state">
                  <CheckCircle2 />
                  <div>
                    <strong>You’re up to date</strong>
                    <p>No ticket actions need attention.</p>
                  </div>
                </div>
              )}
            </div>
          </section>
          <section
            aria-labelledby="concert-calendar-title"
            className="stage-section"
          >
            <Tabs value={calendarView} onValueChange={setCalendarView}>
              <div className="section-title">
                <h2 id="concert-calendar-title">Your concert calendar</h2>
                <TabsList className="encore-tabs">
                  <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
                  <TabsTrigger value="all">All</TabsTrigger>
                </TabsList>
              </div>
              <TabsContent value={calendarView}>
                <div className="stage-list">
                  {upcoming
                    .slice(0, calendarView === "all" ? upcoming.length : 3)
                    .map((c) => {
                      const a =
                        state.applications.find(
                          (a) => a.concertId === c.id && a.result === "Won",
                        ) ??
                        state.applications.find((a) => a.concertId === c.id);
                      return (
                        <a
                          className="stage-row"
                          href={"/concerts/" + c.id}
                          key={c.id}
                        >
                          <DateTile date={c.date} />
                          <ConcertMark concert={c} />
                          <div className="stage-copy">
                            <h3>{c.title}</h3>
                            <p>
                              {c.city} · {c.time ? c.time + " JST" : "Time TBA"}
                            </p>
                            <span>{c.venue}</span>
                          </div>
                          <div className="stage-status">
                            <Pill
                              tone={
                                a?.payment === "Paid"
                                  ? "mint"
                                  : a?.result === "Won"
                                    ? "amber"
                                    : "neutral"
                              }
                            >
                              {a ? appStatus(a) : "No application"}
                            </Pill>
                            <ChevronRight size={16} />
                          </div>
                        </a>
                      );
                    })}
                  {!upcoming.length && (
                    <div className="clear-state">
                      <CalendarDays />
                      <p>No upcoming performances. Add a concert to begin.</p>
                    </div>
                  )}
                </div>
              </TabsContent>
            </Tabs>
            <a href="/concerts" className="text-link calendar-more">
              See all concerts <ArrowRight size={15} />
            </a>
          </section>
          <a className="reminder-strip" href="/settings#reminders">
            <Bell size={20} />
            <div>
              <strong>Keep your deadlines close</strong>
              <p>Choose Discord DM or a channel. Delivery is simulated.</p>
            </div>
            <ChevronRight size={17} />
          </a>
        </div>
        <aside className="journey-column" aria-label="Next journey">
          <SectionTitle href="/trips" link="All trips">
            Next journey
          </SectionTitle>
          {next ? (
            <section className="journey-document">
              {next.cities.toLowerCase().includes("tokyo") ? (
                <div className="journey-photo">
                  <img
                    src="/tokyo.jpg"
                    alt="Tokyo Tower above the city at dusk"
                  />
                  <span className="glass-tag">
                    {day(next.start)} — {day(next.end)}
                  </span>
                </div>
              ) : (
                <div className="journey-no-photo">
                  <Luggage size={32} />
                  <span>
                    {day(next.start)} — {day(next.end)}
                  </span>
                </div>
              )}
              <div className="journey-body">
                <a href={"/trips/" + next.id} className="journey-title">
                  <h2>{next.cities}</h2>
                  <ArrowUpRight size={20} />
                </a>
                <p className="journey-caption">
                  {Math.round(
                    (Date.parse(next.end) - Date.parse(next.start)) / 86400000,
                  ) + 1}{" "}
                  days · {tripConcerts.length} concerts · {stays.length} stays
                </p>
                <div className="journey-route">
                  {tripConcerts.map((c, i) => (
                    <a
                      href={"/concerts/" + c.id}
                      className="journey-stop"
                      key={c.id}
                    >
                      <span className="stop-number">{i + 1}</span>
                      <div>
                        <strong>
                          {day(c.date)} · {c.city}
                        </strong>
                        <p>{c.title}</p>
                      </div>
                      <ChevronRight size={14} />
                    </a>
                  ))}
                  {!tripConcerts.length && (
                    <p className="secondary">No concerts attached yet.</p>
                  )}
                </div>
                <div className="journey-stays">
                  <h3>Stays</h3>
                  {stays.map((h) => (
                    <button
                      className="journey-stay"
                      key={h.id}
                      onClick={() => setEditor({ type: "hotel", id: h.id })}
                    >
                      <Hotel size={17} />
                      <span>
                        <strong>{h.name}</strong>
                        <small>
                          {day(h.checkIn)} — {day(h.checkOut)}
                        </small>
                      </span>
                      <span
                        className={
                          h.payment === "Paid" ? "stay-paid" : "stay-unpaid"
                        }
                      >
                        {h.payment === "Paid" ? (
                          <Check size={14} />
                        ) : (
                          <Clock3 size={14} />
                        )}{" "}
                        {h.payment}
                      </span>
                    </button>
                  ))}
                  {!stays.length && (
                    <Button
                      variant="outline"
                      onClick={() =>
                        setEditor({ type: "hotel", tripId: next.id })
                      }
                    >
                      Add a hotel stay
                    </Button>
                  )}
                </div>
                <div className="journey-money">
                  {Object.entries(summary).map(([currency, v]) => (
                    <div key={currency}>
                      <span>
                        Planned{" "}
                        <strong>{money(v.total, currency as Currency)}</strong>
                      </span>
                      <span>
                        Paid{" "}
                        <strong>{money(v.paid, currency as Currency)}</strong>
                      </span>
                    </div>
                  ))}
                </div>
                <Button asChild variant="outline" className="open-journey">
                  <a href={"/trips/" + next.id}>
                    Open trip <ArrowRight size={16} />
                  </a>
                </Button>
              </div>
            </section>
          ) : (
            <div className="panel clear-state">
              <Luggage />
              <div>
                <h3>Your next journey starts here</h3>
                <Button onClick={() => setEditor({ type: "trip" })}>
                  Create trip
                </Button>
              </div>
            </div>
          )}
        </aside>
      </div>
    </>
  );
}
