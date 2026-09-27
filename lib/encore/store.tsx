"use client";
import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { createPlannerStore } from "./demo-storage";
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
const STORAGE_FAILED_NOTICE =
  "Browser storage is full or unavailable. Changes are only kept until this page closes. Remove a photo or free some storage, then try again.";
const plannerStore = createPlannerStore(seed, () =>
  typeof window === "undefined" ? null : window.localStorage,
);
export function PlannerProvider({ children }: { children: ReactNode }) {
  const state = useSyncExternalStore(
    plannerStore.subscribe,
    plannerStore.getSnapshot,
    plannerStore.getServerSnapshot,
  );
  const [editor, setEditor] = useState<Editor>(null);
  const [notice, setNotice] = useState("");
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
  const update = useCallback((fn: (s: PlannerState) => PlannerState) => {
    if (!plannerStore.set(fn(plannerStore.getSnapshot())))
      setNotice(STORAGE_FAILED_NOTICE);
  }, []);
  const notify = useCallback((s: string) => setNotice(s), []);
  const setApplication = useCallback(
    (id: string, changes: Partial<Application>) => {
      update((s) => ({
        ...s,
        applications: s.applications.map((a) =>
          a.id === id ? { ...a, ...changes } : a,
        ),
      }));
    },
    [update],
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
          setNotice(
            plannerStore.set(structuredClone(seed))
              ? "Sample plans restored."
              : STORAGE_FAILED_NOTICE,
          );
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
