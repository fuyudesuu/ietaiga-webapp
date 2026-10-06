"use client";
import { useEffect, useRef, useState } from "react";
import { ImagePlus } from "lucide-react";
import { prepareItemImage, safeItemImage } from "@/lib/encore/images";
import { withBasePath } from "@/lib/encore/paths";

const hintText = "mt-1.25 mb-2 text-label text-muted-foreground";

export function ItemImageField({
  initialValue,
  onBusyChange,
}: {
  initialValue?: string;
  onBusyChange: (busy: boolean) => void;
}) {
  const [value, setValue] = useState(safeItemImage(initialValue) ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const version = useRef(0);
  useEffect(
    () => () => {
      version.current += 1;
    },
    [],
  );
  return (
    <div className="flex items-start gap-4 border-b border-border pt-1 pb-4.5">
      <input type="hidden" name="image" value={value} />
      <div className="grid h-[100px] w-[82px] shrink-0 place-items-center overflow-hidden rounded-[12px] bg-secondary text-muted-foreground">
        {value ? (
          <img
            className="size-full object-cover"
            src={withBasePath(value)}
            alt="Selected card cover"
          />
        ) : (
          <ImagePlus aria-hidden="true" size={24} />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <label htmlFor="item-photo" className="font-semibold">
          Card image
        </label>
        <p className={hintText}>
          Choose artwork or a travel photo. JPG, PNG or WebP, up to 12 MB.
        </p>
        <input
          id="item-photo"
          type="file"
          className="min-h-11 w-full max-w-full text-label file:mr-2 file:min-h-10 file:cursor-pointer file:rounded-sm file:border-0 file:bg-accent file:px-3 file:py-0 file:text-primary"
          accept="image/jpeg,image/png,image/webp"
          disabled={busy}
          aria-describedby="item-photo-status"
          onChange={async (event) => {
            const file = event.currentTarget.files?.[0];
            event.currentTarget.value = "";
            if (!file) return;
            const request = ++version.current;
            setBusy(true);
            onBusyChange(true);
            setError("");
            try {
              const result = await prepareItemImage(file);
              if (request === version.current) setValue(result);
            } catch (error) {
              if (request === version.current)
                setError(
                  error instanceof Error ? error.message : "Try another photo.",
                );
            } finally {
              if (request === version.current) {
                setBusy(false);
                onBusyChange(false);
              }
            }
          }}
        />
        {value && (
          <button
            type="button"
            className="min-h-11 text-small text-destructive"
            disabled={busy}
            onClick={() => setValue("")}
          >
            Remove image
          </button>
        )}
        <p id="item-photo-status" role="status" className={hintText}>
          {busy
            ? "Preparing your photo…"
            : error || "Saved with this item in your browser."}
        </p>
      </div>
    </div>
  );
}
