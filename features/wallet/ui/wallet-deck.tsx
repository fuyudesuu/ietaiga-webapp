"use client";
import { useEffect, useRef, useState, type PointerEvent } from "react";
import { usePlanner } from "@/lib/encore/store";
import { appStatus, countOf, day, ticketApplication } from "@/lib/encore/model";
import { WalletCard, type WalletCardItem } from "./wallet-card";
import {
  TicketDetails,
  TripDetails,
  walletPrimaryClass,
} from "./wallet-details";
import { CARD_HEIGHT, CARD_PEEK, useWalletMotion } from "./use-wallet-motion";
import { withBasePath } from "@/lib/encore/paths";
import { phoneColumnClass } from "@/components/encore-ui/ui";

export type WalletKind = "tickets" | "trips";

const pagePath: Record<WalletKind, string> = {
  tickets: "/concerts",
  trips: "/trips",
};

/** The address that opens one card in its page's deck. */
export function walletCardHref(kind: WalletKind, id: string) {
  return withBasePath(`${pagePath[kind]}?open=${encodeURIComponent(id)}`);
}

/**
 * The phone card stack for one kind of plan: concert tickets on Concerts,
 * journeys on Trips. A card opens in place; `?open=<id>` opens one on arrival.
 */
export function WalletDeck({ kind }: { kind: WalletKind }) {
  const { state, setEditor } = usePlanner();
  const [selected, setSelected] = useState<string | null>(null);
  const [rebound, setRebound] = useState(0);
  const heading = useRef<HTMLDivElement>(null);
  const done = useRef<HTMLButtonElement>(null);
  const deck = useRef<HTMLDivElement>(null);
  const drag = useRef<{
    pointer: number;
    start: number;
    distance: number;
  } | null>(null);
  const suppressClick = useRef(false);
  // A card opened by the address moves no focus: the page has just loaded.
  const keepFocus = useRef(false);
  const items: WalletCardItem[] =
    kind === "tickets"
      ? [...state.concerts]
          .sort((first, second) =>
            (first.date || "9999").localeCompare(second.date || "9999"),
          )
          .map((concert) => {
            const application = ticketApplication(state, concert.id);
            return {
              id: concert.id,
              title: concert.title,
              subtitle: concert.subtitle,
              date: concert.date ? day(concert.date) : "Date TBA",
              location: concert.venue,
              status: application ? appStatus(application) : "No application",
              image: concert.image,
            };
          })
      : [...state.trips]
          .sort((first, second) => first.start.localeCompare(second.start))
          .map((trip) => {
            const concerts = state.concerts.filter(
              (concert) => concert.tripId === trip.id,
            ).length;
            const stays = state.hotels.filter(
              (hotel) => hotel.tripId === trip.id,
            ).length;
            return {
              id: trip.id,
              title: trip.cities,
              subtitle: trip.title,
              date: `${day(trip.start)} – ${day(trip.end)}`,
              location: `${countOf(concerts, "concert")} · ${countOf(stays, "stay")}`,
              status: trip.status,
              image: trip.image,
            };
          });
  const cards = useWalletMotion(
    selected,
    items.map((item) => item.id),
    rebound,
  );
  const concert =
    kind === "tickets"
      ? state.concerts.find((candidate) => candidate.id === selected)
      : undefined;
  const trip =
    kind === "trips"
      ? state.trips.find((candidate) => candidate.id === selected)
      : undefined;

  function close() {
    const id = selected;
    setSelected(null);
    requestAnimationFrame(() => {
      const target = (id && cards.current.get(id)) || deck.current;
      target?.focus({ preventScroll: true });
    });
  }
  function open(id: string) {
    setSelected(id);
    heading.current?.scrollIntoView({ block: "start", behavior: "instant" });
  }
  // Arriving from the Overview list (or a linked card) opens that card, one
  // frame after the deck has rendered at rest, so it animates open.
  useEffect(() => {
    const id = new URLSearchParams(window.location.search).get("open");
    if (!id || !items.some((item) => item.id === id)) return;
    const frame = requestAnimationFrame(() => {
      keepFocus.current = true;
      open(id);
    });
    return () => cancelAnimationFrame(frame);
    // Only on arrival: later changes to the list must not reopen it.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => {
    if (selected && !keepFocus.current)
      done.current?.focus({ preventScroll: true });
    keepFocus.current = false;
  }, [selected]);
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
      className={phoneColumnClass}
      aria-label={kind === "tickets" ? "Concert cards" : "Trip cards"}
    >
      <div
        className="flex min-h-11 scroll-mt-[86px] items-center justify-between text-caption text-muted-foreground"
        ref={heading}
      >
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
      <div
        id="wallet-panel"
        ref={deck}
        tabIndex={-1}
        className="relative isolate outline-none"
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
                <span className="h-1 w-8 rounded-xs bg-input" />
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
                  key={item.id}
                  item={item}
                  index={index}
                  selected={selected === item.id}
                  otherSelected={!!selected && selected !== item.id}
                  cardRef={(node) => {
                    if (node) cards.current.set(item.id, node);
                    else cards.current.delete(item.id);
                  }}
                  onSelect={() =>
                    selected === item.id ? close() : open(item.id)
                  }
                />
              ))}
            </div>
            {selected && (
              <div
                id="wallet-item-details"
                className="relative mt-5 animate-wallet-detail-in motion-reduce:animate-none"
                key={selected}
              >
                {concert && (
                  <TicketDetails
                    concert={concert}
                    openTrip={(id) =>
                      window.location.assign(walletCardHref("trips", id))
                    }
                  />
                )}
                {trip && (
                  <TripDetails
                    trip={trip}
                    openTicket={(id) =>
                      window.location.assign(walletCardHref("tickets", id))
                    }
                  />
                )}
              </div>
            )}
          </>
        ) : (
          <div className="py-6">
            <h2 className="text-heading tracking-tight">
              {kind === "tickets" ? "Your next stage awaits" : "Where to next?"}
            </h2>
            <p className="mt-3 mb-6 text-muted-foreground">
              Add{" "}
              {kind === "tickets"
                ? "a concert and keep its applications close."
                : "a trip to bring concerts and stays together."}
            </p>
            <button
              className={walletPrimaryClass}
              onClick={() =>
                setEditor({ type: kind === "tickets" ? "concert" : "trip" })
              }
            >
              Add {kind === "tickets" ? "concert" : "trip"}
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
