"use client";
import {
  EditorForm,
  type EditorSession,
  type FormReader,
} from "@/components/encore-ui/editor-form";
import {
  AmountFields,
  Field,
  FieldRow,
  SelectField,
} from "@/components/encore-ui/form-fields";
import {
  fromJstInput,
  noTrip,
  parseMoney,
  toJstInput,
  tripChoices,
} from "@/lib/encore/form-input";
import type { Currency, Editor, Hotel } from "@/lib/encore/model";
import { useStayDemoStore } from "./stay-demo-store";

export type HotelEditorTarget = Extract<Editor, { type: "hotel" }>;

const hotelPayments: Hotel["payment"][] = ["Unpaid", "Paid", "Refunded"];

/** Add or edit a hotel stay; every stay belongs to a trip. */
export function HotelEditor({
  target,
  session,
}: {
  target: HotelEditorTarget;
  session: EditorSession;
}) {
  const store = useStayDemoStore();
  const existing = store.findHotel(target.id);

  function save(read: FormReader) {
    const price = parseMoney(
      read("amount"),
      read("currency"),
      store.defaultCurrency,
    );
    const checkIn = read("checkIn");
    const checkOut = read("checkOut");
    if (!checkIn || checkOut <= checkIn)
      throw new Error("Check-out must be after check-in.");
    if (read("tripId") === noTrip)
      throw new Error("Choose a trip for this stay.");
    store.saveHotel(hotelFromForm(read, price, existing), {
      isNew: !existing,
    });
  }

  return (
    <EditorForm
      session={session}
      title={(target.id ? "Edit" : "Add") + " hotel stay"}
      onSave={save}
    >
      <Field name="name" label="Hotel name" value={existing?.name} required />
      <Field name="city" label="Area / city" value={existing?.city} />
      <SelectField
        name="tripId"
        label="Trip"
        value={existing?.tripId || target.tripId || noTrip}
        options={tripChoices(store.trips)}
      />
      <FieldRow>
        <Field
          name="checkIn"
          label="Check-in date"
          value={existing?.checkIn}
          type="date"
          required
        />
        <Field
          name="checkOut"
          label="Check-out date"
          value={existing?.checkOut}
          type="date"
          required
        />
      </FieldRow>
      <Field
        name="cancellation"
        label="Free cancellation until · JST (optional)"
        value={toJstInput(existing?.cancellation ?? "")}
        type="datetime-local"
      />
      <AmountFields
        amount={existing?.amount}
        currency={existing?.currency ?? store.defaultCurrency}
      />
      <SelectField
        name="payment"
        label="Payment"
        value={existing?.payment ?? "Unpaid"}
        options={hotelPayments}
      />
      <Field
        name="reference"
        label="Booking reference (sample only)"
        value={existing?.reference}
      />
    </EditorForm>
  );
}

function hotelFromForm(
  read: FormReader,
  price: { amount: number; currency: Currency },
  existing?: Hotel,
): Hotel {
  return {
    id: existing?.id ?? crypto.randomUUID(),
    tripId: read("tripId"),
    name: read("name"),
    city: read("city"),
    checkIn: read("checkIn"),
    checkOut: read("checkOut"),
    cancellation: fromJstInput(read("cancellation")),
    amount: price.amount,
    currency: price.currency,
    // The select only offers hotel payment states.
    payment: read("payment") as Hotel["payment"],
    reference: read("reference"),
  };
}
