import type { Camada, ExemploCodigo } from "@/shared/types/conceito";

/** id de uma demo interativa registrada em `conteudo/demos`. */
export type DemoId =
  | "observer"
  | "strategy"
  | "adapter"
  | "cqrs"
  /** Laboratório de concorrência: duas transações, um nível, uma anomalia. */
  | "isolamento"
  /** Escala de latência: do ciclo de CPU à travessia do Pacífico. */
  | "escala"
  /** Mini-simulador: e se o Redis cair? */
  | "falha-cache"
  /** Mini-simulador: e se a dependência travar? */
  | "falha-timeout";

/** Camada navegável (v3): o usuário foca/expande cada camada. */
export interface CamadaNav {
  id: string;
  titulo: string;
  /** papel em 1 frase (visível sempre). */
  curto: string;
  /** o que entra/sai, contratos, responsabilidade (visível ao focar). */
  detalhe: string;
  /** mini-exemplo de código da camada (opcional). */
  exemplo?: string;
  /** o que acontece se remover/violar esta camada (opcional). */
  seViolar?: string;
}

/** Caso de uso real (v3). */
export interface CasoDeUso {
  titulo: string;
  cenario: string;
  aplicacao: string;
  tradeoff: string;
}

/** Ator de uma ilustração de fluxo linear (arquétipo "fluxo"). */
export interface FluxoAtor {
  id: string;
  label: string;
  /** peça onde o conceito atua. */
  destaque?: boolean;
}

/** Seta entre atores consecutivos (setas[i] liga atores[i] → atores[i+1]). */
export interface FluxoSeta {
  label?: string;
  tracejada?: boolean;
}

/**
 * Bloco do arquétipo "estrutura": caixas aninhadas ou empilhadas.
 * O aninhamento é a mensagem — Decorator embrulha, Facade esconde atrás de
 * si, Composite se contém. `filhos` é recursivo de propósito.
 */
export interface EstruturaBloco {
  id: string;
  label: string;
  /** anotação curta à direita do rótulo (papel da peça, contrato, custo). */
  nota?: string;
  /** peça onde o conceito atua — ganha o acento da categoria. */
  destaque?: boolean;
  /** borda tracejada: peça opcional ou substituível. */
  opcional?: boolean;
  filhos?: EstruturaBloco[];
}

/** Um dos dois lados do arquétipo "antes-depois". */
export interface LadoComparacao {
  titulo: string;
  /** 2–5 itens curtos: o que existe/acontece deste lado. */
  itens: string[];
  /** veredito de uma linha — o custo (antes) ou o ganho (depois). */
  nota: string;
}

/**
 * Conteúdo rico de um conceito como lista ordenada de blocos — permite
 * intercalar texto, figura, diagrama, demo interativa e código.
 */
export type Bloco =
  | { tipo: "texto"; titulo?: string; paragrafos: string[] }
  | { tipo: "analogia"; emoji: string; titulo: string; texto: string }
  | { tipo: "passos"; titulo?: string; passos: { titulo: string; texto: string }[] }
  | { tipo: "diagrama"; titulo?: string; mermaid: string }
  | { tipo: "camadas"; titulo?: string; camadas: Camada[] }
  | { tipo: "demo"; titulo?: string; demo: DemoId }
  | { tipo: "codigo"; titulo?: string; exemplos: ExemploCodigo[] }
  | { tipo: "quando"; usar: string[]; evitar: string[] }
  // ——— v3 ———
  | { tipo: "tldr"; texto: string }
  | {
      tipo: "secao";
      id: string;
      titulo: string;
      /** sempre visível (2–4 linhas). */
      resumo: string[];
      /** aprofundamento opt-in ("Ler mais"). */
      extensao?: string[];
    }
  | { tipo: "casos"; titulo?: string; casos: CasoDeUso[] }
  | {
      tipo: "armadilhas";
      titulo?: string;
      itens: {
        titulo: string;
        texto: string;
        /**
         * Enunciado alternativo para o quiz, quando `texto` cita o nome do
         * padrão e a substituição automática por "este padrão" produziria uma
         * frase ruim. Escape manual — a regra geral é automática.
         */
        enunciadoQuiz?: string;
      }[];
    }
  | { tipo: "camadas-nav"; titulo?: string; camadas: CamadaNav[] }
  /**
   * O padrão **mal implementado** — não a ausência dele.
   *
   * Tipo próprio, e não mais um `antes-depois`, por dois motivos: o arquétipo
   * `antes-depois` já significa "sem padrão × com padrão" em várias páginas, e
   * ter dois blocos visualmente idênticos com sentidos diferentes na mesma
   * página confunde; e o valor aqui está no **código errado**, que uma lista
   * de itens curtos não consegue mostrar.
   */
  | {
      tipo: "anti-exemplo";
      titulo?: string;
      /** Como o erro se reconhece no código de alguém, em uma linha. */
      comoSeParece: string;
      /** A implementação ingênua, com os comentários que a denunciam. */
      codigo: ExemploCodigo;
      /** O que quebra, e sob qual condição — sem isto é só código feio. */
      sintomas: { quando: string; efeito: string }[];
      /** A saída, em uma frase. Aponta para o que a página já ensinou. */
      correcao: string;
    }
  /**
   * Do código com cheiro até o padrão, um diff por vez.
   *
   * O `motivo` de cada passo é o que separa isto de um diff: sem ele, o leitor
   * vê o quê e não aprende o porquê — e é o porquê que ele vai precisar quando
   * encontrar um cheiro parecido mas não idêntico.
   */
  | {
      tipo: "refatoracao";
      titulo?: string;
      /** O cheiro, nomeado em uma frase. */
      cheiro: string;
      /** O ponto de partida, com o problema visível. */
      inicio: ExemploCodigo;
      passos: {
        titulo: string;
        /** Por que este passo — sem isto, é só um diff. */
        motivo: string;
        depois: ExemploCodigo;
      }[];
      /** O que se ganhou, e o que se pagou. */
      veredito: string;
    }
  | {
      tipo: "ilustracao";
      arquetipo: "fluxo";
      atores: FluxoAtor[];
      setas: FluxoSeta[];
      direcao?: "horizontal" | "vertical";
      legenda: string;
    }
  | {
      tipo: "ilustracao";
      arquetipo: "estrutura";
      blocos: EstruturaBloco[];
      legenda: string;
    }
  | {
      tipo: "ilustracao";
      arquetipo: "antes-depois";
      antes: LadoComparacao;
      depois: LadoComparacao;
      legenda: string;
    };
