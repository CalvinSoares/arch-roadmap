import type { Nascimento } from "@/shared/types/quando";

/**
 * Nascimentos compartilhados por vários conceitos.
 *
 * Os 23 padrões GoF têm a mesma data e a mesma fonte — repetir o objeto em 23
 * arquivos seria a duplicação que este repositório evita em conteúdo. O que varia
 * de um para outro é só o `precursor`, então ele é o parâmetro.
 *
 * O arquivo começa com `_` por convenção de "não é um conceito": o registro em
 * `shared/lib/content.ts` é explícito, então nada aqui é descoberto por engano.
 */

const FONTE_GOF =
  "Gamma, Helm, Johnson & Vlissides — *Design Patterns: Elements of " +
  "Reusable Object-Oriented Software*, Addison-Wesley, 1994";

/**
 * O marco dos 23 padrões.
 *
 * `precisao: "convencao"` de propósito: 1994 é quando os padrões foram
 * **catalogados**, não inventados. Vários são bem mais velhos, e é justamente
 * isso que o `precursor` conta.
 */
export function gof(precursor?: string): Nascimento {
  return {
    quando: { rotulo: "1994", ano: 1994, precisao: "convencao" },
    fonte: FONTE_GOF,
    precursor,
  };
}
