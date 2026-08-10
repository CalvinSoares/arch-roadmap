"use client";

import * as React from "react";
import { useArmazenamentoLocal } from "@/shared/hook/use-armazenamento-local";

interface SidebarContextValue {
  collapsed: boolean;
  toggleCollapsed: () => void;
  mobileOpen: boolean;
  setMobileOpen: (open: boolean) => void;
}

const SidebarContext = React.createContext<SidebarContextValue | null>(null);

/**
 * `:v2` porque a versão anterior guardava as strings "1"/"0" e agora o valor
 * é JSON. Ler o formato antigo devolveria o número 1 num campo tipado como
 * boolean; trocar a chave descarta a preferência uma única vez, o que para um
 * menu recolhido é inofensivo.
 */
const CHAVE = "devatlas:sidebar-collapsed:v2";
const PADRAO = false;

export function SidebarProvider({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useArmazenamentoLocal(CHAVE, PADRAO);
  const [mobileOpen, setMobileOpen] = React.useState(false);

  const toggleCollapsed = React.useCallback(
    () => setCollapsed(!collapsed),
    [collapsed, setCollapsed]
  );

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
