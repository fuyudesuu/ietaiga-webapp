"use client";
import { useState } from "react";
import {
  Bell,
  MessageCircle,
  Hash,
  Check,
  Globe2,
  Palette,
  Monitor,
  Sun,
  Moon,
  Download,
  RotateCcw,
  ShieldCheck,
  LoaderCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";
import { usePlanner } from "@/lib/encore/store";
import { type Preferences, type Currency } from "@/lib/encore/model";
import {
  PageHeading,
  Choice,
  Pill,
  formErrorClass,
  formHelpClass,
  panelClass,
} from "@/components/encore-ui/ui";
import { cn } from "@/lib/utils";

// Shared pieces of the settings sections.
const sectionClass = cn(panelClass, "p-6 max-md:p-5");
const headingIconClass = "mt-0.5 w-[19px] text-primary";
const sectionHeadingClass = "mb-6 flex items-start gap-3";
const sectionTitleClass = "text-lead font-semibold tracking-tight";
const sectionHintClass =
  "mt-1 text-small leading-relaxed text-muted-foreground";
const settingRowClass =
  "flex items-center justify-between gap-5 border-t border-border py-4 last:pb-0 max-md:flex-wrap max-md:gap-3";
const settingLabelClass = "text-small font-medium";
const settingHintClass =
  "mt-0.5 text-small leading-relaxed text-muted-foreground";
const settingChoiceClass = "w-[200px] shrink-0 max-lg:w-[185px] max-md:w-full";
export function Settings() {
  const { state, update, notify, reset } = usePlanner();
  const p = state.preferences;
  const [testing, setTesting] = useState(false);
  const [blocked, setBlocked] = useState(false);
  const [testMessage, setTestMessage] = useState("");
  function pref(changes: Partial<Preferences>) {
    update((s) => ({ ...s, preferences: { ...s.preferences, ...changes } }));
  }
  async function test() {
    setTesting(true);
    setTestMessage("");
    await new Promise((r) => setTimeout(r, 700));
    const ok = !blocked;
    pref({ connected: ok });
    const message = ok
      ? "Simulated test successful. No message was sent."
      : p.destination === "dm"
        ? "Simulated failure: Discord could not deliver this DM. Check privacy settings or shared-server setup."
        : "Simulated failure: channel access was revoked. Reconnect the destination.";
    setTestMessage(message);
    update((s) => ({
      ...s,
      deliveries: [
        {
          id: crypto.randomUUID(),
          label: "Connection test",
          destination: p.destination === "dm" ? "Discord DM" : "#" + p.channel,
          status: ok ? ("Simulated sent" as const) : ("Failed" as const),
          time: "1 Oct · 12:00 JST",
        },
        ...s.deliveries,
      ].slice(0, 10),
    }));
    setTesting(false);
  }
  function exportDemo() {
    const blob = new Blob([JSON.stringify({ demo: true, ...state }, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "encore-demo-plans.json";
    a.click();
    URL.revokeObjectURL(url);
    notify("Sample plans exported.");
  }
  return (
    <>
      <PageHeading
        eyebrow="MAKE YOURSELF AT HOME"
        title="Settings"
        subtitle="Time zones, appearance, and reminder preferences."
      />
      <div className="grid grid-cols-[minmax(0,1fr)_275px] gap-6 max-[1251px]:grid-cols-[minmax(0,1fr)]">
        <div className="flex flex-col gap-6">
          <section className={sectionClass}>
            <div className={sectionHeadingClass}>
              <Globe2 className={headingIconClass} />
              <div>
                <h2 className={sectionTitleClass}>Your defaults</h2>
                <p className={sectionHintClass}>
                  Keep local time clear, even when you are far from home.
                </p>
              </div>
            </div>
            <div className={settingRowClass}>
              <div>
                <label htmlFor="zone-setting" className={settingLabelClass}>
                  Display time zone
                </label>
                <p className={settingHintClass}>
                  Original Japanese deadlines remain visible.
                </p>
              </div>
              <Choice
                id="zone-setting"
                label="Display time zone"
                className={settingChoiceClass}
                value={p.zone}
                onChange={(zone) => pref({ zone })}
                options={[
                  { value: "Asia/Singapore", label: "Singapore · SGT" },
                  { value: "Asia/Tokyo", label: "Tokyo · JST" },
                  { value: "Australia/Sydney", label: "Sydney · AEST/AEDT" },
                  { value: "America/Los_Angeles", label: "Los Angeles · PT" },
                ]}
              />
            </div>
            <div className={settingRowClass}>
              <div>
                <label htmlFor="currency-setting" className={settingLabelClass}>
                  Default currency
                </label>
                <p className={settingHintClass}>
                  Each cost keeps its original currency.
                </p>
              </div>
              <Choice
                id="currency-setting"
                label="Default currency"
                className={settingChoiceClass}
                value={p.currency}
                onChange={(v) => pref({ currency: v as Currency })}
                options={["JPY", "USD", "AUD", "SGD"]}
              />
            </div>
          </section>
          <section className={sectionClass}>
            <div className={sectionHeadingClass}>
              <Palette className={headingIconClass} />
              <div>
                <h2 className={sectionTitleClass}>Look & feel</h2>
                <p className={sectionHintClass}>A little personal touch.</p>
              </div>
            </div>
            <RadioGroup
              className="mb-6 grid grid-cols-3 gap-3"
              value={p.theme}
              onValueChange={(v) => pref({ theme: v as Preferences["theme"] })}
              aria-label="Color theme"
            >
              {[
                { id: "light", label: "Light", icon: Sun },
                { id: "dark", label: "Dark", icon: Moon },
                { id: "system", label: "System", icon: Monitor },
              ].map((t) => (
                <label
                  key={t.id}
                  className={cn(
                    "relative flex cursor-pointer flex-col items-center gap-2.5 rounded-lg border border-border p-5 text-muted-foreground focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-ring max-md:gap-2 max-md:px-2 max-md:py-4",
                    p.theme === t.id && "border-primary bg-accent text-primary",
                  )}
                >
                  <RadioGroupItem value={t.id} className="sr-only" />
                  <t.icon size={22} />
                  <span className="text-small">{t.label}</span>
                  {p.theme === t.id && (
                    <Check size={14} className="absolute top-2.5 right-2.5" />
                  )}
                </label>
              ))}
            </RadioGroup>
            <div className={settingRowClass}>
              <div>
                <label htmlFor="solid-setting" className={settingLabelClass}>
                  Reduce transparency
                </label>
                <p className={settingHintClass}>
                  Use solid surfaces for extra clarity.
                </p>
              </div>
              <Switch
                id="solid-setting"
                checked={p.solid}
                onCheckedChange={(solid) => pref({ solid })}
              />
            </div>
          </section>
          <section id="reminders" className={sectionClass}>
            <div className={sectionHeadingClass}>
              <Bell className={headingIconClass} />
              <div>
                <h2 className={sectionTitleClass}>Your reminders, your way.</h2>
                <p className={sectionHintClass}>
                  Choose where your important deadlines find you.
                </p>
              </div>
            </div>
            <RadioGroup
              value={p.destination}
              onValueChange={(v) => {
                pref({
                  destination: v as Preferences["destination"],
                  connected: false,
                });
                setTestMessage("");
              }}
              aria-label="Reminder destination"
              className="flex flex-col gap-2.5"
            >
              {[
                {
                  id: "dm",
                  title: "Discord direct message",
                  description: "A personal nudge, just for you.",
                  icon: MessageCircle,
                },
                {
                  id: "channel",
                  title: "Discord server channel",
                  description: "Keep your plans in a chosen channel.",
                  icon: Hash,
                },
                {
                  id: "none",
                  title: "In-app only",
                  description: "See your deadlines here in Encore.",
                  icon: Bell,
                },
              ].map((d) => (
                <label
                  key={d.id}
                  className={cn(
                    "flex cursor-pointer items-center gap-3 rounded-lg border border-border p-4",
                    p.destination === d.id && "border-primary bg-accent",
                  )}
                >
                  <span className="text-primary">
                    <d.icon size={20} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <strong className="block text-small font-semibold">
                      {d.title}
                    </strong>
                    <small className="mt-0.5 block text-small text-muted-foreground">
                      {d.description}
                    </small>
                  </span>
                  <RadioGroupItem value={d.id} />
                </label>
              ))}
            </RadioGroup>
            {p.destination !== "none" && (
              <div className="mt-6">
                {p.destination === "channel" && (
                  <>
                    <label className="mb-4 flex min-w-0 flex-col gap-2">
                      <span className="text-small font-medium">
                        Demo channel name
                      </span>
                      <Input
                        value={p.channel}
                        onChange={(e) =>
                          pref({ channel: e.target.value, connected: false })
                        }
                        placeholder="my-concert-plans"
                      />
                    </label>
                    <div className={settingRowClass}>
                      <div>
                        <label
                          htmlFor="show-title"
                          className={settingLabelClass}
                        >
                          Include concert title
                        </label>
                        <p className={settingHintClass}>
                          Channel members will be able to see it.
                        </p>
                      </div>
                      <Switch
                        id="show-title"
                        checked={p.revealTitle}
                        onCheckedChange={(revealTitle) => pref({ revealTitle })}
                      />
                    </div>
                  </>
                )}
                <div className="mt-5 mb-3 flex gap-3 rounded-lg bg-muted p-5 max-md:gap-2 max-md:p-3">
                  <span className="grid size-[34px] shrink-0 place-items-center rounded-full bg-primary text-title font-semibold text-primary-foreground">
                    e.
                  </span>
                  <div className="min-w-0 flex-1">
                    <strong className="text-label">
                      encore{" "}
                      <small className="ml-0.5 rounded-xs bg-[#74808d] px-1 py-px text-small text-white">
                        APP
                      </small>
                    </strong>
                    <span className="ml-2 text-small text-muted-foreground">
                      Today at 12:00
                    </span>
                    <div className="mt-1.5 rounded-xs border-l-[3px] border-primary bg-card p-3">
                      <strong className="block text-small">
                        {p.destination === "channel" && !p.revealTitle
                          ? "A saved deadline needs attention"
                          : "THE IDOLM@STER · Payment deadline"}
                      </strong>
                      <p className="my-1.5 text-small">1 Oct, 18:00 JST</p>
                      <span className="text-small text-primary">
                        Open in Encore ↗
                      </span>
                    </div>
                  </div>
                </div>
                <p className={formHelpClass}>
                  Preview only. No real Discord account, webhook, or bot is
                  connected. Booking references and private notes are never
                  included.
                </p>
                <div className="mt-5 flex items-center gap-3 max-md:flex-wrap">
                  <Button
                    className="primary-button"
                    disabled={
                      testing ||
                      (p.destination === "channel" && !p.channel.trim())
                    }
                    onClick={test}
                  >
                    {testing ? (
                      <LoaderCircle className="animate-spin" size={16} />
                    ) : (
                      <MessageCircle size={16} />
                    )}{" "}
                    {testing ? "Testing…" : "Simulate test"}
                  </Button>
                  <Pill tone={p.connected ? "mint" : "neutral"}>
                    {p.connected ? "Demo connected" : "Not connected"}
                  </Pill>
                </div>
                {testMessage && (
                  <p
                    className={
                      blocked ? formErrorClass : "py-3 text-label text-primary"
                    }
                    role="status"
                  >
                    {testMessage}
                  </p>
                )}
                <details className="mt-5 text-small text-muted-foreground">
                  <summary className="cursor-pointer">
                    Demo failure scenario
                  </summary>
                  <label className="mt-4 flex items-center gap-3">
                    <Switch checked={blocked} onCheckedChange={setBlocked} />
                    Simulate blocked delivery on the next test
                  </label>
                </details>
              </div>
            )}
          </section>
          {state.deliveries.length > 0 && (
            <section className={sectionClass}>
              <h2 className="text-body font-semibold tracking-tight">
                Recent activity
              </h2>
              {state.deliveries.map((d) => (
                <div
                  className="flex items-center gap-3 border-b border-border py-4 last:border-0 last:pb-0"
                  key={d.id}
                >
                  <MessageCircle size={17} />
                  <span className="flex-1">
                    <strong className="text-label font-medium">
                      {d.label}
                    </strong>
                    <small className="block text-small text-muted-foreground">
                      {d.destination} · {d.time}
                    </small>
                  </span>
                  <Pill tone={d.status === "Failed" ? "amber" : "mint"}>
                    {d.status}
                  </Pill>
                </div>
              ))}
            </section>
          )}
        </div>
        <aside className="flex flex-col gap-6 max-[1251px]:grid max-[1251px]:grid-cols-2 max-[1251px]:items-start max-md:flex max-md:flex-col max-md:*:w-full">
          <section
            className={cn(
              panelClass,
              "flex flex-col items-center gap-2.5 px-6 py-6",
            )}
          >
            <div className="grid size-[68px] shrink-0 place-items-center rounded-full bg-secondary text-heading font-semibold text-secondary-foreground">
              A
            </div>
            <h2 className="mt-1 text-title font-semibold">Aki</h2>
            <p className="text-small text-muted-foreground">
              Personal demo space
            </p>
            <Pill>Sample account</Pill>
            <div className="mt-4 flex items-start gap-2 border-t border-border pt-4 text-muted-foreground">
              <ShieldCheck size={18} />
              <p className="text-small leading-relaxed">
                This is a design prototype. Use fictional information only.
              </p>
            </div>
          </section>
          <section className={cn(panelClass, "flex flex-col gap-3 p-6")}>
            <h2 className="text-small font-semibold">Your sample data</h2>
            <p className="text-small text-muted-foreground">
              Edits stay on this browser. You can take a copy or start fresh.
            </p>
            <Button variant="outline" onClick={exportDemo}>
              <Download size={16} />
              Export sample plans
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="ghost">
                  <RotateCcw size={16} />
                  Reset the demo
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Start fresh?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Your changes on this browser will be replaced with the
                    original fictional plans.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Keep my changes</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => {
                      reset();
                      setTestMessage("");
                    }}
                  >
                    Reset demo
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </section>
          <p className="px-5 text-small leading-relaxed text-muted-foreground">
            Tokyo photograph by Kazuend, CC0.
            <br />
            <a
              href="https://commons.wikimedia.org/wiki/File:Shiba-koen,_aerial_view_on_Tokyo_Tower_at_dusk_(Unsplash).jpg"
              target="_blank"
              rel="noreferrer"
              className="underline"
            >
              Photo source ↗
            </a>
          </p>
        </aside>
      </div>
    </>
  );
}
