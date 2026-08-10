"use client";

import { AlertTriangle } from "lucide-react";
import { Button } from "@/shared/components/global/ui/button";
import {
  resolveContentError,
  type ContentErrorCategory,
} from "@/shared/lib/errors/resolve-content-error";

interface Props {
  error?: unknown;
  hint?: ContentErrorCategory;
  onRetry?: () => void;
}

/** UI inline para falha de carregamento de uma seção/tela. */
export function ContentErrorState({ error, hint, onRetry }: Props) {
  const { title, description } = resolveContentError(error, hint);
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-card-border bg-card px-6 py-12 text-center">
      <AlertTriangle className="size-8 text-cat-principio" />
      <div>
        <p className="font-medium text-foreground">{title}</p>
        <p className="mt-1 text-sm text-muted">{description}</p>
      </div>
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry}>
          Tentar novamente
        </Button>
      )}
    </div>
  );
}
