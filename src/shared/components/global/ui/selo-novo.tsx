import { cn } from "@/shared/utils/cn";

/**
 * Selo de conteúdo recém-publicado. A decisão de mostrar vem sempre de
 * `ehNovo`/`slugsNovos` (derivados do changelog); nunca marcado à mão.
 */
export function SeloNovo({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full bg-primary px-2 py-0.5",
        "text-[10px] font-bold uppercase tracking-[0.1em] text-primary-foreground",
        className
      )}
    >
      <span aria-hidden className="size-1 rounded-full bg-current pulso-anel" />
      Novo
    </span>
  );
}
