import { describe, it, expect } from "vitest";
import {
  conceitoValidoParaQuiz,
  ehUuid,
  noExisteEmAlgumRoadmap,
  noExisteNoRoadmap,
  statusProgressoValido,
} from "@/server/gamificacao/validacao";

describe("validacao gamificação", () => {
  it("ehUuid aceita UUID v4 e rejeita lixo", () => {
    expect(ehUuid("550e8400-e29b-41d4-a716-446655440000")).toBe(true);
    expect(ehUuid("nao-uuid")).toBe(false);
    expect(ehUuid("")).toBe(false);
  });

  it("conceitoValidoParaQuiz exige verbete real", () => {
    expect(conceitoValidoParaQuiz("strategy")).toBe(true);
    expect(conceitoValidoParaQuiz("checkpoint:backend:be-git")).toBe(false);
    expect(conceitoValidoParaQuiz("revisao:pontos-fracos")).toBe(false);
    expect(conceitoValidoParaQuiz("__inventado__")).toBe(false);
  });

  it("noExisteNoRoadmap bloqueia id inventado", () => {
    expect(noExisteNoRoadmap("backend", "be-http")).toBe(true);
    expect(noExisteNoRoadmap("backend", "no-inventado-xyz")).toBe(false);
    expect(noExisteNoRoadmap("nao-existe", "be-http")).toBe(false);
  });

  it("noExisteEmAlgumRoadmap e status", () => {
    expect(noExisteEmAlgumRoadmap("be-http")).toBe(true);
    expect(noExisteEmAlgumRoadmap("zzz-fake")).toBe(false);
    expect(statusProgressoValido("done")).toBe(true);
    expect(statusProgressoValido("explode")).toBe(false);
  });
});
