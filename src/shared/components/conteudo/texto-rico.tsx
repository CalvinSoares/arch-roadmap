import { Fragment } from "react";

/**
 * Ênfase e código inline dentro da prosa dos conceitos.
 *
 * O conteúdo é escrito em TypeScript, não em MDX, então nunca houve um passo
 * de markdown. Só que os textos foram escritos **como se houvesse**: havia 139
 * ocorrências de `**negrito**` no catálogo renderizando como asterisco
 * literal na tela.
 *
 * Isto resolve as duas marcações que o conteúdo realmente usa, e nada mais.
 * Deliberadamente **não** é um parser de markdown: link, lista e título dentro
 * de parágrafo continuam sem suporte, porque cada um deles tem bloco próprio e
 * suportá-los aqui só faria o conteúdo migrar para o lugar errado.
 */

/** `**negrito**` e `código`, nesta ordem de precedência, sem aninhamento. */
const PADRAO = /(\*\*[^*]+\*\*|`[^`]+`)/g;

export function TextoRico({ children }: { children: string }) {
  const partes = children.split(PADRAO);

  return (
    <>
      {partes.map((parte, i) => {
        if (parte.startsWith("**") && parte.endsWith("**") && parte.length > 4) {
          // `text-foreground` não é redundante: em blocos de texto esmaecido
          // (o veredito de uma comparação, por exemplo) é ele que faz o
          // destaque aparecer. Em prosa normal, é um no-op.
          return (
            <strong key={i} className="font-semibold text-foreground">
              {parte.slice(2, -2)}
            </strong>
          );
        }
        if (parte.startsWith("`") && parte.endsWith("`") && parte.length > 2) {
          // a estilização de code inline já vem de `.prose-doc :not(pre) > code`
          return <code key={i}>{parte.slice(1, -1)}</code>;
        }
        return <Fragment key={i}>{parte}</Fragment>;
      })}
    </>
  );
}
