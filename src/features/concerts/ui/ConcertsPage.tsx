import { useState } from "react";
import { useNow, useStore } from "../../../app/store";
import { Cover } from "../../../components/Cover";
import layout from "../../../components/layout.module.css";
import ui from "../../../components/ui.module.css";
import { formatDateOnly } from "../../../lib/dates";
import { buildAttention } from "../../reminders/domain/attention";
import { AddConcertForm } from "./AddConcertForm";

type Filter = "upcoming" | "attention" | "archived";
const FILTER_LABELS: Record<Filter, string> = { upcoming: "Upcoming", attention: "Needs attention", archived: "Archived" };

export function ConcertsPage() {
  const { data } = useStore();
  const now = useNow();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("upcoming");
  const [adding, setAdding] = useState(false);

  const attentionConcertIds = new Set(
    buildAttention({ ...data, now }).map((item) => item.href.replace("#/concerts/", "")),
  );
  const normalizedQuery = query.trim().toLowerCase();
  const concerts = data.concerts
    .filter((concert) => {
      if (filter === "archived") return concert.archived;
      if (concert.archived) return false;
      return filter === "attention" ? attentionConcertIds.has(concert.id) : true;
    })
    .filter((concert) => `${concert.title} ${concert.performance} ${concert.city}`.toLowerCase().includes(normalizedQuery))
    .sort((a, b) => (a.date ?? "9999").localeCompare(b.date ?? "9999"));

  return (
    <>
      <h1 className={layout.pageTitle}>Concerts</h1>
      <div className={layout.toolbar}>
        <label className="visually-hidden" htmlFor="concert-search">
          Search concerts
        </label>
        <input
          id="concert-search"
          className={layout.search}
          type="search"
          placeholder="Search concerts"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
        <div className={layout.filters} role="group" aria-label="Filter">
          {(Object.keys(FILTER_LABELS) as Filter[]).map((key) => (
            <button
              key={key}
              type="button"
              className={layout.filter}
              aria-pressed={filter === key}
              onClick={() => setFilter(key)}
            >
              {FILTER_LABELS[key]}
            </button>
          ))}
        </div>
        {!adding && (
          <button type="button" className={ui.primary} onClick={() => setAdding(true)}>
            Add concert
          </button>
        )}
      </div>

      {adding && <AddConcertForm onDone={() => setAdding(false)} />}

      {concerts.length === 0 ? (
        <div className={ui.empty}>
          <p>{normalizedQuery ? `No concerts match “${query}”.` : `No ${FILTER_LABELS[filter].toLowerCase()} concerts.`}</p>
          {normalizedQuery ? (
            <button type="button" className={ui.button} onClick={() => setQuery("")}>
              Clear search
            </button>
          ) : (
            <button type="button" className={ui.button} onClick={() => setAdding(true)}>
              Add a concert
            </button>
          )}
        </div>
      ) : (
        <ul className={layout.rowList}>
          {concerts.map((concert) => (
            <li key={concert.id}>
              <a className={layout.rowLink} href={`#/concerts/${concert.id}`}>
                <Cover hue={concert.coverHue} className={layout.thumb} />
                <span className={layout.rowText}>
                  <span className={layout.rowTitle}>{concert.title}</span>
                  <br />
                  <span className={layout.rowMeta}>
                    {concert.performance} · {concert.date ? formatDateOnly(concert.date) : "Date TBA"} · {concert.venue}
                  </span>
                </span>
                {attentionConcertIds.has(concert.id) && <span className={ui.pillWarn}>Action</span>}
              </a>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
