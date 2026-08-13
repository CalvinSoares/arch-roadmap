import { describe, it, expect } from "vitest";
import {
  MISSOES_DIARIAS,
  MISSOES_POR_DIA,
  missoesDoDia,
  acharMissao,
  avancarMissao,
  type Missao,
} from "@/shared/lib/gamificacao/missoes";

const inicial = { progresso: 0, concluida: false };

describe("missões diárias", () => {
  it("as chaves de missão são únicas e estáveis", () => {
    const ids = MISSOES_DIARIAS.map((m) => m.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(acharMissao("acerte-5")?.meta).toBe(5);
    expect(acharMissao("inexistente")).toBeUndefined();
  });

  it("rotação diária é determinística e do tamanho certo", () => {
    const a = missoesDoDia("2026-08-13");
    const b = missoesDoDia("2026-08-13");
    expect(a).toHaveLength(MISSOES_POR_DIA);
    expect(a.map((m) => m.id)).toEqual(b.map((m) => m.id)); // mesmo dia = mesmas missões
    for (const m of a) expect(MISSOES_DIARIAS).toContainEqual(m); // sempre do pool
  });

  it("ao longo de uma semana, as missões variam", () => {
    const semana = ["2026-08-10", "2026-08-11", "2026-08-12", "2026-08-13", "2026-08-14", "2026-08-15", "2026-08-16"];
    const conjuntos = new Set(
      semana.map((d) => missoesDoDia(d).map((m) => m.id).join(","))
    );
    expect(conjuntos.size).toBeGreaterThan(1); // não é sempre o mesmo trio
  });

  it("sem dia, devolve o pool inteiro", () => {
    expect(missoesDoDia()).toBe(MISSOES_DIARIAS);
  });

  it("avança só com o gatilho certo", () => {
    const m = acharMissao("conclua-1-no") as Missao;
    const nada = avancarMissao(m, inicial, "quizAcerto");
    expect(nada.estado).toBe(inicial);
    expect(nada.recemConcluida).toBe(false);

    const ok = avancarMissao(m, inicial, "noConcluido");
    expect(ok.estado).toEqual({ progresso: 1, concluida: true });
    expect(ok.recemConcluida).toBe(true);
  });

  it("recemConcluida dispara uma única vez", () => {
    const m = acharMissao("acerte-5") as Missao;
    let estado = inicial;
    let concluiuVezes = 0;
    for (let i = 0; i < 8; i++) {
      const r = avancarMissao(m, estado, "quizAcerto");
      estado = r.estado;
      if (r.recemConcluida) concluiuVezes++;
    }
    expect(estado).toEqual({ progresso: 5, concluida: true });
    expect(concluiuVezes).toBe(1); // só na 5ª resposta
  });

  it("não passa da meta e ignora quantidade não-positiva", () => {
    const m = acharMissao("pratique-10") as Missao;
    const salto = avancarMissao(m, inicial, "quizResposta", 25);
    expect(salto.estado).toEqual({ progresso: 10, concluida: true });

    const zero = avancarMissao(m, inicial, "quizResposta", 0);
    expect(zero.estado).toBe(inicial);
  });
});
