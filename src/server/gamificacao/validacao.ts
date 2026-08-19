import { getConceito, getRoadmap, listRoadmaps } from "@/shared/lib/content";
import type { ProgressoNo } from "@/shared/types/roadmap";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const STATUS_VALIDOS: readonly ProgressoNo[] = [
  "pending",
  "done",
  "in-progress",
  "skipped",
];

/** Teto diário de XP de quiz por usuário (anti-farm com UUID novo). */
export const TETO_QUIZ_ACERTO_DIA = 50;

export function ehUuid(id: string): boolean {
  return UUID_RE.test(id);
}

/** Slug de verbete real: rejeita `checkpoint:` / `revisao:` / invenções. */
export function conceitoValidoParaQuiz(slug: string): boolean {
  if (!slug || slug.includes(":")) return false;
  return !!getConceito(slug);
}

export function statusProgressoValido(s: unknown): s is ProgressoNo {
  return (
    typeof s === "string" &&
    (STATUS_VALIDOS as readonly string[]).includes(s)
  );
}

/** Nó existe neste roadmap (bloqueia farm com `noId` inventado). */
export function noExisteNoRoadmap(
  roadmapSlug: string,
  noId: string
): boolean {
  const r = getRoadmap(roadmapSlug);
  if (!r) return false;
  return r.sections.some((s) => s.items.some((i) => i.id === noId));
}

/** Nó existe em qualquer trilha (estrelas da jornada). */
export function noExisteEmAlgumRoadmap(noId: string): boolean {
  return listRoadmaps().some((r) =>
    r.sections.some((s) => s.items.some((i) => i.id === noId))
  );
}
