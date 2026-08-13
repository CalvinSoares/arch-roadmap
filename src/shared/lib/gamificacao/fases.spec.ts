import { describe, it, expect } from "vitest";
import { montarMapaDeFases } from "@/shared/lib/gamificacao/fases";
import type { RoadmapSection, ProgressoNo } from "@/shared/types/roadmap";

const sections: RoadmapSection[] = [
  {
    id: "s1",
    titulo: "Fundamentos",
    items: [
      { id: "a", titulo: "A" },
      { id: "b", titulo: "B" },
    ],
  },
  {
    id: "s2",
    titulo: "Intermediário",
    items: [{ id: "c", titulo: "C" }],
  },
  { id: "s3", titulo: "Avançado", items: [{ id: "d", titulo: "D" }] },
];

const statusDe = (mapa: Record<string, ProgressoNo>) => (id: string) =>
  mapa[id] ?? "pending";

describe("montarMapaDeFases", () => {
  it("só a primeira fase começa desbloqueada", () => {
    const m = montarMapaDeFases(sections, statusDe({}));
    expect(m.map((f) => f.desbloqueada)).toEqual([true, false, false]);
    expect(m.every((f) => !f.concluida)).toBe(true);
  });

  it("concluir uma fase desbloqueia a seguinte", () => {
    const m = montarMapaDeFases(sections, statusDe({ a: "done", b: "done" }));
    expect(m[0].concluida).toBe(true);
    expect(m[0].concluidos).toBe(2);
    expect(m[1].desbloqueada).toBe(true); // s2 abriu
    expect(m[2].desbloqueada).toBe(false); // s3 ainda não
  });

  it("fase parcial não conclui nem abre a próxima", () => {
    const m = montarMapaDeFases(sections, statusDe({ a: "done" }));
    expect(m[0].concluida).toBe(false);
    expect(m[0].concluidos).toBe(1);
    expect(m[1].desbloqueada).toBe(false);
  });

  it("desbloqueio encadeia por todas as fases", () => {
    const m = montarMapaDeFases(
      sections,
      statusDe({ a: "done", b: "done", c: "done", d: "done" })
    );
    expect(m.every((f) => f.concluida)).toBe(true);
    expect(m.every((f) => f.desbloqueada)).toBe(true);
  });
});
