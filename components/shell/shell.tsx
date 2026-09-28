"use client";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Luggage,
  Ticket,
  Settings2,
  AudioLines,
  Bell,
  ChevronRight,
  Globe2,
  Plus,
  Check,
} from "lucide-react";
import {
  SidebarProvider,
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { usePlanner } from "@/lib/encore/store";
import { Forms } from "@/features/editors";
import { WebTools } from "./web-tools";
import type { CSSProperties, ReactNode } from "react";
import { withBasePath } from "@/lib/encore/paths";
const nav = [
  { href: "/", label: "Overview", icon: LayoutDashboard },
  { href: "/trips", label: "Trips", icon: Luggage },
  { href: "/concerts", label: "Concerts", icon: Ticket },
  { href: "/settings", label: "Settings", icon: Settings2 },
];
export function AppShell({ children }: { children: ReactNode }) {
  const path = usePathname();
  const { state, notice, setEditor } = usePlanner();
  const active = (href: string) =>
    href === "/" ? path === "/" : path.startsWith(href);
  return (
    <SidebarProvider style={{ "--sidebar-width": "216px" } as CSSProperties}>
      <a href="#main-content" className="skip-link">
        Skip to content
      </a>
      <Sidebar className="encore-sidebar">
        <SidebarHeader className="brand-block">
          <a href={withBasePath("/")} className="brand">
            <span className="brand-symbol">
              <AudioLines size={23} />
            </span>
            encore<span className="brand-period">.</span>
          </a>
        </SidebarHeader>
        <SidebarContent>
          <SidebarMenu className="main-nav">
            {nav.map((n) => (
              <SidebarMenuItem key={n.href}>
                <SidebarMenuButton
                  asChild
                  isActive={active(n.href)}
                  className="nav-link"
                >
                  <a
                    href={withBasePath(n.href)}
                    aria-current={active(n.href) ? "page" : undefined}
                  >
                    <n.icon size={19} />
                    <span>{n.label}</span>
                  </a>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
          <div className="saved-trips">
            <p className="nav-caption">UPCOMING TRIPS</p>
            {state.trips.slice(0, 3).map((t) => (
              <a key={t.id} href={withBasePath("/trips/" + t.id)}>
                <span className="mini-trip-icon">
                  <Luggage size={15} />
                </span>
                <span>
                  {t.cities}
                  <small>
                    {t.start
                      ? new Date(t.start + "T12:00:00Z").toLocaleString("en", {
                          month: "long",
                          timeZone: "UTC",
                        }) + " getaway"
                      : "A new adventure"}
                  </small>
                </span>
              </a>
            ))}
          </div>
          <div className="sidebar-note">
            <Bell size={20} />
            <p>Concerts, stays, and every deadline in between.</p>
            <a href={withBasePath("/settings#reminders")}>
              Reminder preferences <ChevronRight size={14} />
            </a>
          </div>
        </SidebarContent>
        <SidebarFooter className="profile-footer">
          <a href={withBasePath("/settings")}>
            <span className="avatar">A</span>
            <span>
              Aki<small>Personal space</small>
            </span>
            <Settings2 size={16} />
          </a>
        </SidebarFooter>
      </Sidebar>
      <div className="workspace">
        <header className="topbar">
          <a href={withBasePath("/")} className="mobile-brand">
            encore.
          </a>
          <div className="breadcrumbs">
            <span>Your space</span>
            <ChevronRight size={13} />
            <span>
              {path.startsWith("/trips")
                ? "Trips"
                : path.startsWith("/concerts")
                  ? "Concerts"
                  : path.startsWith("/settings")
                    ? "Settings"
                    : "Overview"}
            </span>
          </div>
          <div className="topbar-right">
            <span className="demo-label">Sample plans</span>
            <span className="zone-label">
              <Globe2 size={14} />
              {(state.preferences.zone.split("/").pop() || "UTC").replaceAll(
                "_",
                " ",
              )}
            </span>
            <Button
              asChild
              variant="ghost"
              size="icon"
              aria-label="Reminder settings"
            >
              <a href={withBasePath("/settings#reminders")}>
                <Bell size={19} />
              </a>
            </Button>
            <a
              href={withBasePath("/settings")}
              className="avatar small"
              aria-label="Account settings"
            >
              A
            </a>
          </div>
        </header>
        <main id="main-content" className="page-content">
          {children}
        </main>
        <footer className="workspace-footer">
          <span>Encore · Personal concert planner</span>
          <span>Fictional plans · Saved on this browser</span>
        </footer>
      </div>
      <nav className="mobile-nav" aria-label="Main navigation">
        {nav.map((n) => (
          <a
            href={withBasePath(n.href)}
            key={n.href}
            className={active(n.href) ? "active" : ""}
            aria-current={active(n.href) ? "page" : undefined}
          >
            <n.icon size={21} />
            <span>{n.label}</span>
          </a>
        ))}
      </nav>
      <Button
        className="mobile-add"
        size="icon"
        onClick={() => setEditor({ type: "concert" })}
        aria-label="Add concert"
      >
        <Plus />
      </Button>
      {notice && (
        <div role="status" className="app-toast">
          <Check size={17} />
          {notice}
        </div>
      )}
      <Forms />
      <WebTools />
    </SidebarProvider>
  );
}
