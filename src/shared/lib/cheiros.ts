import { listConceitos, getConceito } from "@/shared/lib/content";
import { POSTMORTEMS } from "@/content/postmortems/registro";

/** Distratores para o postmortem jogável: conceitos de outros incidentes. */
export function distratoresDePostmortem(
  slugAtual: string,
  corretos: readonly string[],
  quantos = 4
): string[] {
  const setCorretos = new Set(corretos);
  const candidatos: string[] = [];
  const visto = new Set<string>();

  const push = (slug: string) => {
    if (setCorretos.has(slug) || visto.has(slug) || !getConceito(slug)) return;
    visto.add(slug);
    candidatos.push(slug);
  };

  for (const pm of POSTMORTEMS) {
    if (pm.slug === slugAtual) continue;
    for (const c of pm.conceitos) push(c.slug);
  }

  if (candidatos.length < quantos) {
    for (const c of listConceitos()) {
      if (c.categoria === "resiliencia" || c.categoria === "arquitetura") {
        push(c.slug);
      }
      if (candidatos.length >= quantos) break;
    }
  }

  return candidatos.slice(0, quantos);
}
