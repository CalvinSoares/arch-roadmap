import { describe, it, expect } from "vitest";
import { A_SEGUIR, NOVIDADES } from "./registro";
import { listNovidades } from "@/shared/lib/novidades";
import { listConceitos, listRoadmaps } from "@/shared/lib/content";

const CONCEITOS = new Set(listConceitos().map((c) => c.slug));
const ROADMAPS = new Set(listRoadmaps().map((r) => r.slug));

describe("registro de novidades", () => {
  it("versões são semânticas e únicas", () => {
    const versoes = NOVIDADES.map((n) => n.versao);
    for (const v of versoes) expect(v).toMatch(/^\d+\.\d+\.\d+$/);
    expect(new Set(versoes).size).toBe(versoes.length);
  });

  it("datas são ISO válidas", () => {
    for (const n of NOVIDADES) {
      expect(n.data, n.versao).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(Number.isNaN(Date.parse(`${n.data}T00:00:00Z`))).toBe(false);
    }
  });

  it("listNovidades ordena por data e desempata por versão", () => {
    const ordenadas = listNovidades();
    for (let i = 1; i < ordenadas.length; i++) {
      const antes = ordenadas[i - 1];
      const depois = ordenadas[i];
      const porData = antes.data.localeCompare(depois.data);
      expect(porData, `${antes.versao} → ${depois.versao}`).toBeGreaterThanOrEqual(0);
      if (porData === 0) {
        // mesma data: a versão maior vem primeiro
        expect(
          antes.versao.localeCompare(depois.versao, undefined, { numeric: true })
        ).toBeGreaterThan(0);
      }
    }
  });

  /**
   * Os slugs anunciados alimentam o badge "novo" do catálogo. Um typo aqui
   * não dá erro em lugar nenhum — o badge simplesmente nunca aparece.
   */
  it("todo slug anunciado numa entrega existe de verdade", () => {
    const quebrados: string[] = [];
    for (const n of NOVIDADES) {
      for (const s of n.conceitos ?? []) {
        if (!CONCEITOS.has(s)) quebrados.push(`${n.versao} → conceito ${s}`);
      }
      for (const s of n.roadmaps ?? []) {
        if (!ROADMAPS.has(s)) quebrados.push(`${n.versao} → roadmap ${s}`);
      }
    }
    expect(quebrados).toEqual([]);
  });

  it("toda entrega tem título, resumo e mudanças substantivas", () => {
    for (const n of NOVIDADES) {
      expect(n.titulo.trim().length, n.versao).toBeGreaterThan(8);
      expect(n.resumo.trim().length, n.versao).toBeGreaterThan(40);
      expect(n.mudancas.length, n.versao).toBeGreaterThan(0);
      for (const m of n.mudancas) {
        expect(["conteudo", "novo", "melhoria", "correcao"]).toContain(m.tipo);
        expect(m.texto.trim().length, n.versao).toBeGreaterThan(20);
      }
    }
  });
});

describe("a seguir", () => {
  it("ids são únicos e itens têm título e descrição substantivos", () => {
    const ids = A_SEGUIR.map((i) => i.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const item of A_SEGUIR) {
      expect(item.id).toMatch(/^[a-z0-9-]+$/);
      expect(item.titulo.trim().length, item.id).toBeGreaterThan(8);
      expect(item.descricao.trim().length, item.id).toBeGreaterThan(40);
    }
  });

  /** Entregue e planejado nunca coexistem: quando sai, sai daqui. */
  it("nenhum item planejado repete o título de uma mudança já entregue", () => {
    const entregues = NOVIDADES.flatMap((n) => n.mudancas.map((m) => m.texto));
    for (const item of A_SEGUIR) {
      expect(entregues).not.toContain(item.titulo);
    }
  });
});
