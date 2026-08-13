import { cn } from "@/shared/utils/cn";

/**
 * Chrome compartilhado das opções de desafio — hover/focus bem legíveis
 * no tema escuro (o border-card-border sozinho some no canvas).
 */
export function classesOpcaoDesafio(o: {
  revelado: boolean;
  correta: boolean;
  escolhida: boolean;
  /** Selecionada antes do submit (ordenar/parear/rascunho). */
  ativa?: boolean;
  compacta?: boolean;
  className?: string;
}): string {
  const {
    revelado,
    correta,
    escolhida,
    ativa = false,
    compacta = false,
    className,
  } = o;
  return cn(
    "rounded-xl border-2 border-b-4 text-left font-medium transition-[colors,transform,box-shadow] outline-none",
    "focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background",
    compacta ? "px-3.5 py-2.5 text-sm" : "min-h-12 w-full px-3.5 py-3 text-sm",
    !revelado &&
      !ativa &&
      "border-card-border bg-card hover:border-primary hover:bg-primary/12 hover:shadow-[0_0_0_1px_color-mix(in_srgb,var(--primary)_35%,transparent)] active:translate-y-0.5 active:border-b-2",
    !revelado &&
      ativa &&
      "border-primary bg-primary/16 text-foreground shadow-[0_0_0_1px_color-mix(in_srgb,var(--primary)_45%,transparent)] ring-2 ring-primary/30",
    revelado &&
      correta &&
      "border-cat-criacional bg-cat-criacional/16 text-foreground",
    revelado &&
      escolhida &&
      !correta &&
      "border-cat-principio bg-cat-principio/14 text-foreground",
    revelado && !correta && !escolhida && "border-card-border opacity-45",
    className
  );
}
