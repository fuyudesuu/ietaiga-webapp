"use client";
import { useEffect, useRef, useState } from "react";
import { ImagePlus } from "lucide-react";
import { prepareItemImage, safeItemImage } from "@/lib/encore/images";
import { withBasePath } from "@/lib/encore/paths";

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
    <div className="item-image-field">
      <input type="hidden" name="image" value={value} />
      <div className="image-field-preview">
        {value ? (
          <img src={withBasePath(value)} alt="Selected card cover" />
        ) : (
          <ImagePlus aria-hidden="true" size={24} />
        )}
      </div>
      <div className="image-field-controls">
        <label htmlFor="item-photo">Card image</label>
        <p>Choose artwork or a travel photo. JPG, PNG or WebP, up to 12 MB.</p>
        <input
          id="item-photo"
          type="file"
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
            className="image-remove"
            disabled={busy}
            onClick={() => setValue("")}
          >
            Remove image
          </button>
        )}
        <p id="item-photo-status" role="status">
          {busy
            ? "Preparing your photo…"
            : error || "Saved with this item in your browser."}
        </p>
      </div>
    </div>
  );
}
