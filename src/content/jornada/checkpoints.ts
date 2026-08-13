import type { Desafio } from "@/shared/types/desafio";
import { CHECKPOINT_OVERRIDES } from "@/content/jornada/checkpoints/index";

export { CHECKPOINT_OVERRIDES };

/** `roadmapSlug:itemId` */
export function chaveCheckpoint(roadmapSlug: string, itemId: string): string {
  return `${roadmapSlug}:${itemId}`;
}

/** Desafios curados do checkpoint — vazio se ainda não houver curadoria. */
export function desafiosCheckpointCurados(chave: string): Desafio[] {
  return CHECKPOINT_OVERRIDES[chave] ?? [];
}
