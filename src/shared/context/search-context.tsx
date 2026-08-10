"use client";

import * as React from "react";
import { CommandPalette } from "@/shared/components/global/command-palette";

interface SearchContextValue {
  open: boolean;
  setOpen: (open: boolean) => void;
  toggle: () => void;
}

const SearchContext = React.createContext<SearchContextValue | null>(null);

export function SearchProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = React.useState(false);

  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((v) => !v);
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  const value = React.useMemo(
    () => ({ open, setOpen, toggle: () => setOpen((v) => !v) }),
    [open]
  );

  return (
    <SearchContext.Provider value={value}>
      {children}
      <CommandPalette open={open} onOpenChange={setOpen} />
    </SearchContext.Provider>
  );
}

export function useSearchPalette() {
  const ctx = React.useContext(SearchContext);
  if (!ctx)
    throw new Error("useSearchPalette deve ser usado dentro de <SearchProvider>");
  return ctx;
}
