import { describe, it, expect } from "vitest";
import { mesclarProgresso, estadoPorRoadmap } from "@/shared/lib/progresso";

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

describe("estadoPorRoadmap (pull server-first: achatado → por trilha)", () => {
  const trilhas = [
    { slug: "backend", noIds: ["be-http", "be-db"] },
    { slug: "frontend", noIds: ["fe-css", "be-http"] }, // be-http em duas trilhas
  ];

  it("reagrupa o estado plano nos mapas de cada trilha", () => {
    const r = estadoPorRoadmap(
      { "be-http": "done", "be-db": "in-progress", "fe-css": "skipped" },
      trilhas
    );
    expect(r).toEqual({
      backend: { "be-http": "done", "be-db": "in-progress" },
      frontend: { "fe-css": "skipped", "be-http": "done" },
    });
  });

  it("um nó em duas trilhas entra nas duas (identidade global)", () => {
    const r = estadoPorRoadmap({ "be-http": "done" }, trilhas);
    expect(r.backend["be-http"]).toBe("done");
    expect(r.frontend["be-http"]).toBe("done");
  });

  it("descarta noIds que não existem em nenhuma trilha", () => {
    const r = estadoPorRoadmap({ fantasma: "done" }, trilhas);
    expect(r).toEqual({ backend: {}, frontend: {} });
  });

  it("nós ausentes no estado não aparecem no mapa da trilha", () => {
    const r = estadoPorRoadmap({ "be-http": "done" }, trilhas);
    expect("be-db" in r.backend).toBe(false);
  });

  it("estado vazio devolve um mapa vazio por trilha", () => {
    expect(estadoPorRoadmap({}, trilhas)).toEqual({
      backend: {},
      frontend: {},
    });
  });
});
