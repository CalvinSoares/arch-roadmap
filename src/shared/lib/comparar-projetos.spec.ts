import { describe, it, expect } from "vitest";
import {
  compararProjetos,
  resumoDoDiff,
  METRICAS,
} from "@/shared/lib/comparar-projetos";
import { TEMPLATES } from "@/content/construtor/regras";
import type { CamadaId, EstadoProjeto } from "@/shared/types/construtor";

const camada = (
  camadaId: CamadaId,
  padroes: string[] = [],
  tecnologias: string[] = []
) => ({ camadaId, padroes, tecnologias });

const BASE: EstadoProjeto = {
  camadas: [
    camada("api", [], ["nginx"]),
    camada("aplicacao"),
    camada("dominio"),
    camada("write-store", [], ["postgres"]),
  ],
};

describe("comparar projetos", () => {
  it("comparar um projeto consigo mesmo não acusa diferença nenhuma", () => {
    const d = compararProjetos(BASE, BASE);
    expect(d.metricas.every((m) => m.veredito === "igual")).toBe(true);
    expect(d.soEmA).toEqual([]);
    expect(d.soEmB).toEqual([]);
    expect(d.alertasNovos).toEqual([]);
    expect(d.alertasResolvidos).toEqual([]);
  });

  it("cobre as cinco métricas, sempre na mesma ordem", () => {
    const d = compararProjetos(BASE, BASE);
    expect(d.metricas.map((m) => m.chave)).toEqual(METRICAS.map((m) => m.chave));
  });

  /**
   * A inversão é o detalhe que faz o diff ser útil em vez de enganoso: em
   * complexidade e custo operacional, **menor é melhor**. Sem isso, um `-8` em
   * complexidade apareceria como piora quando é o ganho.
   */
  it("complexidade menor conta como melhora, não como piora", () => {
    const complexo: EstadoProjeto = {
      camadas: [
        ...BASE.camadas,
        camada("read-store", [], ["redis", "elasticsearch"]),
        camada("fila", ["dead-letter-queue"], ["kafka"]),
      ],
    };
    const d = compararProjetos(complexo, BASE);
    const complexidade = d.metricas.find((m) => m.chave === "complexidade")!;
    expect(complexidade.delta).toBeLessThan(0);
    expect(complexidade.veredito).toBe("melhor");
  });

  it("detecta peça acrescentada e peça removida, com o lugar", () => {
    const comCache: EstadoProjeto = {
      camadas: [...BASE.camadas, camada("read-store", [], ["redis"])],
    };
    const d = compararProjetos(BASE, comCache);
    expect(d.soEmB.map((p) => p.label)).toContain("Redis");
    expect(d.soEmB.find((p) => p.label === "Redis")?.onde).toBeTruthy();
    expect(d.soEmA).toEqual([]);

    // e o inverso é simétrico
    const inverso = compararProjetos(comCache, BASE);
    expect(inverso.soEmA.map((p) => p.label)).toContain("Redis");
    expect(inverso.soEmB).toEqual([]);
  });

  it("mostra qual alerta a variante resolveu", () => {
    const semTimeout: EstadoProjeto = {
      camadas: [
        camada("api", ["retry"], ["nginx"]),
        camada("aplicacao"),
        camada("dominio"),
        camada("write-store", [], ["postgres"]),
      ],
    };
    const comTimeout: EstadoProjeto = {
      camadas: [
        camada("api", ["retry", "timeout", "idempotencia"], ["nginx"]),
        camada("aplicacao"),
        camada("dominio"),
        camada("write-store", [], ["postgres"]),
      ],
    };
    const d = compararProjetos(semTimeout, comTimeout);
    expect(d.alertasResolvidos.map((i) => i.id)).toContain("retry-sem-timeout");
    expect(d.sinergiasGanhas.map((i) => i.id)).toContain("timeout-retry");
  });

  it("mostra qual alerta a variante introduziu", () => {
    const comFilaSemDlq: EstadoProjeto = {
      camadas: [...BASE.camadas, camada("fila", [], ["kafka"])],
    };
    const d = compararProjetos(BASE, comFilaSemDlq);
    expect(d.alertasNovos.map((i) => i.id)).toContain("fila-sem-dlq");
  });

  it("é antissimétrico nas métricas", () => {
    const outro = TEMPLATES.find((t) => t.id === "ecommerce-cqrs")!.estado;
    const ab = compararProjetos(BASE, outro);
    const ba = compararProjetos(outro, BASE);
    for (let i = 0; i < ab.metricas.length; i++) {
      expect(ba.metricas[i].delta).toBe(-ab.metricas[i].delta);
    }
  });

  it("funciona entre todos os templates, sem estourar", () => {
    for (const a of TEMPLATES) {
      for (const b of TEMPLATES) {
        const d = compararProjetos(a.estado, b.estado);
        expect(d.metricas.length).toBe(5);
        expect(resumoDoDiff(d).length).toBeGreaterThan(20);
      }
    }
  });
});

describe("resumo do diff", () => {
  it("projetos iguais recebem o resumo de 'nada mudou'", () => {
    expect(resumoDoDiff(compararProjetos(BASE, BASE))).toMatch(/iguais/i);
  });

  it("nomeia a troca quando há ganho e perda ao mesmo tempo", () => {
    const outro = TEMPLATES.find((t) => t.id === "ecommerce-cqrs")!.estado;
    const d = compararProjetos(BASE, outro);
    const resumo = resumoDoDiff(d);
    const temMelhor = d.metricas.some((m) => m.veredito === "melhor");
    const temPior = d.metricas.some((m) => m.veredito === "pior");
    if (temMelhor && temPior) {
      expect(resumo).toMatch(/troca/i);
      // o resumo não pode fingir que existe resposta certa
      expect(resumo).toMatch(/não existe resposta certa/i);
    }
  });
});
