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
import { TicketDetails, TripDetails } from "./wallet-details";
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
    <section className="mobile-wallet" aria-labelledby="wallet-title">
      <div className="wallet-page-heading">
        <div>
          <h1 id="wallet-title">Your wallet</h1>
          <p>Thu, 1 Oct · Your next live moments</p>
        </div>
        <button
          className="wallet-add"
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
          className="wallet-attention"
          onClick={() => open("tickets", payment.concertId)}
        >
          <Clock3 size={20} />
          <span>
            <strong>
              Payment due · {money(payment.amount, payment.currency)}
            </strong>
            <small>
              {paymentConcert.title} · {due(payment.paymentDeadline)}
            </small>
          </span>
          <ArrowRight size={18} />
        </button>
      ) : (
        <div className="wallet-clear">
          <CheckCircle2 size={18} />
          <span>No unpaid winning tickets.</span>
        </div>
      )}
      <div className="wallet-section-heading" ref={heading}>
        <div
          className="wallet-tabs"
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
              <span>
                {value === "tickets" ? concerts.length : trips.length}
              </span>
            </button>
          ))}
        </div>
        <div className="wallet-stack-instruction">
          {selected ? (
            <button ref={done} onClick={close}>
              Done
            </button>
          ) : (
            <span>Tap a card to open</span>
          )}
        </div>
      </div>
      <div
        id="wallet-panel"
        role="tabpanel"
        aria-labelledby={`wallet-tab-${tab}`}
      >
        {items.length ? (
          <>
            {selected && (
              <button
                className="wallet-drag-handle"
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
                <span />
              </button>
            )}
            <div
              className={`wallet-deck ${selected ? "has-selection" : ""}`}
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
                className="wallet-details"
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
                className="wallet-all-link"
                href={withBasePath(tab === "tickets" ? "/concerts" : "/trips")}
              >
                View all {tab === "tickets" ? "concerts" : "trips"}
                <ArrowRight size={17} />
              </a>
            )}
          </>
        ) : (
          <div className="wallet-empty">
            <h2>
              {tab === "tickets" ? "Your next stage awaits" : "Where to next?"}
            </h2>
            <p>
              Add{" "}
              {tab === "tickets"
                ? "a concert and keep its applications close."
                : "a trip to bring concerts and stays together."}
            </p>
            <button
              className="wallet-primary"
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
        className="wallet-reminders"
        href={withBasePath("/settings#reminders")}
      >
        Reminder preferences <ArrowRight size={15} />
      </a>
      <p className="wallet-footnote">
        Fictional sample plans · Japan time
        <br />
        Concert cover is illustrative; add your own artwork.
      </p>
    </section>
  );
}
