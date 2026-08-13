import { describe, it, expect } from "vitest";
import {
  XP,
  xpDaAcao,
  xpParaNivel,
  nivelPara,
  progressoNivel,
} from "@/shared/lib/gamificacao/xp";
import {
  ESTADO_INICIAL,
  ehPrimeiraDoDia,
  registrarAtividade,
} from "@/shared/lib/gamificacao/streak";

describe("XP e níveis", () => {
  it("cada ação concede o XP declarado", () => {
    expect(xpDaAcao("quizAcerto")).toBe(XP.quizAcerto);
    expect(xpDaAcao("desafioResolvido")).toBe(30);
  });

  it("a curva de nível é conhecida e cresce", () => {
    expect(xpParaNivel(1)).toBe(0);
    expect(xpParaNivel(2)).toBe(100);
    expect(xpParaNivel(3)).toBe(250);
    expect(xpParaNivel(4)).toBe(450);
    // estritamente crescente
    for (let n = 1; n < 50; n++) {
      expect(xpParaNivel(n + 1)).toBeGreaterThan(xpParaNivel(n));
    }
  });

  it("nivelPara é a inversa de xpParaNivel", () => {
    for (let n = 1; n <= 60; n++) {
      // no limiar exato → o próprio nível
      expect(nivelPara(xpParaNivel(n))).toBe(n);
      // um XP antes do limiar → o nível anterior (n>1)
      if (n > 1) expect(nivelPara(xpParaNivel(n) - 1)).toBe(n - 1);
    }
  });

  it("nunca cai abaixo do nível 1", () => {
    expect(nivelPara(0)).toBe(1);
    expect(nivelPara(-50)).toBe(1);
    expect(nivelPara(99)).toBe(1);
    expect(nivelPara(100)).toBe(2);
  });

  it("progressoNivel dá base, topo e percentual coerentes", () => {
    const p = progressoNivel(175); // entre o nível 2 (100) e o 3 (250)
    expect(p.nivel).toBe(2);
    expect(p.xpNoNivel).toBe(75);
    expect(p.xpDoNivel).toBe(150);
    expect(p.falta).toBe(75);
    expect(p.pct).toBeCloseTo(0.5);
  });

  it("no limiar exato de um nível, o progresso começa do zero", () => {
    const p = progressoNivel(250);
    expect(p.nivel).toBe(3);
    expect(p.xpNoNivel).toBe(0);
    expect(p.pct).toBe(0);
  });
});

describe("streak", () => {
  it("a primeira atividade abre o streak em 1", () => {
    const r = registrarAtividade(ESTADO_INICIAL, "2026-08-10");
    expect(r.estado.dias).toBe(1);
    expect(r.estado.ultimoDia).toBe("2026-08-10");
    expect(r.estado.maior).toBe(1);
    expect(r.aumentou).toBe(true);
  });

  it("dois registros no mesmo dia não mudam nada", () => {
    const r1 = registrarAtividade(ESTADO_INICIAL, "2026-08-10");
    const r2 = registrarAtividade(r1.estado, "2026-08-10");
    expect(r2.estado.dias).toBe(1);
    expect(r2.aumentou).toBe(false);
  });

  it("dias consecutivos aumentam o streak e registram o maior", () => {
    let e = registrarAtividade(ESTADO_INICIAL, "2026-08-10").estado;
    e = registrarAtividade(e, "2026-08-11").estado;
    e = registrarAtividade(e, "2026-08-12").estado;
    expect(e.dias).toBe(3);
    expect(e.maior).toBe(3);
  });

  it("um dia perdido sem freeze quebra o streak", () => {
    let e = registrarAtividade(ESTADO_INICIAL, "2026-08-10").estado;
    e = registrarAtividade(e, "2026-08-11").estado; // dias=2
    const r = registrarAtividade(e, "2026-08-13"); // pulou o dia 12
    expect(r.quebrou).toBe(true);
    expect(r.estado.dias).toBe(1);
    expect(r.estado.maior).toBe(2); // preserva o recorde
  });

  it("um freeze cobre exatamente um dia perdido", () => {
    let e = registrarAtividade({ ...ESTADO_INICIAL, freezes: 1 }, "2026-08-10").estado;
    e = registrarAtividade(e, "2026-08-11").estado; // dias=2, freezes=1
    const r = registrarAtividade(e, "2026-08-13"); // pulou o 12, usa freeze
    expect(r.usouFreeze).toBe(true);
    expect(r.quebrou).toBe(false);
    expect(r.estado.dias).toBe(3);
    expect(r.estado.freezes).toBe(0);
  });

  it("dois dias perdidos com um freeze só ainda quebra", () => {
    const e = registrarAtividade({ ...ESTADO_INICIAL, freezes: 1 }, "2026-08-10").estado;
    const r = registrarAtividade(e, "2026-08-13"); // gap de 3
    expect(r.quebrou).toBe(true);
    expect(r.estado.freezes).toBe(1); // não gastou o freeze à toa
  });

  it("ehPrimeiraDoDia distingue o primeiro acesso do dia", () => {
    expect(ehPrimeiraDoDia(null, "2026-08-10")).toBe(true);
    expect(ehPrimeiraDoDia("2026-08-09", "2026-08-10")).toBe(true);
    expect(ehPrimeiraDoDia("2026-08-10", "2026-08-10")).toBe(false);
  });
});
