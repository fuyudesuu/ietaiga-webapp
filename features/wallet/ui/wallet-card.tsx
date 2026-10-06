"use client";
import { useState, type CSSProperties, type RefCallback } from "react";
import { ImageIcon } from "lucide-react";
import { safeItemImage } from "@/lib/encore/images";
import { withBasePath } from "@/lib/encore/paths";

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
      // The stacked position uses `transform` (not `translate`): the Wallet
      // motion hook reads and animates the computed transform.
      className="absolute top-0 left-0 isolate h-[280px] w-full origin-[50%_0] overflow-hidden rounded-[16px] border-0 bg-[#23344b] text-left text-white shadow-[0_-3px_16px_#0814281c,0_8px_18px_#08142820] [transform:translateY(calc(var(--card-index)*100px))] disabled:pointer-events-none disabled:cursor-default"
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
          className="absolute inset-0 size-full object-cover object-[center_42%]"
          src={withBasePath(image)}
          alt=""
          decoding="async"
          onError={() => setFailedImage(image)}
        />
      ) : (
        <span className="absolute inset-[80px_0_85px] flex items-center justify-center gap-2.5 text-[#d4e4ff]">
          <ImageIcon size={50} strokeWidth={1} />
          <span className="max-w-20 text-label">Add your own cover</span>
        </span>
      )}
      <span className="absolute inset-0 bg-[linear-gradient(180deg,rgba(5,14,29,0.88),rgba(5,14,29,0.62)_32%,rgba(5,14,29,0.1)_48%,rgba(5,14,29,0.84)_100%)]" />
      <span className="absolute top-5 right-5 left-5 flex items-start gap-3 max-[360px]:right-4 max-[360px]:left-4 max-[360px]:gap-2">
        <strong className="line-clamp-2 min-w-0 flex-1 text-lead leading-[1.25] font-[650] tracking-[-0.02em] max-[360px]:text-body">
          {item.title}
        </strong>
        <span className="max-w-[88px] shrink-0 pt-px text-right text-caption leading-normal font-semibold">
          {item.date}
        </span>
      </span>
      <span className="absolute right-5 bottom-5 left-5 flex flex-col items-start gap-1.25">
        <span className="line-clamp-2 max-w-full text-[0.9375rem] leading-[1.4] font-[550]">
          {item.subtitle}
        </span>
        <span className="text-caption leading-[1.4] text-[#ecf2ff]">
          {item.location}
        </span>
        <span className="mt-1.25 rounded-[6px] bg-[#f4f6fa] px-[9px] py-1.25 text-[0.6875rem] font-semibold text-[#14233e]">
          {item.status}
        </span>
      </span>
    </button>
  );
}
