import { ConcertDetailPage } from "../features/concerts/ui/ConcertDetailPage";
import { ConcertsPage } from "../features/concerts/ui/ConcertsPage";
import { SettingsPage } from "../features/settings/ui/SettingsPage";
import { TripDetailPage } from "../features/trips/ui/TripDetailPage";
import { WalletPage } from "../features/wallet/ui/WalletPage";
import { AppShell } from "./AppShell";
import { OverviewPage } from "./OverviewPage";
import { useRoute, type Route } from "./router";
import { StoreProvider } from "./store";

function Page({ route }: { route: Route }) {
  switch (route.name) {
    case "overview":
      return <OverviewPage />;
    case "wallet":
      return <WalletPage tab={route.tab} />;
    case "concerts":
      return <ConcertsPage />;
    case "concert":
      return <ConcertDetailPage id={route.id} />;
    case "trip":
      return <TripDetailPage id={route.id} />;
    case "settings":
      return <SettingsPage />;
  }
}

export function App() {
  const route = useRoute();
  return (
    <StoreProvider>
      <AppShell route={route}>
        <Page route={route} />
      </AppShell>
    </StoreProvider>
  );
}
