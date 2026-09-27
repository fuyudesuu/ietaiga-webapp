"use client";
import { useState, type CSSProperties, type RefCallback } from "react";
import { ImageIcon } from "lucide-react";
import { safeItemImage } from "@/lib/encore/images";

export interface WalletCardItem {
  id: string;
  title: string;
  subtitle: string;
  date: string;
  location: string;
  status: string;
  image?: string;
}
export function WalletCard({
  item,
  index,
  selected,
  otherSelected,
  cardRef,
  onSelect,
}: {
  item: WalletCardItem;
  index: number;
  selected: boolean;
  otherSelected: boolean;
  cardRef: RefCallback<HTMLButtonElement>;
  onSelect: () => void;
}) {
  const [failedImage, setFailedImage] = useState<string>();
  const image = safeItemImage(item.image);
  return (
    <button
      ref={cardRef}
      type="button"
      className={`wallet-card ${selected ? "is-selected" : ""}`}
      style={{ "--card-index": index } as CSSProperties}
      aria-expanded={selected}
      aria-controls={selected ? "wallet-item-details" : undefined}
      aria-label={`${item.title}, ${item.date}, ${item.status}. ${selected ? "Close" : "Open"} details`}
      aria-hidden={otherSelected || undefined}
      tabIndex={otherSelected ? -1 : 0}
      disabled={otherSelected}
      onClick={onSelect}
    >
      {image && failedImage !== image ? (
        <img
          className="wallet-card-image"
          src={image}
          alt=""
          decoding="async"
          onError={() => setFailedImage(image)}
        />
      ) : (
        <span className="wallet-card-fallback">
          <ImageIcon size={50} strokeWidth={1} />
          <span>Add your own cover</span>
        </span>
      )}
      <span className="wallet-card-shade" />
      <span className="wallet-card-heading">
        <strong>{item.title}</strong>
        <span>{item.date}</span>
      </span>
      <span className="wallet-card-bottom">
        <span className="wallet-card-subtitle">{item.subtitle}</span>
        <span className="wallet-card-location">{item.location}</span>
        <span className="wallet-card-status">{item.status}</span>
      </span>
    </button>
  );
}
