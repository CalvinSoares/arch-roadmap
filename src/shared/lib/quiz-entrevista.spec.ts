import { describe, it, expect } from "vitest";
import { gerarRodadaEntrevista } from "@/shared/lib/quiz-formatos";

describe("gerarRodadaEntrevista", () => {
  it("monta 5 explique-erro + 2 duelos", () => {
    const rodada = gerarRodadaEntrevista(42);
    expect(rodada.length).toBe(7);
    expect(rodada.filter((p) => p.formato === "explique-erro")).toHaveLength(5);
    expect(rodada.filter((p) => p.formato === "duelo")).toHaveLength(2);
  });

  it("é determinístico na mesma semente", () => {
    expect(gerarRodadaEntrevista(7).map((p) => p.id)).toEqual(
      gerarRodadaEntrevista(7).map((p) => p.id)
    );
  });
});
