import { createContext, useContext, useEffect, useState, ReactNode } from "react";

interface SidebarCtx {
  collapsed: boolean;
  setCollapsed: (v: boolean) => void;
  toggle: () => void;
  width: number;
}

const Ctx = createContext<SidebarCtx | null>(null);
const KEY = "pulse.sidebar.collapsed";

export function SidebarProvider({ children }: { children: ReactNode }) {
  const [collapsed, setCollapsedState] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem(KEY) === "1";
  });

  useEffect(() => {
    try { localStorage.setItem(KEY, collapsed ? "1" : "0"); } catch {}
    document.documentElement.style.setProperty("--sidebar-w", collapsed ? "64px" : "220px");
  }, [collapsed]);

  const setCollapsed = (v: boolean) => setCollapsedState(v);
  const toggle = () => setCollapsedState((c) => !c);

  return (
    <Ctx.Provider value={{ collapsed, setCollapsed, toggle, width: collapsed ? 64 : 220 }}>
      {children}
    </Ctx.Provider>
  );
}

export function useSidebarState() {
  const ctx = useContext(Ctx);
  if (!ctx) return { collapsed: false, setCollapsed: () => {}, toggle: () => {}, width: 220 };
  return ctx;
}
