import { useState } from "react";
import { useStore } from "../../../app/store";
import layout from "../../../components/layout.module.css";
import ui from "../../../components/ui.module.css";

export function SettingsPage() {
  const { data, dispatch } = useStore();
  const [confirmingReset, setConfirmingReset] = useState(false);
  const localTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;

  const exportJson = () => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "encore-demo-export.json";
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <>
      <h1 className={layout.pageTitle}>Settings</h1>
      <div className={layout.stack}>
        <section className={ui.card}>
          <h2 className={ui.sectionTitle}>Time zone</h2>
          <p>
            Deadlines show the event's zone plus your device zone: <strong>{localTimeZone}</strong>.
          </p>
        </section>

        <section className={ui.card}>
          <h2 className={ui.sectionTitle}>Account &amp; Discord</h2>
          <p className={ui.muted}>
            Not available in this prototype. Discord sign-in, cloud sync and reminder delivery are planned (MVP-01,
            MVP-11) and nothing is sent anywhere.
          </p>
          <button type="button" className={ui.button} disabled>
            Sign in with Discord (not implemented)
          </button>
        </section>

        <section className={ui.card}>
          <h2 className={ui.sectionTitle}>Demo data</h2>
          <p className={ui.muted}>
            {data.concerts.length} concerts, {data.rounds.length} rounds, {data.trips.length} trips, {data.stays.length}{" "}
            stays in this browser.
          </p>
          <div className={layout.toolbar}>
            <button type="button" className={ui.button} onClick={exportJson}>
              Export JSON
            </button>
            {confirmingReset ? (
              <>
                <button
                  type="button"
                  className={ui.primary}
                  onClick={() => {
                    dispatch({ type: "reset" });
                    setConfirmingReset(false);
                  }}
                >
                  Replace my changes with fresh demo data
                </button>
                <button type="button" className={ui.button} onClick={() => setConfirmingReset(false)}>
                  Keep my changes
                </button>
              </>
            ) : (
              <button type="button" className={ui.button} onClick={() => setConfirmingReset(true)}>
                Reset demo data…
              </button>
            )}
          </div>
        </section>
      </div>
    </>
  );
}
