"use client";

import { useCallback } from "react";
import { toast } from "sonner";
import {
  resolveContentError,
  type ContentErrorCategory,
} from "@/shared/lib/errors/resolve-content-error";

/**
 * Hook client para tratamento de erros de conteúdo.
 * Espelha `use-user-error` do PaaS: resolve, showToast, log.
 */
export function useContentError() {
  const resolve = useCallback(
    (error: unknown, hint?: ContentErrorCategory) =>
      resolveContentError(error, hint),
    []
  );

  const log = useCallback((error: unknown, context?: string) => {
    // Detalhe técnico só em log, nunca na UI.
    if (process.env.NODE_ENV !== "production") {
      console.error(`[content-error${context ? `:${context}` : ""}]`, error);
    }
  }, []);

  const showToast = useCallback(
    (error: unknown, context?: string, hint?: ContentErrorCategory) => {
      const { title, description } = resolveContentError(error, hint);
      toast.error(title, { description });
      log(error, context);
    },
    [log]
  );

  return { resolve, showToast, log };
}
