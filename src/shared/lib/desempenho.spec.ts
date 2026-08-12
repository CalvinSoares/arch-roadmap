import { describe, it, expect } from "vitest";
import {
  registrar,
  totais,
  pontosFracos,
  slugsFracos,
} from "@/shared/lib/desempenho";
import type { DesempenhoQuiz } from "@/shared/types/desempenho";

const HOJE = "2026-08-11";

describe("desempenho do quiz", () => {
  it("está vazio na chegada, sem quebrar nada", () => {
    const vazio: DesempenhoQuiz = {};
    expect(totais(vazio)).toEqual({
      respostas: 0,
      acertos: 0,
      erros: 0,
      conceitos: 0,
      taxaAcerto: 0,
    });
    expect(pontosFracos(vazio)).toEqual([]);
    expect(slugsFracos(vazio)).toEqual([]);
  });

  it("registrar acumula acertos e erros por conceito, sem mutar a entrada", () => {
    const d0: DesempenhoQuiz = {};
    const d1 = registrar(d0, "saga", true, HOJE);
    const d2 = registrar(d1, "saga", false, HOJE);
    const d3 = registrar(d2, "cqrs", false, HOJE);

    expect(d0).toEqual({}); // imutável
    expect(d2.saga).toEqual({ acertos: 1, erros: 1, ultimoEm: HOJE });
    expect(d3.cqrs).toEqual({ acertos: 0, erros: 1, ultimoEm: HOJE });
  });

  it("registrar atualiza a data da última resposta", () => {
    const d1 = registrar({}, "saga", true, "2026-01-01");
    const d2 = registrar(d1, "saga", true, "2026-02-02");
    expect(d2.saga.ultimoEm).toBe("2026-02-02");
    expect(d2.saga.acertos).toBe(2);
  });

  it("totais soma tudo e calcula a taxa de acerto", () => {
    let d: DesempenhoQuiz = {};
    d = registrar(d, "saga", true, HOJE);
    d = registrar(d, "saga", false, HOJE);
    d = registrar(d, "cqrs", true, HOJE);
    const t = totais(d);
    expect(t.respostas).toBe(3);
    expect(t.acertos).toBe(2);
    expect(t.erros).toBe(1);
    expect(t.conceitos).toBe(2);
    expect(t.taxaAcerto).toBeCloseTo(2 / 3);
  });

  it("pontosFracos traz só quem errou, do que mais erra ao que menos erra", () => {
    let d: DesempenhoQuiz = {};
    // saga: 3 erros; cqrs: 1 erro; adapter: 0 erro (não deve aparecer)
    for (let i = 0; i < 3; i++) d = registrar(d, "saga", false, HOJE);
    d = registrar(d, "cqrs", false, HOJE);
    d = registrar(d, "adapter", true, HOJE);

    const fracos = pontosFracos(d);
    expect(fracos.map((p) => p.slug)).toEqual(["saga", "cqrs"]);
    expect(fracos.map((p) => p.slug)).not.toContain("adapter");
    expect(fracos[0]).toMatchObject({ slug: "saga", erros: 3, total: 3, taxaErro: 1 });
  });

  it("no empate de erros, a maior taxa de erro vem primeiro", () => {
    let d: DesempenhoQuiz = {};
    // ambos com 3 erros, mas "raso" acertou menos -> taxa maior
    for (let i = 0; i < 3; i++) d = registrar(d, "raso", false, HOJE);
    for (let i = 0; i < 3; i++) d = registrar(d, "fundo", false, HOJE);
    for (let i = 0; i < 5; i++) d = registrar(d, "fundo", true, HOJE);

    const fracos = pontosFracos(d);
    expect(fracos.map((p) => p.slug)).toEqual(["raso", "fundo"]);
  });

  it("pontosFracos respeita o limite pedido", () => {
    let d: DesempenhoQuiz = {};
    for (let i = 0; i < 4; i++) d = registrar(d, "a", false, HOJE);
    for (let i = 0; i < 3; i++) d = registrar(d, "b", false, HOJE);
    for (let i = 0; i < 2; i++) d = registrar(d, "c", false, HOJE);
    expect(pontosFracos(d, 2).map((p) => p.slug)).toEqual(["a", "b"]);
  });

  it("slugsFracos é o escopo do modo praticar", () => {
    let d: DesempenhoQuiz = {};
    d = registrar(d, "saga", false, HOJE);
    d = registrar(d, "cqrs", true, HOJE); // só acerto -> fora
    expect(slugsFracos(d)).toEqual(["saga"]);
  });
});
