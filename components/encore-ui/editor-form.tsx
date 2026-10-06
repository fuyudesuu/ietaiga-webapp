"use client";
import { useState, type FormEvent, type ReactNode } from "react";
import {
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { usePlanner } from "@/lib/encore/store";
import { formErrorClass } from "@/components/encore-ui/ui";

/** How a record editor reports back to the dialog that hosts it. */
export interface EditorSession {
  /** The person touched the form; closing now asks before discarding. */
  markDirty: () => void;
  /** Close, asking first if there are unsaved changes. */
  cancel: () => void;
  /** Close after a successful save. */
  finish: () => void;
}

/** Reads a submitted field as trimmed text ("" when absent). */
export type FormReader = (name: string) => string;

export const defaultEditorDescription =
  "Use sample information only. This prototype saves changes on this browser.";

/**
 * The shared frame of every record editor: heading, uncontrolled form, error
 * message and actions. `onSave` validates and saves; a thrown Error's message
 * is shown and the entries stay as typed.
 */
export function EditorForm({
  session,
  title,
  description = defaultEditorDescription,
  saveLabel = "Save changes",
  savedMessage = "Your changes are saved in this browser.",
  busy = false,
  onSave,
  children,
}: {
  session: EditorSession;
  title: string;
  description?: string;
  saveLabel?: string;
  savedMessage?: string;
  /** While true (e.g. an image is being prepared), saving is blocked. */
  busy?: boolean;
  onSave: (read: FormReader) => void;
  children: ReactNode;
}) {
  const { notify } = usePlanner();
  const [error, setError] = useState("");

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    const data = new FormData(event.currentTarget);
    const read: FormReader = (name) => String(data.get(name) ?? "").trim();
    setError("");
    try {
      onSave(read);
      notify(savedMessage);
      session.finish();
    } catch (failure) {
      setError(
        failure instanceof Error
          ? failure.message
          : "Unable to save. Check your entries.",
      );
    }
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle className="text-title font-[550] leading-[1.4] tracking-[-0.4px] max-md:text-[1.3rem]">
          {title}
        </DialogTitle>
        <DialogDescription className="mt-1.5 text-small leading-[1.6]">
          {description}
        </DialogDescription>
      </DialogHeader>
      <form
        className="mt-3 flex min-h-0 flex-[1_1_auto] flex-col"
        onSubmit={submit}
        onChange={session.markDirty}
        onClick={session.markDirty}
      >
        {/* Only the fields scroll; the padding leaves room for focus rings. */}
        <div className="-mx-1 flex min-h-0 flex-[1_1_auto] flex-col gap-4.5 overflow-x-hidden overflow-y-auto overscroll-contain p-1">
          {children}
          {error && (
            <p className={formErrorClass} role="alert">
              {error}
            </p>
          )}
        </div>
        <div className="mt-3 flex flex-none justify-end gap-2.5 border-t border-border pt-4">
          <Button type="button" variant="outline" onClick={session.cancel}>
            Cancel
          </Button>
          <Button type="submit" className="primary-button" disabled={busy}>
            {saveLabel}
          </Button>
        </div>
      </form>
    </>
  );
}
