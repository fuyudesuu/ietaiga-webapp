import type { ReactNode } from "react";
import type { Route } from "./router";
import { useStore } from "./store";
import styles from "./AppShell.module.css";

const NAV_ITEMS = [
  { href: "#/", label: "Overview", icon: "◎", match: ["overview"] },
  { href: "#/wallet", label: "Wallet", icon: "▤", match: ["wallet", "trip"] },
  { href: "#/concerts", label: "Concerts", icon: "♪", match: ["concerts", "concert"] },
  { href: "#/settings", label: "Settings", icon: "⚙", match: ["settings"] },
] as const;

interface AppShellProps {
  route: Route;
  children: ReactNode;
}

export function AppShell({ route, children }: AppShellProps) {
  const { persisted } = useStore();
  return (
    <div className={styles.shell}>
      <p className={styles.banner} role="note">
        Prototype · fictional demo data stored only in this browser
        {persisted ? "" : " · storage unavailable, changes will not survive a reload"}
      </p>
      <header className={styles.header}>
        <a className={styles.brand} href="#/">
          Encore<span>.</span>
        </a>
        <nav className={styles.nav} aria-label="Main">
          {NAV_ITEMS.map((item) => (
            <a
              key={item.href}
              className={styles.navLink}
              href={item.href}
              aria-current={(item.match as readonly string[]).includes(route.name) ? "page" : undefined}
            >
              <span className={styles.navIcon} aria-hidden="true">
                {item.icon}
              </span>
              {item.label}
            </a>
          ))}
        </nav>
      </header>
      <main className={styles.main}>{children}</main>
    </div>
  );
}
