export type Categoria =
  | "criacional"
  | "estrutural"
  | "comportamental"
  | "principio"
  | "arquitetura"
  /**
   * O que mantém o sistema de pé quando a dependência falha. Categoria
   * própria, e não um apêndice de `arquitetura`, porque o gênero de erro é
   * outro: aqui a armadilha quase sempre é de **configuração** (o retry sem
   * jitter, o timeout maior que o do cliente), não de desenho.
   */
  | "resiliencia"
  /** Como o dado se comporta quando não cabe mais numa máquina só. */
  | "dados"
  | "infra"
  /**
   * Quem pode fazer o quê — e como provar identidade sob ameaça.
   * Categoria própria porque o gênero de erro é outro: aqui a armadilha
   * quase sempre é de **abuso ou vazamento** (token no localStorage,
   * guard que só checa “tem user”), não de desenho nem de config de
   * resiliência.
   */
  | "seguranca";

export type Dificuldade = "iniciante" | "intermediario" | "avancado";

export type LinguagemCodigo = "typescript" | "python" | "java";

export interface ExemploCodigo {
  lang: LinguagemCodigo;
  code: string;
}

/** Camada de uma arquitetura para o DiagramaCamadas (React Flow). */
export interface Camada {
  id: string;
  titulo: string;
  descricao?: string;
  /** Destaca a peça onde este conceito atua. */
  destaque?: boolean;
}

/** Um lugar concreto onde o padrão já está rodando. */
export interface OndeAparece {
  /**
   * O nome que a pessoa reconhece de imediato: `addEventListener`,
   * "middleware do Express". É um nome, não uma frase — há spec de tamanho.
   */
  onde: string;
  /** Por que aquilo é este padrão. Uma frase, não um parágrafo. */
  explicacao: string;
  /** Doc oficial, quando ajuda. Absoluto. */
  href?: string;
}

export interface Conceito {
  slug: string;
  titulo: string;
  categoria: Categoria;
  resumo: string;
  tags: string[];
  dificuldade: Dificuldade;
  tempoLeitura: number;
  /**
   * Quando a ideia foi **nomeada** — opcional, preenchido aos poucos.
   *
   * Destrava a cronologia das ideias de software, o quiz de ordenação e
   * "hoje na história". Note que a maioria das datas de software é
   * `convencao`, não `exata`: o GoF de 1994 catalogou o que já existia.
   */
  nasceu?: import("@/shared/types/quando").Nascimento;
  /**
   * Onde o padrão já está na vida de quem lê.
   *
   * Não é "exemplo de uso" — é **reconhecimento**: a biblioteca que a pessoa
   * importa toda semana e não sabia que era isto. `Proxy` virou palavra-chave
   * do JS; Event Sourcing é o `git`. É o que tira do catálogo a sensação de
   * livro acadêmico.
   */
  ondeAparece?: OndeAparece[];
  /**
   * O snippet mínimo que **é** o padrão — três a cinco linhas, sem nome de
   * domínio, sem interface extra, sem cerimônia. É o que a pessoa copia para
   * lembrar depois, e o que o exemplo completo não consegue ser.
   */
  emUmaLinha?: ExemploCodigo;
  /**
   * O preço do padrão.
   *
   * O catálogo só mostrava o benefício, o que é propaganda e não ensino. Todo
   * padrão cobra alguma coisa — indireção, arquivos, dificuldade de depurar —
   * e saber o preço é metade da decisão.
   */
  custo?: {
    /** Quantos saltos a mais entre a chamada e o efeito. */
    indirecoes: number;
    /** O que fica mais difícil de fazer depois de adotar. */
    cobra: string[];
    /** A frase que diz quando o preço não compensa. */
    naoValeSe: string;
  };
  relacionados: string[];
  /*
   * Não existe campo apontando para os roadmaps: a ligação é declarada no
   * item do roadmap (`conceito: "slug"`) e o caminho inverso sai de
   * `roadmapsDoConceito()`. Havia aqui um `roadmapNodes: string[]`, preenchido
   * em todos os conceitos, nunca lido por ninguém e com ids que não existiam
   * mais nos roadmaps — duas fontes de verdade, uma delas silenciosamente
   * errada.
   */
  /** Diagrama de classes/sequência em sintaxe Mermaid. */
  mermaid?: string;
  /** Camadas para a visualização arquitetural. */
  camadas?: Camada[];
  /** Corpo em prosa (parágrafos). Migra para MDX na Fase 1. */
  problema: string[];
  solucao: string[];
  quandoUsar: string[];
  quandoEvitar: string[];
  exemplos: ExemploCodigo[];
  /**
   * Conteúdo rico opcional (imagens/figuras/demos). Quando presente, a
   * página do conceito renderiza estes blocos no lugar do layout clássico.
   */
  blocos?: import("@/shared/types/bloco").Bloco[];
}
