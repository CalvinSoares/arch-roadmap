import { describe, it, expect } from "vitest";
import { listConceitos } from "@/shared/lib/content";

const CONCEITOS = listConceitos();
const COM = CONCEITOS.filter((c) => c.ondeAparece?.length);

/**
 * `onde` é um **nome**, não uma frase: "addEventListener", "Middleware do
 * Express". O limite existe porque o campo é renderizado em `<code>` num
 * cartão estreito — passar disso quebra o layout e, mais importante, quer
 * dizer que se escreveu explicação no lugar errado.
 */
const MAX_ONDE = 40;
/** Abaixo disto não é explicação, é rótulo repetido. */
const MIN_EXPLICACAO = 40;

describe("onde isto aparece de verdade", () => {
  it("há conceitos com a seção preenchida", () => {
    expect(COM.length).toBeGreaterThan(0);
  });

  it.each(COM.map((c) => [c.slug, c] as const))(
    "%s tem itens bem formados",
    (_slug, c) => {
      for (const item of c.ondeAparece!) {
        expect(item.onde.trim().length, `"${item.onde}" vazio`).toBeGreaterThan(1);
        expect(
          item.onde.length,
          `"${item.onde}" tem ${item.onde.length} caracteres — é nome, não frase`
        ).toBeLessThanOrEqual(MAX_ONDE);
        expect(
          item.explicacao.trim().length,
          `${c.slug} / "${item.onde}": explicação curta demais`
        ).toBeGreaterThanOrEqual(MIN_EXPLICACAO);
        // a explicação tem que explicar, não repetir o rótulo
        expect(item.explicacao.trim()).not.toBe(item.onde.trim());
      }
    }
  );

  it("não repete o mesmo `onde` dentro de um conceito", () => {
    const erros: string[] = [];
    for (const c of COM) {
      const nomes = c.ondeAparece!.map((i) => i.onde.toLowerCase());
      if (new Set(nomes).size !== nomes.length) erros.push(c.slug);
    }
    expect(erros).toEqual([]);
  });

  it("`href`, quando existe, é absoluto e https", () => {
    const erros: string[] = [];
    for (const c of COM) {
      for (const i of c.ondeAparece!) {
        if (i.href !== undefined && !/^https:\/\//.test(i.href)) {
          erros.push(`${c.slug} / ${i.onde}: ${i.href}`);
        }
      }
    }
    expect(erros).toEqual([]);
  });

  it("todo padrão GoF tem pelo menos dois lugares onde aparece", () => {
    const gof = CONCEITOS.filter((c) => c.tags.includes("gof"));
    expect(gof.length).toBe(23);
    const fracos = gof
      .filter((c) => (c.ondeAparece?.length ?? 0) < 2)
      .map((c) => `${c.slug} (${c.ondeAparece?.length ?? 0})`);
    // dois é o mínimo para a seção valer: um exemplo sozinho parece coincidência
    expect(fracos).toEqual([]);
  });

  it("todo conceito tem a seção ondeAparece", () => {
    const sem = CONCEITOS.filter((c) => !c.ondeAparece?.length).map((c) => c.slug);
    expect(sem).toEqual([]);
  });
});
