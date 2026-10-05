"use client";
import { useState, type ReactNode } from "react";
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
  panelClass,
} from "@/components/encore-ui/ui";
import { useRecordId } from "@/lib/encore/navigation";
import { withBasePath } from "@/lib/encore/paths";
import { cn } from "@/lib/utils";
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
      <div className="mb-[27px] flex justify-between gap-3.5 max-md:flex-wrap max-md:gap-3">
        <div className="relative max-w-[440px] flex-1 max-md:w-full max-md:basis-full">
          <Search
            size={18}
            className="absolute top-[13px] left-[13px] text-muted-foreground"
          />
          <Input
            className="pl-10 text-small!"
            aria-label="Search concerts"
            placeholder="Search concerts, artists, or cities"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Choice
          className="w-[180px] max-md:max-w-none max-md:flex-1"
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
      <div className="mt-0 mr-[55px] mb-2.5 ml-[23px] flex justify-between pl-1 text-caption tracking-[0.04em] text-muted-foreground max-md:hidden">
        <span>PERFORMANCE</span>
        <span>TICKET STATUS</span>
      </div>
      <div className="overflow-hidden border-t border-border">
        {concerts.map((c) => {
          const a = state.applications.find((a) => a.concertId === c.id);
          return (
            <a
              href={withBasePath("/concerts/" + c.id)}
              key={c.id}
              className="group flex min-h-[93px] min-w-0 items-center gap-5 border-b border-border px-1 py-6 text-foreground last:border-0 max-[1251px]:gap-3.5 max-md:grid max-md:grid-cols-[40px_38px_minmax(0,1fr)] max-md:gap-2.5 max-md:px-0 max-md:py-5"
            >
              <DateTile
                date={c.date}
                className="max-md:w-auto max-md:min-w-0"
              />
              <ConcertMark
                concert={c}
                className="h-[60px] w-[53px] max-md:h-[42px] max-md:w-[38px]"
              />
              <div className="min-w-0 flex-1">
                <h3 className="text-body font-[630] tracking-[-0.1px] group-hover:text-primary">
                  {c.title}
                </h3>
                <p className="mt-[3px] text-small wrap-anywhere text-muted-foreground">
                  {c.subtitle}
                </p>
                <small className="mt-1.25 flex items-center gap-1.25 text-small text-muted-foreground max-[1251px]:flex-wrap max-md:text-label">
                  <MapPin size={13} />
                  {c.venue} · {c.city}
                </small>
              </div>
              <Pill
                className="max-lg:text-caption max-md:col-[3] max-md:justify-self-start"
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
              <ArrowUpRight
                size={18}
                className="shrink-0 text-muted-foreground max-md:hidden"
              />
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
      <p className={fictionNoteClass}>
        All performances, dates, and ticket outcomes in this demo are fictional.
      </p>
    </>
  );
}
export function ConcertDetail() {
  const recordId = useRecordId();
  const { state, setEditor, update, notify } = usePlanner();
  const c = state.concerts.find((c) => c.id === recordId);
  if (!c)
    return (
      <Empty
        title="Concert not found"
        description="This concert may have been removed from your demo."
        action={
          <Button asChild>
            <a href={withBasePath("/concerts")}>Back to concerts</a>
          </Button>
        }
      />
    );
  const applications = state.applications.filter((a) => a.concertId === c.id);
  return (
    <>
      <a href={withBasePath("/concerts")} className="back-link">
        <ArrowLeft size={16} />
        All concerts
      </a>
      <div className="mb-7 flex items-center gap-[23px] max-md:mt-[22px] max-md:flex-wrap max-md:gap-3.5">
        <ConcertMark concert={c} large />
        <div className="max-md:min-w-0 max-md:flex-1">
          <h1 className="text-[2.3rem] leading-[1.25] font-[650] tracking-[-0.035em] wrap-anywhere max-md:text-[1.6rem]">
            {c.title}
          </h1>
          <p className="mt-1.25 text-[0.88rem] text-muted-foreground">
            {c.subtitle}
          </p>
        </div>
        <Button
          variant="outline"
          className="ml-auto max-md:ml-0"
          onClick={() => setEditor({ type: "concert", id: c.id })}
        >
          <Pencil size={15} />
          Edit concert
        </Button>
      </div>
      <div
        className={cn(
          panelClass,
          "mb-[30px] flex items-center gap-[35px] p-[23px] max-md:grid max-md:grid-cols-1 max-md:gap-4.5 max-md:p-5",
        )}
      >
        <span className={factClass}>
          <CalendarDays className={factIconClass} />
          <strong className={factTextClass}>
            {day(c.date, { day: "numeric", month: "long", year: "numeric" })}
          </strong>
        </span>
        <span className={factClass}>
          <Clock3 className={factIconClass} />
          <strong className={factTextClass}>
            {c.time ? c.time + " JST" : "Time not announced"}
          </strong>
        </span>
        <span className={factClass}>
          <MapPin className={factIconClass} />
          <strong className={factTextClass}>
            {c.venue}
            <small className="block text-small font-normal text-muted-foreground">
              {c.city}
            </small>
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
          <div className="flex flex-col gap-5">
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
              <a
                className="text-link"
                href={withBasePath("/trips/" + c.tripId)}
              >
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
          <p className={fictionNoteClass}>
            Sample performance. Dates and ticketing arrangements are fictional.
          </p>
        </aside>
      </div>
    </>
  );
}
const fictionNoteClass =
  "mt-4.5 text-small leading-[1.7] text-muted-foreground max-md:text-label";
const factClass = "flex items-center gap-2.5 max-md:flex-wrap";
const factIconClass = "w-[18px] text-muted-foreground";
const factTextClass = "text-small font-medium";
const roundActionClass =
  "mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-border py-4 max-md:items-start";
// Quiet footer actions: muted text that stays muted on hover.
const footerButtonClass =
  "px-2 py-0 text-muted-foreground hover:text-muted-foreground has-[>svg]:px-2";
const timelineLineClass = "mt-3 flex-1 border-t border-border";

function TimelineStep({
  state,
  number,
  label,
  children,
}: {
  state: "todo" | "current" | "done";
  number: number;
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="flex w-[66px] shrink-0 flex-col items-center gap-1.25 max-md:w-[58px]">
      <span
        className={cn(
          "mb-[3px] grid size-[25px] place-items-center rounded-full border border-border bg-muted text-small text-muted-foreground",
          state === "done" &&
            "border-transparent bg-primary text-primary-foreground",
          state === "current" &&
            "border-[#dabb7888] bg-amber-bg text-amber-text",
        )}
      >
        {state === "done" ? <Check size={13} /> : number}
      </span>
      <strong className="text-small font-medium max-md:text-caption">
        {label}
      </strong>
      <small className="text-small text-muted-foreground max-md:text-caption">
        {children}
      </small>
    </div>
  );
}

function StatusCell({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div>
      <span className="mb-1.25 block text-small text-muted-foreground">
        {label}
      </span>
      <strong className="text-small leading-[1.6] font-medium">
        {children}
      </strong>
    </div>
  );
}

function ApplicationCard({ application: a }: { application: Application }) {
  const { state, setApplication, setEditor, notify, update } = usePlanner();
  function change(changes: Partial<Application>, message: string) {
    setApplication(a.id, changes);
    notify(message);
  }
  return (
    <article className={cn(panelClass, "p-6 max-md:p-[18px]")}>
      <header className="mb-[13px] flex items-center gap-[9px]">
        <span className="flex items-center gap-[7px] text-small tracking-[0.05em] text-muted-foreground max-md:text-label max-md:tracking-normal">
          <Ticket size={15} />
          {a.provider}
        </span>
        <Pill
          className="ml-auto"
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
          className="-ml-[3px]"
          aria-label={"Edit " + a.round}
          onClick={() =>
            setEditor({ type: "application", id: a.id, concertId: a.concertId })
          }
        >
          <Pencil size={16} />
        </Button>
      </header>
      <h3 className="text-[1.08rem] font-[550] tracking-[-0.3px]">{a.round}</h3>
      <div className="my-[26px] flex items-start gap-0">
        <TimelineStep
          state={a.submitted ? "done" : "todo"}
          number={1}
          label="Apply"
        >
          {a.deadline ? day(a.deadline) : "TBA"}
        </TimelineStep>
        <i className={timelineLineClass} />
        <TimelineStep
          state={a.result !== "Pending" ? "done" : "todo"}
          number={2}
          label="Result"
        >
          {a.resultDate ? day(a.resultDate) : "TBA"}
        </TimelineStep>
        <i className={timelineLineClass} />
        <TimelineStep
          state={
            a.payment === "Paid"
              ? "done"
              : a.result === "Won"
                ? "current"
                : "todo"
          }
          number={3}
          label="Payment"
        >
          {a.payment === "Paid"
            ? "Paid"
            : a.paymentDeadline
              ? day(a.paymentDeadline)
              : "TBA"}
        </TimelineStep>
      </div>
      <div className="mt-2.5 grid grid-cols-4 gap-2.5 border-t border-border pt-4.5 max-md:grid-cols-2 max-md:gap-4.5">
        <StatusCell label="Submission">
          {a.submitted ? "Submitted" : "Not submitted"}
        </StatusCell>
        <StatusCell label="Result">{a.result}</StatusCell>
        <StatusCell label="Payment">{a.payment}</StatusCell>
        <StatusCell label="Collection">{a.collection}</StatusCell>
      </div>
      {a.result === "Won" && a.payment === "Unpaid" && (
        <div className="mt-[21px] flex items-center justify-between gap-3 rounded-md bg-amber-bg p-4 text-amber-text max-md:flex-wrap max-md:p-3.5">
          <div>
            <strong className="text-small">
              {money(a.amount, a.currency)} to secure your seat
            </strong>
            <p className="mt-1 text-small">
              Pay by {instant(a.paymentDeadline)}
            </p>
            {a.paymentDeadline && state.preferences.zone !== "Asia/Tokyo" && (
              <small className="text-small">
                Your time: {instant(a.paymentDeadline, state.preferences.zone)}
              </small>
            )}
          </div>
          <Button
            className="primary-button px-3!"
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
        <div className={roundActionClass}>
          <p className="text-small text-muted-foreground">
            Applications close {instant(a.deadline)}
          </p>
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
        <div className={roundActionClass}>
          <div className="max-md:w-full">
            <strong className="text-small">Record your lottery result</strong>
            <p className="text-small text-muted-foreground">
              Announcement: {instant(a.resultDate)}
            </p>
          </div>
          <Choice
            className="w-[150px]"
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
        <div className={roundActionClass}>
          <span className="flex items-center gap-1.25 text-[0.8rem] text-primary">
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
      <footer className="mt-3.5 flex flex-wrap items-center justify-between border-t border-border pt-2 max-md:gap-3">
        <Button
          variant="ghost"
          className={footerButtonClass}
          onClick={() => setEditor({ type: "reminder", id: a.id })}
        >
          <Bell size={15} />
          {a.reminder ? a.offset + " before" : "Add reminder"}
        </Button>
        <Button
          variant="ghost"
          className={footerButtonClass}
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
