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
  type Trip,
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
  formCalloutClass,
  formHelpClass,
  ConcertMark,
  Empty,
  Choice,
  GlassTag,
  backLinkClass,
  countLabelClass,
  detailAsideClass,
  detailGridClass,
  notesCopyClass,
  panelClass,
  secondaryTextClass,
  sectionHeadingClass,
  sectionTitleClass,
  sideHeadingClass,
  sideSectionClass,
  tabsListClass,
  tabsTriggerClass,
} from "@/components/encore-ui/ui";
import { withBasePath } from "@/lib/encore/paths";
import { cn } from "@/lib/utils";
const hasPhoto = (trip: Trip) => trip.cities.toLowerCase().includes("tokyo");
const tripYearClass = "text-label text-muted-foreground";
const mutedIconClass = "text-muted-foreground";
const dayIntroClass =
  "flex items-center gap-2.5 pt-3 pb-[17px] text-muted-foreground";
const itineraryItemClass =
  "mb-3 flex items-center gap-3.5 border-b border-border py-4.5 max-md:flex-wrap max-md:gap-2.5";
const itineraryTitleClass = "text-body font-[550]";
const itineraryTextClass = "mt-[3px] text-small text-muted-foreground";
const expenseRowClass =
  "flex items-center gap-3 border-b border-border py-4.5 text-small max-md:flex-wrap";
const expenseNoteClass = "block text-small text-muted-foreground";
const expenseAmountClass = "font-medium max-md:ml-auto";
const tripStatClass = "flex items-center gap-2.5 text-small";
const stayDateLabelClass = "text-small tracking-[0.06em] text-muted-foreground";
const stayDateClass = "text-[1.08rem] font-medium";

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
      <div className="grid grid-cols-2 gap-6 max-lg:grid-cols-1">
        {state.trips.map((t) => (
          <a
            key={t.id}
            href={withBasePath("/trips/" + t.id)}
            className={cn(
              panelClass,
              "block overflow-hidden transition-[transform,box-shadow] duration-[180ms] ease-[ease] hover:border-input max-lg:grid max-lg:grid-cols-[0.7fr_1fr] max-md:block",
            )}
          >
            <div
              className={cn(
                "relative flex h-[220px] items-start justify-between overflow-hidden p-5 max-[1251px]:h-[190px] max-lg:h-full max-lg:min-h-[245px] max-md:h-[205px] max-md:min-h-0",
                hasPhoto(t)
                  ? "after:absolute after:inset-0 after:bg-[linear-gradient(transparent,#061d2a80)] after:content-['']"
                  : "bg-secondary text-secondary-foreground",
              )}
            >
              {hasPhoto(t) && (
                <img
                  className="absolute inset-0 size-full object-cover object-[center_27%]"
                  src={withBasePath("/tokyo.jpg")}
                  alt="Tokyo at dusk"
                />
              )}
              <GlassTag
                className={cn(
                  "relative z-1",
                  !hasPhoto(t) &&
                    "border-border bg-card text-foreground solid:bg-card",
                )}
              >
                <MapPin size={14} />
                {t.cities}
              </GlassTag>
              {!hasPhoto(t) && (
                <Luggage
                  size={48}
                  strokeWidth={0.8}
                  className="absolute right-[38px] bottom-[30px] opacity-70"
                />
              )}
              <span
                className={cn(
                  "absolute bottom-5 left-[23px] z-1 font-sans text-small tracking-[0.1em] uppercase",
                  hasPhoto(t) ? "text-white" : "text-foreground",
                )}
              >
                {day(t.start, { month: "long" })}
                <strong className="block text-[2.2rem] leading-[1.2] font-[450] tracking-[-1px]">
                  {day(t.start, { day: "2-digit" })}—
                  {day(t.end, { day: "2-digit" })}
                </strong>
              </span>
            </div>
            <div className="p-6 max-md:p-5">
              <div className={cn(sectionTitleClass, "mb-[13px]")}>
                <span className={tripYearClass}>
                  {day(t.start, { year: "numeric" })} · JAPAN
                </span>
                <Pill tone={t.status === "Confirmed" ? "mint" : "neutral"}>
                  {t.status}
                </Pill>
              </div>
              <h2 className="text-[1.35rem] font-[630] tracking-[-0.025em] max-md:text-[1.3rem]">
                {t.title}
              </h2>
              <p className="mt-2 min-h-11 text-[0.8rem] leading-[1.8] text-muted-foreground">
                {t.notes}
              </p>
              <div className="mt-[22px] flex items-center gap-[22px] border-t border-border pt-[17px] text-small text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <Ticket size={16} />
                  {state.concerts.filter((c) => c.tripId === t.id).length}{" "}
                  concerts
                </span>
                <span className="flex items-center gap-1.5">
                  <HotelIcon size={16} />
                  {state.hotels.filter((h) => h.tripId === t.id).length} stays
                </span>
                <ArrowUpRight size={19} className="ml-auto" />
              </div>
            </div>
          </a>
        ))}
        <button
          className="flex min-h-40 flex-col items-center justify-center gap-2 rounded-[16px] border border-dashed border-input bg-transparent text-muted-foreground"
          onClick={() => setEditor({ type: "trip" })}
        >
          <span className="grid size-[38px] place-items-center rounded-full border border-border bg-secondary text-primary">
            <Plus size={23} />
          </span>
          <h3 className="text-[0.95rem] font-medium text-foreground">
            Where to next?
          </h3>
          <p className="text-[0.8rem]">Start a new journey.</p>
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
      <a href={withBasePath("/trips")} className={backLinkClass}>
        <ArrowLeft size={16} />
        My trips
      </a>
      <div className="relative mb-[30px] h-auto min-h-[260px] overflow-hidden rounded-[16px] bg-[#172e51] text-white max-md:min-h-[300px]">
        {hasPhoto(t) && (
          <img
            className="absolute inset-0 size-full object-cover object-[center_24%]"
            src={withBasePath("/tokyo.jpg")}
            alt="Tokyo skyline"
          />
        )}
        <div className="absolute inset-0 bg-[linear-gradient(180deg,#081b3015_15%,#09182250_50%,#091520df_100%)]" />
        <div className="relative max-w-[680px] px-[30px] pt-[70px] pb-7 max-md:px-[22px] max-md:pt-20 max-md:pb-6">
          <Pill tone="glass">{t.status}</Pill>
          <h1 className="mt-[15px] mb-4.5 max-w-[30ch] text-[2.25rem] leading-[1.18] font-[620] tracking-[-0.025em] max-md:max-w-[22ch] max-md:text-[1.7rem]">
            {t.title}
          </h1>
          <div className="flex flex-wrap gap-[17px] text-small max-md:flex-col max-md:items-start max-md:gap-2.5">
            <span className="flex items-center gap-1.5">
              <MapPin size={16} />
              {t.cities}
            </span>
            <span className="flex items-center gap-1.5">
              <CalendarDays size={16} />
              {day(t.start)} — {day(t.end)}, {day(t.end, { year: "numeric" })}
            </span>
          </div>
        </div>
        <Button
          className="absolute top-5 right-[22px] bg-[#ffffffed] text-[#14233e] hover:bg-[#ffffffed] hover:text-[#14233e] dark:bg-[#ffffffed] dark:hover:bg-[#ffffffed] max-md:top-4 max-md:right-4"
          variant="outline"
          onClick={() => setEditor({ type: "trip", id: t.id })}
        >
          <Pencil size={15} />
          Edit trip
        </Button>
      </div>
      <div className={detailGridClass}>
        <div>
          <Tabs defaultValue="itinerary">
            <div className="mb-[22px] flex items-center justify-between gap-3 max-md:flex-wrap max-md:gap-3">
              <TabsList className={tabsListClass}>
                <TabsTrigger className={tabsTriggerClass} value="itinerary">
                  Itinerary
                </TabsTrigger>
                <TabsTrigger className={tabsTriggerClass} value="stays">
                  Stays <span className={countLabelClass}>{hotels.length}</span>
                </TabsTrigger>
                <TabsTrigger className={tabsTriggerClass} value="expenses">
                  Expenses
                </TabsTrigger>
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
              <div className="pt-3">
                {dates.map((date) => (
                  <section className="flex gap-[22px] max-md:gap-3" key={date}>
                    <div className="flex w-[60px] shrink-0 items-start gap-[7px] pt-2.5 max-md:w-11 max-md:flex-col max-md:gap-[3px]">
                      <strong className="text-[1.55rem] leading-[1.2] font-medium">
                        {day(date, { day: "2-digit" })}
                      </strong>
                      <span className="text-small leading-[1.4] text-muted-foreground uppercase">
                        {day(date, { month: "short" })}
                        <small className="block text-small normal-case">
                          {day(date, { weekday: "short" })}
                        </small>
                      </span>
                    </div>
                    <div className="relative min-w-0 flex-1 border-l border-border pb-[25px] pl-[21px] before:absolute before:top-[17px] before:-left-1 before:size-[7px] before:rounded-full before:border before:border-input before:bg-background max-md:pl-[15px]">
                      {date === t.start && (
                        <div className={dayIntroClass}>
                          <Luggage size={18} />
                          <h3 className="text-small font-medium">
                            The journey begins
                          </h3>
                        </div>
                      )}
                      {hotels
                        .filter((h) => h.checkOut === date)
                        .map((h) => (
                          <div
                            className={itineraryItemClass}
                            key={"out" + h.id}
                          >
                            <HotelIcon size={20} className={mutedIconClass} />
                            <div className="min-w-0 flex-1">
                              <span className={tripYearClass}>CHECK OUT</span>
                              <h3 className={itineraryTitleClass}>{h.name}</h3>
                              <p className={itineraryTextClass}>{h.city}</p>
                            </div>
                            <Button
                              variant="ghost"
                              className="px-[5px] py-0 max-md:ml-[42px]"
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
                          <div className={itineraryItemClass} key={h.id}>
                            <HotelIcon size={20} className={mutedIconClass} />
                            <div className="min-w-0 flex-1">
                              <span className={tripYearClass}>
                                CHECK IN ·{" "}
                                {Math.round(
                                  (new Date(h.checkOut).getTime() -
                                    new Date(h.checkIn).getTime()) /
                                    86400000,
                                )}{" "}
                                NIGHTS
                              </span>
                              <h3 className={itineraryTitleClass}>{h.name}</h3>
                              <p className={itineraryTextClass}>{h.city}</p>
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
                            className={cn(
                              itineraryItemClass,
                              "hover:border-ring",
                            )}
                            key={c.id}
                          >
                            <ConcertMark
                              concert={c}
                              className="h-[43px] w-[38px] max-md:h-9 max-md:w-8"
                            />
                            <div className="min-w-0 flex-1">
                              <span className={tripYearClass}>
                                {c.time
                                  ? c.time + " JST"
                                  : "TIME NOT ANNOUNCED"}{" "}
                                · LIVE
                              </span>
                              <h3 className={itineraryTitleClass}>{c.title}</h3>
                              <p className={itineraryTextClass}>{c.venue}</p>
                            </div>
                            <ArrowUpRight
                              size={18}
                              className={mutedIconClass}
                            />
                          </a>
                        ))}
                      {date === t.end && (
                        <div className={dayIntroClass}>
                          <Check size={18} />
                          <h3 className="text-small font-medium">
                            Until the next encore.
                          </h3>
                        </div>
                      )}
                    </div>
                  </section>
                ))}
              </div>
            </TabsContent>
            <TabsContent value="stays">
              <div className="flex flex-col gap-4.5">
                {hotels.map((h) => (
                  <HotelCard key={h.id} hotel={h} />
                ))}
                <Button
                  className="w-full border-dashed"
                  variant="outline"
                  onClick={() => setEditor({ type: "hotel", tripId: t.id })}
                >
                  <Plus size={16} />
                  Add hotel stay
                </Button>
              </div>
            </TabsContent>
            <TabsContent value="expenses">
              <section className={cn(panelClass, "p-6 max-md:p-[18px]")}>
                <div className={sectionTitleClass}>
                  <h2 className={sectionHeadingClass}>
                    Every cost, in its own currency.
                  </h2>
                </div>
                {state.applications
                  .filter(
                    (a) =>
                      concerts.some((c) => c.id === a.concertId) &&
                      a.result === "Won",
                  )
                  .map((a) => (
                    <div className={expenseRowClass} key={a.id}>
                      <Ticket size={18} className={mutedIconClass} />
                      <span className="flex-1">
                        {
                          state.concerts.find((c) => c.id === a.concertId)
                            ?.title
                        }
                        <small className={expenseNoteClass}>{a.round}</small>
                      </span>
                      <Pill
                        className="max-md:text-caption"
                        tone={a.payment === "Paid" ? "mint" : "amber"}
                      >
                        {a.payment}
                      </Pill>
                      <strong className={expenseAmountClass}>
                        {money(a.amount, a.currency)}
                      </strong>
                    </div>
                  ))}
                {hotels.map((h) => (
                  <div className={expenseRowClass} key={h.id}>
                    <HotelIcon size={18} className={mutedIconClass} />
                    <span className="flex-1">
                      {h.name}
                      <small className={expenseNoteClass}>Hotel stay</small>
                    </span>
                    <Pill
                      className="max-md:text-caption"
                      tone={h.payment === "Paid" ? "mint" : "amber"}
                    >
                      {h.payment}
                    </Pill>
                    <strong className={expenseAmountClass}>
                      {money(h.amount, h.currency)}
                    </strong>
                  </div>
                ))}
                {Object.entries(summary).map(([c, v]) => (
                  <div
                    className="flex justify-between pt-[22px] pb-3 text-[0.93rem]"
                    key={c}
                  >
                    <span>Total · {c}</span>
                    <strong>{money(v.total, c as Currency)}</strong>
                  </div>
                ))}
                <p className={formHelpClass}>
                  Only winning ticket applications and hotel stays are included.
                  Refunded costs are excluded from totals.
                </p>
              </section>
            </TabsContent>
          </Tabs>
        </div>
        <aside className={detailAsideClass}>
          <section className={sideSectionClass}>
            <h2 className={sideHeadingClass}>Your trip, at a glance</h2>
            <div className="mt-1.5 mb-2.5 flex flex-col gap-[13px] max-md:flex-wrap">
              <span className={tripStatClass}>
                <Ticket size={17} className={mutedIconClass} />
                {concerts.length} concerts
              </span>
              <span className={tripStatClass}>
                <HotelIcon size={17} className={mutedIconClass} />
                {hotels.length} hotel stays
              </span>
              <span className={tripStatClass}>
                <CalendarDays size={17} className={mutedIconClass} />
                {Math.round(
                  (new Date(t.end).getTime() - new Date(t.start).getTime()) /
                    86400000,
                ) + 1}{" "}
                days away
              </span>
            </div>
            <p className={notesCopyClass}>{t.notes}</p>
          </section>
          <section className={sideSectionClass}>
            <h2 className={sideHeadingClass}>Add to this journey</h2>
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
            <div className={formCalloutClass}>
              <strong>Check your trip dates</strong>
              <p>A linked concert falls outside this trip.</p>
            </div>
          )}
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="ghost"
                className="self-start text-muted-foreground text-small! hover:text-muted-foreground"
              >
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
    <article className={cn(panelClass, "p-[22px] max-md:p-[18px]")}>
      <div className={sectionTitleClass}>
        <div className="flex items-center gap-3 max-md:flex-wrap">
          <span className="bg-blue-bg text-blue-text">
            <HotelIcon size={23} />
          </span>
          <div>
            <h3 className="text-[0.99rem] font-[550] max-md:text-body">
              {h.name}
            </h3>
            <p className={secondaryTextClass}>{h.city}</p>
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
      <div className="mt-[23px] flex items-center gap-[25px] max-[1251px]:flex-wrap max-md:gap-4">
        <div className="flex flex-col gap-1">
          <span className={stayDateLabelClass}>CHECK IN</span>
          <strong className={stayDateClass}>{day(h.checkIn)}</strong>
        </div>
        <ArrowUpRight size={18} className={mutedIconClass} />
        <div className="flex flex-col gap-1">
          <span className={stayDateLabelClass}>CHECK OUT</span>
          <strong className={stayDateClass}>{day(h.checkOut)}</strong>
        </div>
        <Pill
          className="ml-auto max-md:ml-0"
          tone={h.payment === "Paid" ? "mint" : "amber"}
        >
          {h.payment}
        </Pill>
      </div>
      <p className="my-5 text-small text-muted-foreground">
        {h.cancellation
          ? "Free cancellation until " + instant(h.cancellation)
          : "Cancellation terms not recorded"}
      </p>
      <footer className="flex flex-wrap items-center gap-2 border-t border-border pt-[15px]">
        <strong className="mr-auto text-[0.97rem] font-medium max-md:mb-2 max-md:basis-full">
          {money(h.amount, h.currency)}
        </strong>
        <Button
          variant="ghost"
          className="px-2 py-0"
          onClick={() => setShow(!show)}
        >
          {show ? h.reference || "No reference added" : "Show reference"}
        </Button>
        <Button
          variant="outline"
          className="px-2 py-0"
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
