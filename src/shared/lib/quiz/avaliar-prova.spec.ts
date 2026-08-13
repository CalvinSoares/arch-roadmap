import { describe, it, expect } from "vitest";
import { sementeDoDia } from "@/shared/lib/quiz";
import { gerarRodada } from "@/shared/lib/quiz-formatos";
import {
  gerarDesafiosLicao,
  avaliarDesafio,
} from "@/shared/lib/jornada/desafios";
import { avaliarProvaRespostaQuiz } from "@/shared/lib/quiz/avaliar-prova";
import type { RespostaDesafio } from "@/shared/types/desafio";

function respostaCorretaMcq(
  correta: string
): Extract<RespostaDesafio, { tipo: "mcq" }> {
  return { tipo: "mcq", escolha: correta };
}

describe("avaliarProvaRespostaQuiz", () => {
  it("mcq-rodada: acerta só com a escolha certa regenerada", () => {
    const hoje = "2026-08-13";
    const rodada = 0;
    const quantidade = 5;
    const perguntas = gerarRodada({
      semente: sementeDoDia(hoje) + rodada,
      quantas: quantidade,
      formatos: ["explique-erro"],
    });
    expect(perguntas.length).toBeGreaterThan(0);
    const p = perguntas[0]!;
    const distrator = p.alternativas.find((a) => a !== p.correta)!;

    const ok = avaliarProvaRespostaQuiz({
      kind: "mcq-rodada",
      hoje,
      rodada,
      indice: 0,
      quantidade,
      formatos: ["explique-erro"],
      escolha: p.correta,
    });
    expect(ok.valido).toBe(true);
    expect(ok.acertou).toBe(true);
    expect(ok.conceitoSlug).toBe(p.correta);

    const fail = avaliarProvaRespostaQuiz({
      kind: "mcq-rodada",
      hoje,
      rodada,
      indice: 0,
      quantidade,
      formatos: ["explique-erro"],
      escolha: distrator,
    });
    expect(fail.valido).toBe(true);
    expect(fail.acertou).toBe(false);
  });

  it("mcq-rodada: rejeita índice fora da rodada e data inválida", () => {
    expect(
      avaliarProvaRespostaQuiz({
        kind: "mcq-rodada",
        hoje: "ontem",
        rodada: 0,
        indice: 0,
        quantidade: 5,
        escolha: "strategy",
      }).valido
    ).toBe(false);

    expect(
      avaliarProvaRespostaQuiz({
        kind: "mcq-rodada",
        hoje: "2026-08-13",
        rodada: 0,
        indice: 99,
        quantidade: 5,
        escolha: "strategy",
      }).valido
    ).toBe(false);
  });

  it("desafio-jornada: regenera e avalia sem confiar no cliente", () => {
    const slug = "strategy";
    const semente = 42;
    const desafios = gerarDesafiosLicao({ slug, semente, quantas: 5 });
    expect(desafios.length).toBeGreaterThan(0);
    const d = desafios.find((x) => x.tipo === "mcq") ?? desafios[0]!;

    let resposta: RespostaDesafio;
    if (d.tipo === "mcq") resposta = respostaCorretaMcq(d.correta);
    else if (d.tipo === "vf") resposta = { tipo: "vf", escolha: d.correta };
    else if (d.tipo === "lacuna")
      resposta = { tipo: "lacuna", escolha: d.correta };
    else if (d.tipo === "dois-codigos")
      resposta = { tipo: "dois-codigos", escolha: d.correta };
    else if (d.tipo === "ordenar")
      resposta = { tipo: "ordenar", ordem: [...d.ordemCorreta] };
    else {
      const ligacoes: Record<string, string> = {};
      for (const p of d.pares) ligacoes[p.esquerda] = p.direita;
      resposta = { tipo: "parear", ligacoes };
    }

    expect(avaliarDesafio(d, resposta).ok).toBe(true);

    const ok = avaliarProvaRespostaQuiz({
      kind: "desafio-jornada",
      modo: "conceito",
      semente,
      desafioId: d.id,
      quantas: 5,
      slug,
      resposta,
    });
    expect(ok.valido).toBe(true);
    expect(ok.acertou).toBe(true);
    expect(ok.conceitoSlug).toBe(slug);

    const errada: RespostaDesafio =
      d.tipo === "mcq"
        ? {
            tipo: "mcq",
            escolha: d.alternativas.find((a) => a !== d.correta) ?? "__x__",
          }
        : d.tipo === "vf"
          ? { tipo: "vf", escolha: !d.correta }
          : { tipo: "mcq", escolha: "__x__" };

    if (errada.tipo === d.tipo) {
      const fail = avaliarProvaRespostaQuiz({
        kind: "desafio-jornada",
        modo: "conceito",
        semente,
        desafioId: d.id,
        quantas: 5,
        slug,
        resposta: errada,
      });
      expect(fail.valido).toBe(true);
      expect(fail.acertou).toBe(false);
    }
  });

  it("desafio-jornada: id inventado não valida", () => {
    const r = avaliarProvaRespostaQuiz({
      kind: "desafio-jornada",
      modo: "conceito",
      semente: 1,
      desafioId: "nao-existe",
      slug: "strategy",
      resposta: { tipo: "mcq", escolha: "x" },
    });
    expect(r.valido).toBe(false);
  });
});
