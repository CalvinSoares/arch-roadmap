"use client";

import { Toaster } from "sonner";
import { ThemeProvider } from "@/shared/context/theme-provider";
import { ModalProvider } from "@/shared/context/modal-context";
import { SearchProvider } from "@/shared/context/search-context";

/**
 * Ordem canônica dos providers raiz. Nunca adicionar provider global
 * fora deste arquivo (convenção herdada do front-nextjs-paas).
 */
export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <ModalProvider>
        <SearchProvider>{children}</SearchProvider>
        <Toaster
          position="bottom-right"
          toastOptions={{
            classNames: {
              toast:
                "!bg-card !text-foreground !border !border-card-border",
            },
          }}
        />
      </ModalProvider>
    </ThemeProvider>
  );
}
