import { describe, it, expect } from "vitest";
import { DESAFIOS } from "@/content/construtor/desafios";
import { REGRAS } from "@/content/construtor/regras";
import {
  alertasDe,
  alternativasDoDesafio,
  corrigir,
} from "@/shared/lib/desafios";

const IDS_DE_REGRA = new Set(REGRAS.map((r) => r.id));

describe("desafios do modo quebre-isto", () => {
  it("ids únicos e não vazios", () => {
    const ids = DESAFIOS.map((d) => d.id);
    expect(ids.length).toBeGreaterThan(0);
    expect(new Set(ids).size).toBe(ids.length);
  });

  /**
   * O teste que faz este modo não apodrecer: o gabarito é **verificado contra o
   * motor**, não transcrito. Mexeu numa regra, o desafio que dependia dela
   * falha aqui — em vez de virar uma pergunta sem resposta em produção.
   */
  it.each(DESAFIOS.map((d) => [d.id, d] as const))(
    "%s: `esperadas` é exatamente o conjunto de alertas do motor",
    (_id, d) => {
      const doMotor = alertasDe(d).map((i) => i.id).sort();
      expect([...d.esperadas].sort()).toEqual(doMotor);
    }
  );

  it("todo id em `esperadas` é uma regra que existe", () => {
    const quebrados: string[] = [];
    for (const d of DESAFIOS) {
      for (const id of d.esperadas) {
        // ids gerados dinamicamente (`padrao-fora:x:y`) não estão em REGRAS;
        // o teste acima já garante que o motor os produz
        if (!id.includes(":") && !IDS_DE_REGRA.has(id)) quebrados.push(`${d.id} → ${id}`);
      }
    }
    expect(quebrados).toEqual([]);
  });

  it("todo desafio tem pelo menos um alerta — senão não há o que achar", () => {
    const vazios = DESAFIOS.filter((d) => d.esperadas.length === 0).map((d) => d.id);
    expect(vazios).toEqual([]);
  });

  it("contexto e veredito são substantivos", () => {
    for (const d of DESAFIOS) {
      expect(d.contexto.trim().length, d.id).toBeGreaterThan(120);
      expect(d.veredito.trim().length, d.id).toBeGreaterThan(120);
    }
  });

  it("o estado tem camadas — um desafio vazio não desafia nada", () => {
    for (const d of DESAFIOS) {
      expect(d.estado.camadas.length, d.id).toBeGreaterThan(1);
    }
  });
});

describe("alternativas", () => {
  it.each(DESAFIOS.map((d) => [d.id, d] as const))(
    "%s: inclui todas as corretas e nenhuma repetida",
    (_id, d) => {
      const alts = alternativasDoDesafio(d, 42);
      const ids = alts.map((a) => a.id);

      expect(new Set(ids).size, "alternativa repetida").toBe(ids.length);

      const corretas = alts.filter((a) => a.correta).map((a) => a.id).sort();
      expect(corretas).toEqual([...d.esperadas].sort());

      // sem distrator, a resposta seria "marque tudo"
      expect(alts.filter((a) => !a.correta).length).toBeGreaterThan(0);
    }
  );

  it("mesma semente produz a mesma ordem", () => {
    const a = alternativasDoDesafio(DESAFIOS[0], 7).map((x) => x.id);
    const b = alternativasDoDesafio(DESAFIOS[0], 7).map((x) => x.id);
    expect(a).toEqual(b);
  });

  it("sementes diferentes produzem ordens diferentes", () => {
    const a = alternativasDoDesafio(DESAFIOS[2], 1).map((x) => x.id);
    const b = alternativasDoDesafio(DESAFIOS[2], 999).map((x) => x.id);
    expect(a).not.toEqual(b);
  });
});

describe("correção", () => {
  const d = DESAFIOS[0];

  it("marcar exatamente as corretas dá nota cheia", () => {
    const r = corrigir(d, d.esperadas);
    expect(r.nota).toBe(1);
    expect(r.perdidos).toEqual([]);
    expect(r.falsosPositivos).toEqual([]);
  });

  it("não marcar nada dá zero, e lista tudo como perdido", () => {
    const r = corrigir(d, []);
    expect(r.nota).toBe(0);
    expect(r.perdidos.sort()).toEqual([...d.esperadas].sort());
  });

  it("falso positivo é penalizado, mas menos que deixar passar", () => {
    const comFalso = corrigir(d, [...d.esperadas, "regra-que-nao-dispara"]);
    const semNada = corrigir(d, []);
    expect(comFalso.falsosPositivos).toEqual(["regra-que-nao-dispara"]);
    expect(comFalso.nota).toBeLessThan(1);
    expect(comFalso.nota).toBeGreaterThan(semNada.nota);
  });

  it("a nota nunca sai de 0..1", () => {
    const muitosFalsos = corrigir(d, ["a", "b", "c", "d", "e", "f"]);
    expect(muitosFalsos.nota).toBeGreaterThanOrEqual(0);
    expect(muitosFalsos.nota).toBeLessThanOrEqual(1);
  });
});
