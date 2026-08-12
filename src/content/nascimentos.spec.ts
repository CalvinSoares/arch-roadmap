import { describe, it, expect } from "vitest";
import { listConceitos } from "@/shared/lib/content";
import { distanciaAnos } from "@/shared/types/quando";
import type { Precisao } from "@/shared/types/quando";

const CONCEITOS = listConceitos();
const DATADOS = CONCEITOS.filter((c) => c.nasceu);

/**
 * Ano de referência **injetado**, nunca `new Date()`: a suíte tem que dar o
 * mesmo resultado hoje e daqui a dez anos. Mesma regra do simulador e do ADR.
 */
const ANO_REFERENCIA = 2026;

/**
 * Piso deliberadamente baixo. O primeiro impulso é 1940 ("software não é mais
 * velho que isso"), e aí o Ledger — partida dobrada, 1494 — vira exceção
 * declarada. Uma lista de exceções envelhece pior que um piso frouxo, então o
 * piso é frouxo: o que se quer pegar é dígito trocado (`194` em vez de `1994`),
 * não anacronismo sutil.
 */
const ANO_MINIMO = 1400;

const PRECISOES: Precisao[] = [
  "exata",
  "aproximada",
  "seculo",
  "intervalo",
  "convencao",
  "disputada",
];

describe("nascimento dos conceitos", () => {
  it("há conceitos datados", () => {
    expect(DATADOS.length).toBeGreaterThan(0);
  });

  it.each(DATADOS.map((c) => [c.slug, c] as const))(
    "%s tem nascimento bem formado",
    (_slug, c) => {
      const n = c.nasceu!;

      // fonte obrigatória: data sem fonte é boato
      expect(n.fonte.trim().length).toBeGreaterThan(10);

      expect(n.quando.rotulo.trim().length).toBeGreaterThan(0);
      expect(PRECISOES).toContain(n.quando.precisao);

      // o ano 0 não existe
      expect(n.quando.ano).not.toBe(0);
      expect(n.quando.ano).toBeGreaterThanOrEqual(ANO_MINIMO);
      expect(n.quando.ano).toBeLessThanOrEqual(ANO_REFERENCIA);

      // `precursor`, quando existe, precisa ensinar algo — não repetir a data
      if (n.precursor !== undefined) {
        expect(n.precursor.trim().length).toBeGreaterThan(30);
      }
    }
  );

  it("`ate` existe se, e somente se, a precisão é intervalo", () => {
    const erros: string[] = [];
    for (const c of DATADOS) {
      const { ano, ate, precisao } = c.nasceu!.quando;
      if (precisao === "intervalo") {
        if (ate === undefined) erros.push(`${c.slug}: intervalo sem \`ate\``);
        else if (ate <= ano) erros.push(`${c.slug}: \`ate\` (${ate}) <= ano (${ano})`);
      } else if (ate !== undefined) {
        erros.push(`${c.slug}: \`ate\` em precisão "${precisao}"`);
      }
    }
    expect(erros).toEqual([]);
  });

  it("`disputa` existe se, e somente se, a precisão é disputada", () => {
    const erros: string[] = [];
    for (const c of DATADOS) {
      const { disputa, precisao } = c.nasceu!.quando;
      if (precisao === "disputada") {
        if (!disputa?.trim()) erros.push(`${c.slug}: disputada sem \`disputa\``);
      } else if (disputa !== undefined) {
        erros.push(`${c.slug}: \`disputa\` em precisão "${precisao}"`);
      }
    }
    expect(erros).toEqual([]);
  });

  it("o rótulo casa com o ano quando ele é um número literal", () => {
    // pega o erro mais provável: mexer no rótulo e esquecer o `ano` (ou vice-versa)
    const erros: string[] = [];
    for (const c of DATADOS) {
      const { rotulo, ano } = c.nasceu!.quando;
      if (/^\d{3,4}$/.test(rotulo.trim()) && Number(rotulo.trim()) !== ano) {
        erros.push(`${c.slug}: rótulo "${rotulo}" ≠ ano ${ano}`);
      }
    }
    expect(erros).toEqual([]);
  });

  it("todo padrão GoF está datado em 1994, por convenção", () => {
    const gof = CONCEITOS.filter((c) => c.tags.includes("gof"));
    expect(gof.length).toBe(23);
    for (const c of gof) {
      expect(c.nasceu?.quando.ano, c.slug).toBe(1994);
      // 1994 é quando foram catalogados, não inventados — a precisão diz isso
      expect(c.nasceu?.quando.precisao, c.slug).toBe("convencao");
    }
  });

  /**
   * Não falha de propósito: é a fila de trabalho, no mesmo espírito do teste
   * que lista as armadilhas que ainda vazam o nome do padrão no quiz.
   */
  it("relata quais conceitos ainda não têm data", () => {
    const semData = CONCEITOS.filter((c) => !c.nasceu).map((c) => c.slug);
    if (semData.length > 0) {
      console.info(
        `\n  ${semData.length} conceito(s) sem \`nasceu\`:\n  ${semData.join(", ")}\n`
      );
    }
    expect(Array.isArray(semData)).toBe(true);
  });
});

describe("distanciaAnos", () => {
  it("não existe ano 0: de 1 a.C. para 1 d.C. passa um ano", () => {
    expect(distanciaAnos(-1, 1)).toBe(1);
    expect(distanciaAnos(1, -1)).toBe(-1);
  });

  it("dentro da mesma era é subtração simples", () => {
    expect(distanciaAnos(1994, 2014)).toBe(20);
    expect(distanciaAnos(-500, -100)).toBe(400);
  });

  it("atravessando a era, desconta o zero que ninguém viveu", () => {
    expect(distanciaAnos(-500, 500)).toBe(999);
  });

  it("recusa o ano 0 em vez de fingir que ele existe", () => {
    expect(() => distanciaAnos(0, 100)).toThrow(RangeError);
    expect(() => distanciaAnos(-100, 0)).toThrow(RangeError);
  });

  it("é antissimétrica", () => {
    expect(distanciaAnos(1994, 2013)).toBe(-distanciaAnos(2013, 1994));
    expect(distanciaAnos(-50, 50)).toBe(-distanciaAnos(50, -50));
  });
});
