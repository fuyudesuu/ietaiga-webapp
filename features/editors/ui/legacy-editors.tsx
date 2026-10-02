"use client";
import { usePlanner } from "@/lib/encore/store";
import { type Editor, type Application, type Hotel } from "@/lib/encore/model";
import {
  EditorForm,
  type EditorSession,
  type FormReader,
} from "@/components/encore-ui/editor-form";
import {
  AmountFields,
  Field,
  SelectField,
} from "@/components/encore-ui/form-fields";
import {
  fromJstInput as fromJst,
  parseMoney,
  toJstInput as localJst,
  tripChoices,
} from "@/lib/encore/form-input";

// Editors not yet moved into their feature (refactor stage B). Each moves out
// in its own change; this file is deleted once it is empty.
const providers = [
  "ASOBI TICKET",
  "eplus",
  "l-tike",
  "CyStore ticket",
  "Other",
];
const uid = () => crypto.randomUUID();
export function LegacyEditor({
  editor,
  session,
}: {
  editor: Exclude<NonNullable<Editor>, { type: "concert" | "trip" }>;
  session: EditorSession;
}) {
  const { state, update } = usePlanner();
  const h =
    editor.type === "hotel"
      ? state.hotels.find((h) => h.id === editor.id)
      : undefined;
  const a =
    editor.type === "application" || editor.type === "reminder"
      ? state.applications.find((a) => a.id === editor.id)
      : undefined;
  const tripOptions = tripChoices(state.trips);
  function save(value: FormReader) {
    if (editor.type === "hotel") {
      const { amount, currency } = parseMoney(
        value("amount"),
        value("currency"),
        state.preferences.currency,
      );
      if (!value("checkIn") || value("checkOut") <= value("checkIn"))
        throw new Error("Check-out must be after check-in.");
      if (value("tripId") === "none")
        throw new Error("Choose a trip for this stay.");
      const id = h?.id ?? uid();
      const record: Hotel = {
        id,
        tripId: value("tripId"),
        name: value("name"),
        city: value("city"),
        checkIn: value("checkIn"),
        checkOut: value("checkOut"),
        cancellation: fromJst(value("cancellation")),
        amount,
        currency,
        payment: value("payment") as Hotel["payment"],
        reference: value("reference"),
      };
      update((s) => ({
        ...s,
        hotels: h
          ? s.hotels.map((v) => (v.id === id ? record : v))
          : [...s.hotels, record],
      }));
    }
    if (editor.type === "application") {
      const { amount, currency } = parseMoney(
        value("amount"),
        value("currency"),
        state.preferences.currency,
      );
      const id = a?.id ?? uid();
      const record: Application = {
        id,
        concertId: editor.concertId,
        round: value("round"),
        provider: value("provider"),
        deadline: fromJst(value("deadline")),
        resultDate: fromJst(value("resultDate")),
        paymentDeadline: fromJst(value("paymentDeadline")),
        submitted: value("submitted") === "Yes",
        result: value("result") as Application["result"],
        payment: value("payment") as Application["payment"],
        collection: value("collection") as Application["collection"],
        amount,
        currency,
        reminder: a?.reminder ?? false,
        offset: a?.offset ?? "1 day",
      };
      update((s) => ({
        ...s,
        applications: a
          ? s.applications.map((v) => (v.id === id ? record : v))
          : [...s.applications, record],
      }));
    }
    if (editor.type === "reminder") {
      update((s) => ({
        ...s,
        applications: s.applications.map((v) =>
          v.id === editor.id
            ? {
                ...v,
                reminder: value("enabled") === "Yes",
                offset: value("offset"),
              }
            : v,
        ),
      }));
    }
  }
  const reminder = editor.type === "reminder";
  return (
    <EditorForm
      session={session}
      title={
        reminder
          ? "A reminder for this moment"
          : `${editor.id ? "Edit" : "Add"} ${editor.type === "application" ? "ticket application" : "hotel stay"}`
      }
      description={
        reminder
          ? "Choose when you would like a nudge. Delivery is simulated."
          : undefined
      }
      saveLabel={reminder ? "Save reminder" : undefined}
      savedMessage={
        reminder ? "Reminder preference saved in this demo." : undefined
      }
      onSave={save}
    >
      {editor.type === "hotel" && (
        <>
          <Field name="name" label="Hotel name" value={h?.name} required />
          <Field name="city" label="Area / city" value={h?.city} />
          <SelectField
            name="tripId"
            label="Trip"
            value={h?.tripId || editor.tripId || "none"}
            options={tripOptions}
          />
          <div className="form-grid">
            <Field
              name="checkIn"
              label="Check-in date"
              value={h?.checkIn}
              type="date"
              required
            />
            <Field
              name="checkOut"
              label="Check-out date"
              value={h?.checkOut}
              type="date"
              required
            />
          </div>
          <Field
            name="cancellation"
            label="Free cancellation until · JST (optional)"
            value={localJst(h?.cancellation ?? "")}
            type="datetime-local"
          />
          <AmountFields
            amount={h?.amount}
            currency={h?.currency ?? state.preferences.currency}
          />
          <SelectField
            name="payment"
            label="Payment"
            value={h?.payment ?? "Unpaid"}
            options={["Unpaid", "Paid", "Refunded"]}
          />
          <Field
            name="reference"
            label="Booking reference (sample only)"
            value={h?.reference}
          />
        </>
      )}
      {editor.type === "application" && (
        <>
          <Field
            name="round"
            label="Application round"
            value={a?.round}
            required
            placeholder="Fanclub advance lottery"
          />
          <SelectField
            name="provider"
            label="Ticket provider"
            value={a?.provider ?? "ASOBI TICKET"}
            options={providers}
          />
          <Field
            name="deadline"
            label="Application deadline · JST"
            value={localJst(a?.deadline ?? "")}
            type="datetime-local"
          />
          <Field
            name="resultDate"
            label="Results announced · JST"
            value={localJst(a?.resultDate ?? "")}
            type="datetime-local"
          />
          <Field
            name="paymentDeadline"
            label="Payment deadline · JST"
            value={localJst(a?.paymentDeadline ?? "")}
            type="datetime-local"
          />
          <div className="form-grid">
            <SelectField
              name="submitted"
              label="Application submitted?"
              value={a?.submitted ? "Yes" : "No"}
              options={["No", "Yes"]}
            />
            <SelectField
              name="result"
              label="Lottery result"
              value={a?.result ?? "Pending"}
              options={["Pending", "Won", "Lost", "Waitlisted"]}
            />
          </div>
          <AmountFields
            amount={a?.amount}
            currency={a?.currency ?? state.preferences.currency}
          />
          <div className="form-grid">
            <SelectField
              name="payment"
              label="Payment"
              value={a?.payment ?? "Unpaid"}
              options={["Unpaid", "Paid", "Not required", "Refunded"]}
            />
            <SelectField
              name="collection"
              label="Ticket collection"
              value={a?.collection ?? "Not ready"}
              options={["Not ready", "Ready", "Collected"]}
            />
          </div>
        </>
      )}
      {editor.type === "reminder" && (
        <>
          <div className="form-callout">
            <strong>{a?.round}</strong>
            <p>{state.concerts.find((c) => c.id === a?.concertId)?.title}</p>
          </div>
          <SelectField
            name="enabled"
            label="Reminder enabled"
            value={a?.reminder ? "Yes" : "No"}
            options={["Yes", "No"]}
          />
          <SelectField
            name="offset"
            label="Remind me before the next deadline"
            value={a?.offset ?? "1 day"}
            options={["7 days", "1 day", "2 hours"]}
          />
          <p className="secondary">
            Destination:{" "}
            {state.preferences.destination === "none"
              ? "In-app only"
              : state.preferences.destination === "dm"
                ? "Discord direct message"
                : "#" + state.preferences.channel}
            .{" "}
            {state.preferences.connected
              ? "A simulated connection is ready."
              : "Set up a simulated connection in Settings."}
          </p>
          <p className="form-help">
            This stores a timing preference for design review. No notification
            is scheduled or sent.
          </p>
        </>
      )}
    </EditorForm>
  );
}
