import { describe, it, expect } from "vitest";
import { listConceitos } from "@/shared/lib/content";
import type { Bloco } from "@/shared/types/bloco";
import type { Conceito } from "@/shared/types/conceito";

const CONCEITOS = listConceitos();

const refatoracoes = (c: Conceito) =>
  (c.blocos ?? []).filter(
    (b): b is Extract<Bloco, { tipo: "refatoracao" }> => b.tipo === "refatoracao"
  );

const COM = CONCEITOS.filter((c) => refatoracoes(c).length > 0);

describe("refatoração passo a passo", () => {
  it("há conceitos com refatoração", () => {
    expect(COM.length).toBeGreaterThan(0);
  });

  it("no máximo uma por conceito", () => {
    // duas trilhas de passos na mesma página competem pela atenção
    const demais = COM.filter((c) => refatoracoes(c).length > 1).map((c) => c.slug);
    expect(demais).toEqual([]);
  });

  it.each(COM.map((c) => [c.slug, c] as const))(
    "%s: bem formada",
    (_slug, c) => {
      const r = refatoracoes(c)[0];

      expect(r.cheiro.trim().length).toBeGreaterThan(40);
      expect(r.veredito.trim().length).toBeGreaterThan(80);
      expect(r.inicio.code.trim().length).toBeGreaterThan(80);

      // menos de dois passos não é uma trilha, é um antes-e-depois
      expect(r.passos.length).toBeGreaterThanOrEqual(2);
      for (const p of r.passos) {
        expect(p.titulo.trim().length, `${c.slug}: título`).toBeGreaterThan(4);
        // o motivo é a razão de o bloco existir: sem ele é só um diff
        expect(
          p.motivo.trim().length,
          `${c.slug} / ${p.titulo}: motivo curto demais`
        ).toBeGreaterThan(60);
        expect(p.depois.code.trim().length).toBeGreaterThan(60);
      }
    }
  );

  it("cada passo muda o código do anterior", () => {
    // um passo que não muda nada é ruído na trilha
    const erros: string[] = [];
    for (const c of COM) {
      const r = refatoracoes(c)[0];
      const codigos = [r.inicio.code, ...r.passos.map((p) => p.depois.code)];
      for (let i = 1; i < codigos.length; i++) {
        if (codigos[i].trim() === codigos[i - 1].trim()) {
          erros.push(`${c.slug}: passo ${i} é idêntico ao anterior`);
        }
      }
    }
    expect(erros).toEqual([]);
  });

  it("o veredito nomeia o que se ganhou e o que se pagou", () => {
    // o bloco existe para ensinar a troca, não para vender o padrão
    const erros: string[] = [];
    for (const c of COM) {
      const v = refatoracoes(c)[0].veredito.toLowerCase();
      if (!/(pagou|custo|em troca|cobra)/.test(v)) {
        erros.push(`${c.slug}: veredito não menciona o custo`);
      }
    }
    expect(erros).toEqual([]);
  });

  it("todas as etapas usam a mesma linguagem", () => {
    // trocar de linguagem no meio da trilha quebra a leitura do diff
    const erros: string[] = [];
    for (const c of COM) {
      const r = refatoracoes(c)[0];
      const langs = new Set([r.inicio.lang, ...r.passos.map((p) => p.depois.lang)]);
      if (langs.size > 1) erros.push(`${c.slug}: ${[...langs].join(" + ")}`);
    }
    expect(erros).toEqual([]);
  });

  it("vem depois da primeira seção — o certo antes do exercício", () => {
    const erros: string[] = [];
    for (const c of COM) {
      const blocos = c.blocos ?? [];
      const iRef = blocos.findIndex((b) => b.tipo === "refatoracao");
      const iSecao = blocos.findIndex((b) => b.tipo === "secao");
      if (iSecao >= 0 && iRef < iSecao) erros.push(c.slug);
    }
    expect(erros).toEqual([]);
  });

  /** Escopo travado de propósito: cinco, não 42. Ver A3 no PLANEJAMENTO. */
  it("o escopo continua pequeno", () => {
    expect(COM.length).toBeLessThanOrEqual(8);
  });
});
