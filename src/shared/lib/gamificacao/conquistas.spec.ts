import { describe, it, expect } from "vitest";
import {
  CONQUISTAS,
  acharConquista,
  conquistasGanhas,
} from "@/shared/lib/gamificacao/conquistas";

describe("conquistas", () => {
  it("as chaves são únicas e estáveis", () => {
    const chaves = CONQUISTAS.map((c) => c.chave);
    expect(new Set(chaves).size).toBe(chaves.length);
    expect(acharConquista("xp-500")?.limiar).toBe(500);
    expect(acharConquista("nao-existe")).toBeUndefined();
  });

  it("nenhuma conquista quando as métricas estão zeradas", () => {
    expect(
      conquistasGanhas({
        xpTotal: 0,
        maiorStreak: 0,
        quizAcertos: 0,
        nosConcluidos: 0,
      })
    ).toEqual([]);
  });

  it("é cumulativa: XP alto ganha os limiares menores também", () => {
    const ganhas = conquistasGanhas({
      xpTotal: 6000,
      maiorStreak: 0,
      quizAcertos: 0,
      nosConcluidos: 0,
    });
    expect(ganhas).toContain("xp-500");
    expect(ganhas).toContain("xp-5000");
  });

  it("respeita o limiar exato (inclusivo)", () => {
    const ganhas = conquistasGanhas({
      xpTotal: 0,
      maiorStreak: 7,
      quizAcertos: 99,
      nosConcluidos: 10,
    });
    expect(ganhas).toContain("streak-7");
    expect(ganhas).not.toContain("quiz-100"); // 99 < 100
    expect(ganhas).toContain("nos-10");
  });
});
