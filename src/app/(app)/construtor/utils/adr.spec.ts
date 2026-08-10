import { describe, it, expect } from "vitest";
import {
  TEMPLATES,
  avaliarRegras,
  calcularScore,
} from "@/content/construtor/regras";
import { revisarProjeto } from "@/content/construtor/sugestoes";
import { camadaDef } from "@/content/construtor/blocos";
import { tecnologiaDef } from "@/content/construtor/tecnologias";
import type { EstadoProjeto } from "@/shared/types/construtor";
import { gerarADR, nomeArquivoADR, type DadosADR } from "./adr";

const DATA = "2026-08-10";

function dados(estado: EstadoProjeto, link?: string): DadosADR {
  return {
    data: DATA,
    estado,
    score: calcularScore(estado),
    revisao: revisarProjeto(estado),
    insights: avaliarRegras(estado),
    link,
  };
}

describe("gerarADR", () => {
  it("é puro: mesma entrada, mesmo documento", () => {
    const e = TEMPLATES[0].estado;
    expect(gerarADR(dados(e))).toBe(gerarADR(dados(e)));
  });

  it.each(TEMPLATES.map((t) => [t.id, t.estado] as const))(
    "%s: o documento nomeia todas as camadas, padrões e tecnologias",
    (_id, estado) => {
      const md = gerarADR(dados(estado));
      for (const c of estado.camadas) {
        expect(md, `camada ${c.camadaId}`).toContain(
          camadaDef(c.camadaId)!.nome
        );
        for (const t of c.tecnologias) {
          expect(md, `tech ${t}`).toContain(tecnologiaDef(t)!.nome);
        }
      }
    }
  );

  it.each(TEMPLATES.map((t) => [t.id, t.estado] as const))(
    "%s: traz as 5 métricas e o veredito",
    (_id, estado) => {
      const d = dados(estado);
      const md = gerarADR(d);
      for (const nome of [
        "Desacoplamento",
        "Testabilidade",
        "Resiliência",
        "Complexidade",
        "Custo operacional",
      ]) {
        expect(md).toContain(nome);
      }
      expect(md).toContain(d.revisao.veredito);
      expect(md).toContain(DATA);
    }
  );

  it("tem a estrutura de um ADR de verdade", () => {
    const md = gerarADR(dados(TEMPLATES[2].estado));
    expect(md.startsWith("# ADR")).toBe(true);
    for (const secao of ["## Contexto", "## Decisão", "## Consequências"]) {
      expect(md).toContain(secao);
    }
  });

  /**
   * A leitura precisa julgar, não só rotular: 84 de complexidade e 84 de
   * desacoplamento são o mesmo número com significados opostos.
   */
  it("qualifica métricas invertidas ao contrário das diretas", () => {
    // e-commerce: desacoplamento 90 e complexidade 84 — números do mesmo
    // patamar que precisam ser lidos em direções opostas.
    const estado = TEMPLATES.find((t) => t.id === "ecommerce-cqrs")!.estado;
    const score = calcularScore(estado);
    expect(score.desacoplamento).toBeGreaterThan(55);
    expect(score.complexidade).toBeGreaterThan(55);

    const linha = (nome: string) =>
      gerarADR(dados(estado))
        .split("\n")
        .find((l) => l.startsWith(`| ${nome}`))!;

    expect(linha("Desacoplamento")).toContain("confortável");
    expect(linha("Complexidade")).toContain("merece atenção");
  });

  it("lista os alertas como riscos assumidos", () => {
    const torto: EstadoProjeto = {
      camadas: [
        { camadaId: "infra", padroes: [], tecnologias: ["postgres"] },
        { camadaId: "ui", padroes: [], tecnologias: [] },
      ],
    };
    const d = dados(torto);
    const alertas = d.insights.filter((i) => i.nivel === "alerta");
    expect(alertas.length).toBeGreaterThan(0);

    const md = gerarADR(d);
    expect(md).toContain("### Riscos assumidos");
    for (const a of alertas) expect(md).toContain(a.titulo);
  });

  it("omite a seção do link quando não há link", () => {
    const md = gerarADR(dados(TEMPLATES[0].estado));
    expect(md).not.toContain("Abrir este projeto");
  });

  /** O link do rodapé precisa reabrir exatamente o projeto exportado. */
  it("o link do rodapé decodifica de volta para o mesmo estado", () => {
    for (const t of TEMPLATES) {
      const p = btoa(JSON.stringify(t.estado));
      const link = `https://exemplo.dev/construtor?p=${p}`;
      const md = gerarADR(dados(t.estado, link));

      expect(md).toContain(link);
      const capturado = md.match(/\?p=([A-Za-z0-9+/=]+)\)/)?.[1];
      expect(capturado, t.id).toBeDefined();
      expect(JSON.parse(atob(capturado!))).toEqual(t.estado);
    }
  });

  it("projeto vazio não produz documento com camadas", () => {
    const md = gerarADR(dados({ camadas: [] }));
    expect(md).toContain("# ADR");
    expect(md).toContain("**Camadas:** 0");
  });
});

describe("nomeArquivoADR", () => {
  it("usa a data recebida, sem ler o relógio", () => {
    expect(nomeArquivoADR(DATA)).toBe("adr-arquitetura-2026-08-10.md");
  });
});
