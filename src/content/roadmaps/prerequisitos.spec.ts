import { describe, it, expect } from "vitest";
import { listRoadmaps } from "@/shared/lib/content";

const ROADMAPS = listRoadmaps();

describe("pré-requisitos dos roadmaps", () => {
  it("todo prerequisito aponta para um item do mesmo roadmap", () => {
    const erros: string[] = [];
    for (const r of ROADMAPS) {
      const ids = new Set(r.sections.flatMap((s) => s.items.map((i) => i.id)));
      for (const s of r.sections) {
        for (const it of s.items) {
          for (const pre of it.prerequisitos ?? []) {
            if (!ids.has(pre)) {
              erros.push(`${r.slug}/${it.id} → ${pre} (inexistente)`);
            }
            if (pre === it.id) {
              erros.push(`${r.slug}/${it.id} → si mesmo`);
            }
          }
        }
      }
    }
    expect(erros).toEqual([]);
  });

  it("não há ciclos no grafo de pré-requisitos", () => {
    const ciclos: string[] = [];

    for (const r of ROADMAPS) {
      const adj = new Map<string, string[]>();
      for (const s of r.sections) {
        for (const it of s.items) {
          adj.set(it.id, it.prerequisitos ?? []);
        }
      }

      const PERM = 0;
      const TEMP = 1;
      const DONE = 2;
      const estado = new Map<string, number>();

      const visit = (id: string, stack: string[]): boolean => {
        const st = estado.get(id) ?? PERM;
        if (st === DONE) return false;
        if (st === TEMP) {
          ciclos.push(`${r.slug}: ${[...stack, id].join(" → ")}`);
          return true;
        }
        estado.set(id, TEMP);
        for (const pre of adj.get(id) ?? []) {
          if (visit(pre, [...stack, id])) return true;
        }
        estado.set(id, DONE);
        return false;
      };

      for (const id of adj.keys()) {
        if ((estado.get(id) ?? PERM) === PERM) visit(id, []);
      }
    }

    expect(ciclos).toEqual([]);
  });

  it("a trilha de resiliência declara o núcleo essencial", () => {
    const res = ROADMAPS.find((r) => r.slug === "resiliencia");
    expect(res).toBeDefined();
    const essenciais = res!.sections.flatMap((s) =>
      s.items.filter((i) => i.essencial).map((i) => i.id)
    );
    expect(essenciais.length).toBeGreaterThanOrEqual(8);
    expect(essenciais).toContain("res-timeout");
    expect(essenciais).toContain("res-retry");
    expect(essenciais).toContain("res-saga");
  });
});
