"use client";
import { MobileWallet } from "@/features/wallet";
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
  panelClass,
  sectionTitleClass,
  GlassTag,
  sectionHeadingClass,
  countLabelClass,
  secondaryTextClass,
  textLinkClass,
  tabsListClass,
  tabsTriggerClass,
} from "@/components/encore-ui/ui";
import { cn } from "@/lib/utils";
import { withBasePath } from "@/lib/encore/paths";

const clearStateClass =
  "flex items-center gap-4 px-5 py-[30px] text-muted-foreground";
const moneyClass = "ml-1.5 text-[0.9375rem] font-semibold text-foreground";

export function Overview() {
  return (
    <>
      <div className="max-md:hidden">
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
          <div className="flex shrink-0 gap-2.5 max-lg:flex-col-reverse">
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
      <div className="grid grid-cols-[minmax(0,1.15fr)_minmax(330px,0.85fr)] items-start gap-[30px] max-[1251px]:grid-cols-[minmax(0,1.15fr)_minmax(300px,0.85fr)] max-[1251px]:gap-6 max-lg:grid-cols-[minmax(0,1fr)] min-[1550px]:gap-11">
        <div className="flex min-w-0 flex-col gap-8">
          <section aria-labelledby="attention-title">
            <div className={sectionTitleClass}>
              <h2 id="attention-title" className={sectionHeadingClass}>
                Needs your attention{" "}
                <span className={countLabelClass}>{attention.length}</span>
              </h2>
              <span className={secondaryTextClass}>Japan time</span>
            </div>
            <div className="border-t border-border">
              {attention.map(({ application: a, concert: c, kind, date }) => (
                <article
                  className="grid grid-cols-[24px_minmax(0,1fr)_auto] items-center gap-3 border-b border-border py-[21px] max-[1251px]:grid-cols-[22px_minmax(0,1fr)] min-[1550px]:py-[25px]"
                  key={a.id}
                >
                  <div
                    className={cn(
                      "self-start pt-1 text-muted-foreground",
                      kind === "payment" && "text-amber-text",
                    )}
                  >
                    {kind === "payment" ? (
                      <Clock3 size={18} />
                    ) : kind === "result" ? (
                      <Ticket size={18} />
                    ) : (
                      <CalendarDays size={18} />
                    )}
                  </div>
                  <div>
                    <a
                      className="text-body leading-[1.4] font-[630] text-foreground hover:text-primary"
                      href={withBasePath("/concerts/" + c.id)}
                    >
                      {kind === "payment"
                        ? "Ticket payment due"
                        : kind === "result"
                          ? "Check your lottery result"
                          : "Application closes"}
                    </a>
                    <p className="mt-1.25 text-small text-muted-foreground">
                      {c.title} <span>· {a.provider}</span>
                    </p>
                    <p
                      className={cn(
                        "mt-1.25 text-small leading-normal text-muted-foreground",
                        kind === "payment" && "text-amber-text",
                      )}
                    >
                      {instant(date)}
                      {date && (
                        <span className="whitespace-nowrap">
                          {" "}
                          · {kind === "result" ? "Ready to check" : due(date)}
                        </span>
                      )}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-[9px] max-[1251px]:col-[2] max-[1251px]:mt-[3px] max-[1251px]:flex-row max-[1251px]:items-center max-[1251px]:justify-between">
                    {kind === "payment" && (
                      <strong className="text-body">
                        {money(a.amount, a.currency)}
                      </strong>
                    )}
                    {kind === "payment" ? (
                      <Button
                        size="sm"
                        className="px-3 py-0 text-label!"
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
                      <a
                        href={withBasePath("/concerts/" + c.id)}
                        className={textLinkClass}
                      >
                        {kind === "result" ? "Check result" : "View round"}
                        <ChevronRight size={15} />
                      </a>
                    )}
                  </div>
                </article>
              ))}
              {!attention.length && (
                <div className={clearStateClass}>
                  <CheckCircle2 />
                  <div>
                    <strong className="text-foreground">
                      You’re up to date
                    </strong>
                    <p className="mt-1.25 text-small">
                      No ticket actions need attention.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </section>
          <section aria-labelledby="concert-calendar-title">
            <Tabs value={calendarView} onValueChange={setCalendarView}>
              <div className={cn(sectionTitleClass, "flex-wrap")}>
                <h2 id="concert-calendar-title" className={sectionHeadingClass}>
                  Your concert calendar
                </h2>
                <TabsList className={tabsListClass}>
                  <TabsTrigger className={tabsTriggerClass} value="upcoming">
                    Upcoming
                  </TabsTrigger>
                  <TabsTrigger className={tabsTriggerClass} value="all">
                    All
                  </TabsTrigger>
                </TabsList>
              </div>
              <TabsContent value={calendarView}>
                <div className="border-t border-border">
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
                          className="group grid grid-cols-[43px_42px_minmax(0,1fr)_auto] items-center gap-[13px] border-b border-border py-[21px] text-foreground max-[1251px]:grid-cols-[38px_36px_minmax(0,1fr)] max-[1251px]:gap-2.5 max-lg:grid-cols-[44px_42px_minmax(0,1fr)_auto] min-[1550px]:py-[25px]"
                          href={withBasePath("/concerts/" + c.id)}
                          key={c.id}
                        >
                          <DateTile date={c.date} variant="calendar" />
                          <ConcertMark
                            concert={c}
                            className="size-[42px] rounded-[11px] max-[1251px]:h-[38px] max-[1251px]:w-9 max-lg:size-[42px]"
                          />
                          <div className="min-w-0">
                            <h3 className="text-body leading-[1.4] font-[630] group-hover:text-primary">
                              {c.title}
                            </h3>
                            <p className="mt-1 block text-small text-muted-foreground">
                              {c.city} · {c.time ? c.time + " JST" : "Time TBA"}
                            </p>
                            <span className="mt-1 block text-label text-muted-foreground">
                              {c.venue}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 max-[1251px]:col-[3] max-[1251px]:-mt-[3px] max-[1251px]:justify-between max-lg:col-auto max-lg:m-0">
                            <Pill
                              className="bg-transparent p-0"
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
                            <ChevronRight
                              size={16}
                              className="text-muted-foreground"
                            />
                          </div>
                        </a>
                      );
                    })}
                  {!upcoming.length && (
                    <div className={clearStateClass}>
                      <CalendarDays />
                      <p className="mt-1.25 text-small">
                        No upcoming performances. Add a concert to begin.
                      </p>
                    </div>
                  )}
                </div>
              </TabsContent>
            </Tabs>
            <a
              href={withBasePath("/concerts")}
              className={cn(textLinkClass, "mt-5")}
            >
              See all concerts <ArrowRight size={15} />
            </a>
          </section>
          <a
            className="flex items-center gap-3.5 border-t border-border py-4.5 text-muted-foreground"
            href={withBasePath("/settings#reminders")}
          >
            <Bell size={20} className="text-primary" />
            <div>
              <strong className="text-[0.9375rem] font-[550] text-foreground">
                Keep your deadlines close
              </strong>
              <p className="mt-1 text-small">
                Choose Discord DM or a channel. Delivery is simulated.
              </p>
            </div>
            <ChevronRight size={17} className="ml-auto" />
          </a>
        </div>
        <aside className="min-w-0" aria-label="Next journey">
          <SectionTitle href="/trips" link="All trips">
            Next journey
          </SectionTitle>
          {next ? (
            <section className="overflow-hidden rounded-[16px] border border-border bg-card max-lg:grid max-lg:grid-cols-[0.7fr_1fr]">
              {next.cities.toLowerCase().includes("tokyo") ? (
                <div className="relative h-[210px] overflow-hidden max-lg:h-full max-lg:min-h-[320px] min-[1550px]:h-[245px]">
                  <img
                    className="size-full object-cover object-[50%_40%] max-lg:object-[55%]"
                    src={withBasePath("/tokyo.jpg")}
                    alt="Tokyo Tower above the city at dusk"
                  />
                  <GlassTag className="absolute top-[14px] right-[14px] border-[#ffffff3b] bg-[#122a48b8] px-3 py-2 text-label leading-[1.3] backdrop-blur-[16px] max-lg:right-auto max-lg:left-3 solid:bg-[#152a48] solid:backdrop-blur-none not-supports-[backdrop-filter:blur(1px)]:bg-[#152a48]">
                    {day(next.start)} — {day(next.end)}
                  </GlassTag>
                </div>
              ) : (
                <div className="flex items-center justify-between bg-secondary px-6 py-8 text-secondary-foreground">
                  <Luggage size={32} />
                  <span>
                    {day(next.start)} — {day(next.end)}
                  </span>
                </div>
              )}
              <div className="p-[22px]">
                <a
                  href={withBasePath("/trips/" + next.id)}
                  className="flex items-center justify-between gap-3 text-foreground hover:text-primary"
                >
                  <h2 className="text-[1.55rem] leading-[1.25] font-[650] tracking-[-0.03em]">
                    {next.cities}
                  </h2>
                  <ArrowUpRight size={20} />
                </a>
                <p className="mt-2 text-small text-muted-foreground">
                  {Math.round(
                    (Date.parse(next.end) - Date.parse(next.start)) / 86400000,
                  ) + 1}{" "}
                  days · {tripConcerts.length} concerts · {stays.length} stays
                </p>
                <div className="pt-[21px] pb-4 max-lg:pt-4.5">
                  {tripConcerts.map((c, i) => (
                    <a
                      href={withBasePath("/concerts/" + c.id)}
                      className="group relative flex items-start gap-3 pb-5 text-foreground not-last:before:absolute not-last:before:top-7 not-last:before:bottom-0 not-last:before:left-[13px] not-last:before:w-px not-last:before:bg-border last:pb-0"
                      key={c.id}
                    >
                      <span className="grid size-[27px] shrink-0 place-items-center rounded-full bg-muted text-label">
                        {i + 1}
                      </span>
                      <div>
                        <strong className="text-small font-semibold group-hover:text-primary">
                          {day(c.date)} · {c.city}
                        </strong>
                        <p className="mt-[3px] text-small text-muted-foreground">
                          {c.title}
                        </p>
                      </div>
                      <ChevronRight
                        size={14}
                        className="mt-1.5 ml-auto text-muted-foreground"
                      />
                    </a>
                  ))}
                  {!tripConcerts.length && (
                    <p className={secondaryTextClass}>
                      No concerts attached yet.
                    </p>
                  )}
                </div>
                <div className="border-t border-border pt-4">
                  <h3 className="mb-2 text-[0.9375rem] font-semibold">Stays</h3>
                  {stays.map((h) => (
                    <button
                      className="group flex min-h-[58px] w-full items-center gap-2.5 border-b border-border py-[13px] text-left text-muted-foreground"
                      key={h.id}
                      onClick={() => setEditor({ type: "hotel", id: h.id })}
                    >
                      <Hotel size={17} />
                      <span className="min-w-0 flex-1">
                        <strong className="block text-small font-medium text-foreground group-hover:text-primary">
                          {h.name}
                        </strong>
                        <small className="mt-1 block text-label">
                          {day(h.checkIn)} — {day(h.checkOut)}
                        </small>
                      </span>
                      <span
                        className={cn(
                          "flex items-center gap-1 text-label whitespace-nowrap",
                          h.payment === "Paid"
                            ? "text-mint-text"
                            : "text-amber-text",
                        )}
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
                <div className="py-4.5">
                  {Object.entries(summary).map(([currency, v]) => (
                    <div
                      key={currency}
                      className="flex flex-wrap items-baseline justify-between gap-4"
                    >
                      <span className="text-label text-muted-foreground">
                        Planned{" "}
                        <strong className={moneyClass}>
                          {money(v.total, currency as Currency)}
                        </strong>
                      </span>
                      <span className="text-label text-muted-foreground">
                        Paid{" "}
                        <strong className={moneyClass}>
                          {money(v.paid, currency as Currency)}
                        </strong>
                      </span>
                    </div>
                  ))}
                </div>
                <Button
                  asChild
                  variant="outline"
                  className="w-full border-input text-primary hover:text-primary"
                >
                  <a href={withBasePath("/trips/" + next.id)}>
                    Open trip <ArrowRight size={16} />
                  </a>
                </Button>
              </div>
            </section>
          ) : (
            <div className={cn(panelClass, clearStateClass)}>
              <Luggage />
              <div>
                <h3 className="text-foreground">
                  Your next journey starts here
                </h3>
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
