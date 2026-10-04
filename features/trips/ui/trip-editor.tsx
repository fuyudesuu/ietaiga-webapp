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
import type { Editor, Trip } from "@/lib/encore/model";
import { useTripDemoStore } from "./trip-demo-store";

export type TripEditorTarget = Extract<Editor, { type: "trip" }>;

const tripStatuses: Trip["status"][] = ["Tentative", "Confirmed", "Completed"];

/** Add or edit a trip. A new trip opens its page once saved. */
export function TripEditor({
  target,
  session,
}: {
  target: TripEditorTarget;
  session: EditorSession;
}) {
  const store = useTripDemoStore();
  const existing = store.findTrip(target.id);
  const [imageBusy, setImageBusy] = useState(false);

  function save(read: FormReader) {
    const trip = tripFromForm(read, existing);
    if (!trip.start || !trip.end || trip.end < trip.start)
      throw new Error("Trip end must be on or after its start date.");
    store.saveTrip(trip, { isNew: !existing });
  }

  return (
    <EditorForm
      session={session}
      title={(target.id ? "Edit" : "Add") + " trip"}
      busy={imageBusy}
      onSave={save}
    >
      <ItemImageField
        initialValue={existing?.image}
        onBusyChange={setImageBusy}
      />
      <Field
        name="title"
        label="Trip name"
        value={existing?.title}
        required
        placeholder="A weekend worth the journey"
      />
      <Field
        name="cities"
        label="Destinations"
        value={existing?.cities}
        required
        placeholder="Tokyo · Yokohama"
      />
      <FieldRow>
        <Field
          name="start"
          label="Start date"
          value={existing?.start}
          type="date"
          required
        />
        <Field
          name="end"
          label="End date"
          value={existing?.end}
          type="date"
          required
        />
      </FieldRow>
      <SelectField
        name="status"
        label="Trip status"
        value={existing?.status ?? "Tentative"}
        options={tripStatuses}
      />
      <Field name="notes" label="Notes">
        <Textarea
          id="field-notes"
          name="notes"
          defaultValue={existing?.notes}
        />
      </Field>
    </EditorForm>
  );
}

function tripFromForm(read: FormReader, existing?: Trip): Trip {
  return {
    id: existing?.id ?? crypto.randomUUID(),
    title: read("title"),
    cities: read("cities"),
    start: read("start"),
    end: read("end"),
    // The select only offers trip statuses.
    status: read("status") as Trip["status"],
    notes: read("notes"),
    image: read("image"),
  };
}
