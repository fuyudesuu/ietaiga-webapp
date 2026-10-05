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
import { EditorHost } from "@/features/editors";
import { WebTools } from "./web-tools";
import type { CSSProperties, ReactNode } from "react";
import { withBasePath } from "@/lib/encore/paths";
import { cn } from "@/lib/utils";
const nav = [
  { href: "/", label: "Overview", icon: LayoutDashboard },
  { href: "/trips", label: "Trips", icon: Luggage },
  { href: "/concerts", label: "Concerts", icon: Ticket },
  { href: "/settings", label: "Settings", icon: Settings2 },
];
// Frosted surfaces; solid when "Reduce transparency" is on or the browser
// lacks backdrop-filter.
const glassSurface =
  "bg-[var(--glass)] solid:bg-card solid:backdrop-filter-none not-supports-[backdrop-filter:blur(1px)]:bg-card";
const sidebarMaterial = [
  "*:data-[slot=sidebar-inner]:border-r *:data-[slot=sidebar-inner]:border-border",
  "*:data-[slot=sidebar-inner]:backdrop-blur-[28px] *:data-[slot=sidebar-inner]:backdrop-saturate-[1.25]",
  "solid:*:data-[slot=sidebar-inner]:bg-card solid:*:data-[slot=sidebar-inner]:backdrop-filter-none",
  "not-supports-[backdrop-filter:blur(1px)]:*:data-[slot=sidebar-inner]:bg-card",
].join(" ");
const topbarClass = cn(
  "sticky top-3 z-20 mx-7 mt-4 flex h-[58px] items-center justify-between rounded-[16px] border border-border px-5 backdrop-blur-[22px] backdrop-saturate-[1.3]",
  glassSurface,
  "max-[1251px]:mx-5 max-md:top-2 max-md:mx-4 max-md:mt-2.5 max-md:h-14 max-md:px-3.5",
);
const mobileNavClass = cn(
  "hidden max-md:fixed max-md:right-4 max-md:bottom-[max(12px,env(safe-area-inset-bottom))] max-md:left-4 max-md:z-30 max-md:flex max-md:justify-around max-md:rounded-[20px] max-md:border max-md:border-border max-md:px-[5px] max-md:py-[7px] max-md:shadow-[0_8px_32px_#14233e18] max-md:backdrop-blur-[28px] max-md:backdrop-saturate-[1.4]",
  glassSurface,
);
// shadcn's menu button: override its size, colours and active state.
const navLinkClass = [
  "h-12 gap-[13px] rounded-[12px] px-[15px] py-0 text-body leading-5 text-sidebar-foreground",
  "hover:text-sidebar-foreground active:text-sidebar-foreground",
  "data-[active=true]:bg-sidebar-accent data-[active=true]:font-semibold data-[active=true]:text-primary data-[active=true]:hover:text-primary",
  "[&>svg]:size-5 [&>svg]:stroke-[1.7]",
].join(" ");
const avatarClass =
  "grid shrink-0 place-items-center rounded-full bg-secondary font-semibold text-secondary-foreground";

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
      <Sidebar className={sidebarMaterial}>
        <SidebarHeader className="p-[32px_24px_38px]">
          <a
            href={withBasePath("/")}
            className="flex items-center gap-2.5 text-[1.8rem] font-bold tracking-[-0.04em] text-foreground"
          >
            <span className="grid place-items-center text-primary">
              <AudioLines size={23} />
            </span>
            encore<span className="-ml-[9px]">.</span>
          </a>
        </SidebarHeader>
        <SidebarContent>
          <SidebarMenu className="gap-[7px] px-3.5 py-0">
            {nav.map((n) => (
              <SidebarMenuItem key={n.href}>
                <SidebarMenuButton
                  asChild
                  isActive={active(n.href)}
                  className={navLinkClass}
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
          <div className="mt-10 border-t border-border pt-7">
            <p className="mx-[26px] mb-3 text-caption font-semibold tracking-[0.06em] text-muted-foreground">
              UPCOMING TRIPS
            </p>
            {state.trips.slice(0, 3).map((t) => (
              <a
                key={t.id}
                href={withBasePath("/trips/" + t.id)}
                className="flex items-center gap-3 px-6 py-3 text-small text-foreground hover:bg-accent"
              >
                <span className="text-muted-foreground">
                  <Luggage size={15} />
                </span>
                <span>
                  {t.cities}
                  <small className="mt-[3px] block text-label text-muted-foreground">
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
          <div className="mx-6 mt-auto mb-6 pt-14 text-small text-muted-foreground">
            <Bell size={20} className="mb-2.5 text-primary" />
            <p>Concerts, stays, and every deadline in between.</p>
            <a
              href={withBasePath("/settings#reminders")}
              className="mt-3 flex items-center gap-1.5 text-primary"
            >
              Reminder preferences <ChevronRight size={14} className="mb-2.5" />
            </a>
          </div>
        </SidebarContent>
        <SidebarFooter className="border-t border-border p-[20px_24px]">
          <a
            href={withBasePath("/settings")}
            className="flex items-center gap-2.5 text-small text-foreground"
          >
            <span className={cn(avatarClass, "size-[38px]")}>A</span>
            <span>
              Aki
              <small className="block text-label text-muted-foreground">
                Personal space
              </small>
            </span>
            <Settings2 size={16} className="ml-auto" />
          </a>
        </SidebarFooter>
      </Sidebar>
      <div className="min-w-0 flex-1">
        <header className={topbarClass}>
          <a
            href={withBasePath("/")}
            className="hidden text-[1.45rem] font-bold tracking-[-0.04em] text-foreground max-md:block"
          >
            encore.
          </a>
          <div className="flex items-center gap-2.5 text-small text-muted-foreground max-md:hidden">
            <span>Your space</span>
            <ChevronRight size={13} />
            <span className="text-foreground">
              {path.startsWith("/trips")
                ? "Trips"
                : path.startsWith("/concerts")
                  ? "Concerts"
                  : path.startsWith("/settings")
                    ? "Settings"
                    : "Overview"}
            </span>
          </div>
          <div className="flex items-center gap-4 max-md:gap-2">
            <span className="text-label text-muted-foreground max-md:text-caption">
              Sample plans
            </span>
            <span className="flex items-center gap-[7px] border-l border-border pl-4 text-label text-muted-foreground max-md:hidden">
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
              className={cn(avatarClass, "size-8 text-small max-md:hidden")}
              aria-label="Account settings"
            >
              A
            </a>
          </div>
        </header>
        <main
          id="main-content"
          className="m-auto min-h-[calc(100vh-134px)] max-w-[1440px] px-9 pt-[35px] pb-12 max-[1251px]:p-[30px_26px] max-md:min-h-[calc(100dvh-100px)] max-md:p-[28px_20px_112px] max-md:has-[#wallet-panel]:pt-6 max-md:has-[#wallet-panel]:pb-9 min-[1550px]:pt-[46px]"
        >
          {children}
        </main>
        <footer className="flex justify-between gap-4 px-9 pb-6 text-caption text-muted-foreground max-md:flex-col max-md:gap-1.25 max-md:px-5 max-md:pb-[110px]">
          <span>Encore · Personal concert planner</span>
          <span>Fictional plans · Saved on this browser</span>
        </footer>
      </div>
      <nav className={mobileNavClass} aria-label="Main navigation">
        {nav.map((n) => (
          <a
            href={withBasePath(n.href)}
            key={n.href}
            className={cn(
              "flex min-h-12 min-w-[60px] flex-col items-center justify-center gap-1 rounded-[13px] px-2 py-1.5 text-caption text-muted-foreground",
              active(n.href) && "bg-accent font-semibold text-primary",
            )}
            aria-current={active(n.href) ? "page" : undefined}
          >
            <n.icon size={21} className="size-5" />
            <span>{n.label}</span>
          </a>
        ))}
      </nav>
      <Button
        className="hidden"
        size="icon"
        onClick={() => setEditor({ type: "concert" })}
        aria-label="Add concert"
      >
        <Plus />
      </Button>
      {notice && (
        <div
          role="status"
          className="fixed bottom-6 left-[calc(50%+100px)] z-100 flex max-w-[calc(100vw-32px)] -translate-x-1/2 items-center gap-2.5 rounded-[12px] border-0 bg-foreground px-5 py-3.5 text-small text-background shadow-[0_8px_30px_#091b3326] max-md:right-4 max-md:bottom-[100px] max-md:left-4 max-md:w-auto max-md:max-w-none max-md:translate-x-0"
        >
          <Check size={17} />
          {notice}
        </div>
      )}
      <EditorHost />
      <WebTools />
    </SidebarProvider>
  );
}
