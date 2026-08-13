import { describe, it, expect } from "vitest";
import {
  montarJornada,
  progressoJornada,
} from "@/shared/lib/gamificacao/jornada";
import type { RoadmapSection, ProgressoNo } from "@/shared/types/roadmap";

const sections: RoadmapSection[] = [
  {
    id: "u1",
    titulo: "Fundamentos",
    items: [
      { id: "a", titulo: "A", conceito: "http" },
      { id: "b", titulo: "B" },
    ],
  },
  {
    id: "u2",
    titulo: "APIs",
    items: [
      { id: "c", titulo: "C" },
      { id: "d", titulo: "D" },
    ],
  },
];

const stat = (m: Record<string, ProgressoNo>) => (id: string) => m[id] ?? "pending";

function estados(m: Record<string, ProgressoNo>) {
  return montarJornada(sections, stat(m)).flatMap((u) =>
    u.nos.map((n) => n.estado)
  );
}

describe("montarJornada", () => {
  it("nada feito: 1º nó é o atual, resto bloqueado", () => {
    expect(estados({})).toEqual(["current", "locked", "locked", "locked"]);
  });

  it("desbloqueio sequencial conforme conclui", () => {
    expect(estados({ a: "done" })).toEqual([
      "done",
      "current",
      "locked",
      "locked",
    ]);
    expect(estados({ a: "done", b: "done" })).toEqual([
      "done",
      "done",
      "current",
      "locked",
    ]);
  });

  it("tudo concluído: nenhum atual", () => {
    expect(estados({ a: "done", b: "done", c: "done", d: "done" })).toEqual([
      "done",
      "done",
      "done",
      "done",
    ]);
  });

  it("preserva unidades, títulos e o slug de conceito", () => {
    const j = montarJornada(sections, stat({}));
    expect(j).toHaveLength(2);
    expect(j[0].titulo).toBe("Fundamentos");
    expect(j[0].nos[0].conceito).toBe("http");
  });

  it("progressoJornada conta concluídos/total", () => {
    expect(progressoJornada(sections, stat({ a: "done", c: "done" }))).toEqual({
      concluidos: 2,
      total: 4,
    });
  });
});
