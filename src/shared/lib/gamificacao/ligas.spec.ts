import { describe, it, expect } from "vitest";
import {
  NIVEIS_LIGA,
  promover,
  rebaixar,
  classificarTier,
  type MembroTier,
} from "@/shared/lib/gamificacao/ligas";

describe("ligas", () => {
  it("promover/rebaixar saturam nas bordas", () => {
    expect(promover("bronze")).toBe("prata");
    expect(promover("mestre")).toBe("mestre");
    expect(rebaixar("mestre")).toBe("diamante");
    expect(rebaixar("bronze")).toBe("bronze");
  });

  it("todos os níveis são conhecidos e ordenados", () => {
    expect(NIVEIS_LIGA).toEqual(["bronze", "prata", "ouro", "diamante", "mestre"]);
  });

  it("classifica: topo sobe, base desce, miolo fica", () => {
    const membros: MembroTier[] = Array.from({ length: 20 }, (_, i) => ({
      userId: `u${i}`,
      xpNaTemporada: (20 - i) * 10, // u0 é o maior
    }));
    const t = classificarTier(membros, "prata", { promover: 5, rebaixar: 5 });

    // top 5 promovem
    for (let i = 0; i < 5; i++) expect(t[i].para).toBe("ouro");
    // miolo fica
    for (let i = 5; i < 15; i++) expect(t[i].para).toBe("prata");
    // base 5 rebaixa
    for (let i = 15; i < 20; i++) expect(t[i].para).toBe("bronze");
  });

  it("quem não pontuou (xp 0) rebaixa mesmo fora da base", () => {
    const membros: MembroTier[] = [
      { userId: "a", xpNaTemporada: 100 },
      { userId: "b", xpNaTemporada: 0 },
      { userId: "c", xpNaTemporada: 0 },
    ];
    const t = classificarTier(membros, "ouro", { promover: 0, rebaixar: 0 });
    expect(t.find((x) => x.userId === "b")?.para).toBe("prata");
    expect(t.find((x) => x.userId === "c")?.para).toBe("prata");
    expect(t.find((x) => x.userId === "a")?.para).toBe("ouro");
  });
});
