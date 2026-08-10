import "server-only";
import { createHighlighter, type Highlighter } from "shiki";
import type { LinguagemCodigo } from "@/shared/types/conceito";

const LANGS: LinguagemCodigo[] = ["typescript", "python", "java"];

let highlighterPromise: Promise<Highlighter> | null = null;

// Variantes high-contrast: comentários/strings passam no AA (axe color-contrast).
const TEMA_LIGHT = "github-light-high-contrast";
const TEMA_DARK = "github-dark-high-contrast";

function getHighlighter() {
  if (!highlighterPromise) {
    highlighterPromise = createHighlighter({
      themes: [TEMA_LIGHT, TEMA_DARK],
      langs: LANGS,
    });
  }
  return highlighterPromise;
}

/**
 * Gera HTML com destaque de sintaxe (dual-theme). Roda em build/servidor.
 * O CSS em globals decide claro/escuro via classe `.dark` (ver `.shiki`).
 */
export async function highlightCode(code: string, lang: LinguagemCodigo) {
  const highlighter = await getHighlighter();
  return highlighter.codeToHtml(code, {
    lang,
    themes: { light: TEMA_LIGHT, dark: TEMA_DARK },
    defaultColor: false,
    transformers: [
      {
        // região rolável precisa ser alcançável por teclado
        pre(node) {
          node.properties.tabindex = 0;
        },
      },
    ],
  });
}
