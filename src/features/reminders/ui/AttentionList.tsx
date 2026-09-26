import { formatInstant, formatRelative } from "../../../lib/dates";
import type { AttentionItem } from "../domain/attention";
import ui from "../../../components/ui.module.css";
import styles from "./AttentionList.module.css";

interface AttentionListProps {
  items: AttentionItem[];
  now: Date;
  localTimeZone: string;
}

export function AttentionList({ items, now, localTimeZone }: AttentionListProps) {
  if (items.length === 0) {
    return <p className={ui.empty}>Nothing needs attention right now. Add an application round to track its deadlines.</p>;
  }
  return (
    <ul className={styles.list}>
      {items.map((item) => (
        <li key={item.key}>
          <a className={`${styles.item} ${item.overdue ? styles.overdue : ""}`} href={item.href}>
            <span className={styles.label}>{item.label}</span>
            <span className={item.overdue ? ui.pillDanger : ui.pillWarn}>
              {item.overdue ? "Overdue" : formatRelative(item.dueAt, now)}
            </span>
            <span className={styles.detail}>{item.detail}</span>
            <span className={styles.when}>
              {formatInstant(item.dueAt, item.timeZone)}
              {item.timeZone !== localTimeZone ? ` · ${formatInstant(item.dueAt, localTimeZone)} your time` : ""}
            </span>
          </a>
        </li>
      ))}
    </ul>
  );
}
