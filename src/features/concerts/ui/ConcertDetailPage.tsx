import { useStore } from "../../../app/store";
import { Cover } from "../../../components/Cover";
import layout from "../../../components/layout.module.css";
import ui from "../../../components/ui.module.css";
import { formatDateOnly, formatInstant, type UtcInstant } from "../../../lib/dates";
import { formatMoney } from "../../../lib/money";
import {
  APPLICATION_LABELS,
  COLLECTION_LABELS,
  PAYMENT_LABELS,
  RESULT_LABELS,
  type ApplicationRound,
} from "../domain/types";

export function ConcertDetailPage({ id }: { id: string }) {
  const { data, dispatch } = useStore();
  const concert = data.concerts.find((candidate) => candidate.id === id);
  if (!concert) {
    return (
      <div className={ui.empty}>
        <p>This concert does not exist in this browser's demo data.</p>
        <a className={ui.button} href="#/concerts">
          Back to concerts
        </a>
      </div>
    );
  }
  const rounds = data.rounds.filter((round) => round.concertId === concert.id);
  const trip = data.trips.find((candidate) => candidate.id === concert.tripId);
  const localTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;

  return (
    <>
      <a className={layout.back} href="#/concerts">
        ← Concerts
      </a>
      <Cover hue={concert.coverHue} className={layout.detailHero}>
        <h1 className={layout.heroTitle}>{concert.title}</h1>
        <span>{concert.performance}</span>
      </Cover>
      <div className={layout.meta}>
        <span className={ui.pill}>{concert.date ? formatDateOnly(concert.date) : "Date TBA"}</span>
        <span className={ui.pill}>{concert.startTime ? `${concert.startTime} ${concert.timeZone}` : "Start time unknown"}</span>
        <span className={ui.pill}>
          {concert.venue} · {concert.city}
        </span>
        {trip ? (
          <a className={ui.pill} href={`#/trips/${trip.id}`}>
            Trip: {trip.title}
          </a>
        ) : (
          <span className={ui.pill}>Not in a trip</span>
        )}
        {concert.archived && <span className={ui.pillWarn}>Archived</span>}
      </div>
      <button
        type="button"
        className={ui.button}
        onClick={() => dispatch({ type: "setConcertArchived", concertId: concert.id, archived: !concert.archived })}
      >
        {concert.archived ? "Unarchive" : "Archive"}
      </button>

      <h2 className={ui.sectionTitle}>Application rounds</h2>
      {rounds.length === 0 ? (
        <p className={ui.empty}>No application rounds yet.</p>
      ) : (
        <div className={layout.stack}>
          {rounds.map((round) => (
            <RoundCard key={round.id} round={round} timeZone={concert.timeZone} localTimeZone={localTimeZone} />
          ))}
        </div>
      )}
    </>
  );
}

interface RoundCardProps {
  round: ApplicationRound;
  timeZone: string;
  localTimeZone: string;
}

function RoundCard({ round, timeZone, localTimeZone }: RoundCardProps) {
  const { dispatch } = useStore();
  const update = (changes: Partial<ApplicationRound>) => dispatch({ type: "updateRound", roundId: round.id, changes });
  const deadlines: [string, UtcInstant | null][] = [
    ["Application closes", round.applicationClosesAt],
    ["Result announced", round.resultAt],
    ["Payment due", round.paymentDueAt],
    ["Collection opens", round.collectionOpensAt],
  ];

  return (
    <article className={ui.card}>
      <div className={layout.roundHeader}>
        <h3>
          {round.provider} · {round.roundName}
        </h3>
        <span className={ui.pill}>{round.amount ? formatMoney(round.amount) : "Price unknown"}</span>
      </div>
      <div className={layout.statusGrid}>
        <StatusSelect label="Application" value={round.application} options={APPLICATION_LABELS} onChange={(application) => update({ application })} />
        <StatusSelect label="Result" value={round.result} options={RESULT_LABELS} onChange={(result) => update({ result })} />
        <StatusSelect label="Payment" value={round.payment} options={PAYMENT_LABELS} onChange={(payment) => update({ payment })} />
        <StatusSelect label="Collection" value={round.collection} options={COLLECTION_LABELS} onChange={(collection) => update({ collection })} />
      </div>
      <ul className={layout.deadlines}>
        {deadlines.map(([label, instant]) => (
          <li key={label}>
            <span className={ui.muted}>{label}</span>
            <span>
              {instant ? formatInstant(instant, timeZone) : "Unknown"}
              {instant && timeZone !== localTimeZone ? ` · ${formatInstant(instant, localTimeZone)}` : ""}
            </span>
          </li>
        ))}
      </ul>
    </article>
  );
}

interface StatusSelectProps<Value extends string> {
  label: string;
  value: Value;
  options: Record<Value, string>;
  onChange: (value: Value) => void;
}

function StatusSelect<Value extends string>({ label, value, options, onChange }: StatusSelectProps<Value>) {
  const values = Object.keys(options) as Value[];
  return (
    <label className={layout.field}>
      {label}
      <select
        value={value}
        onChange={(event) => {
          const selected = values.find((option) => option === event.target.value);
          if (selected) onChange(selected);
        }}
      >
        {values.map((option) => (
          <option key={option} value={option}>
            {options[option]}
          </option>
        ))}
      </select>
    </label>
  );
}
