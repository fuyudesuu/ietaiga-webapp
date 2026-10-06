"use client";
import {
  EditorForm,
  type EditorSession,
  type FormReader,
} from "@/components/encore-ui/editor-form";
import { SelectField } from "@/components/encore-ui/form-fields";
import {
  formCalloutClass,
  formHelpClass,
  secondaryTextClass,
} from "@/components/encore-ui/ui";
import type { Editor, Preferences } from "@/lib/encore/model";
import { useReminderDemoStore } from "./reminder-demo-store";

export type ReminderEditorTarget = Extract<Editor, { type: "reminder" }>;

/** Choose whether, and how early, to be reminded about an application round. */
export function ReminderEditor({
  target,
  session,
}: {
  target: ReminderEditorTarget;
  session: EditorSession;
}) {
  const store = useReminderDemoStore();
  const application = store.findApplication(target.id);
  const concert = store.findConcert(application?.concertId);

  function save(read: FormReader) {
    store.saveReminder(target.id, {
      reminder: read("enabled") === "Yes",
      offset: read("offset"),
    });
  }

  return (
    <EditorForm
      session={session}
      title="A reminder for this moment"
      description="Choose when you would like a nudge. Delivery is simulated."
      saveLabel="Save reminder"
      savedMessage="Reminder preference saved in this demo."
      onSave={save}
    >
      <div className={formCalloutClass}>
        <strong>{application?.round}</strong>
        <p>{concert?.title}</p>
      </div>
      <SelectField
        name="enabled"
        label="Reminder enabled"
        value={application?.reminder ? "Yes" : "No"}
        options={["Yes", "No"]}
      />
      <SelectField
        name="offset"
        label="Remind me before the next deadline"
        value={application?.offset ?? "1 day"}
        options={["7 days", "1 day", "2 hours"]}
      />
      <p className={secondaryTextClass}>
        Destination: {destinationLabel(store.preferences)}.{" "}
        {store.preferences.connected
          ? "A simulated connection is ready."
          : "Set up a simulated connection in Settings."}
      </p>
      <p className={formHelpClass}>
        This stores a timing preference for design review. No notification is
        scheduled or sent.
      </p>
    </EditorForm>
  );
}

function destinationLabel(preferences: Preferences) {
  switch (preferences.destination) {
    case "none":
      return "In-app only";
    case "dm":
      return "Discord direct message";
    case "channel":
      return "#" + preferences.channel;
  }
}
