import { describe, it, expect } from "vitest";
import { listRoadmaps } from "@/shared/lib/content";
import {
  CHECKPOINT_OVERRIDES,
  chaveCheckpoint,
} from "@/content/jornada/checkpoints";
import { gerarDesafiosCheckpoint } from "@/shared/lib/jornada/desafios";
import type { Desafio } from "@/shared/types/desafio";

function qualidade(d: Desafio, onde: string) {
  expect(d.id.trim().length, onde).toBeGreaterThan(4);
  expect(d.explicacao.trim().length, onde).toBeGreaterThan(20);
  switch (d.tipo) {
    case "vf":
      expect(d.afirmacao.trim().length, onde).toBeGreaterThan(40);
      expect(d.afirmacao.toLowerCase(), onde).not.toMatch(
        /neste passo da trilha, o foco é/
      );
      break;
    case "lacuna":
      expect(d.opcoes.length, onde).toBeGreaterThanOrEqual(3);
      expect(d.opcoes).toContain(d.correta);
      break;
    case "mcq":
      expect(d.alternativas.length, onde).toBeGreaterThanOrEqual(2);
      expect(d.alternativas).toContain(d.correta);
      expect(d.enunciado.trim().length, onde).toBeGreaterThan(20);
      expect(d.enunciado.toLowerCase(), onde).not.toMatch(
        /qual afirmação resume o foco/
      );
      break;
    case "ordenar":
      expect(d.itens.length, onde).toBeGreaterThanOrEqual(2);
      break;
    case "parear":
      expect(d.pares.length, onde).toBeGreaterThanOrEqual(2);
      break;
    case "dois-codigos":
      expect(d.a.trim().length, onde).toBeGreaterThan(5);
      expect(d.b.trim().length, onde).toBeGreaterThan(5);
      break;
  }
}

describe("registro de checkpoints da jornada", () => {
  it("overrides cobrem exatamente os nós sem conceito", () => {
    const esperadas = new Set<string>();
    for (const r of listRoadmaps()) {
      for (const s of r.sections) {
        for (const item of s.items) {
          if (!item.conceito) esperadas.add(chaveCheckpoint(r.slug, item.id));
        }
      }
    }
    const presentes = new Set(Object.keys(CHECKPOINT_OVERRIDES));
    const faltando = [...esperadas].filter((k) => !presentes.has(k));
    const sobrando = [...presentes].filter((k) => !esperadas.has(k));
    expect(faltando, `faltam: ${faltando.join(", ")}`).toEqual([]);
    expect(sobrando, `chaves órfãs: ${sobrando.join(", ")}`).toEqual([]);
  });

  it("cada override tem ≥3 desafios de qualidade", () => {
    for (const [chave, lista] of Object.entries(CHECKPOINT_OVERRIDES)) {
      expect(lista.length, chave).toBeGreaterThanOrEqual(3);
      const ids = new Set<string>();
      for (const d of lista) {
        expect(ids.has(d.id), `id duplicado ${d.id}`).toBe(false);
        ids.add(d.id);
        qualidade(d, `${chave}/${d.id}`);
      }
    }
  });

  it("gerarDesafiosCheckpoint só devolve curados", () => {
    for (const r of listRoadmaps()) {
      for (const s of r.sections) {
        for (const item of s.items) {
          if (item.conceito) continue;
          const desafios = gerarDesafiosCheckpoint({
            roadmapSlug: r.slug,
            item,
            semente: 17,
            quantas: 3,
          });
          expect(desafios.length).toBeGreaterThanOrEqual(3);
          for (const d of desafios) {
            expect(d.id.startsWith(`${r.slug}:${item.id}:`) || d.id.includes(item.id)).toBe(
              true
            );
          }
        }
      }
    }
  });
});
