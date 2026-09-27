"use client";
import { useState, type FormEvent, type ReactNode } from "react";
import { commitAndNavigate } from "@/lib/encore/navigation";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { usePlanner } from "@/lib/encore/store";
import {
  type Editor,
  type Concert,
  type Application,
  type Hotel,
  type Trip,
  type Currency,
} from "@/lib/encore/model";
import { ItemImageField } from "./item-image-field";
import { Choice } from "./ui";
const currencies = ["JPY", "USD", "AUD", "SGD"];
const providers = [
  "ASOBI TICKET",
  "eplus",
  "l-tike",
  "CyStore ticket",
  "Other",
];
const uid = () => crypto.randomUUID();
function Field({
  label,
  name,
  type = "text",
  value = "",
  required = false,
  placeholder,
  children,
}: {
  label: string;
  name: string;
  type?: string;
  value?: string;
  required?: boolean;
  placeholder?: string;
  children?: ReactNode;
}) {
  return (
    <label className="form-field" htmlFor={"field-" + name}>
      <span>
        {label}
        {required && " *"}
      </span>
      {children ?? (
        <Input
          id={"field-" + name}
          name={name}
          type={type}
          defaultValue={value}
          required={required}
          placeholder={placeholder}
          step={type === "number" ? "any" : undefined}
        />
      )}
    </label>
  );
}
function SelectField({
  name,
  label,
  value,
  options,
}: {
  name: string;
  label: string;
  value: string;
  options: (string | { value: string; label: string })[];
}) {
  const [selected, setSelected] = useState(value);
  return (
    <Field label={label} name={name}>
      <input type="hidden" name={name} value={selected} />
      <Choice
        id={"field-" + name}
        label={label}
        value={selected}
        onChange={setSelected}
        options={options}
      />
    </Field>
  );
}
const localJst = (v: string) =>
  v
    ? new Date(new Date(v).getTime() + 9 * 3600000).toISOString().slice(0, 16)
    : "";
const fromJst = (v: string) =>
  v ? new Date(v + ":00+09:00").toISOString() : "";
function AmountFields({
  amount = 0,
  currency = "JPY",
}: {
  amount?: number;
  currency?: Currency;
}) {
  return (
    <div className="form-grid">
      <Field
        name="amount"
        label="Amount"
        type="number"
        value={String(amount / (currency === "JPY" ? 1 : 100))}
      />
      <SelectField
        name="currency"
        label="Currency"
        value={currency}
        options={currencies}
      />
    </div>
  );
}
export function Forms() {
  const { editor, setEditor } = usePlanner();
  const [discard, setDiscard] = useState(false);
  const [dirty, setDirty] = useState(false);
  function close() {
    if (dirty) setDiscard(true);
    else setEditor(null);
  }
  return (
    <>
      <Dialog
        open={!!editor}
        onOpenChange={(v) => {
          if (!v) close();
        }}
      >
        <DialogContent
          className="editor-dialog"
          onOpenAutoFocus={() => setDirty(false)}
        >
          {editor && (
            <EditorBody
              key={JSON.stringify(editor)}
              editor={editor}
              onDirty={() => setDirty(true)}
              onCancel={close}
              onSaved={() => {
                setDirty(false);
                setEditor(null);
              }}
            />
          )}
        </DialogContent>
      </Dialog>
      <AlertDialog open={discard} onOpenChange={setDiscard}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Discard your changes?</AlertDialogTitle>
            <AlertDialogDescription>
              Your unsaved changes will be lost.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep editing</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setDirty(false);
                setEditor(null);
              }}
            >
              Discard changes
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
function EditorBody({
  editor,
  onDirty,
  onCancel,
  onSaved,
}: {
  editor: NonNullable<Editor>;
  onDirty: () => void;
  onCancel: () => void;
  onSaved: () => void;
}) {
  const { state, update, notify } = usePlanner();
  const [error, setError] = useState("");
  const [imageBusy, setImageBusy] = useState(false);
  const c =
    editor.type === "concert"
      ? state.concerts.find((c) => c.id === editor.id)
      : undefined;
  const t =
    editor.type === "trip"
      ? state.trips.find((t) => t.id === editor.id)
      : undefined;
  const h =
    editor.type === "hotel"
      ? state.hotels.find((h) => h.id === editor.id)
      : undefined;
  const a =
    editor.type === "application" || editor.type === "reminder"
      ? state.applications.find((a) => a.id === editor.id)
      : undefined;
  const tripOptions = [
    { value: "none", label: "No trip yet" },
    ...state.trips.map((t) => ({
      value: t.id,
      label: t.cities + " · " + t.title,
    })),
  ];
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (imageBusy) return;
    const f = new FormData(event.currentTarget);
    const value = (n: string) => String(f.get(n) ?? "").trim();
    setError("");
    try {
      const currency = (
        currencies.includes(value("currency"))
          ? value("currency")
          : state.preferences.currency
      ) as Currency;
      const number = Number(value("amount"));
      if (!Number.isFinite(number) || number < 0)
        throw new Error("Enter an amount of zero or more.");
      if (currency === "JPY" && !Number.isInteger(number))
        throw new Error("Enter whole yen for JPY.");
      const amount = Math.round(number * (currency === "JPY" ? 1 : 100));
      if (editor.type === "concert") {
        const id = c?.id ?? uid();
        const record: Concert = {
          id,
          title: value("title"),
          subtitle: value("subtitle"),
          date: value("date"),
          time: value("time"),
          venue: value("venue") || "To be announced",
          city: value("city") || "Japan",
          zone: "Asia/Tokyo",
          tripId: value("tripId") === "none" ? "" : value("tripId"),
          color: c?.color ?? "blue",
          notes: value("notes"),
          image: value("image"),
        };
        if (!record.title) throw new Error("A concert title is required.");
        commitAndNavigate(
          () =>
            update((s) => ({
              ...s,
              concerts: c
                ? s.concerts.map((v) => (v.id === id ? record : v))
                : [...s.concerts, record],
            })),
          c ? undefined : "/concerts/" + id,
        );
      }
      if (editor.type === "trip") {
        const start = value("start"),
          end = value("end");
        if (!start || !end || end < start)
          throw new Error("Trip end must be on or after its start date.");
        const id = t?.id ?? uid();
        const record: Trip = {
          id,
          title: value("title"),
          cities: value("cities"),
          start,
          end,
          status: value("status") as Trip["status"],
          notes: value("notes"),
          image: value("image"),
        };
        commitAndNavigate(
          () =>
            update((s) => ({
              ...s,
              trips: t
                ? s.trips.map((v) => (v.id === id ? record : v))
                : [...s.trips, record],
            })),
          t ? undefined : "/trips/" + id,
        );
      }
      if (editor.type === "hotel") {
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
      notify(
        editor.type === "reminder"
          ? "Reminder preference saved in this demo."
          : "Your changes are saved in this browser.",
      );
      onSaved();
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Unable to save. Check your entries.",
      );
    }
  }
  const title =
    editor.type === "reminder"
      ? "A reminder for this moment"
      : `${editor.id ? "Edit" : "Add"} ${editor.type === "application" ? "ticket application" : editor.type === "hotel" ? "hotel stay" : editor.type}`;
  return (
    <>
      <DialogHeader>
        <DialogTitle>{title}</DialogTitle>
        <DialogDescription>
          {editor.type === "reminder"
            ? "Choose when you would like a nudge. Delivery is simulated."
            : "Use sample information only. This prototype saves changes on this browser."}
        </DialogDescription>
      </DialogHeader>
      <form
        className="editor-form"
        onSubmit={submit}
        onChange={onDirty}
        onClick={onDirty}
      >
        {editor.type === "concert" && (
          <>
            <ItemImageField
              initialValue={c?.image}
              onBusyChange={setImageBusy}
            />
            <Field
              name="title"
              label="Concert / artist"
              value={c?.title}
              required
              placeholder="Who are you going to see?"
            />
            <Field
              name="subtitle"
              label="Performance name"
              value={c?.subtitle}
              placeholder="Tour name, subtitle, or Japanese title"
            />
            <div className="form-grid">
              <Field
                name="date"
                label="Concert date (optional)"
                type="date"
                value={c?.date}
              />
              <Field
                name="time"
                label="Start time · JST (optional)"
                type="time"
                value={c?.time}
              />
            </div>
            <div className="form-grid">
              <Field name="venue" label="Venue" value={c?.venue} />
              <Field name="city" label="City" value={c?.city} />
            </div>
            <SelectField
              name="tripId"
              label="Attach to a trip"
              value={c?.tripId || editor.tripId || "none"}
              options={tripOptions}
            />
            <Field name="notes" label="Notes">
              <Textarea name="notes" id="field-notes" defaultValue={c?.notes} />
            </Field>
          </>
        )}
        {editor.type === "trip" && (
          <>
            <ItemImageField
              initialValue={t?.image}
              onBusyChange={setImageBusy}
            />
            <Field
              name="title"
              label="Trip name"
              value={t?.title}
              required
              placeholder="A weekend worth the journey"
            />
            <Field
              name="cities"
              label="Destinations"
              value={t?.cities}
              required
              placeholder="Tokyo · Yokohama"
            />
            <div className="form-grid">
              <Field
                name="start"
                label="Start date"
                value={t?.start}
                type="date"
                required
              />
              <Field
                name="end"
                label="End date"
                value={t?.end}
                type="date"
                required
              />
            </div>
            <SelectField
              name="status"
              label="Trip status"
              value={t?.status ?? "Tentative"}
              options={["Tentative", "Confirmed", "Completed"]}
            />
            <Field name="notes" label="Notes">
              <Textarea id="field-notes" name="notes" defaultValue={t?.notes} />
            </Field>
          </>
        )}
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
        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}
        <div className="form-actions">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" className="primary-button" disabled={imageBusy}>
            Save {editor.type === "reminder" ? "reminder" : "changes"}
          </Button>
        </div>
      </form>
    </>
  );
}
