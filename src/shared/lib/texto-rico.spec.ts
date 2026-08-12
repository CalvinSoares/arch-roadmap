import { describe, it, expect } from "vitest";
import { listConceitos } from "@/shared/lib/content";
import type { Bloco } from "@/shared/types/bloco";

const CONCEITOS = listConceitos();

/** Mesma expressão do componente — se uma mudar, a outra falha aqui. */
const PADRAO = /(\*\*[^*]+\*\*|`[^`]+`)/g;

/** Toda a prosa que passa pelo `TextoRico`. */
function prosa(): { onde: string; texto: string }[] {
  const saida: { onde: string; texto: string }[] = [];
  for (const c of CONCEITOS) {
    for (const b of (c.blocos ?? []) as Bloco[]) {
      if (b.tipo === "texto") {
        b.paragrafos.forEach((p, i) => saida.push({ onde: `${c.slug}/texto[${i}]`, texto: p }));
      }
      if (b.tipo === "secao") {
        b.resumo.forEach((p, i) => saida.push({ onde: `${c.slug}#${b.id}/resumo[${i}]`, texto: p }));
        b.extensao?.forEach((p, i) =>
          saida.push({ onde: `${c.slug}#${b.id}/extensao[${i}]`, texto: p })
        );
      }
    }
  }
  return saida;
}

const PROSA = prosa();

describe("marcação inline da prosa", () => {
  it("há prosa com marcação para justificar o renderizador", () => {
    const comMarcacao = PROSA.filter((p) => PADRAO.test(p.texto));
    PADRAO.lastIndex = 0;
    expect(comMarcacao.length).toBeGreaterThan(50);
  });

  it("asteriscos de negrito estão sempre em pares", () => {
    // Um `**` órfão vira asterisco literal na tela — o defeito que este
    // renderizador veio corrigir, e que voltaria em silêncio sem o teste.
    const erros: string[] = [];
    for (const { onde, texto } of PROSA) {
      const semPares = texto.replace(/\*\*[^*]+\*\*/g, "");
      if (semPares.includes("**")) erros.push(`${onde}: ${texto.slice(0, 60)}…`);
    }
    expect(erros).toEqual([]);
  });

  it("crases estão sempre em pares", () => {
    const erros: string[] = [];
    for (const { onde, texto } of PROSA) {
      const crases = (texto.match(/`/g) ?? []).length;
      if (crases % 2 !== 0) erros.push(`${onde}: ${crases} crase(s)`);
    }
    expect(erros).toEqual([]);
  });

  it("não há negrito vazio nem código vazio", () => {
    const erros: string[] = [];
    for (const { onde, texto } of PROSA) {
      if (/\*\*\s*\*\*/.test(texto)) erros.push(`${onde}: negrito vazio`);
      if (/`\s*`/.test(texto)) erros.push(`${onde}: código vazio`);
    }
    expect(erros).toEqual([]);
  });

  it("não há sintaxe de markdown que o renderizador ignora", () => {
    // Link, imagem e título dentro de parágrafo sairiam literais na tela.
    // Cada um tem bloco próprio; suportá-los aqui migraria conteúdo para o
    // lugar errado.
    const erros: string[] = [];
    for (const { onde, texto } of PROSA) {
      if (/\[[^\]]+\]\([^)]+\)/.test(texto)) erros.push(`${onde}: link markdown`);
      if (/^#{1,6}\s/.test(texto.trim())) erros.push(`${onde}: título markdown`);
    }
    expect(erros).toEqual([]);
  });
});
