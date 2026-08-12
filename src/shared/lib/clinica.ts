import type { Bloco } from "@/shared/types/bloco";
import type { ExemploCodigo } from "@/shared/types/conceito";
import { listConceitos, getConceito } from "@/shared/lib/content";
import { distratoresDe } from "@/shared/lib/quiz";

/** Um caso jogável: anti-exemplo com código para diagnosticar. */
export interface CasoClinica {
  id: string;
  slug: string;
  titulo: string;
  /** O problema em uma linha (comoSeParece do anti-exemplo). */
  problema: string;
  codigo: ExemploCodigo;
  sintomas: { quando: string; efeito: string }[];
  correcao: string;
}

/**
 * Casos jogáveis — derivados dos blocos `anti-exemplo`.
 * Só entram os que têm código (sem código não há o que julgar).
 */
export function listCasosClinica(): CasoClinica[] {
  const out: CasoClinica[] = [];
  for (const c of listConceitos()) {
    const blocos = (c.blocos ?? []).filter(
      (b): b is Extract<Bloco, { tipo: "anti-exemplo" }> =>
        b.tipo === "anti-exemplo"
    );
    blocos.forEach((b, i) => {
      if (!b.codigo?.code?.trim()) return;
      out.push({
        id: `${c.slug}:${i}`,
        slug: c.slug,
        titulo: c.titulo,
        problema: b.comoSeParece.trim(),
        codigo: b.codigo,
        sintomas: b.sintomas,
        correcao: b.correcao,
      });
    });
  }
  return out;
}

function prng(semente: number): () => number {
  let a = semente >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function embaralhar<T>(itens: T[], rnd: () => number): T[] {
  const out = [...itens];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/** Ordem dos casos no dia — estável na mesma semente. */
export function casosDoDia(semente: number): CasoClinica[] {
  return embaralhar(listCasosClinica(), prng(semente));
}

/**
 * Quatro alternativas: a correta + distratores (relacionados / categoria).
 */
export function alternativasDoCaso(
  caso: CasoClinica,
  semente: number
): string[] {
  const rnd = prng(semente);
  const candidatos = new Set<string>(distratoresDe(caso.slug));
  const conceito = getConceito(caso.slug);
  if (conceito) {
    for (const c of listConceitos()) {
      if (c.categoria === conceito.categoria && c.slug !== caso.slug) {
        candidatos.add(c.slug);
      }
    }
  }
  for (const c of listConceitos()) {
    if (candidatos.size >= 12) break;
    if (c.slug !== caso.slug) candidatos.add(c.slug);
  }
  const outros = embaralhar([...candidatos], rnd)
    .filter((s) => s !== caso.slug && getConceito(s))
    .slice(0, 3);
  return embaralhar([caso.slug, ...outros], rnd);
}
