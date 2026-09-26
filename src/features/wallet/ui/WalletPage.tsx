import { useState, type ReactNode } from "react";
import { Cover } from "../../../components/Cover";
import ui from "../../../components/ui.module.css";
import { formatDateOnly } from "../../../lib/dates";
import { formatMoney } from "../../../lib/money";
import { useStore } from "../../../app/store";
import { RESULT_LABELS, type ApplicationRound, type Concert } from "../../concerts/domain/types";
import type { Trip } from "../../trips/domain/types";
import styles from "./Wallet.module.css";

type WalletTab = "tickets" | "trips";

interface WalletCard {
  id: string;
  hue: number;
  eyebrow: string;
  badge: string;
  title: string;
  subtitle: string;
  details: [string, string][];
  href: string;
}

export function WalletPage({ tab }: { tab: WalletTab }) {
  const { data } = useStore();
  const [openId, setOpenId] = useState<string | null>(null);

  const cards = tab === "tickets" ? ticketCards(data.concerts, data.rounds) : tripCards(data.trips, data.concerts);

  return (
    <>
      <h1 className="visually-hidden">Wallet</h1>
      <div className={styles.tabs} role="tablist" aria-label="Wallet">
        <TabLink tab="tickets" current={tab}>Tickets</TabLink>
        <TabLink tab="trips" current={tab}>Trips</TabLink>
      </div>
      {cards.length === 0 ? (
        <p className={ui.empty}>No {tab} yet.</p>
      ) : (
        <ul className={styles.stack} role="tabpanel">
          {cards.map((card, index) => {
            const isOpen = openId === card.id;
            const previousOpen = index > 0 && cards[index - 1]?.id === openId;
            const detailsId = `wallet-details-${card.id}`;
            return (
              <li key={card.id} className={`${styles.slot} ${previousOpen ? styles.slotAfterOpen : ""}`}>
                <button
                  type="button"
                  className={styles.card}
                  aria-expanded={isOpen}
                  aria-controls={detailsId}
                  onClick={() => setOpenId(isOpen ? null : card.id)}
                >
                  <Cover hue={card.hue}>
                    <span className={styles.cardFace}>
                      <span className={styles.cardTop}>
                        <span>{card.eyebrow}</span>
                        <span>{card.badge}</span>
                      </span>
                      <span>
                        <span className={styles.cardTitle}>{card.title}</span>
                        <br />
                        <span className={styles.cardSub}>{card.subtitle}</span>
                      </span>
                    </span>
                  </Cover>
                </button>
                {isOpen && (
                  <dl id={detailsId} className={styles.details}>
                    {card.details.map(([term, value]) => (
                      <div key={term} className={styles.row}>
                        <dt>{term}</dt>
                        <dd>{value}</dd>
                      </div>
                    ))}
                    <a className={ui.primary} href={card.href}>
                      Open details
                    </a>
                  </dl>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}

function TabLink({ tab, current, children }: { tab: WalletTab; current: WalletTab; children: ReactNode }) {
  return (
    <a className={styles.tab} role="tab" aria-selected={tab === current} href={`#/wallet/${tab}`}>
      {children}
    </a>
  );
}

function ticketCards(concerts: Concert[], rounds: ApplicationRound[]): WalletCard[] {
  return concerts
    .filter((concert) => !concert.archived)
    .sort((a, b) => (a.date ?? "9999").localeCompare(b.date ?? "9999"))
    .map((concert) => {
      const concertRounds = rounds.filter((round) => round.concertId === concert.id);
      const won = concertRounds.find((round) => round.result === "won");
      const latest = won ?? concertRounds[0];
      const details: [string, string][] = [
        ["Venue", concert.venue],
        ["Start", concert.startTime ? `${concert.startTime} (${concert.timeZone})` : "Unknown"],
        ["Rounds", String(concertRounds.length)],
      ];
      if (won) details.push(["Ticket", `${won.provider} · ${won.amount ? formatMoney(won.amount) : "price unknown"}`]);
      return {
        id: concert.id,
        hue: concert.coverHue,
        eyebrow: concert.city,
        badge: latest ? RESULT_LABELS[latest.result] : "No rounds",
        title: concert.title,
        subtitle: `${concert.performance} · ${concert.date ? formatDateOnly(concert.date) : "Date TBA"}`,
        details,
        href: `#/concerts/${concert.id}`,
      };
    });
}

function tripCards(trips: Trip[], concerts: Concert[]): WalletCard[] {
  return trips
    .filter((trip) => !trip.archived)
    .sort((a, b) => a.startDate.localeCompare(b.startDate))
    .map((trip) => ({
      id: trip.id,
      hue: trip.coverHue,
      eyebrow: trip.destinations.join(" · "),
      badge: trip.status,
      title: trip.title,
      subtitle: `${formatDateOnly(trip.startDate)} – ${formatDateOnly(trip.endDate)}`,
      details: [
        ["Concerts", String(concerts.filter((concert) => concert.tripId === trip.id).length)],
        ["Notes", trip.notes || "—"],
      ],
      href: `#/trips/${trip.id}`,
    }));
}
