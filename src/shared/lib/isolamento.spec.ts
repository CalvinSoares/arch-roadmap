import { describe, it, expect } from "vitest";
import { simular, ROTEIROS, NIVEIS, type Nivel } from "@/shared/lib/isolamento";

/**
 * O que este motor precisa provar: que cada roteiro exibe a anomalia que
 * promete no nível fraco, e que ela some no nível que a resolve. Se um dia
 * alguém mexer na regra de visibilidade, o roteiro que dependia dela falha
 * aqui — em vez de ensinar errado em silêncio.
 */
describe("laboratório de concorrência", () => {
  it("os roteiros têm ids únicos e passos", () => {
    const ids = ROTEIROS.map((r) => r.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const r of ROTEIROS) {
      expect(r.passos.length, r.id).toBeGreaterThanOrEqual(4);
      expect(r.descricao.trim().length, r.id).toBeGreaterThan(40);
    }
  });

  it("toda transação que começa termina em commit ou rollback", () => {
    for (const r of ROTEIROS) {
      for (const tx of ["T1", "T2"] as const) {
        const seus = r.passos.filter((p) => p.tx === tx);
        if (seus.length === 0) continue;
        const ultimo = seus[seus.length - 1];
        expect(["commit", "rollback"], `${r.id}/${tx}`).toContain(ultimo.op);
      }
    }
  });

  it("lost update: as duas leem 100, e o débito de 30 desaparece", () => {
    const r = simular(ROTEIROS[0].passos, "READ COMMITTED");
    expect(r.anomalias).toContain("lost-update");
    // 100 − 30 − 50 seria 20; o resultado é 50 porque T2 escreveu sobre 100
    expect(r.esperadoEmSerie).toBe(20);
    expect(r.final).toBe(50);
  });

  it("dirty read só acontece em READ UNCOMMITTED", () => {
    const roteiro = ROTEIROS.find((x) => x.id === "dirty-read")!;
    expect(simular(roteiro.passos, "READ UNCOMMITTED").anomalias).toContain("dirty-read");
    for (const nivel of ["READ COMMITTED", "REPEATABLE READ", "SERIALIZABLE"] as Nivel[]) {
      expect(simular(roteiro.passos, nivel).anomalias, nivel).not.toContain("dirty-read");
    }
  });

  it("non-repeatable read some em REPEATABLE READ", () => {
    const roteiro = ROTEIROS.find((x) => x.id === "non-repeatable")!;
    expect(simular(roteiro.passos, "READ COMMITTED").anomalias).toContain(
      "non-repeatable-read"
    );
    expect(simular(roteiro.passos, "REPEATABLE READ").anomalias).not.toContain(
      "non-repeatable-read"
    );
  });

  it.each(ROTEIROS.map((r) => [r.id, r] as const))(
    "%s: a anomalia some no nível que o roteiro declara resolver",
    (_id, roteiro) => {
      const resultado = simular(roteiro.passos, roteiro.resolvidoEm);
      // no nível declarado, ou não há anomalia, ou a transação foi abortada
      const abortou = resultado.eventos.some((e) => e.abortou);
      expect(
        resultado.anomalias.length === 0 || abortou,
        `${roteiro.id} em ${roteiro.resolvidoEm}: ${resultado.anomalias.join(", ")}`
      ).toBe(true);
    }
  );

  it("SERIALIZABLE aborta em vez de perder a atualização", () => {
    const r = simular(ROTEIROS[0].passos, "SERIALIZABLE");
    expect(r.eventos.some((e) => e.abortou)).toBe(true);
    expect(r.anomalias).not.toContain("lost-update");
  });

  it("é determinístico — mesma entrada, mesma narração", () => {
    for (const nivel of NIVEIS) {
      const a = simular(ROTEIROS[0].passos, nivel);
      const b = simular(ROTEIROS[0].passos, nivel);
      expect(a).toEqual(b);
    }
  });

  it("todo passo produz exatamente um evento narrado", () => {
    for (const roteiro of ROTEIROS) {
      for (const nivel of NIVEIS) {
        const r = simular(roteiro.passos, nivel);
        expect(r.eventos.length, `${roteiro.id}/${nivel}`).toBe(roteiro.passos.length);
        for (const e of r.eventos) {
          expect(e.narracao.trim().length, `${roteiro.id}/${nivel}#${e.indice}`).toBeGreaterThan(10);
        }
      }
    }
  });

  it("uma transação sozinha nunca produz anomalia", () => {
    const r = simular(
      [
        { tx: "T1", op: "ler" },
        { tx: "T1", op: "escrever", delta: -30 },
        { tx: "T1", op: "commit" },
      ],
      "READ UNCOMMITTED"
    );
    expect(r.anomalias).toEqual([]);
    expect(r.final).toBe(70);
    expect(r.final).toBe(r.esperadoEmSerie);
  });
});
