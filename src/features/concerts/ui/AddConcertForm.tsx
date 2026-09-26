import { useState, type FormEvent } from "react";
import { useStore } from "../../../app/store";
import layout from "../../../components/layout.module.css";
import ui from "../../../components/ui.module.css";
import { TOKYO } from "../../../lib/dates";

interface AddConcertFormProps {
  onDone: () => void;
}

export function AddConcertForm({ onDone }: AddConcertFormProps) {
  const { data, dispatch } = useStore();
  const [title, setTitle] = useState("");
  const [performance, setPerformance] = useState("");
  const [venue, setVenue] = useState("");
  const [city, setCity] = useState("Tokyo");
  const [date, setDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [tripId, setTripId] = useState("");
  const [error, setError] = useState<string | null>(null);

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!title.trim()) {
      setError("A title is required.");
      return;
    }
    const id = `c-${crypto.randomUUID()}`;
    dispatch({
      type: "addConcert",
      concert: {
        id,
        title: title.trim(),
        performance: performance.trim(),
        venue: venue.trim() || "TBA",
        city: city.trim(),
        date: date || null,
        startTime: startTime || null,
        timeZone: TOKYO,
        status: "planned",
        archived: false,
        tripId: tripId || null,
        sourceUrl: null,
        coverHue: Math.floor(Math.random() * 360),
      },
    });
    onDone();
    window.location.hash = `#/concerts/${id}`;
  };

  return (
    <form className={`${ui.card} ${layout.form}`} onSubmit={submit} noValidate>
      <label className={layout.field}>
        Title
        <input value={title} onChange={(event) => setTitle(event.target.value)} required autoFocus />
      </label>
      <label className={layout.field}>
        Performance
        <input value={performance} onChange={(event) => setPerformance(event.target.value)} placeholder="Day 1" />
      </label>
      <label className={layout.field}>
        Venue
        <input value={venue} onChange={(event) => setVenue(event.target.value)} />
      </label>
      <label className={layout.field}>
        City
        <input value={city} onChange={(event) => setCity(event.target.value)} />
      </label>
      <label className={layout.field}>
        Date (leave empty if unknown)
        <input type="date" value={date} onChange={(event) => setDate(event.target.value)} />
      </label>
      <label className={layout.field}>
        Start time, Japan time (optional)
        <input type="time" value={startTime} onChange={(event) => setStartTime(event.target.value)} />
      </label>
      <label className={layout.field}>
        Trip
        <select value={tripId} onChange={(event) => setTripId(event.target.value)}>
          <option value="">No trip yet</option>
          {data.trips.map((trip) => (
            <option key={trip.id} value={trip.id}>
              {trip.title}
            </option>
          ))}
        </select>
      </label>
      {error && (
        <p className={layout.error} role="alert">
          {error}
        </p>
      )}
      <div className={layout.formActions}>
        <button type="button" className={ui.button} onClick={onDone}>
          Cancel
        </button>
        <button type="submit" className={ui.primary}>
          Save concert
        </button>
      </div>
    </form>
  );
}
