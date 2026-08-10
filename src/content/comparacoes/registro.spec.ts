import { describe, it, expect } from "vitest";
import { COMPARACOES } from "./registro";
import { slugComparacao } from "@/shared/types/comparacao";
import {
  listComparacoes,
  getComparacao,
  comparacoesDoConceito,
  listConceitos,
} from "@/shared/lib/content";

const SLUGS = new Set(listConceitos().map((c) => c.slug));

describe("registro de comparações", () => {
  it("os dois lados existem e são diferentes", () => {
    for (const c of COMPARACOES) {
      expect(SLUGS.has(c.a), `lado A: ${c.a}`).toBe(true);
      expect(SLUGS.has(c.b), `lado B: ${c.b}`).toBe(true);
      expect(c.a).not.toBe(c.b);
    }
  });

  /** Um par só pode ter uma URL — senão o mesmo conteúdo compete consigo. */
  it("o slug é determinístico e único", () => {
    const slugs = listComparacoes().map((c) => c.slug);
    expect(new Set(slugs).size).toBe(slugs.length);

    for (const c of COMPARACOES) {
      expect(slugComparacao(c.a, c.b)).toBe(slugComparacao(c.b, c.a));
      expect(slugComparacao(c.a, c.b)).toMatch(/^[a-z0-9-]+-vs-[a-z0-9-]+$/);
    }
  });

  it("nenhum par se repete, mesmo invertido", () => {
    const pares = COMPARACOES.map((c) => slugComparacao(c.a, c.b));
    expect(new Set(pares).size).toBe(pares.length);
  });

  it.each(COMPARACOES.map((c) => [slugComparacao(c.a, c.b), c] as const))(
    "%s tem conteúdo substantivo",
    (_slug, c) => {
      expect(c.criterios.length).toBeGreaterThanOrEqual(3);
      expect(c.vereditoRapido.length).toBeGreaterThan(80);
      expect(c.confusaoComum.length).toBeGreaterThan(80);
      expect(c.escolhaA.length).toBeGreaterThan(30);
      expect(c.escolhaB.length).toBeGreaterThan(30);

      const perguntas = c.criterios.map((cr) => cr.pergunta);
      expect(new Set(perguntas).size, "perguntas duplicadas").toBe(
        perguntas.length
      );
      for (const cr of c.criterios) {
        expect(cr.pergunta.endsWith("?"), cr.pergunta).toBe(true);
        expect(cr.ladoA.length, cr.pergunta).toBeGreaterThan(15);
        expect(cr.ladoB.length, cr.pergunta).toBeGreaterThan(15);
        // dois lados iguais não comparam nada
        expect(cr.ladoA).not.toBe(cr.ladoB);
      }
    }
  );

  it("getComparacao encontra pela URL derivada", () => {
    for (const c of listComparacoes()) {
      expect(getComparacao(c.slug)?.slug).toBe(c.slug);
    }
    expect(getComparacao("inexistente-vs-nada")).toBeUndefined();
  });

  /** A ida (registro) e a volta (bloco no conceito) precisam bater. */
  it("cada comparação é alcançável a partir dos dois conceitos", () => {
    for (const c of listComparacoes()) {
      for (const lado of [c.a, c.b]) {
        const duelos = comparacoesDoConceito(lado);
        expect(
          duelos.some((d) => d.slug === c.slug),
          `${lado} deveria apontar para ${c.slug}`
        ).toBe(true);
      }
    }
  });

  it("comparacoesDoConceito devolve sempre o outro lado, nunca o próprio", () => {
    for (const conceito of listConceitos()) {
      for (const d of comparacoesDoConceito(conceito.slug)) {
        expect(d.outro.slug).not.toBe(conceito.slug);
      }
    }
  });
});
