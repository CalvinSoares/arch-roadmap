"use client";

import * as React from "react";
import {
  Dialog,
  DialogContent,
  type DialogSize,
} from "@/shared/components/global/ui/dialog";

/**
 * Sistema central de modais (pub/sub), espelhando o contrato do
 * front-nextjs-paas: `openModal(id, Component, props, options)`.
 * Importar SEMPRE deste arquivo, nunca de um barrel.
 */

export interface ModalOptions {
  size?: DialogSize;
  closeOnOverlayClick?: boolean;
  closeOnEscape?: boolean;
  showCloseButton?: boolean;
  onClose?: () => void;
}

/**
 * A pilha de modais é heterogênea: cada entrada tem um componente com props
 * próprias. Guardamos tudo com props abertas e cobramos a correspondência
 * componente ↔ props na assinatura genérica de `openModal`, que é onde o
 * autor da chamada pode ser ajudado pelo compilador.
 */
type PropsAbertas = Record<string, unknown>;

interface OpenModal {
  id: string;
  Component: React.ComponentType<PropsAbertas>;
  props: PropsAbertas;
  options: ModalOptions;
}

interface ModalContextValue {
  openModal: <P extends PropsAbertas>(
    id: string,
    Component: React.ComponentType<P>,
    props?: P,
    options?: ModalOptions
  ) => void;
  closeModal: (id: string) => void;
  closeAllModals: () => void;
}

const ModalContext = React.createContext<ModalContextValue | null>(null);

export function ModalProvider({ children }: { children: React.ReactNode }) {
  const [modals, setModals] = React.useState<OpenModal[]>([]);

  const closeModal = React.useCallback((id: string) => {
    setModals((prev) => {
      const target = prev.find((m) => m.id === id);
      target?.options.onClose?.();
      return prev.filter((m) => m.id !== id);
    });
  }, []);

  const openModal = React.useCallback<ModalContextValue["openModal"]>(
    (id, Component, props, options = {}) => {
      setModals((prev) => [
        ...prev.filter((m) => m.id !== id),
        {
          id,
          // único ponto de conversão: a genérica acima já validou o par
          Component: Component as React.ComponentType<PropsAbertas>,
          props: props ?? {},
          options: {
            size: "md",
            closeOnOverlayClick: true,
            closeOnEscape: true,
            showCloseButton: true,
            ...options,
          },
        },
      ]);
    },
    []
  );

  const closeAllModals = React.useCallback(() => {
    setModals((prev) => {
      prev.forEach((m) => m.options.onClose?.());
      return [];
    });
  }, []);

  const value = React.useMemo(
    () => ({ openModal, closeModal, closeAllModals }),
    [openModal, closeModal, closeAllModals]
  );

  return (
    <ModalContext.Provider value={value}>
      {children}
      {modals.map(({ id, Component, props, options }) => (
        <Dialog
          key={id}
          open
          onOpenChange={(open) => {
            if (!open && options.closeOnOverlayClick !== false) closeModal(id);
          }}
        >
          <DialogContent
            size={options.size}
            showClose={options.showCloseButton}
            onEscapeKeyDown={(e) => {
              if (options.closeOnEscape === false) e.preventDefault();
            }}
            onPointerDownOutside={(e) => {
              if (options.closeOnOverlayClick === false) e.preventDefault();
            }}
          >
            <Component {...props} closeModal={() => closeModal(id)} />
          </DialogContent>
        </Dialog>
      ))}
    </ModalContext.Provider>
  );
}

export function useModal() {
  const ctx = React.useContext(ModalContext);
  if (!ctx) throw new Error("useModal deve ser usado dentro de <ModalProvider>");
  return ctx;
}
