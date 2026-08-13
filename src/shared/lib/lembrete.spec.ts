import { describe, it, expect } from "vitest";
import { deveLembrar } from "@/shared/lib/lembrete";

const base = {
  ultimoDiaAtivo: "2026-08-12",
  hoje: "2026-08-13",
  streakDias: 3,
  lembretesEmail: true,
};

describe("deveLembrar (lembrete de streak)", () => {
  it("lembra quem esteve ativo ontem e ainda não hoje", () => {
    expect(deveLembrar(base)).toBe(true);
  });

  it("não lembra quem já esteve ativo hoje (gap 0)", () => {
    expect(deveLembrar({ ...base, ultimoDiaAtivo: "2026-08-13" })).toBe(false);
  });

  it("não lembra quando o streak já quebrou (gap ≥ 2)", () => {
    expect(deveLembrar({ ...base, ultimoDiaAtivo: "2026-08-11" })).toBe(false);
  });

  it("respeita o opt-out", () => {
    expect(deveLembrar({ ...base, lembretesEmail: false })).toBe(false);
  });

  it("não lembra sem streak ou sem histórico", () => {
    expect(deveLembrar({ ...base, streakDias: 0 })).toBe(false);
    expect(deveLembrar({ ...base, ultimoDiaAtivo: null })).toBe(false);
  });
});
