"use client";

import { useCallback, useState } from "react";

/** Copia texto para o clipboard com feedback temporário. */
export function useCopy(resetMs = 1800) {
  const [copied, setCopied] = useState(false);

  const copy = useCallback(
    async (text: string) => {
      try {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), resetMs);
      } catch {
        setCopied(false);
      }
    },
    [resetMs]
  );

  return { copied, copy };
}
