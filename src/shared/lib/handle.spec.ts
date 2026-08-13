import { describe, it, expect } from "vitest";
import {
  normalizarHandle,
  handleValido,
  erroHandle,
} from "@/shared/lib/handle";

describe("handle", () => {
  it("normaliza para minúsculo e sem bordas", () => {
    expect(normalizarHandle("  Calvin  ")).toBe("calvin");
  });

  it("aceita handles bem formados", () => {
    expect(handleValido("calvin")).toBe(true);
    expect(handleValido("dev_2026")).toBe(true);
    expect(handleValido("Calvin")).toBe(true); // normaliza antes
  });

  it("rejeita formatos inválidos com mensagem", () => {
    expect(erroHandle("ab")).toMatch(/3 a 20/);
    expect(erroHandle("2fast")).toMatch(/letra/);
    expect(erroHandle("com espaço")).toMatch(/min/i);
    expect(erroHandle("calvin")).toBeNull();
  });
});
