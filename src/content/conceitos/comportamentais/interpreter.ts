import type { Conceito } from "@/shared/types/conceito";
import { gof } from "@/content/conceitos/_nascimento";

const MERMAID = `classDiagram
    class Expressao {
        <<interface>>
        +interpretar(ctx) bool
    }
    class Campo {
        -nome
        -valor
        +interpretar(ctx)
    }
    class E {
        -esq
        -dir
        +interpretar(ctx)
    }
    class Ou {
        -esq
        -dir
        +interpretar(ctx)
    }
    Expressao <|.. Campo
    Expressao <|.. E
    Expressao <|.. Ou
    E o-- Expressao
    Ou o-- Expressao`;

const CAMADAS = [
  { id: "gramatica", titulo: "Gramática", descricao: "As regras da mini-linguagem, uma classe por regra" },
  {
    id: "arvore",
    titulo: "Árvore de expressões",
    descricao: "A frase virada objetos aninhados — coração do padrão",
    destaque: true,
  },
  { id: "contexto", titulo: "Contexto", descricao: "Os dados sobre os quais a expressão é avaliada" },
];

const EXEMPLOS = [
  {
    lang: "typescript" as const,
    code: `type Contexto = Record<string, string>;

interface Expressao {
  interpretar(ctx: Contexto): boolean;
}

// Terminal: a regra mais simples da gramatica
class Campo implements Expressao {
  constructor(
    private nome: string,
    private valor: string,
  ) {}
  interpretar(ctx: Contexto): boolean {
    return ctx[this.nome] === this.valor;
  }
}

// Nao-terminais: regras compostas por outras regras
class E implements Expressao {
  constructor(private esq: Expressao, private dir: Expressao) {}
  interpretar(ctx: Contexto): boolean {
    return this.esq.interpretar(ctx) && this.dir.interpretar(ctx);
  }
}

class Ou implements Expressao {
  constructor(private esq: Expressao, private dir: Expressao) {}
  interpretar(ctx: Contexto): boolean {
    return this.esq.interpretar(ctx) || this.dir.interpretar(ctx);
  }
}

class Nao implements Expressao {
  constructor(private dentro: Expressao) {}
  interpretar(ctx: Contexto): boolean {
    return !this.dentro.interpretar(ctx);
  }
}

// "plano = pro E (regiao = sul OU NAO(bloqueado = sim))"
const regra = new E(
  new Campo("plano", "pro"),
  new Ou(new Campo("regiao", "sul"), new Nao(new Campo("bloqueado", "sim"))),
);

console.log(regra.interpretar({ plano: "pro", regiao: "norte", bloqueado: "nao" })); // true`,
  },
  {
    lang: "python" as const,
    code: `from abc import ABC, abstractmethod

class Expressao(ABC):
    @abstractmethod
    def interpretar(self, ctx) -> bool: ...

# Terminal: a regra mais simples da gramatica
class Campo(Expressao):
    def __init__(self, nome, valor):
        self._nome, self._valor = nome, valor
    def interpretar(self, ctx):
        return ctx.get(self._nome) == self._valor

# Nao-terminais: regras compostas por outras regras
class E(Expressao):
    def __init__(self, esq, dir):
        self._esq, self._dir = esq, dir
    def interpretar(self, ctx):
        return self._esq.interpretar(ctx) and self._dir.interpretar(ctx)

class Ou(Expressao):
    def __init__(self, esq, dir):
        self._esq, self._dir = esq, dir
    def interpretar(self, ctx):
        return self._esq.interpretar(ctx) or self._dir.interpretar(ctx)

class Nao(Expressao):
    def __init__(self, dentro):
        self._dentro = dentro
    def interpretar(self, ctx):
        return not self._dentro.interpretar(ctx)

# "plano = pro E (regiao = sul OU NAO(bloqueado = sim))"
regra = E(Campo("plano", "pro"),
          Ou(Campo("regiao", "sul"), Nao(Campo("bloqueado", "sim"))))

print(regra.interpretar({"plano": "pro", "regiao": "norte", "bloqueado": "nao"}))  # True`,
  },
];

export const interpreter: Conceito = {
  slug: "interpreter",
  titulo: "Interpreter",
  categoria: "comportamental",
  resumo:
    "Representa as regras de uma mini-linguagem como uma árvore de objetos, com uma classe por regra gramatical, e avalia frases dessa linguagem percorrendo a árvore.",
  tags: ["gramatica", "dsl", "regras", "gof"],
  dificuldade: "avancado",
  tempoLeitura: 7,
  nasceu: gof(),
  ondeAparece: [
    {
      onde: "Engines de regex",
      explicacao:
        "A expressão é uma linguagem própria, compilada numa árvore que depois é avaliada contra o texto.",
    },
    {
      onde: "Template engines",
      explicacao:
        "`{{ nome }}` é uma gramática pequena com um avaliador que a resolve contra um contexto.",
    },
  ],
  emUmaLinha: {
    lang: "typescript",
    code: `// Árvore da linguagem → avaliação.
const n = parse("a AND b").avaliar(ctx);`,
  },
  custo: {
    indirecoes: 2,
    cobra: [
      "Uma classe por regra gramatical, que cresce rápido conforme a linguagem ganha construções",
      "Interpretar a árvore a cada execução costuma ser mais lento que compilar ou usar uma engine pronta",
    ],
    naoValeSe:
      "a linguagem é complexa ou muda muito — aí um parser gerado ou uma engine existente supera a gramática feita à mão.",
  },
  relacionados: ["composite", "visitor", "strategy"],
  problema: [
    "Certas regras mudam demais para viver no código: filtros de segmentação, condições de desconto, critérios de alerta. Cada ajuste vira deploy, e quem entende a regra não é quem sabe programar.",
    "Guardar a regra como texto e avaliá-la com `eval` resolve a flexibilidade e abre um buraco de segurança — além de tornar impossível validar ou explicar a regra.",
  ],
  solucao: [
    "Definir uma gramática pequena e criar uma classe por regra: terminais (comparações) e não-terminais (E, OU, NÃO). Uma frase vira uma árvore desses objetos.",
    "Avaliar é chamar `interpretar` na raiz e deixar a recursão descer. Como cada regra é um objeto, dá para validar, serializar e até explicar a decisão passo a passo.",
  ],
  quandoUsar: [
    "Existe uma linguagem pequena e estável de regras que usuários ou analistas precisam alterar sem deploy.",
    "As regras precisam ser guardadas, versionadas ou auditadas como dado.",
    "Você precisa explicar por que uma regra deu determinado resultado.",
  ],
  quandoEvitar: [
    "A gramática é complexa ou tende a crescer — a explosão de classes torna a manutenção pior que um parser de verdade.",
    "Desempenho importa muito: percorrer objetos é bem mais lento que código compilado.",
    "As regras são poucas e estáveis: funções normais resolvem sem inventar uma linguagem.",
  ],
  mermaid: MERMAID,
  camadas: CAMADAS,
  exemplos: EXEMPLOS,
  blocos: [
    {
      tipo: "tldr",
      texto:
        "Cada regra da mini-linguagem vira uma classe, e uma frase vira uma árvore de objetos. Avaliar é chamar `interpretar` na raiz — o que permite guardar regras como dado, validá-las e explicá-las, sem `eval` e sem deploy a cada ajuste.",
    },
    {
      tipo: "analogia",
      emoji: "🧩",
      titulo: "Blocos de montar com encaixe fixo",
      texto:
        "Numa caixa de blocos, poucas peças com encaixes compatíveis produzem infinitas construções. Você não precisa de uma peça nova para cada modelo — precisa das peças certas e das regras de encaixe. Uma expressão funciona assim: E, OU e NÃO são poucos tipos de peça, mas combinados descrevem qualquer condição que a linguagem permita.",
    },
    {
      tipo: "secao",
      id: "problema",
      titulo: "O problema",
      resumo: [
        "Regras de negócio voláteis são um mau encaixe para código compilado. Quem decide 'clientes pro da região sul não bloqueados' é a área de negócio, e a espera pelo próximo deploy custa oportunidade.",
        "As saídas fáceis são ruins: `eval` sobre texto do usuário é execução remota de código, e uma tabela de flags rígida não expressa combinações com parênteses e negação.",
      ],
      extensao: [
        "O Interpreter é, estruturalmente, um **Composite** especializado: terminais são folhas, não-terminais são compostos, e a avaliação é a travessia recursiva. Se você entendeu Composite, já entendeu metade daqui — o que muda é a intenção, que passa a ser representar uma gramática.",
        "É importante separar duas coisas que costumam se confundir: **parsing** e **interpretação**. O padrão trata só da segunda — dada a árvore, como avaliá-la. Transformar o texto `plano = pro E regiao = sul` em objetos é trabalho de um parser, que o GoF deixa de fora e que na prática costuma ser a parte mais trabalhosa.",
        "Também vale notar a alternativa quase sempre melhor para gramáticas maiores: separar a árvore da avaliação e usar **Visitor**. Assim a mesma árvore serve para avaliar, validar, otimizar e imprimir de volta como texto — em vez de acumular tudo dentro de cada classe de nó.",
      ],
    },
    {
      tipo: "secao",
      id: "limites",
      titulo: "O limite prático do padrão",
      resumo: [
        "O Interpreter é o padrão menos usado do GoF, e por um motivo honesto: ele escala mal. Cada regra gramatical é uma classe, e gramáticas reais têm dezenas.",
      ],
      extensao: [
        "Com aritmética, precedência de operadores, funções, variáveis e tipos, a contagem de classes explode e as interações entre elas ficam difíceis de manter corretas. Nesse território, geradores de parser ou bibliotecas de expressão prontas ganham disparado.",
        "A faixa em que ele brilha é estreita e real: gramáticas de cinco a dez regras, estáveis, com necessidade de auditar e explicar. Filtros booleanos, condições de alerta e critérios de segmentação cabem bem.",
        "Antes de escrever o seu, considere uma linguagem de expressão pronta (CEL, JsonLogic, expressões de regra de mercado). Elas já resolveram parsing, segurança e desempenho — e o valor que você agrega raramente está em ter inventado a sintaxe.",
      ],
    },
    {
      tipo: "ilustracao",
      arquetipo: "estrutura",
      blocos: [
        {
          id: "e",
          label: "E",
          nota: "não-terminal — exige os dois lados",
          destaque: true,
          filhos: [
            { id: "campo1", label: "plano = pro", nota: "terminal — compara e devolve" },
            {
              id: "ou",
              label: "OU",
              nota: "não-terminal — basta um lado",
              destaque: true,
              filhos: [
                { id: "campo2", label: "regiao = sul", nota: "terminal" },
                { id: "nao", label: "NÃO (bloqueado = sim)", nota: "não-terminal de um filho só" },
              ],
            },
          ],
        },
      ],
      legenda:
        "A frase inteira é esta árvore. Avaliar é chamar interpretar() na raiz e deixar a recursão descer até os terminais, que são os únicos que realmente olham os dados.",
    },
    {
      tipo: "ilustracao",
      arquetipo: "antes-depois",
      antes: {
        titulo: "Regra no código (ou no eval)",
        itens: [
          "cada ajuste de critério vira um deploy",
          "quem entende a regra depende de quem programa",
          "avaliar texto com eval expõe execução de código",
          "não há como explicar por que alguém foi incluído",
        ],
        nota: "A flexibilidade só existe pelo caminho perigoso, e a regra não é um dado que se possa versionar, revisar ou auditar.",
      },
      depois: {
        titulo: "Regra como árvore de objetos",
        itens: [
          "a regra é dado: pode ser salva, versionada e revisada",
          "alterar não exige deploy",
          "sem eval — só os operadores que você definiu existem",
          "dá para instrumentar e explicar cada decisão",
        ],
        nota: "O custo é uma classe por regra gramatical e a necessidade de um parser se a entrada for texto — além de avaliação bem mais lenta que código compilado.",
      },
      legenda:
        "A troca é expressividade controlada por desempenho e cerimônia. Faz sentido enquanto a gramática for pequena; quando cresce, ferramentas dedicadas passam a ganhar.",
    },
    {
      tipo: "camadas-nav",
      titulo: "Navegue pelas camadas",
      camadas: [
        {
          id: "terminal",
          titulo: "Expressão terminal",
          curto: "a folha que olha os dados",
          detalhe:
            "Implementa a regra mais simples da gramática — uma comparação, uma constante. É o único tipo que realmente consulta o contexto; todo o resto apenas combina resultados.",
          exemplo: "class Campo { interpretar(ctx) { return ctx[this.nome] === this.valor } }",
          seViolar:
            "terminal que consulta banco ou chama API transforma a avaliação da árvore numa cascata de I/O imprevisível.",
        },
        {
          id: "naoterminal",
          titulo: "Expressão não-terminal",
          curto: "combina outras expressões",
          detalhe:
            "Contém filhos e define como compor os resultados deles: E, OU, NÃO. É onde mora a estrutura da linguagem, e cada operador novo é uma classe.",
          exemplo: "class E { interpretar(ctx) { return esq.interpretar(ctx) && dir.interpretar(ctx) } }",
          seViolar:
            "não-terminal com regra de negócio específica ('E, mas só para clientes pro') deixou de ser gramática e virou caso particular disfarçado.",
        },
        {
          id: "contexto",
          titulo: "Contexto",
          curto: "os dados da avaliação",
          detalhe:
            "Carrega os valores sobre os quais a expressão é avaliada e deve ser imutável durante a travessia. Uma árvore avaliada duas vezes com o mesmo contexto tem de dar o mesmo resultado.",
          exemplo: "regra.interpretar({ plano: 'pro', regiao: 'norte' })",
          seViolar:
            "contexto mutável faz o resultado depender da ordem de avaliação dos ramos — e a ordem é detalhe interno.",
        },
      ],
    },
    {
      tipo: "diagrama",
      titulo: "Estrutura",
      mermaid: MERMAID,
    },
    {
      tipo: "codigo",
      titulo: "Código",
      exemplos: EXEMPLOS,
    },
    {
      tipo: "casos",
      casos: [
        {
          titulo: "Segmentação de clientes em ferramenta de marketing",
          cenario:
            "Analistas precisam montar públicos como 'plano pro E (região sul OU compra nos últimos 30 dias)' pela interface, sem pedir nada ao time de engenharia.",
          aplicacao:
            "A interface monta a árvore de expressões; o backend a avalia contra cada cliente. A regra é salva como JSON, versionada e reutilizável entre campanhas.",
          tradeoff:
            "Avaliar a árvore por cliente não escala para milhões de registros: em algum momento a mesma árvore precisa ser traduzida para SQL, e manter os dois avaliadores coerentes vira trabalho permanente.",
        },
        {
          titulo: "Condições de alerta em monitoramento",
          cenario:
            "Times definem alertas como 'erro acima de 5% E latência acima de 300ms por 5 minutos', e cada equipe tem critérios próprios.",
          aplicacao:
            "Cada condição é uma árvore avaliada a cada janela de métricas. Como a regra é objeto, o sistema mostra qual ramo disparou — informação que um booleano opaco não daria.",
          tradeoff:
            "Regras temporais ('por 5 minutos') não cabem numa avaliação sem estado; a gramática precisa de operadores com memória, e a simplicidade original começa a se perder.",
        },
        {
          titulo: "Filtros salvos em ferramenta interna",
          cenario:
            "Um back-office permite montar filtros compostos sobre pedidos e salvá-los como visões compartilhadas entre a equipe.",
          aplicacao:
            "O filtro é uma árvore serializada. Ele pode ser validado antes de salvar, exibido de volta na interface e traduzido para a consulta do banco.",
          tradeoff:
            "Serializar a árvore cria um formato persistido: renomear um operador ou mudar sua semântica quebra os filtros que os usuários salvaram meses atrás.",
        },
      ],
    },
    {
      tipo: "armadilhas",
      itens: [
        {
          titulo: "A gramática cresce sem parar",
          texto:
            "Começa com E, OU e NÃO; em seis meses tem aritmética, funções de data, variáveis e precedência. Cada adição é uma classe e novas interações a testar. Se a gramática está crescendo todo mês, o padrão é a ferramenta errada — um parser gerado ou uma linguagem de expressão pronta escala muito melhor.",
        },
        {
          titulo: "Achar que o padrão inclui o parser",
          texto:
            "O Interpreter avalia a árvore; ele não transforma texto em árvore. Times descobrem isso depois de adotar o padrão e acabam escrevendo um parser à mão, com todos os problemas clássicos de precedência e mensagens de erro. Se a entrada for texto livre, planeje o parser desde o início.",
        },
        {
          titulo: "Terminal com efeito colateral",
          texto:
            "Um terminal que consulta banco parece prático e destrói as propriedades do padrão: a avaliação deixa de ser previsível, o custo passa a depender do formato da árvore e curtos-circuitos de E/OU fazem o número de consultas variar de forma misteriosa. Terminais devem ler apenas o contexto já carregado.",
        },
      ],
    },
    {
      tipo: "quando",
      usar: [
        "Existe uma mini-linguagem estável de regras que muda sem deploy.",
        "As regras precisam ser guardadas, versionadas e auditadas como dado.",
        "Você precisa explicar por que uma regra deu determinado resultado.",
      ],
      evitar: [
        "A gramática é grande ou cresce constantemente.",
        "Desempenho é crítico e o volume é alto.",
        "As regras são poucas e estáveis — funções bastam.",
      ],
    },
  ],
};
