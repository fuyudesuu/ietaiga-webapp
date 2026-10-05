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
/** Card surface used by most sections. */
export const panelClass =
  "rounded-[16px] border border-border bg-card shadow-none";
/** Supporting text under a form or setting. */
export const formHelpClass = "text-small leading-[1.8] text-muted-foreground";
/** An inline error or warning message. */
export const formErrorClass =
  "rounded-sm bg-amber-bg px-3.5 py-3 text-small text-amber-text";
/** A highlighted note at the top of a form. */
export const formCalloutClass =
  "rounded-md bg-amber-bg p-[17px] text-[0.8rem] text-amber-text [&_p]:mt-1 [&_p]:text-small";

/** Heading row above a section, with optional actions on the right. */
export const sectionTitleClass =
  "flex items-center justify-between gap-3 mb-4.5 max-md:gap-2.5";
/** The heading inside a section title row. */
export const sectionHeadingClass =
  "flex items-center gap-2.5 text-lead font-[650] tracking-[-0.02em] max-md:text-[1.0625rem]";
/** A compact link with an icon. */
export const textLinkClass =
  "inline-flex items-center gap-[7px] text-small font-[550] text-primary hover:underline";
/** A small round count badge next to a heading. */
export const countLabelClass =
  "inline-grid h-[23px] min-w-[23px] place-items-center rounded-full bg-muted px-1.5 text-caption font-medium text-muted-foreground";
/** Quiet supporting text. */
export const secondaryTextClass = "text-small text-muted-foreground";
/** "← All concerts" style link above a detail page. */
export const backLinkClass =
  "mb-6 inline-flex items-center gap-1.5 text-[0.8rem] text-muted-foreground hover:text-primary";
/** Notes paragraph in a side panel. */
export const notesCopyClass = "text-small leading-[1.85] text-muted-foreground";
/** Detail page: main column and a side column. */
export const detailGridClass =
  "grid grid-cols-[minmax(0,1fr)_290px] gap-7 max-[1251px]:grid-cols-[minmax(0,1fr)]";
export const detailAsideClass =
  "flex flex-col gap-[22px] max-[1251px]:grid max-[1251px]:grid-cols-[repeat(2,minmax(0,1fr))] max-[1251px]:items-start max-md:flex max-md:flex-col max-md:*:w-full";
/** A small panel in the side column. */
export const sideSectionClass = cn(
  panelClass,
  "flex flex-col gap-3.5 p-[23px]",
);
export const sideHeadingClass = "text-[0.91rem] font-semibold";

/** Segmented tabs (shadcn TabsList / TabsTrigger). The trigger needs an
    important size: shadcn controls inherit the page font via an unlayered rule. */
export const tabsListClass =
  "rounded-md bg-secondary p-1 group-data-[orientation=horizontal]/tabs:h-[43px]";
export const tabsTriggerClass =
  "min-h-[34px] rounded-[7px] px-[13px] py-1.5 text-small! shadow-none data-[state=active]:bg-card data-[state=active]:text-primary group-data-[variant=default]/tabs-list:data-[state=active]:shadow-none dark:data-[state=active]:bg-card dark:data-[state=active]:text-primary max-md:px-2.5";

/** Frosted label over a photo; solid when transparency is reduced. */
export function GlassTag({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.25 rounded-[20px] border border-[#ffffff50] bg-[#152a353b] px-2.5 py-1.5 text-small leading-[1.3] text-white backdrop-blur-[12px] solid:bg-[#152a48] solid:backdrop-blur-none",
        className,
      )}
    >
      {children}
    </span>
  );
}

/** Status colours shared by pills and concert marks (tokens in globals.css). */
export const toneClasses: Record<string, string> = {
  neutral: "",
  amber: "bg-amber-bg text-amber-text",
  blue: "bg-blue-bg text-blue-text",
  mint: "bg-mint-bg text-mint-text",
  lilac: "bg-lilac-bg text-lilac-text",
  pink: "bg-pink-bg text-pink-text",
  peach: "bg-peach-bg text-peach-text",
  // Frosted material over photos.
  glass:
    "bg-[#152a48c9] text-white backdrop-blur-[18px] solid:bg-[#152a48] solid:backdrop-blur-none",
};

// `pill`, `date-tile` and `concert-mark` stay as hooks for the screen-specific
// sizes in app/styles until those screens move to utilities.
export function Pill({
  children,
  tone = "neutral",
  className,
}: {
  children: ReactNode;
  tone?: string;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "pill inline-flex max-w-full items-center gap-1.25 rounded-[6px] bg-muted px-2 py-1 text-label leading-[1.4] font-[550] text-muted-foreground",
        toneClasses[tone],
        className,
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
/** Month over day; "calendar" puts a larger day above the month. */
export function DateTile({
  date,
  variant = "default",
  className,
}: {
  date: string;
  variant?: "default" | "calendar";
  className?: string;
}) {
  const calendar = variant === "calendar";
  return (
    <div
      className={cn(
        "date-tile flex min-w-9 shrink-0 flex-col items-center leading-[1.3] tabular-nums",
        calendar && "w-auto min-w-0 flex-col-reverse gap-0.5",
        className,
      )}
    >
      <span
        className={cn(
          "text-small tracking-[0.08em] text-muted-foreground uppercase",
          calendar && "text-caption",
        )}
      >
        {date ? day(date, { month: "short" }) : "TBA"}
      </span>
      <strong
        className={cn(
          "mt-0.5 text-[1.3rem] font-medium tabular-nums",
          calendar && "text-[1.7rem] font-[550] tracking-[-0.04em]",
        )}
      >
        {date ? day(date, { day: "2-digit" }) : "—"}
      </strong>
    </div>
  );
}
export function ConcertMark({
  concert,
  large = false,
  className,
}: {
  concert: Concert;
  large?: boolean;
  className?: string;
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
        className,
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
    <div className={sectionTitleClass}>
      <h2 className={sectionHeadingClass}>{children}</h2>
      {href && (
        <a className={textLinkClass} href={withBasePath(href)}>
          {link}
          <ArrowUpRight size={15} />
        </a>
      )}
    </div>
  );
}
