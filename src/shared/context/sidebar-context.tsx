"use client";

import * as React from "react";

interface SidebarContextValue {
  collapsed: boolean;
  toggleCollapsed: () => void;
  mobileOpen: boolean;
  setMobileOpen: (open: boolean) => void;
}

const SidebarContext = React.createContext<SidebarContextValue | null>(null);

const CHAVE = "devatlas:sidebar-collapsed";

export function SidebarProvider({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = React.useState(false);
  const [mobileOpen, setMobileOpen] = React.useState(false);

  React.useEffect(() => {
    setCollapsed(localStorage.getItem(CHAVE) === "1");
  }, []);

  const toggleCollapsed = React.useCallback(() => {
    setCollapsed((v) => {
      const next = !v;
      try {
        localStorage.setItem(CHAVE, next ? "1" : "0");
      } catch {
        /* ignora */
      }
      return next;
    });
  }, []);

  const value = React.useMemo(
    () => ({ collapsed, toggleCollapsed, mobileOpen, setMobileOpen }),
    [collapsed, toggleCollapsed, mobileOpen]
  );

  return (
    <SidebarContext.Provider value={value}>{children}</SidebarContext.Provider>
  );
}

export function useSidebar() {
  const ctx = React.useContext(SidebarContext);
  if (!ctx) throw new Error("useSidebar deve ser usado dentro de <SidebarProvider>");
  return ctx;
}
