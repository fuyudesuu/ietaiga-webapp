import { useEffect, useState } from "react";

export type Route =
  | { name: "overview" }
  | { name: "wallet"; tab: "tickets" | "trips" }
  | { name: "concerts" }
  | { name: "concert"; id: string }
  | { name: "trip"; id: string }
  | { name: "settings" };

// Hash routing keeps deep links working on GitHub Pages without a 404 fallback.
export function parseRoute(hash: string): Route {
  const [section, id] = hash.replace(/^#\/?/, "").split("/");
  switch (section) {
    case "wallet":
      return { name: "wallet", tab: id === "trips" ? "trips" : "tickets" };
    case "concerts":
      return id ? { name: "concert", id } : { name: "concerts" };
    case "trips":
      return id ? { name: "trip", id } : { name: "wallet", tab: "trips" };
    case "settings":
      return { name: "settings" };
    default:
      return { name: "overview" };
  }
}

export function useRoute(): Route {
  const [route, setRoute] = useState(() => parseRoute(window.location.hash));
  useEffect(() => {
    const onChange = () => {
      setRoute(parseRoute(window.location.hash));
      window.scrollTo({ top: 0 });
    };
    window.addEventListener("hashchange", onChange);
    return () => window.removeEventListener("hashchange", onChange);
  }, []);
  return route;
}
