import { describe, it, expect } from "vitest";
import { listRoadmaps } from "@/shared/lib/content";
import type { RoadmapItem, TipoRecurso } from "@/shared/types/roadmap";

const TIPOS: TipoRecurso[] = [
  "doc",
  "artigo",
  "spec",
  "video",
  "curso",
  "ferramenta",
];

const ITENS: { roadmap: string; item: RoadmapItem }[] = listRoadmaps().flatMap(
  (r) => r.sections.flatMap((s) => s.items.map((item) => ({ roadmap: r.slug, item })))
);

const COM_RECURSOS = ITENS.filter(({ item }) => item.recursos?.length);

describe("recursos externos dos roadmaps", () => {
  it("há itens com recursos", () => {
    expect(COM_RECURSOS.length).toBeGreaterThan(0);
  });

  it.each(COM_RECURSOS.map(({ roadmap, item }) => [`${roadmap}/${item.id}`, item] as const))(
    "%s tem recursos bem formados",
    (_id, item) => {
      for (const r of item.recursos!) {
        expect(r.titulo.trim().length, r.href).toBeGreaterThan(2);
        // absoluto e https: link externo não pode ser relativo nem http
        expect(r.href, `${item.id}: "${r.titulo}"`).toMatch(/^https:\/\/[^\s]+$/);
        expect(TIPOS, `${item.id}: "${r.titulo}"`).toContain(r.tipo);
        if (r.fonte !== undefined) expect(r.fonte.trim().length).toBeGreaterThan(0);
      }
    }
  );

  it("não repete a mesma URL dentro de um item", () => {
    const erros: string[] = [];
    for (const { roadmap, item } of COM_RECURSOS) {
      const hrefs = item.recursos!.map((r) => r.href);
      if (new Set(hrefs).size !== hrefs.length) erros.push(`${roadmap}/${item.id}`);
    }
    expect(erros).toEqual([]);
  });

  /**
   * Fila de trabalho, sem falhar — mesmo espírito das filas de conteúdo.
   * Relata os nós que ainda caem no "conteúdo chega em breve": sem conceito,
   * sem descrição e sem recursos. O alvo é zerar isto trilha a trilha.
   */
  it("relata os nós que ainda não oferecem nada ao abrir", () => {
    const vazios = ITENS.filter(
      ({ item }) => !item.conceito && !item.descricao && !item.recursos?.length
    ).map(({ roadmap, item }) => `${roadmap}/${item.id}`);
    if (vazios.length > 0) {
      console.info(`\n  ${vazios.length} nó(s) ainda sem conteúdo:\n  ${vazios.join(", ")}\n`);
    }
    expect(Array.isArray(vazios)).toBe(true);
  });
});
