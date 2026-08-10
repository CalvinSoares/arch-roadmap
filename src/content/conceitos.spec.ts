import { describe, it, expect } from "vitest";
import {
  listConceitos,
  listRoadmaps,
  getConceito,
  roadmapsDoConceito,
} from "@/shared/lib/content";
import type { Bloco } from "@/shared/types/bloco";
import type { Conceito } from "@/shared/types/conceito";

const CONCEITOS = listConceitos();
const ROADMAPS = listRoadmaps();
const SLUGS = new Set(CONCEITOS.map((c) => c.slug));

const casos = (c: Conceito) => (c.blocos ?? []).filter((b) => b.tipo === "casos");
const bloco = <T extends Bloco["tipo"]>(c: Conceito, tipo: T) =>
  (c.blocos ?? []).filter((b): b is Extract<Bloco, { tipo: T }> => b.tipo === tipo);

describe("catálogo de conceitos", () => {
  it("tem conceitos e todos os slugs são únicos", () => {
    expect(CONCEITOS.length).toBeGreaterThan(0);
    const slugs = CONCEITOS.map((c) => c.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it("slug é kebab-case e casa com o arquivo de rota", () => {
    for (const c of CONCEITOS) {
      expect(c.slug, c.titulo).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
      expect(getConceito(c.slug)?.slug).toBe(c.slug);
    }
  });

  it.each(CONCEITOS.map((c) => [c.slug, c] as const))(
    "%s tem metadados completos",
    (_slug, c) => {
      expect(c.titulo.trim().length).toBeGreaterThan(2);
      expect(c.resumo.trim().length).toBeGreaterThan(30);
      expect(c.tags.length).toBeGreaterThan(0);
      expect(["iniciante", "intermediario", "avancado"]).toContain(c.dificuldade);
      expect(c.tempoLeitura).toBeGreaterThan(0);
      expect(["criacional", "estrutural", "comportamental", "principio", "arquitetura"]).toContain(
        c.categoria
      );
    }
  );

  it("todo `relacionados` aponta para um conceito existente e nunca para si mesmo", () => {
    const quebrados: string[] = [];
    for (const c of CONCEITOS) {
      for (const r of c.relacionados) {
        if (!SLUGS.has(r)) quebrados.push(`${c.slug} → ${r}`);
        if (r === c.slug) quebrados.push(`${c.slug} → si mesmo`);
      }
    }
    expect(quebrados).toEqual([]);
  });

  it("todo conceito tem ao menos um exemplo de código com conteúdo", () => {
    for (const c of CONCEITOS) {
      expect(c.exemplos.length, c.slug).toBeGreaterThan(0);
      for (const e of c.exemplos) {
        expect(["typescript", "python", "java"], c.slug).toContain(e.lang);
        expect(e.code.trim().length, `${c.slug}/${e.lang}`).toBeGreaterThan(50);
      }
    }
  });
});

/**
 * A "barra de qualidade v3" de PLANEJAMENTO-V3 §2.6, automatizada: TL;DR +
 * ≥2 casos de uso + ≥2 armadilhas + seções com resumo. Era uma promessa em
 * prosa; aqui vira condição de merge.
 */
describe("barra de qualidade v3", () => {
  const v3 = CONCEITOS.filter((c) => (c.blocos ?? []).some((b) => b.tipo === "tldr"));

  it("todo conceito do catálogo está no formato v3", () => {
    const fora = CONCEITOS.filter((c) => !v3.includes(c)).map((c) => c.slug);
    expect(fora).toEqual([]);
  });

  it.each(v3.map((c) => [c.slug, c] as const))("%s tem TL;DR único e substantivo", (_s, c) => {
    const tldr = bloco(c, "tldr");
    expect(tldr).toHaveLength(1);
    expect(tldr[0].texto.trim().length).toBeGreaterThan(40);
  });

  it.each(v3.map((c) => [c.slug, c] as const))("%s tem ≥2 casos de uso reais", (_s, c) => {
    const total = casos(c).reduce((a, b) => a + b.casos.length, 0);
    expect(total).toBeGreaterThanOrEqual(2);
    for (const b of casos(c)) {
      for (const caso of b.casos) {
        expect(caso.cenario.length, `${c.slug}/${caso.titulo}`).toBeGreaterThan(30);
        expect(caso.tradeoff.length, `${c.slug}/${caso.titulo}`).toBeGreaterThan(20);
      }
    }
  });

  it.each(v3.map((c) => [c.slug, c] as const))("%s tem ≥2 armadilhas", (_s, c) => {
    const total = bloco(c, "armadilhas").reduce((a, b) => a + b.itens.length, 0);
    expect(total).toBeGreaterThanOrEqual(2);
  });

  it.each(v3.map((c) => [c.slug, c] as const))("%s tem seções com id único e resumo", (_s, c) => {
    const secoes = bloco(c, "secao");
    expect(secoes.length).toBeGreaterThan(0);
    const ids = secoes.map((s) => s.id);
    expect(new Set(ids).size, `ids duplicados em ${c.slug}`).toBe(ids.length);
    for (const s of secoes) {
      expect(s.resumo.length, `${c.slug}#${s.id}`).toBeGreaterThan(0);
      expect(s.titulo.trim().length).toBeGreaterThan(2);
    }
  });
});

/** Uma ilustração malformada quebra o layout em silêncio — não no build. */
describe("ilustrações", () => {
  const ilustracoes = CONCEITOS.flatMap((c) =>
    bloco(c, "ilustracao").map((b) => [c.slug, b] as const)
  );

  it("existe pelo menos uma ilustração de cada arquétipo no catálogo", () => {
    const usados = new Set(ilustracoes.map(([, b]) => b.arquetipo));
    expect(usados).toContain("fluxo");
    expect(usados).toContain("estrutura");
    expect(usados).toContain("antes-depois");
  });

  it.each(ilustracoes)("%s: ilustração %#  é estruturalmente válida", (slug, b) => {
    expect(b.legenda.trim().length, slug).toBeGreaterThan(30);

    if (b.arquetipo === "fluxo") {
      expect(b.atores.length, slug).toBeGreaterThanOrEqual(2);
      // setas[i] liga atores[i] → atores[i+1]
      expect(b.setas.length, `${slug}: setas x atores`).toBe(b.atores.length - 1);
      const ids = b.atores.map((a) => a.id);
      expect(new Set(ids).size, `${slug}: ids de ator duplicados`).toBe(ids.length);
    }

    if (b.arquetipo === "estrutura") {
      const ids: string[] = [];
      const anda = (bs: typeof b.blocos, nivel = 0) => {
        expect(nivel, `${slug}: aninhamento fundo demais`).toBeLessThanOrEqual(3);
        for (const x of bs) {
          ids.push(x.id);
          // 1 caractere é válido: operadores como "E" e "OU" são rótulos legítimos
          expect(x.label.trim().length, slug).toBeGreaterThan(0);
          if (x.filhos?.length) anda(x.filhos, nivel + 1);
        }
      };
      expect(b.blocos.length, slug).toBeGreaterThan(0);
      anda(b.blocos);
      expect(new Set(ids).size, `${slug}: ids duplicados na estrutura`).toBe(ids.length);
    }

    if (b.arquetipo === "antes-depois") {
      for (const [nome, lado] of [["antes", b.antes], ["depois", b.depois]] as const) {
        expect(lado.itens.length, `${slug}/${nome}`).toBeGreaterThanOrEqual(2);
        expect(lado.titulo.trim().length, `${slug}/${nome}`).toBeGreaterThan(3);
        expect(lado.nota.trim().length, `${slug}/${nome}`).toBeGreaterThan(30);
      }
    }
  });
});

describe("roadmaps", () => {
  it("tem roadmaps com slugs únicos", () => {
    expect(ROADMAPS.length).toBeGreaterThan(0);
    const slugs = ROADMAPS.map((r) => r.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it("ids de seção e item são únicos dentro de cada roadmap", () => {
    for (const r of ROADMAPS) {
      const ids = r.sections.flatMap((s) => [s.id, ...s.items.map((i) => i.id)]);
      const dup = ids.filter((id, i) => ids.indexOf(id) !== i);
      expect(dup, `${r.slug}: ids duplicados`).toEqual([]);
    }
  });

  it("todo `conceito` citado por um roadmap existe", () => {
    const quebrados: string[] = [];
    for (const r of ROADMAPS) {
      for (const s of r.sections) {
        if (s.conceito && !SLUGS.has(s.conceito)) quebrados.push(`${r.slug}/${s.id} → ${s.conceito}`);
        for (const i of s.items) {
          if (i.conceito && !SLUGS.has(i.conceito)) quebrados.push(`${r.slug}/${i.id} → ${i.conceito}`);
        }
      }
    }
    expect(quebrados).toEqual([]);
  });

  /**
   * A ligação bidirecional roadmap ↔ conceito. Já existiu um campo
   * `roadmapNodes` no conceito que apontava para nós inexistentes; agora a
   * volta é derivada, e estes testes garantem que ela case com a ida.
   */
  it("todo conceito é alcançável por pelo menos um roadmap", () => {
    const orfaos = CONCEITOS.filter(
      (c) => roadmapsDoConceito(c.slug).length === 0
    ).map((c) => c.slug);
    expect(orfaos).toEqual([]);
  });

  it("a volta bate com a ida: roadmapsDoConceito reflete os itens", () => {
    for (const r of ROADMAPS) {
      for (const s of r.sections) {
        for (const i of s.items) {
          if (!i.conceito) continue;
          const volta = roadmapsDoConceito(i.conceito);
          expect(
            volta.some(
              (o) => o.roadmapSlug === r.slug && o.secaoTitulo === s.titulo
            ),
            `${i.conceito} deveria apontar de volta para ${r.slug}/${s.id}`
          ).toBe(true);
        }
      }
    }
  });

  it("toda seção tem ao menos um item e título", () => {
    for (const r of ROADMAPS) {
      expect(r.sections.length, r.slug).toBeGreaterThan(0);
      for (const s of r.sections) {
        expect(s.titulo.trim().length, `${r.slug}/${s.id}`).toBeGreaterThan(2);
        expect(s.items.length, `${r.slug}/${s.id}`).toBeGreaterThan(0);
      }
    }
  });
});
