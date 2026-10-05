"use client";
import { cn } from "@/lib/utils";
import { ArrowUpRight, Music2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { type ReactNode } from "react";
import { Concert, day } from "@/lib/encore/model";
import { withBasePath } from "@/lib/encore/paths";
/** Status colours shared by pills and concert marks (tokens in globals.css). */
export const toneClasses: Record<string, string> = {
  neutral: "",
  amber: "bg-amber-bg text-amber-text",
  blue: "bg-blue-bg text-blue-text",
  mint: "bg-mint-bg text-mint-text",
  lilac: "bg-lilac-bg text-lilac-text",
  pink: "bg-pink-bg text-pink-text",
  peach: "bg-peach-bg text-peach-text",
  // Frosted material over photos; stays global (app/styles/shell.css).
  glass: "glass",
};

// `pill`, `date-tile` and `concert-mark` stay as hooks for the screen-specific
// sizes in app/styles until those screens move to utilities.
export function Pill({
  children,
  tone = "neutral",
}: {
  children: ReactNode;
  tone?: string;
}) {
  return (
    <span
      className={cn(
        "pill inline-flex max-w-full items-center gap-1.25 rounded-[6px] bg-muted px-2 py-1 text-label leading-[1.4] font-[550] text-muted-foreground",
        toneClasses[tone],
      )}
    >
      {children}
    </span>
  );
}
export function PageHeading({
  title,
  subtitle,
  action,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  action?: ReactNode;
}) {
  return (
    <header className="page-heading mb-[34px] flex items-center justify-between gap-6 max-lg:items-start max-md:mb-7 max-md:flex-wrap max-md:gap-5">
      <div>
        <h1 className="text-[length:clamp(2rem,3vw,2.5rem)] leading-[1.2] font-[680] tracking-[-0.035em] max-md:text-[2rem]">
          {title}
        </h1>
        {subtitle && (
          <p className="mt-2.5 text-[0.9375rem] text-muted-foreground max-md:text-small max-md:leading-[1.6]">
            {subtitle}
          </p>
        )}
      </div>
      {action}
    </header>
  );
}
export function AddButton({
  children,
  onClick,
}: {
  children: ReactNode;
  onClick: () => void;
}) {
  return (
    <Button className="primary-button" onClick={onClick}>
      <Plus size={17} />
      {children}
    </Button>
  );
}
export function Choice({
  value,
  onChange,
  options,
  label,
  id,
  className,
}: {
  value: string;
  onChange: (v: string) => void;
  options: (string | { value: string; label: string })[];
  label: string;
  id?: string;
  /** Extra classes for the trigger button. */
  className?: string;
}) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger
        id={id}
        aria-label={label}
        className={cn("choice w-full min-w-[130px]", className)}
      >
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {options.map((o) => {
          const v = typeof o === "string" ? o : o.value;
          return (
            <SelectItem key={v} value={v}>
              {typeof o === "string" ? o : o.label}
            </SelectItem>
          );
        })}
      </SelectContent>
    </Select>
  );
}
export function DateTile({ date }: { date: string }) {
  return (
    <div className="date-tile flex min-w-9 shrink-0 flex-col items-center leading-[1.3] tabular-nums">
      <span className="text-small tracking-[0.08em] text-muted-foreground uppercase">
        {date ? day(date, { month: "short" }) : "TBA"}
      </span>
      <strong className="mt-0.5 text-[1.3rem] font-medium tabular-nums">
        {date ? day(date, { day: "2-digit" }) : "—"}
      </strong>
    </div>
  );
}
export function ConcertMark({
  concert,
  large = false,
}: {
  concert: Concert;
  large?: boolean;
}) {
  return (
    <div
      aria-hidden
      className={cn(
        "concert-mark grid shrink-0 place-items-center",
        large
          ? "h-[100px] w-[90px] rounded-[18px] max-md:h-16 max-md:w-[58px]"
          : "h-12 w-[43px] rounded-[9px]",
        toneClasses[concert.color],
      )}
    >
      <Music2 size={large ? 36 : 22} strokeWidth={1.5} />
    </div>
  );
}
export function Empty({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center gap-3.5 px-6 py-[50px] text-center text-muted-foreground">
      <Music2 />
      <h3 className="text-[1.1rem] text-foreground">{title}</h3>
      <p className="max-w-[360px] text-small">{description}</p>
      {action}
    </div>
  );
}
export function SectionTitle({
  children,
  href,
  link = "View all",
}: {
  children: ReactNode;
  href?: string;
  link?: string;
}) {
  return (
    <div className="section-title">
      <h2>{children}</h2>
      {href && (
        <a className="text-link" href={withBasePath(href)}>
          {link}
          <ArrowUpRight size={15} />
        </a>
      )}
    </div>
  );
}
