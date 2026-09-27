"use client";
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
export function Pill({
  children,
  tone = "neutral",
}: {
  children: ReactNode;
  tone?: string;
}) {
  return <span className={`pill ${tone}`}>{children}</span>;
}
export function PageHeading({
  eyebrow,
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
    <header className="page-heading">
      <div>
        <h1>{title}</h1>
        {subtitle && <p className="page-subtitle">{subtitle}</p>}
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
}: {
  value: string;
  onChange: (v: string) => void;
  options: (string | { value: string; label: string })[];
  label: string;
  id?: string;
}) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger id={id} aria-label={label} className="choice">
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
    <div className="date-tile">
      <span>{date ? day(date, { month: "short" }) : "TBA"}</span>
      <strong>{date ? day(date, { day: "2-digit" }) : "—"}</strong>
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
      className={`concert-mark ${concert.color} ${large ? "large" : ""}`}
    >
      <Music2 size={large ? 36 : 22} />
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
    <div className="empty-state">
      <Music2 />
      <h3>{title}</h3>
      <p>{description}</p>
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
