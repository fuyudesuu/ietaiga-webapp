"use client";
import { useEffect, useState } from "react";
import { Check } from "lucide-react";

// Matches the exit animation below, plus a little margin. A timer (not
// `animationend`) removes the toast, so it also goes with reduced motion.
const EXIT_MS = 220;

/** The "saved" message: slides in, and fades out after the store clears it. */
export function Toast({ message }: { message: string }) {
  const [shown, setShown] = useState(message);
  if (message && message !== shown) setShown(message);
  useEffect(() => {
    if (message) return;
    const timer = setTimeout(() => setShown(""), EXIT_MS);
    return () => clearTimeout(timer);
  }, [message]);
  if (!shown) return null;
  return (
    <div
      role="status"
      data-state={message ? "open" : "closed"}
      className="fixed bottom-6 left-[calc(50%+100px)] z-100 flex max-w-[calc(100vw-32px)] -translate-x-1/2 items-center gap-2.5 rounded-lg border-0 bg-foreground px-5 py-3 text-small text-background shadow-[0_8px_30px_#091b3326] duration-200 ease-out data-[state=closed]:animate-out data-[state=closed]:fill-mode-forwards data-[state=closed]:fade-out-0 data-[state=closed]:slide-out-to-bottom-2 data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:slide-in-from-bottom-4 max-md:right-4 max-md:bottom-[100px] max-md:left-4 max-md:w-auto max-md:max-w-none max-md:translate-x-0"
    >
      <Check size={17} />
      {shown}
    </div>
  );
}
