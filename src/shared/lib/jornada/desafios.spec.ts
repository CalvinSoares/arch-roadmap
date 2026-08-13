import { describe, it, expect } from "vitest";
import { listConceitos, listRoadmaps } from "@/shared/lib/content";
import {
  avaliarDesafio,
  desafioOco,
  estrelasDaLicao,
  gerarDesafiosLicao,
  gerarDesafiosCheckpoint,
  gerarDesafiosRevisao,
} from "@/shared/lib/jornada/desafios";
import { chaveCheckpoint } from "@/content/jornada/checkpoints";
import type { Desafio, RespostaDesafio } from "@/shared/types/desafio";

function respostaCorreta(d: Desafio): RespostaDesafio {
  switch (d.tipo) {
    case "mcq":
      return { tipo: "mcq", escolha: d.correta };
    case "vf":
      return { tipo: "vf", escolha: d.correta };
    case "lacuna":
      return { tipo: "lacuna", escolha: d.correta };
    case "ordenar":
      return { tipo: "ordenar", ordem: [...d.ordemCorreta] };
    case "parear":
      return {
        tipo: "parear",
        ligacoes: Object.fromEntries(
          d.pares.map((p) => [p.esquerda, p.direita])
        ),
      };
    case "dois-codigos":
      return { tipo: "dois-codigos", escolha: d.correta };
  }
}

function respostaErrada(d: Desafio): RespostaDesafio {
  switch (d.tipo) {
    case "mcq":
      return {
        tipo: "mcq",
        escolha: d.alternativas.find((a) => a !== d.correta) ?? "__x__",
      };
    case "vf":
      return { tipo: "vf", escolha: !d.correta };
    case "lacuna":
      return {
        tipo: "lacuna",
        escolha: d.opcoes.find((o) => o !== d.correta) ?? "__x__",
      };
    case "ordenar":
      return { tipo: "ordenar", ordem: [...d.ordemCorreta].reverse() };
    case "parear": {
      const dirs = d.pares.map((p) => p.direita);
      const rotacionadas = [...dirs.slice(1), dirs[0]];
      return {
        tipo: "parear",
        ligacoes: Object.fromEntries(
          d.pares.map((p, i) => [p.esquerda, rotacionadas[i]!])
        ),
      };
    }
    case "dois-codigos":
      return {
        tipo: "dois-codigos",
        escolha: d.correta === "a" ? "b" : "a",
      };
  }
}

function textoDoDesafio(d: Desafio): string {
  switch (d.tipo) {
    case "vf":
      return d.afirmacao;
    case "lacuna":
      return `${d.fraseAntes} ${d.fraseDepois}`;
    case "mcq":
    case "ordenar":
    case "parear":
    case "dois-codigos":
      return d.enunciado;
  }
}

describe("estrelasDaLicao", () => {
  it("lição curta (checkpoint) exige perfeição para 3★", () => {
    expect(estrelasDaLicao(3, 0)).toBe(3);
    expect(estrelasDaLicao(3, 1)).toBe(2);
    expect(estrelasDaLicao(3, 2)).toBe(1);
  });

  it("lição longa tolera até 2 erros para 2★", () => {
    expect(estrelasDaLicao(5, 0)).toBe(3);
    expect(estrelasDaLicao(5, 2)).toBe(2);
    expect(estrelasDaLicao(5, 3)).toBe(1);
  });
});

describe("gerarDesafiosRevisao", () => {
  it("mistura slugs fracos sem ficar vazio", () => {
    const d = gerarDesafiosRevisao({
      slugs: ["strategy", "timeout", "saga"],
      semente: 11,
      quantas: 5,
    });
    expect(d.length).toBeGreaterThanOrEqual(3);
    expect(d.every((x) => !desafioOco(x))).toBe(true);
  });

  it("slug inexistente é ignorado", () => {
    expect(
      gerarDesafiosRevisao({
        slugs: ["__nao-existe__"],
        semente: 1,
        quantas: 5,
      })
    ).toEqual([]);
  });
});

describe("avaliarDesafio", () => {
  it("aceita a resposta certa e rejeita a errada em cada tipo", () => {
    const amostra = gerarDesafiosLicao({
      slug: "strategy",
      semente: 42,
      quantas: 8,
    });
    expect(amostra.length).toBeGreaterThan(0);
    for (const d of amostra) {
      expect(avaliarDesafio(d, respostaCorreta(d)).ok, d.id).toBe(true);
      expect(avaliarDesafio(d, respostaErrada(d)).ok, d.id).toBe(false);
    }
  });
});

describe("gerarDesafiosLicao", () => {
  it("mesma semente → mesma sequência", () => {
    const a = gerarDesafiosLicao({ slug: "timeout", semente: 7, quantas: 5 });
    const b = gerarDesafiosLicao({ slug: "timeout", semente: 7, quantas: 5 });
    expect(a.map((d) => d.id)).toEqual(b.map((d) => d.id));
  });

  it("nunca devolve vazio para conceitos do catálogo", () => {
    const falhas: string[] = [];
    for (const c of listConceitos()) {
      const d = gerarDesafiosLicao({ slug: c.slug, semente: 1, quantas: 5 });
      if (d.length < 2) falhas.push(`${c.slug}: ${d.length}`);
    }
    expect(falhas).toEqual([]);
  });

  it("mistura tipos quando o conteúdo permite (strategy)", () => {
    const tipos = new Set(
      gerarDesafiosLicao({ slug: "strategy", semente: 99, quantas: 5 }).map(
        (d) => d.tipo
      )
    );
    expect(tipos.size).toBeGreaterThanOrEqual(2);
  });

  it("Encapsulamento e Polimorfismo têm lição jogável", () => {
    expect(
      gerarDesafiosLicao({ slug: "encapsulamento", semente: 4, quantas: 5 })
        .length
    ).toBeGreaterThanOrEqual(2);
    expect(
      gerarDesafiosLicao({ slug: "polimorfismo", semente: 4, quantas: 5 })
        .length
    ).toBeGreaterThanOrEqual(2);
  });

  it("não devolve desafios ocos (eco de resumo / quiz de nome)", () => {
    const falhas: string[] = [];
    for (const c of listConceitos()) {
      for (const semente of [1, 42, 99]) {
        const d = gerarDesafiosLicao({
          slug: c.slug,
          semente,
          quantas: 5,
        });
        for (const desafio of d) {
          if (desafioOco(desafio)) {
            falhas.push(`${c.slug}@${semente}/${desafio.id}`);
          }
          const t = textoDoDesafio(desafio).toLowerCase();
          if (/se chama|desta lição|neste passo da trilha/.test(t)) {
            falhas.push(`${c.slug}@${semente}/${desafio.id}:texto`);
          }
        }
      }
    }
    expect(falhas).toEqual([]);
  });
});

describe("checkpoints curados", () => {
  const itensSemConceito = listRoadmaps().flatMap((r) =>
    r.sections.flatMap((s) =>
      s.items
        .filter((i) => !i.conceito)
        .map((i) => ({ roadmap: r.slug, item: i }))
    )
  );

  it("todo item sem conceito tem ≥3 desafios curados", () => {
    const falhas: string[] = [];
    for (const { roadmap, item } of itensSemConceito) {
      const d = gerarDesafiosCheckpoint({
        roadmapSlug: roadmap,
        item,
        semente: 11,
        quantas: 3,
      });
      if (d.length < 3) {
        falhas.push(`${chaveCheckpoint(roadmap, item.id)} → ${d.length}`);
      }
    }
    expect(falhas).toEqual([]);
  });

  it("proíbe eco genérico da descrição do nó", () => {
    for (const { roadmap, item } of itensSemConceito) {
      const d = gerarDesafiosCheckpoint({
        roadmapSlug: roadmap,
        item,
        semente: 2,
        quantas: 5,
      });
      for (const desafio of d) {
        const t = textoDoDesafio(desafio).toLowerCase();
        expect(t, desafio.id).not.toMatch(/neste passo da trilha, o foco é/);
        expect(t, desafio.id).not.toMatch(/neste passo \("/);
        expect(t, desafio.id).not.toMatch(/se chama/);
        expect(t, desafio.id).not.toMatch(/checkpoint da trilha/);
        // não ecoar a descrição crua do item como enunciado inteiro
        if (item.descricao && item.descricao.trim().length > 20) {
          expect(t.trim(), desafio.id).not.toBe(
            item.descricao.trim().toLowerCase()
          );
        }
      }
    }
  });

  it("respostas corretas passam na avaliação (amostra backend)", () => {
    const alvo = itensSemConceito.find((x) => x.item.id === "be-linguagem");
    expect(alvo).toBeTruthy();
    const d = gerarDesafiosCheckpoint({
      roadmapSlug: alvo!.roadmap,
      item: alvo!.item,
      semente: 2,
    });
    for (const desafio of d) {
      expect(avaliarDesafio(desafio, respostaCorreta(desafio)).ok).toBe(true);
    }
  });
});
