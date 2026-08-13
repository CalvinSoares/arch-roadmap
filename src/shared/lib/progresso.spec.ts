import { describe, it, expect } from "vitest";
import { mesclarProgresso } from "@/shared/lib/progresso";

describe("mesclarProgresso (migração local→conta)", () => {
  it("grava o que o servidor ainda não tem", () => {
    const r = mesclarProgresso([{ noId: "be-http", status: "done" }], {});
    expect(r).toEqual([{ noId: "be-http", status: "done" }]);
  });

  it("não grava quando o servidor iguala o local", () => {
    const r = mesclarProgresso(
      [{ noId: "be-http", status: "done" }],
      { "be-http": "done" }
    );
    expect(r).toEqual([]);
  });

  it("o estado mais avançado vence — local promove o servidor", () => {
    const r = mesclarProgresso(
      [{ noId: "be-http", status: "done" }],
      { "be-http": "pending" }
    );
    expect(r).toEqual([{ noId: "be-http", status: "done" }]);
  });

  it("empate e regressão mantêm o servidor (concluído nunca vira pendente)", () => {
    const r = mesclarProgresso(
      [
        { noId: "a", status: "pending" }, // servidor tem 'done' → ignora
        { noId: "b", status: "in-progress" }, // servidor tem 'done' → ignora
      ],
      { a: "done", b: "done" }
    );
    expect(r).toEqual([]);
  });

  it("colapsa duplicatas do próprio dispositivo no status mais avançado", () => {
    const r = mesclarProgresso(
      [
        { noId: "x", status: "pending" },
        { noId: "x", status: "done" },
        { noId: "x", status: "skipped" },
      ],
      {}
    );
    expect(r).toEqual([{ noId: "x", status: "done" }]);
  });

  it("ignora entradas cruas/inválidas vindas do cliente", () => {
    const r = mesclarProgresso(
      [
        { noId: "", status: "done" },
        { noId: "y", status: "concluido" }, // status fora do enum
        { noId: 42, status: "done" }, // noId não-string
        { noId: "z", status: "done" }, // válida
      ] as unknown as { noId: unknown; status: unknown }[],
      {}
    );
    expect(r).toEqual([{ noId: "z", status: "done" }]);
  });

  it("não muda nada quando não há progresso local", () => {
    expect(mesclarProgresso([], { a: "done" })).toEqual([]);
  });
});
