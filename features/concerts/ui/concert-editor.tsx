"use client";
import { useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import {
  EditorForm,
  type EditorSession,
  type FormReader,
} from "@/components/encore-ui/editor-form";
import {
  Field,
  FieldRow,
  SelectField,
} from "@/components/encore-ui/form-fields";
import { ItemImageField } from "@/components/encore-ui/item-image-field";
import { noTrip, tripChoices } from "@/lib/encore/form-input";
import type { Concert, Editor } from "@/lib/encore/model";
import { useConcertDemoStore } from "./concert-demo-store";

export type ConcertEditorTarget = Extract<Editor, { type: "concert" }>;

/** Add or edit a concert. A new concert opens its page once saved. */
export function ConcertEditor({
  target,
  session,
}: {
  target: ConcertEditorTarget;
  session: EditorSession;
}) {
  const store = useConcertDemoStore();
  const existing = store.findConcert(target.id);
  const [imageBusy, setImageBusy] = useState(false);

  function save(read: FormReader) {
    const concert = concertFromForm(read, existing);
    if (!concert.title) throw new Error("A concert title is required.");
    store.saveConcert(concert, { isNew: !existing });
  }

  return (
    <EditorForm
      session={session}
      title={(target.id ? "Edit" : "Add") + " concert"}
      busy={imageBusy}
      onSave={save}
    >
      <ItemImageField
        initialValue={existing?.image}
        onBusyChange={setImageBusy}
      />
      <Field
        name="title"
        label="Concert / artist"
        value={existing?.title}
        required
        placeholder="Who are you going to see?"
      />
      <Field
        name="subtitle"
        label="Performance name"
        value={existing?.subtitle}
        placeholder="Tour name, subtitle, or Japanese title"
      />
      <FieldRow>
        <Field
          name="date"
          label="Concert date (optional)"
          type="date"
          value={existing?.date}
        />
        <Field
          name="time"
          label="Start time · JST (optional)"
          type="time"
          value={existing?.time}
        />
      </FieldRow>
      <FieldRow>
        <Field name="venue" label="Venue" value={existing?.venue} />
        <Field name="city" label="City" value={existing?.city} />
      </FieldRow>
      <SelectField
        name="tripId"
        label="Attach to a trip"
        value={existing?.tripId || target.tripId || noTrip}
        options={tripChoices(store.trips)}
      />
      <Field name="notes" label="Notes">
        <Textarea
          name="notes"
          id="field-notes"
          defaultValue={existing?.notes}
        />
      </Field>
    </EditorForm>
  );
}

function concertFromForm(read: FormReader, existing?: Concert): Concert {
  const tripId = read("tripId");
  return {
    id: existing?.id ?? crypto.randomUUID(),
    title: read("title"),
    subtitle: read("subtitle"),
    date: read("date"),
    time: read("time"),
    venue: read("venue") || "To be announced",
    city: read("city") || "Japan",
    zone: "Asia/Tokyo",
    tripId: tripId === noTrip ? "" : tripId,
    color: existing?.color ?? "blue",
    notes: read("notes"),
    image: read("image"),
  };
}
