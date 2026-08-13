"use client";

import { Toaster } from "sonner";
import { SessionProvider } from "next-auth/react";
import { ThemeProvider } from "@/shared/context/theme-provider";
import { ModalProvider } from "@/shared/context/modal-context";
import { SearchProvider } from "@/shared/context/search-context";
import { MigrarProgresso } from "@/shared/components/global/migrar-progresso";

/**
 * Ordem canônica dos providers raiz. Nunca adicionar provider global
 * fora deste arquivo (convenção herdada do front-nextjs-paas).
 *
 * `SessionProvider` (Auth.js) por fora: expõe a sessão a qualquer componente
 * cliente (header, migração). `MigrarProgresso` vive aqui dentro para reagir ao
 * login em qualquer rota, sem renderizar UI.
 */
export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <ThemeProvider>
        <ModalProvider>
          <SearchProvider>{children}</SearchProvider>
          <MigrarProgresso />
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
    </SessionProvider>
  );
}
