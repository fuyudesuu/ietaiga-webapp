"use client";
import { useEffect, useRef, useState, type PointerEvent } from "react";
import {
  ArrowRight,
  Clock3,
  Plus,
  Ticket,
  Luggage,
  CheckCircle2,
} from "lucide-react";
import { usePlanner } from "@/lib/encore/store";
import { appStatus, day, due, money, DEMO_NOW } from "@/lib/encore/model";
import { WalletCard, type WalletCardItem } from "./wallet-card";
import {
  TicketDetails,
  TripDetails,
  walletPrimaryClass,
} from "./wallet-details";
import { CARD_HEIGHT, CARD_PEEK, useWalletMotion } from "./use-wallet-motion";
import { withBasePath } from "@/lib/encore/paths";

type WalletTab = "tickets" | "trips";

export function MobileWallet() {
  const { state, setEditor } = usePlanner();
  const [tab, setTab] = useState<WalletTab>("tickets");
  const [selected, setSelected] = useState<string | null>(null);
  const [rebound, setRebound] = useState(0);
  const heading = useRef<HTMLDivElement>(null);
  const done = useRef<HTMLButtonElement>(null);
  const drag = useRef<{
    pointer: number;
    start: number;
    distance: number;
  } | null>(null);
  const suppressClick = useRef(false);
  const concerts = [...state.concerts]
    .filter((c) => !c.date || c.date >= DEMO_NOW.slice(0, 10))
    .sort((a, b) => (a.date || "9999").localeCompare(b.date || "9999"));
  const trips = [...state.trips]
    .filter((t) => t.end >= DEMO_NOW.slice(0, 10))
    .sort((a, b) => a.start.localeCompare(b.start));
  const allItems: WalletCardItem[] =
    tab === "tickets"
      ? concerts.map((c) => {
          const application =
            state.applications.find(
              (a) => a.concertId === c.id && a.result === "Won",
            ) ?? state.applications.find((a) => a.concertId === c.id);
          return {
            id: c.id,
            title: c.title,
            subtitle: c.subtitle,
            date: c.date ? day(c.date) : "Date TBA",
            location: c.venue,
            status: application ? appStatus(application) : "No application",
            image: c.image,
          };
        })
      : trips.map((t) => ({
          id: t.id,
          title: t.cities,
          subtitle: t.title,
          date: `${day(t.start)} – ${day(t.end)}`,
          location: `${state.concerts.filter((c) => c.tripId === t.id).length} concerts · ${state.hotels.filter((h) => h.tripId === t.id).length} stays`,
          status: t.status,
          image: t.image,
        }));
  // The front stack stays compact; linked items beyond it can still open in place.
  const items = allItems.slice(0, 3);
  const outside = allItems.find(
    (item) =>
      item.id === selected && !items.some((visible) => visible.id === item.id),
  );
  if (outside) items.push(outside);
  const cards = useWalletMotion(
    selected,
    items.map((item) => item.id),
    rebound,
  );
  const concert =
    tab === "tickets"
      ? state.concerts.find((c) => c.id === selected)
      : undefined;
  const trip =
    tab === "trips" ? state.trips.find((t) => t.id === selected) : undefined;
  const payment = state.applications
    .filter(
      (a) =>
        a.result === "Won" &&
        a.payment === "Unpaid" &&
        state.concerts.some((c) => c.id === a.concertId),
    )
    .sort((a, b) =>
      (a.paymentDeadline || "9999").localeCompare(b.paymentDeadline || "9999"),
    )[0];
  const paymentConcert = state.concerts.find(
    (c) => c.id === payment?.concertId,
  );

  function close() {
    const id = selected;
    setSelected(null);
    requestAnimationFrame(() => {
      const target =
        (id && cards.current.get(id)) ||
        document.getElementById(`wallet-tab-${tab}`);
      target?.focus({ preventScroll: true });
    });
  }
  function open(nextTab: WalletTab, id: string) {
    setTab(nextTab);
    setSelected(id);
    heading.current?.scrollIntoView({ block: "start", behavior: "instant" });
  }
  useEffect(() => {
    if (selected) done.current?.focus({ preventScroll: true });
  }, [selected, tab]);
  useEffect(() => {
    function escape(event: KeyboardEvent) {
      if (event.key === "Escape" && selected && !stateEditorOpen()) close();
    }
    // Radix editors own Escape while open; the wallet must not close behind them.
    function stateEditorOpen() {
      return !!document.querySelector('[role="dialog"][data-state="open"]');
    }
    window.addEventListener("keydown", escape);
    return () => window.removeEventListener("keydown", escape);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected]);
  function finishDrag(
    event: PointerEvent<HTMLButtonElement>,
    cancelled = false,
  ) {
    const current = drag.current;
    if (!current || current.pointer !== event.pointerId) return;
    drag.current = null;
    suppressClick.current = current.distance > 5;
    if (!cancelled && current.distance > 75) close();
    else setRebound((value) => value + 1);
  }

  return (
    <section
      className="hidden max-md:mx-auto max-md:block max-md:max-w-[500px]"
      aria-labelledby="wallet-title"
    >
      <div className="mb-[23px] flex items-center justify-between gap-3">
        <div>
          <h1
            id="wallet-title"
            className="text-[2.125rem] leading-[1.15] font-bold tracking-[-0.035em] max-[360px]:text-[1.875rem]"
          >
            Your wallet
          </h1>
          <p className="mt-2 text-label text-muted-foreground max-[360px]:max-w-[24ch]">
            Thu, 1 Oct · Your next live moments
          </p>
        </div>
        <button
          className="grid size-[46px] shrink-0 place-items-center rounded-full bg-accent text-primary active:bg-secondary"
          aria-label={tab === "tickets" ? "Add concert" : "Add trip"}
          onClick={() =>
            setEditor({ type: tab === "tickets" ? "concert" : "trip" })
          }
        >
          <Plus size={23} />
        </button>
      </div>
      {payment && paymentConcert ? (
        <button
          className="flex w-full items-center gap-3 border-y border-border py-[15px] text-left"
          onClick={() => open("tickets", payment.concertId)}
        >
          <Clock3 size={20} className="text-amber-text" />
          <span className="min-w-0 flex-1">
            <strong className="block text-[0.9375rem] font-[620]">
              Payment due · {money(payment.amount, payment.currency)}
            </strong>
            <small className="mt-[3px] block text-caption wrap-anywhere text-muted-foreground">
              {paymentConcert.title} · {due(payment.paymentDeadline)}
            </small>
          </span>
          <ArrowRight size={18} />
        </button>
      ) : (
        <div className="flex items-center gap-2.5 border-y border-border py-3.5 text-small text-muted-foreground">
          <CheckCircle2 size={18} />
          <span>No unpaid winning tickets.</span>
        </div>
      )}
      <div className="mt-[26px] scroll-mt-[86px]" ref={heading}>
        <div
          className="flex gap-1 rounded-[13px] bg-secondary p-1"
          role="tablist"
          aria-label="Wallet contents"
        >
          {(["tickets", "trips"] as const).map((value) => (
            <button
              key={value}
              id={`wallet-tab-${value}`}
              role="tab"
              aria-selected={tab === value}
              aria-controls="wallet-panel"
              tabIndex={tab === value ? 0 : -1}
              className="flex min-h-11 flex-1 items-center justify-center gap-2 rounded-md text-[0.9375rem] font-semibold text-muted-foreground aria-selected:bg-card aria-selected:text-foreground aria-selected:shadow-[0_2px_5px_#14233e0d]"
              onClick={() => {
                setSelected(null);
                setTab(value);
              }}
              onKeyDown={(event) => {
                if (
                  ["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)
                ) {
                  event.preventDefault();
                  const target =
                    event.key === "Home"
                      ? "tickets"
                      : event.key === "End"
                        ? "trips"
                        : tab === "tickets"
                          ? "trips"
                          : "tickets";
                  setSelected(null);
                  setTab(target);
                  document.getElementById(`wallet-tab-${target}`)?.focus();
                }
              }}
            >
              {value === "tickets" ? (
                <Ticket size={17} />
              ) : (
                <Luggage size={17} />
              )}
              {value === "tickets" ? "Tickets" : "Trips"}
              <span className="text-caption font-medium text-muted-foreground">
                {value === "tickets" ? concerts.length : trips.length}
              </span>
            </button>
          ))}
        </div>
        <div className="flex min-h-11 items-center justify-between text-caption text-muted-foreground">
          {selected ? (
            <button
              ref={done}
              onClick={close}
              className="ml-auto min-h-11 pr-2 pl-5 text-small font-semibold text-primary"
            >
              Done
            </button>
          ) : (
            <span>Tap a card to open</span>
          )}
        </div>
      </div>
      <div
        id="wallet-panel"
        className="relative isolate"
        role="tabpanel"
        aria-labelledby={`wallet-tab-${tab}`}
      >
        {items.length ? (
          <>
            {selected && (
              <button
                className="absolute -top-11 left-0 z-12 grid h-11 w-[100px] touch-none place-items-center"
                aria-label="Close card. You can also drag down."
                onClick={() => {
                  if (!suppressClick.current) close();
                  suppressClick.current = false;
                }}
                onPointerDown={(event) => {
                  if (event.button !== 0) return;
                  event.currentTarget.setPointerCapture(event.pointerId);
                  suppressClick.current = false;
                  drag.current = {
                    pointer: event.pointerId,
                    start: event.clientY,
                    distance: 0,
                  };
                  cards.current
                    .get(selected)
                    ?.getAnimations()
                    .forEach((animation) => animation.cancel());
                }}
                onPointerMove={(event) => {
                  if (!drag.current || drag.current.pointer !== event.pointerId)
                    return;
                  drag.current.distance = Math.max(
                    0,
                    event.clientY - drag.current.start,
                  );
                  const node = cards.current.get(selected);
                  if (
                    node &&
                    !window.matchMedia("(prefers-reduced-motion: reduce)")
                      .matches
                  )
                    node.style.transform = `translate3d(0,${Math.min(160, drag.current.distance * 0.8)}px,0) scale(${1 - Math.min(0.04, drag.current.distance / 3500)})`;
                }}
                onPointerUp={(event) => finishDrag(event)}
                onPointerCancel={(event) => finishDrag(event, true)}
              >
                <span className="h-1 w-8 rounded-[2px] bg-input" />
              </button>
            )}
            <div
              className="relative transition-[height] duration-[480ms] ease-[cubic-bezier(0.16,1,0.3,1)] motion-reduce:transition-none"
              style={{
                height: selected
                  ? CARD_HEIGHT
                  : CARD_HEIGHT + (items.length - 1) * CARD_PEEK,
              }}
            >
              {items.map((item, index) => (
                <WalletCard
                  key={`${tab}-${item.id}`}
                  item={item}
                  index={index}
                  selected={selected === item.id}
                  otherSelected={!!selected && selected !== item.id}
                  cardRef={(node) => {
                    if (node) cards.current.set(item.id, node);
                    else cards.current.delete(item.id);
                  }}
                  onSelect={() =>
                    selected === item.id ? close() : open(tab, item.id)
                  }
                />
              ))}
            </div>
            {selected && (
              <div
                id="wallet-item-details"
                className="relative mt-[22px] animate-wallet-detail-in motion-reduce:animate-none"
                key={`${tab}-${selected}`}
              >
                {concert && (
                  <TicketDetails
                    concert={concert}
                    openTrip={(id) => open("trips", id)}
                  />
                )}
                {trip && (
                  <TripDetails
                    trip={trip}
                    openTicket={(id) => open("tickets", id)}
                  />
                )}
              </div>
            )}
            {!selected && (
              <a
                className="flex min-h-[52px] items-center justify-between gap-2 pt-2 text-small font-[550] text-primary"
                href={withBasePath(tab === "tickets" ? "/concerts" : "/trips")}
              >
                View all {tab === "tickets" ? "concerts" : "trips"}
                <ArrowRight size={17} />
              </a>
            )}
          </>
        ) : (
          <div className="py-6">
            <h2 className="text-heading tracking-[-0.025em]">
              {tab === "tickets" ? "Your next stage awaits" : "Where to next?"}
            </h2>
            <p className="mt-3 mb-6 text-muted-foreground">
              Add{" "}
              {tab === "tickets"
                ? "a concert and keep its applications close."
                : "a trip to bring concerts and stays together."}
            </p>
            <button
              className={walletPrimaryClass}
              onClick={() =>
                setEditor({ type: tab === "tickets" ? "concert" : "trip" })
              }
            >
              Add {tab === "tickets" ? "concert" : "trip"}
            </button>
          </div>
        )}
      </div>
      <a
        className="mt-[22px] flex min-h-12 items-center justify-between border-t border-border text-label text-muted-foreground"
        href={withBasePath("/settings#reminders")}
      >
        Reminder preferences <ArrowRight size={15} />
      </a>
      <p className="mt-3 text-caption leading-[1.6] text-muted-foreground">
        Fictional sample plans · Japan time
        <br />
        Concert cover is illustrative; add your own artwork.
      </p>
    </section>
  );
}
