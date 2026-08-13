import type { Desafio } from "@/shared/types/desafio";
import { CHECKPOINTS_BACKEND } from "./backend";
import { CHECKPOINTS_FRONTEND } from "./frontend";
import { CHECKPOINTS_ARQUITETURA } from "./arquitetura";
import { CHECKPOINTS_RESILIENCIA } from "./resiliencia";
import { CHECKPOINT_TERCEIROS } from "./terceiros";

const BASE: Record<string, Desafio[]> = {
  ...CHECKPOINTS_BACKEND,
  ...CHECKPOINTS_FRONTEND,
  ...CHECKPOINTS_ARQUITETURA,
  ...CHECKPOINTS_RESILIENCIA,
};

/**
 * Todos os desafios de checkpoint da jornada — **só curadoria humana**.
 * Nada de ecoar `item.descricao` automaticamente.
 * Cada chave inclui o desafio extra de `CHECKPOINT_TERCEIROS` quando existir.
 */
export const CHECKPOINT_OVERRIDES: Record<string, Desafio[]> = Object.fromEntries(
  Object.entries(BASE).map(([chave, lista]) => {
    const extra = CHECKPOINT_TERCEIROS[chave];
    return [chave, extra ? [...lista, extra] : lista];
  })
);
