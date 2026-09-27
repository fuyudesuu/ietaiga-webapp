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
import { PageHeading, Choice, Pill } from "./ui";
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
      <div className="settings-layout">
        <div className="settings-main">
          <section className="panel settings-section">
            <div className="settings-heading">
              <Globe2 />
              <div>
                <h2>Your defaults</h2>
                <p>Keep local time clear, even when you are far from home.</p>
              </div>
            </div>
            <div className="setting-row">
              <div>
                <label htmlFor="zone-setting">Display time zone</label>
                <p>Original Japanese deadlines remain visible.</p>
              </div>
              <Choice
                id="zone-setting"
                label="Display time zone"
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
            <div className="setting-row">
              <div>
                <label htmlFor="currency-setting">Default currency</label>
                <p>Each cost keeps its original currency.</p>
              </div>
              <Choice
                id="currency-setting"
                label="Default currency"
                value={p.currency}
                onChange={(v) => pref({ currency: v as Currency })}
                options={["JPY", "USD", "AUD", "SGD"]}
              />
            </div>
          </section>
          <section className="panel settings-section">
            <div className="settings-heading">
              <Palette />
              <div>
                <h2>Look & feel</h2>
                <p>A little personal touch.</p>
              </div>
            </div>
            <RadioGroup
              className="theme-options"
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
                  className={
                    "theme-option " + (p.theme === t.id ? "selected" : "")
                  }
                >
                  <RadioGroupItem value={t.id} className="sr-only" />
                  <t.icon size={22} />
                  <span>{t.label}</span>
                  {p.theme === t.id && <Check size={14} />}
                </label>
              ))}
            </RadioGroup>
            <div className="setting-row">
              <div>
                <label htmlFor="solid-setting">Reduce transparency</label>
                <p>Use solid surfaces for extra clarity.</p>
              </div>
              <Switch
                id="solid-setting"
                checked={p.solid}
                onCheckedChange={(solid) => pref({ solid })}
              />
            </div>
          </section>
          <section id="reminders" className="panel settings-section">
            <div className="settings-heading">
              <Bell />
              <div>
                <h2>Your reminders, your way.</h2>
                <p>Choose where your important deadlines find you.</p>
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
              className="destination-options"
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
                  className={
                    "destination-option " +
                    (p.destination === d.id ? "selected" : "")
                  }
                >
                  <span className="destination-icon">
                    <d.icon size={20} />
                  </span>
                  <span>
                    <strong>{d.title}</strong>
                    <small>{d.description}</small>
                  </span>
                  <RadioGroupItem value={d.id} />
                </label>
              ))}
            </RadioGroup>
            {p.destination !== "none" && (
              <div className="connection-area">
                {p.destination === "channel" && (
                  <>
                    <label className="form-field">
                      <span>Demo channel name</span>
                      <Input
                        value={p.channel}
                        onChange={(e) =>
                          pref({ channel: e.target.value, connected: false })
                        }
                        placeholder="my-concert-plans"
                      />
                    </label>
                    <div className="setting-row">
                      <div>
                        <label htmlFor="show-title">
                          Include concert title
                        </label>
                        <p>Channel members will be able to see it.</p>
                      </div>
                      <Switch
                        id="show-title"
                        checked={p.revealTitle}
                        onCheckedChange={(revealTitle) => pref({ revealTitle })}
                      />
                    </div>
                  </>
                )}
                <div className="message-preview">
                  <span className="discord-avatar">e.</span>
                  <div>
                    <strong>
                      encore <small>APP</small>
                    </strong>
                    <span className="message-time">Today at 12:00</span>
                    <div className="discord-message">
                      <strong>
                        {p.destination === "channel" && !p.revealTitle
                          ? "A saved deadline needs attention"
                          : "THE IDOLM@STER · Payment deadline"}
                      </strong>
                      <p>1 Oct, 18:00 JST</p>
                      <span>Open in Encore ↗</span>
                    </div>
                  </div>
                </div>
                <p className="form-help">
                  Preview only. No real Discord account, webhook, or bot is
                  connected. Booking references and private notes are never
                  included.
                </p>
                <div className="connection-actions">
                  <Button
                    className="primary-button"
                    disabled={
                      testing ||
                      (p.destination === "channel" && !p.channel.trim())
                    }
                    onClick={test}
                  >
                    {testing ? (
                      <LoaderCircle className="spin" size={16} />
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
                    className={blocked ? "form-error" : "test-success"}
                    role="status"
                  >
                    {testMessage}
                  </p>
                )}
                <details className="demo-controls">
                  <summary>Demo failure scenario</summary>
                  <label>
                    <Switch checked={blocked} onCheckedChange={setBlocked} />
                    Simulate blocked delivery on the next test
                  </label>
                </details>
              </div>
            )}
          </section>
          {state.deliveries.length > 0 && (
            <section className="panel settings-section">
              <h2>Recent activity</h2>
              {state.deliveries.map((d) => (
                <div className="delivery-row" key={d.id}>
                  <MessageCircle size={17} />
                  <span>
                    <strong>{d.label}</strong>
                    <small>
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
        <aside className="settings-aside">
          <section className="panel profile-card">
            <div className="avatar big">A</div>
            <h2>Aki</h2>
            <p>Personal demo space</p>
            <Pill>Sample account</Pill>
            <div className="profile-disclaimer">
              <ShieldCheck size={18} />
              <p>This is a design prototype. Use fictional information only.</p>
            </div>
          </section>
          <section className="panel side-section">
            <h2>Your sample data</h2>
            <p className="secondary">
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
          <p className="photo-credit">
            Tokyo photograph by Kazuend, CC0.
            <br />
            <a
              href="https://commons.wikimedia.org/wiki/File:Shiba-koen,_aerial_view_on_Tokyo_Tower_at_dusk_(Unsplash).jpg"
              target="_blank"
              rel="noreferrer"
            >
              Photo source ↗
            </a>
          </p>
        </aside>
      </div>
    </>
  );
}
