"use client";
import { useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import type { EditorSession } from "@/components/encore-ui/editor-form";
import { usePlanner } from "@/lib/encore/store";
import type { Editor } from "@/lib/encore/model";
import { ApplicationEditor, ConcertEditor } from "@/features/concerts";
import { TripEditor } from "@/features/trips";
import { HotelEditor } from "@/features/stays";
import { ReminderEditor } from "@/features/reminders";
import styles from "./editor-host.module.css";

/**
 * The dialog that hosts every record editor. It owns opening, closing and the
 * "discard your changes?" check; each feature's editor owns its fields and save.
 */
export function EditorHost() {
  const { editor, setEditor } = usePlanner();
  const [confirmingDiscard, setConfirmingDiscard] = useState(false);
  const [dirty, setDirty] = useState(false);

  function close() {
    if (dirty) setConfirmingDiscard(true);
    else setEditor(null);
  }
  function closeWithoutAsking() {
    setDirty(false);
    setEditor(null);
  }
  const session: EditorSession = {
    markDirty: () => setDirty(true),
    cancel: close,
    finish: closeWithoutAsking,
  };

  return (
    <>
      <Dialog
        open={!!editor}
        onOpenChange={(open) => {
          if (!open) close();
        }}
      >
        <DialogContent
          className={"editor-dialog " + styles.dialog}
          onOpenAutoFocus={() => setDirty(false)}
        >
          {editor && (
            <RecordEditor
              key={JSON.stringify(editor)}
              editor={editor}
              session={session}
            />
          )}
        </DialogContent>
      </Dialog>
      <AlertDialog open={confirmingDiscard} onOpenChange={setConfirmingDiscard}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Discard your changes?</AlertDialogTitle>
            <AlertDialogDescription>
              Your unsaved changes will be lost.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep editing</AlertDialogCancel>
            <AlertDialogAction onClick={closeWithoutAsking}>
              Discard changes
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

function RecordEditor({
  editor,
  session,
}: {
  editor: NonNullable<Editor>;
  session: EditorSession;
}) {
  switch (editor.type) {
    case "concert":
      return <ConcertEditor target={editor} session={session} />;
    case "trip":
      return <TripEditor target={editor} session={session} />;
    case "hotel":
      return <HotelEditor target={editor} session={session} />;
    case "application":
      return <ApplicationEditor target={editor} session={session} />;
    case "reminder":
      return <ReminderEditor target={editor} session={session} />;
  }
}
