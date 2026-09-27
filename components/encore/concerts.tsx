"use client";
import { useState } from "react";
import { useParams } from "next/navigation";
import {
  Search,
  ArrowUpRight,
  ArrowLeft,
  MapPin,
  CalendarDays,
  Clock3,
  Ticket,
  Bell,
  Pencil,
  Check,
  Copy,
  Wallet,
  Music2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { usePlanner } from "@/lib/encore/store";
import {
  type Application,
  day,
  instant,
  money,
  appStatus,
} from "@/lib/encore/model";
import {
  AddButton,
  PageHeading,
  DateTile,
  ConcertMark,
  Pill,
  Empty,
  Choice,
} from "./ui";
export function Concerts() {
  const { state, setEditor } = usePlanner();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const concerts = state.concerts
    .filter((c) =>
      (c.title + " " + c.subtitle + " " + c.city)
        .toLowerCase()
        .includes(search.toLowerCase()),
    )
    .filter(
      (c) =>
        filter === "all" ||
        (filter === "wishlist"
          ? !c.tripId
          : state.applications.some(
              (a) =>
                a.concertId === c.id &&
                (filter === "payment"
                  ? a.result === "Won" && a.payment === "Unpaid"
                  : a.result === "Won" && a.payment === "Paid"),
            )),
    )
    .sort((a, b) => (a.date || "9999").localeCompare(b.date || "9999"));
  return (
    <>
      <PageHeading
        eyebrow="YOUR LIVE MUSIC DIARY"
        title="Concerts"
        subtitle={`${state.concerts.length} performances · Applications, results, and tickets`}
        action={
          <AddButton onClick={() => setEditor({ type: "concert" })}>
            Add concert
          </AddButton>
        }
      />
      <div className="filter-bar">
        <div className="search-field">
          <Search size={18} />
          <Input
            aria-label="Search concerts"
            placeholder="Search concerts, artists, or cities"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Choice
          label="Filter concerts"
          value={filter}
          onChange={setFilter}
          options={[
            { value: "all", label: "All concerts" },
            { value: "payment", label: "Payment needed" },
            { value: "secured", label: "Ticket secured" },
            { value: "wishlist", label: "No trip yet" },
          ]}
        />
      </div>
      <div className="concert-list-header">
        <span>PERFORMANCE</span>
        <span>TICKET STATUS</span>
      </div>
      <div className="panel concert-list">
        {concerts.map((c) => {
          const a = state.applications.find((a) => a.concertId === c.id);
          return (
            <a href={"/concerts/" + c.id} key={c.id} className="concert-row">
              <DateTile date={c.date} />
              <ConcertMark concert={c} />
              <div className="row-copy">
                <h3>{c.title}</h3>
                <p>{c.subtitle}</p>
                <small>
                  <MapPin size={13} />
                  {c.venue} · {c.city}
                </small>
              </div>
              <Pill
                tone={
                  a?.payment === "Paid"
                    ? "mint"
                    : a?.result === "Won"
                      ? "amber"
                      : "neutral"
                }
              >
                {a ? appStatus(a) : "On the wishlist"}
              </Pill>
              <ArrowUpRight size={18} className="row-arrow" />
            </a>
          );
        })}
        {concerts.length === 0 && (
          <Empty
            title="No concerts found"
            description="Try another search or clear your filters."
            action={
              <Button
                variant="outline"
                onClick={() => {
                  setSearch("");
                  setFilter("all");
                }}
              >
                Clear filters
              </Button>
            }
          />
        )}
      </div>
      <p className="fiction-note">
        All performances, dates, and ticket outcomes in this demo are fictional.
      </p>
    </>
  );
}
export function ConcertDetail() {
  const params = useParams();
  const { state, setEditor, update, notify } = usePlanner();
  const c = state.concerts.find((c) => c.id === params.id);
  if (!c)
    return (
      <Empty
        title="Concert not found"
        description="This concert may have been removed from your demo."
        action={
          <Button asChild>
            <a href="/concerts">Back to concerts</a>
          </Button>
        }
      />
    );
  const applications = state.applications.filter((a) => a.concertId === c.id);
  return (
    <>
      <a href="/concerts" className="back-link">
        <ArrowLeft size={16} />
        All concerts
      </a>
      <div className="concert-detail-head">
        <ConcertMark concert={c} large />
        <div>
          <h1>{c.title}</h1>
          <p>{c.subtitle}</p>
        </div>
        <Button
          variant="outline"
          onClick={() => setEditor({ type: "concert", id: c.id })}
        >
          <Pencil size={15} />
          Edit concert
        </Button>
      </div>
      <div className="event-facts panel">
        <span>
          <CalendarDays />
          <strong>
            {day(c.date, { day: "numeric", month: "long", year: "numeric" })}
          </strong>
        </span>
        <span>
          <Clock3 />
          <strong>{c.time ? c.time + " JST" : "Time not announced"}</strong>
        </span>
        <span>
          <MapPin />
          <strong>
            {c.venue}
            <small>{c.city}</small>
          </strong>
        </span>
      </div>
      <div className="detail-grid">
        <div>
          <div className="section-title">
            <h2>
              Ticket applications{" "}
              <span className="count-label">{applications.length}</span>
            </h2>
            <Button
              variant="outline"
              onClick={() =>
                setEditor({ type: "application", concertId: c.id })
              }
            >
              + Add round
            </Button>
          </div>
          <div className="application-list">
            {applications.map((a) => (
              <ApplicationCard key={a.id} application={a} />
            ))}
            {applications.length === 0 && (
              <Empty
                title="The anticipation starts here."
                description="Add an application round to keep its deadlines and results together."
                action={
                  <AddButton
                    onClick={() =>
                      setEditor({ type: "application", concertId: c.id })
                    }
                  >
                    Add application
                  </AddButton>
                }
              />
            )}
          </div>
        </div>
        <aside className="detail-aside">
          <section className="panel side-section">
            <h2>Part of the journey</h2>
            <p className="secondary">
              Keep this performance with your travel plans.
            </p>
            <Choice
              label="Linked trip"
              value={c.tripId || "none"}
              onChange={(v) => {
                update((s) => ({
                  ...s,
                  concerts: s.concerts.map((x) =>
                    x.id === c.id ? { ...x, tripId: v === "none" ? "" : v } : x,
                  ),
                }));
                notify(
                  v === "none"
                    ? "Concert detached. Your ticket history is kept."
                    : "Concert attached to your trip.",
                );
              }}
              options={[
                { value: "none", label: "No trip attached" },
                ...state.trips.map((t) => ({ value: t.id, label: t.cities })),
              ]}
            />
            {c.tripId && (
              <a className="text-link" href={"/trips/" + c.tripId}>
                Open trip
                <ArrowUpRight size={15} />
              </a>
            )}
          </section>
          <section className="panel side-section">
            <div className="section-title">
              <h2>Little details</h2>
              <Pencil size={16} />
            </div>
            <p className="notes-copy">
              {c.notes ||
                "No notes yet. Add venue details, reminders, or anything useful for the day."}
            </p>
            <Button
              variant="ghost"
              onClick={() => setEditor({ type: "concert", id: c.id })}
            >
              Edit notes
            </Button>
          </section>
          <p className="fiction-note">
            Sample performance. Dates and ticketing arrangements are fictional.
          </p>
        </aside>
      </div>
    </>
  );
}
function ApplicationCard({ application: a }: { application: Application }) {
  const { state, setApplication, setEditor, notify, update } = usePlanner();
  function change(changes: Partial<Application>, message: string) {
    setApplication(a.id, changes);
    notify(message);
  }
  return (
    <article className="panel application-card">
      <header>
        <span className="provider-label">
          <Ticket size={15} />
          {a.provider}
        </span>
        <Pill
          tone={
            a.result === "Won"
              ? "mint"
              : a.result === "Lost"
                ? "neutral"
                : "blue"
          }
        >
          {a.result === "Pending" ? "Lottery" : a.result}
        </Pill>
        <Button
          variant="ghost"
          size="icon"
          aria-label={"Edit " + a.round}
          onClick={() =>
            setEditor({ type: "application", id: a.id, concertId: a.concertId })
          }
        >
          <Pencil size={16} />
        </Button>
      </header>
      <h3>{a.round}</h3>
      <div className="ticket-timeline">
        <div className={a.submitted ? "done" : ""}>
          <span>{a.submitted ? <Check size={13} /> : 1}</span>
          <strong>Apply</strong>
          <small>{a.deadline ? day(a.deadline) : "TBA"}</small>
        </div>
        <i />
        <div className={a.result !== "Pending" ? "done" : ""}>
          <span>{a.result !== "Pending" ? <Check size={13} /> : 2}</span>
          <strong>Result</strong>
          <small>{a.resultDate ? day(a.resultDate) : "TBA"}</small>
        </div>
        <i />
        <div
          className={
            a.payment === "Paid" ? "done" : a.result === "Won" ? "current" : ""
          }
        >
          <span>{a.payment === "Paid" ? <Check size={13} /> : 3}</span>
          <strong>Payment</strong>
          <small>
            {a.payment === "Paid"
              ? "Paid"
              : a.paymentDeadline
                ? day(a.paymentDeadline)
                : "TBA"}
          </small>
        </div>
      </div>
      <div className="application-status-grid">
        <div>
          <span>Submission</span>
          <strong>{a.submitted ? "Submitted" : "Not submitted"}</strong>
        </div>
        <div>
          <span>Result</span>
          <strong>{a.result}</strong>
        </div>
        <div>
          <span>Payment</span>
          <strong>{a.payment}</strong>
        </div>
        <div>
          <span>Collection</span>
          <strong>{a.collection}</strong>
        </div>
      </div>
      {a.result === "Won" && a.payment === "Unpaid" && (
        <div className="payment-callout">
          <div>
            <strong>{money(a.amount, a.currency)} to secure your seat</strong>
            <p>Pay by {instant(a.paymentDeadline)}</p>
            {a.paymentDeadline && state.preferences.zone !== "Asia/Tokyo" && (
              <small>
                Your time: {instant(a.paymentDeadline, state.preferences.zone)}
              </small>
            )}
          </div>
          <Button
            className="primary-button"
            onClick={() =>
              change(
                { payment: "Paid" },
                "Payment recorded. This deadline is cleared from your overview.",
              )
            }
          >
            Record payment
            <Check size={15} />
          </Button>
        </div>
      )}
      {!a.submitted && (
        <div className="round-action">
          <p>Applications close {instant(a.deadline)}</p>
          <Button
            variant="outline"
            onClick={() =>
              change({ submitted: true }, "Application marked as submitted.")
            }
          >
            Mark submitted
          </Button>
        </div>
      )}
      {a.submitted && a.result === "Pending" && (
        <div className="round-action">
          <div>
            <strong>Record your lottery result</strong>
            <p>Announcement: {instant(a.resultDate)}</p>
          </div>
          <Choice
            label={"Result for " + a.round}
            value={a.result}
            onChange={(v) =>
              change(
                {
                  result: v as Application["result"],
                  payment: v === "Won" ? "Unpaid" : a.payment,
                },
                "Lottery result updated.",
              )
            }
            options={["Pending", "Won", "Lost", "Waitlisted"]}
          />
        </div>
      )}
      {a.result === "Won" && a.payment === "Paid" && (
        <div className="round-action">
          <span className="secured">
            <Check size={17} />
            Your seat is secured · {money(a.amount, a.currency)}
          </span>
          <Button
            variant="outline"
            disabled={a.collection === "Collected"}
            onClick={() =>
              change({ collection: "Collected" }, "Ticket marked as collected.")
            }
          >
            {a.collection === "Collected" ? "Collected" : "Mark collected"}
          </Button>
        </div>
      )}
      <footer>
        <Button
          variant="ghost"
          onClick={() => setEditor({ type: "reminder", id: a.id })}
        >
          <Bell size={15} />
          {a.reminder ? a.offset + " before" : "Add reminder"}
        </Button>
        <Button
          variant="ghost"
          onClick={() => {
            const copy = {
              ...a,
              id: crypto.randomUUID(),
              round: a.round + " (copy)",
              submitted: false,
              result: "Pending" as const,
              payment: "Unpaid" as const,
              collection: "Not ready" as const,
              reminder: false,
            };
            update((s) => ({ ...s, applications: [...s.applications, copy] }));
            setEditor({
              type: "application",
              id: copy.id,
              concertId: a.concertId,
            });
            notify("Copied as a fresh application.");
          }}
        >
          <Copy size={14} />
          Duplicate
        </Button>
      </footer>
    </article>
  );
}
