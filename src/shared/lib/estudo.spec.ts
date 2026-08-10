import { describe, it, expect } from "vitest";
import {
  agendar,
  conceitosConcluidos,
  devidosHoje,
  itensEstudaveis,
  paraISO,
  progressoPorRoadmap,
  proximosDaTrilha,
  registrarRevisao,
  sincronizarComProgresso,
} from "./estudo";
import { listConceitos, listRoadmaps } from "./content";
import { NIVEL_MAXIMO, type AgendaEstudo } from "@/shared/types/estudo";
import type { ProgressoNo } from "@/shared/types/roadmap";

const HOJE = "2026-08-10";
const SLUGS = new Set(listConceitos().map((c) => c.slug));

describe("agenda de revisão", () => {
  it("acertar sobe um nível; errar zera", () => {
    const n0 = agendar("proxy", undefined, true, HOJE);
    expect(n0.nivel).toBe(0);

    const n1 = agendar("proxy", n0, true, HOJE);
    expect(n1.nivel).toBe(1);

    const errou = agendar("proxy", n1, false, HOJE);
    expect(errou.nivel).toBe(0);
  });

  it("o nível satura no topo da curva", () => {
    let r = agendar("proxy", undefined, true, HOJE);
    for (let i = 0; i < 20; i++) r = agendar("proxy", r, true, HOJE);
    expect(r.nivel).toBe(NIVEL_MAXIMO);
  });

  it("a próxima revisão respeita o intervalo do nível", () => {
    const n0 = agendar("proxy", undefined, true, "2026-08-10");
    expect(n0.proximaEm).toBe("2026-08-11"); // +1 dia

    const n1 = agendar("proxy", n0, true, "2026-08-11");
    expect(n1.proximaEm).toBe("2026-08-14"); // +3 dias
  });

  it("nunca lê o relógio: mesma entrada, mesma saída", () => {
    expect(agendar("proxy", undefined, true, HOJE)).toEqual(
      agendar("proxy", undefined, true, HOJE)
    );
  });

  it("registrarRevisao não muda a agenda original", () => {
    const antes: AgendaEstudo = {};
    const depois = registrarRevisao(antes, "proxy", true, HOJE);
    expect(antes).toEqual({});
    expect(depois.proxy.slug).toBe("proxy");
  });
});

describe("devidosHoje", () => {
  const agenda: AgendaEstudo = {
    proxy: { slug: "proxy", nivel: 0, revisadoEm: "2026-08-01", proximaEm: "2026-08-02" },
    command: { slug: "command", nivel: 1, revisadoEm: "2026-08-09", proximaEm: "2026-08-10" },
    visitor: { slug: "visitor", nivel: 2, revisadoEm: "2026-08-09", proximaEm: "2026-08-30" },
  };

  it("devolve só o que venceu ou vence hoje", () => {
    expect(devidosHoje(agenda, HOJE).map((r) => r.slug)).toEqual([
      "proxy",
      "command",
    ]);
  });

  it("ordena do mais atrasado para o menos", () => {
    const [primeiro] = devidosHoje(agenda, HOJE);
    expect(primeiro.slug).toBe("proxy");
  });

  it("conceito nunca concluído não aparece — a fila sai do roadmap", () => {
    expect(devidosHoje({}, HOJE)).toEqual([]);
  });
});

describe("sincronizarComProgresso", () => {
  it("conclusão nova entra na fila com agenda inicial", () => {
    const a = sincronizarComProgresso({}, ["proxy"], HOJE);
    expect(a.proxy.nivel).toBe(0);
    expect(a.proxy.proximaEm).toBe("2026-08-11");
  });

  it("quem já tinha agenda mantém o progresso", () => {
    const existente: AgendaEstudo = {
      proxy: { slug: "proxy", nivel: 3, revisadoEm: "2026-08-01", proximaEm: "2026-08-17" },
    };
    const a = sincronizarComProgresso(existente, ["proxy"], HOJE);
    expect(a.proxy.nivel).toBe(3);
  });

  it("desmarcar no roadmap tira o conceito da fila", () => {
    const existente: AgendaEstudo = {
      proxy: { slug: "proxy", nivel: 2, revisadoEm: "2026-08-01", proximaEm: "2026-08-08" },
    };
    expect(sincronizarComProgresso(existente, [], HOJE)).toEqual({});
  });
});

describe("trilha sugerida", () => {
  const vazio: Record<string, Record<string, ProgressoNo>> = {};

  /**
   * 72 dos 142 itens de roadmap são tópicos sem página ("HTTP a sério").
   * Sugeri-los levaria o usuário a lugar nenhum.
   */
  it("só considera itens que têm conceito de verdade", () => {
    const itens = itensEstudaveis();
    expect(itens.length).toBeGreaterThan(0);
    for (const i of itens) {
      expect(SLUGS.has(i.conceitoSlug), i.conceitoSlug).toBe(true);
    }

    const totalDeItens = listRoadmaps().reduce(
      (a, r) => a + r.sections.reduce((b, s) => b + s.items.length, 0),
      0
    );
    expect(itens.length).toBeLessThan(totalDeItens);
  });

  it("devolve no máximo o que foi pedido, na ordem das trilhas", () => {
    const p = proximosDaTrilha(vazio, 3);
    expect(p).toHaveLength(3);
    expect(p[0].conceitoSlug).toBe(itensEstudaveis()[0].conceitoSlug);
  });

  it("não repete o mesmo conceito que aparece em várias trilhas", () => {
    const p = proximosDaTrilha(vazio, 40);
    const slugs = p.map((x) => x.conceitoSlug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it("pula o que já está concluído ou pulado", () => {
    const primeiro = itensEstudaveis()[0];
    const progresso = {
      [primeiro.roadmapSlug]: { [primeiro.noId]: "done" as ProgressoNo },
    };
    const p = proximosDaTrilha(progresso, 3);
    expect(p.some((x) => x.noId === primeiro.noId)).toBe(false);
  });

  it("conceitosConcluidos reflete o progresso das trilhas", () => {
    const primeiro = itensEstudaveis()[0];
    const progresso = {
      [primeiro.roadmapSlug]: { [primeiro.noId]: "done" as ProgressoNo },
    };
    expect(conceitosConcluidos(progresso)).toContain(primeiro.conceitoSlug);
    expect(conceitosConcluidos({})).toEqual([]);
  });
});

describe("progresso por trilha", () => {
  it("conta os nós de cada roadmap e nunca passa do total", () => {
    for (const t of progressoPorRoadmap({})) {
      expect(t.total).toBeGreaterThan(0);
      expect(t.concluidos).toBe(0);
      expect(t.concluidos).toBeLessThanOrEqual(t.total);
    }
  });
});

describe("paraISO", () => {
  it("formata em UTC, sem depender do fuso da máquina", () => {
    expect(paraISO(new Date("2026-08-10T23:30:00Z"))).toBe("2026-08-10");
  });
});
