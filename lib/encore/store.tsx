"use client";
import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import { seed } from "./fixtures";
import { PlannerState, Editor, Application } from "./model";
type Store = {
  state: PlannerState;
  update: (fn: (s: PlannerState) => PlannerState) => void;
  editor: Editor;
  setEditor: (e: Editor) => void;
  notify: (s: string) => void;
  notice: string;
  reset: () => void;
  setApplication: (id: string, changes: Partial<Application>) => void;
};
const Context = createContext<Store | null>(null);
export function PlannerProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<PlannerState>(seed);
  const [editor, setEditor] = useState<Editor>(null);
  const [notice, setNotice] = useState("");
  const [ready, setReady] = useState(false);
  useEffect(() => {
    try {
      const value = localStorage.getItem("encore-mobile-demo-v1");
      if (value) {
        const saved = JSON.parse(value);
        if (
          saved.version === 1 &&
          ["concerts", "applications", "trips", "hotels", "deliveries"].every(
            (key) => Array.isArray(saved.data?.[key]),
          ) &&
          typeof saved.data?.preferences?.zone === "string"
        )
          setState(saved.data);
      }
    } catch {}
    setReady(true);
  }, []);
  useEffect(() => {
    if (ready)
      try {
        localStorage.setItem(
          "encore-mobile-demo-v1",
          JSON.stringify({ version: 1, data: state }),
        );
      } catch {
        setNotice(
          "Browser storage is full or unavailable. Changes are only kept until this page closes. Remove a photo or free some storage, then try again.",
        );
      }
  }, [state, ready]);
  useEffect(() => {
    const dark =
      state.preferences.theme === "dark" ||
      (state.preferences.theme === "system" &&
        window.matchMedia("(prefers-color-scheme: dark)").matches);
    document.documentElement.classList.toggle("dark", dark);
    document.documentElement.classList.toggle("solid", state.preferences.solid);
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const sync = () => {
      if (state.preferences.theme === "system")
        document.documentElement.classList.toggle("dark", media.matches);
    };
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, [state.preferences.theme, state.preferences.solid]);
  useEffect(() => {
    if (notice) {
      const timer = setTimeout(() => setNotice(""), 4500);
      return () => clearTimeout(timer);
    }
  }, [notice]);
  const update = useCallback(
    (fn: (s: PlannerState) => PlannerState) => setState(fn),
    [],
  );
  const notify = useCallback((s: string) => setNotice(s), []);
  const setApplication = useCallback(
    (id: string, changes: Partial<Application>) => {
      setState((s) => ({
        ...s,
        applications: s.applications.map((a) =>
          a.id === id ? { ...a, ...changes } : a,
        ),
      }));
    },
    [],
  );
  return (
    <Context.Provider
      value={{
        state,
        update,
        editor,
        setEditor,
        notify,
        notice,
        reset: () => {
          setState(structuredClone(seed));
          setNotice("Sample plans restored.");
        },
        setApplication,
      }}
    >
      {children}
    </Context.Provider>
  );
}
export function usePlanner() {
  const c = useContext(Context);
  if (!c) throw new Error("PlannerProvider missing");
  return c;
}
