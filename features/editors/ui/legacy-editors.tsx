"use client";
import { usePlanner } from "@/lib/encore/store";
import { type Editor } from "@/lib/encore/model";
import {
  EditorForm,
  type EditorSession,
  type FormReader,
} from "@/components/encore-ui/editor-form";
import { SelectField } from "@/components/encore-ui/form-fields";

// Editors not yet moved into their feature (refactor stage B). Each moves out
// in its own change; this file is deleted once it is empty.
export function LegacyEditor({
  editor,
  session,
}: {
  editor: Extract<Editor, { type: "reminder" }>;
  session: EditorSession;
}) {
  const { state, update } = usePlanner();
  const a = state.applications.find((a) => a.id === editor.id);
  function save(value: FormReader) {
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
  return (
    <EditorForm
      session={session}
      title="A reminder for this moment"
      description="Choose when you would like a nudge. Delivery is simulated."
      saveLabel="Save reminder"
      savedMessage="Reminder preference saved in this demo."
      onSave={save}
    >
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
          This stores a timing preference for design review. No notification is
          scheduled or sent.
        </p>
      </>
    </EditorForm>
  );
}
