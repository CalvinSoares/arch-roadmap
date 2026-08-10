import type { Conceito } from "@/shared/types/conceito";

const MERMAID = `classDiagram
    class No {
        <<interface>>
        +aceitar(v) any
    }
    class Numero {
        +valor
        +aceitar(v)
    }
    class Soma {
        +esq
        +dir
        +aceitar(v)
    }
    class Visitante {
        <<interface>>
        +visitarNumero(n)
        +visitarSoma(s)
    }
    No <|.. Numero
    No <|.. Soma
    Numero ..> Visitante : chama visitarNumero
    Soma ..> Visitante : chama visitarSoma`;

const CAMADAS = [
  { id: "estrutura", titulo: "Estrutura de nós", descricao: "Tipos estáveis que só sabem aceitar visitantes" },
  {
    id: "visitante",
    titulo: "Visitante",
    descricao: "Uma operação inteira, separada dos nós — coração do padrão",
    destaque: true,
  },
  { id: "despacho", titulo: "Duplo despacho", descricao: "aceitar() escolhe o método certo pelo tipo real do nó" },
];

const EXEMPLOS = [
  {
    lang: "typescript" as const,
    code: `interface Visitante<T> {
  visitarNumero(n: Numero): T;
  visitarSoma(s: Soma): T;
}

interface No {
  aceitar<T>(v: Visitante<T>): T;
}

class Numero implements No {
  constructor(readonly valor: number) {}
  // duplo despacho: o no sabe QUAL metodo do visitante chamar
  aceitar<T>(v: Visitante<T>): T {
    return v.visitarNumero(this);
  }
}

class Soma implements No {
  constructor(readonly esq: No, readonly dir: No) {}
  aceitar<T>(v: Visitante<T>): T {
    return v.visitarSoma(this);
  }
}

// Operacao 1: calcular — nenhuma mudanca nas classes de no
class Avaliador implements Visitante<number> {
  visitarNumero(n: Numero): number {
    return n.valor;
  }
  visitarSoma(s: Soma): number {
    return s.esq.aceitar(this) + s.dir.aceitar(this);
  }
}

// Operacao 2: imprimir — de novo, sem tocar nos nos
class Impressor implements Visitante<string> {
  visitarNumero(n: Numero): string {
    return String(n.valor);
  }
  visitarSoma(s: Soma): string {
    return \`(\${s.esq.aceitar(this)} + \${s.dir.aceitar(this)})\`;
  }
}

const expr = new Soma(new Numero(1), new Soma(new Numero(2), new Numero(3)));
console.log(expr.aceitar(new Impressor())); // (1 + (2 + 3))
console.log(expr.aceitar(new Avaliador())); // 6`,
  },
  {
    lang: "python" as const,
    code: `from abc import ABC, abstractmethod

class No(ABC):
    @abstractmethod
    def aceitar(self, v): ...

class Numero(No):
    def __init__(self, valor):
        self.valor = valor
    # duplo despacho: o no sabe QUAL metodo chamar
    def aceitar(self, v):
        return v.visitar_numero(self)

class Soma(No):
    def __init__(self, esq, dir):
        self.esq, self.dir = esq, dir
    def aceitar(self, v):
        return v.visitar_soma(self)

# Operacao 1: calcular — sem tocar nas classes de no
class Avaliador:
    def visitar_numero(self, n):
        return n.valor
    def visitar_soma(self, s):
        return s.esq.aceitar(self) + s.dir.aceitar(self)

# Operacao 2: imprimir — de novo, sem tocar nos nos
class Impressor:
    def visitar_numero(self, n):
        return str(n.valor)
    def visitar_soma(self, s):
        return f"({s.esq.aceitar(self)} + {s.dir.aceitar(self)})"

expr = Soma(Numero(1), Soma(Numero(2), Numero(3)))
print(expr.aceitar(Impressor()))  # (1 + (2 + 3))
print(expr.aceitar(Avaliador()))  # 6`,
  },
];

export const visitor: Conceito = {
  slug: "visitor",
  titulo: "Visitor",
  categoria: "comportamental",
  resumo:
    "Separa operações da estrutura de objetos sobre a qual elas atuam, permitindo adicionar comportamentos novos sem modificar as classes existentes — ao custo de congelar o conjunto de tipos.",
  tags: ["duplo-despacho", "arvore", "compilador", "gof"],
  dificuldade: "avancado",
  tempoLeitura: 7,
  relacionados: ["composite", "iterator", "state"],
  problema: [
    "Uma estrutura com vários tipos de nó precisa de operações novas com frequência: avaliar, imprimir, otimizar, validar, exportar. Colocar cada uma dentro dos nós faz classes de domínio incharem com responsabilidades que não são delas.",
    "Pior: cada operação nova obriga a editar todas as classes de nó, e o código de uma mesma operação fica espalhado por dezenas de arquivos.",
  ],
  solucao: [
    "Mover cada operação para um objeto visitante com um método por tipo de nó. Os nós ganham apenas um `aceitar(visitante)` que chama o método correspondente ao seu próprio tipo.",
    "Essa devolução de chamada é o duplo despacho: a primeira chamada resolve o tipo do nó, a segunda resolve a operação. Com isso, cada operação fica inteira num arquivo só.",
  ],
  quandoUsar: [
    "O conjunto de tipos é estável e o de operações cresce (ASTs, documentos, relatórios).",
    "Uma operação precisa de lógica diferente por tipo e você quer vê-la inteira num lugar só.",
    "As operações não pertencem conceitualmente ao domínio dos nós.",
  ],
  quandoEvitar: [
    "Tipos novos aparecem com frequência — cada um obriga a alterar todos os visitantes existentes.",
    "Há poucas operações e elas são naturais aos objetos: um método comum é mais simples e mais legível.",
    "A linguagem oferece casamento de padrões sobre tipos, que resolve o mesmo problema com muito menos cerimônia.",
  ],
  mermaid: MERMAID,
  camadas: CAMADAS,
  exemplos: EXEMPLOS,
  blocos: [
    {
      tipo: "tldr",
      texto:
        "Cada operação vira uma classe com um método por tipo de nó, e os nós só sabem dizer 'me visite'. Adicionar 'imprimir' ou 'otimizar' não toca em nenhuma classe existente — mas adicionar um tipo novo de nó obriga a mexer em todos os visitantes.",
    },
    {
      tipo: "analogia",
      emoji: "🏥",
      titulo: "O perito que visita a fábrica",
      texto:
        "Uma fábrica tem tornos, prensas e esteiras. Em vez de ensinar cada máquina a se autoavaliar para segurança, contabilidade e eficiência energética, chegam peritos: o de segurança sabe o que olhar em cada tipo de máquina, o contador sabe outra coisa. Contratar um perito novo não exige modificar máquina nenhuma — mas comprar um tipo de máquina inédito exige treinar todos os peritos.",
    },
    {
      tipo: "secao",
      id: "problema",
      titulo: "O problema",
      resumo: [
        "Estruturas heterogêneas — a árvore sintática de uma linguagem, os blocos de um documento, os nós de um relatório — atraem operações. Cada nova exigência de negócio quer percorrer a mesma árvore fazendo algo diferente.",
        "Se cada operação vira um método nos nós, as classes crescem sem parar e passam a misturar representação com dezenas de comportamentos não relacionados.",
      ],
      extensao: [
        "O padrão inverte a direção da extensibilidade, e entender isso é entender o Visitor. Um método por nó facilita adicionar TIPOS (a classe nova traz seus métodos) e dificulta adicionar OPERAÇÕES (é preciso editar todas as classes). O Visitor faz o oposto: operações entram de graça, tipos custam caro.",
        "Esse dilema tem nome — o **problema da expressão**. Nenhuma das duas organizações resolve os dois lados ao mesmo tempo em linguagens orientadas a objetos convencionais. Escolher entre método e visitante é escolher qual eixo você espera que cresça.",
        "O mecanismo que viabiliza tudo é o **duplo despacho**. Linguagens comuns despacham por um tipo só (o do receptor). Como precisamos escolher o comportamento pela combinação nó × operação, o `aceitar` faz o primeiro salto — o nó, que conhece o próprio tipo, chama o método específico do visitante. É um truque para simular algo que a linguagem não oferece nativamente.",
      ],
    },
    {
      tipo: "secao",
      id: "alternativas",
      titulo: "Quando a linguagem já resolve",
      resumo: [
        "Boa parte da cerimônia do Visitor existe para contornar limitações que linguagens modernas não têm mais. Vale checar antes de adotá-lo.",
      ],
      extensao: [
        "Com **uniões discriminadas** e casamento de padrões (TypeScript com `switch` sobre um campo `tipo`, Rust, Kotlin com `sealed`, Scala), uma operação nova é uma função com um `match` — sem `aceitar`, sem interface de visitante, e ainda com verificação de exaustividade do compilador, que avisa quando um tipo novo não foi tratado.",
        "Essa checagem de exaustividade é exatamente a garantia que o Visitor oferece por outro caminho: se você adiciona um método à interface do visitante, todos os visitantes deixam de compilar até tratá-lo. A diferença é a quantidade de código necessária para chegar lá.",
        "A recomendação prática: em linguagens com união fechada e casamento de padrões, prefira a função com `match`. Reserve o Visitor para linguagens sem esse recurso, ou quando os visitantes precisam carregar estado próprio e configuração, caso em que a classe se paga.",
      ],
    },
    {
      tipo: "ilustracao",
      arquetipo: "fluxo",
      atores: [
        { id: "cliente", label: "Cliente" },
        { id: "no", label: "Soma.aceitar(v)" },
        { id: "visitante", label: "Impressor.visitarSoma()", destaque: true },
        { id: "filhos", label: "Filhos aceitam de novo" },
      ],
      setas: [
        { label: "1º despacho: tipo do nó" },
        { label: "2º despacho: operação" },
        { label: "recursão pela árvore", tracejada: true },
      ],
      legenda:
        "São dois saltos: o nó resolve quem ele é, o visitante resolve o que fazer. Essa dupla resolução é o que a linguagem não faz sozinha e o padrão fornece.",
    },
    {
      tipo: "ilustracao",
      arquetipo: "antes-depois",
      antes: {
        titulo: "Operação como método no nó",
        itens: [
          "adicionar um tipo de nó é fácil: a classe traz seus métodos",
          "adicionar uma operação exige editar todas as classes",
          "a lógica de 'imprimir' fica espalhada por dez arquivos",
          "os nós acumulam responsabilidades alheias ao domínio",
        ],
        nota: "Bom quando os tipos crescem e as operações são poucas e estáveis — o caso mais comum em modelos de domínio comuns.",
      },
      depois: {
        titulo: "Operação como visitante",
        itens: [
          "adicionar uma operação é uma classe nova, sem tocar em nada",
          "a lógica de 'imprimir' fica inteira num arquivo",
          "os nós ficam magros, só com representação",
          "adicionar um tipo obriga a mexer em todos os visitantes",
        ],
        nota: "Bom quando os tipos são estáveis e as operações crescem — compiladores, interpretadores e processadores de documento vivem disso.",
      },
      legenda:
        "Não existe lado vencedor: é o problema da expressão. A pergunta a responder antes de escolher é qual eixo vai crescer mais nos próximos anos, tipos ou operações.",
    },
    {
      tipo: "camadas-nav",
      titulo: "Navegue pelas camadas",
      camadas: [
        {
          id: "no",
          titulo: "Nó",
          curto: "representa, e aceita visitas",
          detalhe:
            "Guarda os dados e implementa `aceitar`, cuja única função é chamar o método do visitante correspondente ao seu tipo. Não conhece nenhuma operação concreta.",
          exemplo: "aceitar<T>(v: Visitante<T>): T { return v.visitarSoma(this) }",
          seViolar:
            "nó com lógica de negócio dentro do `aceitar` recria o acoplamento que o padrão veio eliminar.",
        },
        {
          id: "visitante",
          titulo: "Visitante",
          curto: "uma operação inteira",
          detalhe:
            "Declara um método por tipo de nó. Pode carregar estado durante a travessia (um acumulador, uma profundidade de indentação), o que é uma das vantagens sobre funções soltas.",
          exemplo: "visitarSoma(s) { return s.esq.aceitar(this) + s.dir.aceitar(this) }",
          seViolar:
            "visitante que faz `if (no instanceof Numero)` desistiu do duplo despacho e perdeu a verificação do compilador.",
        },
        {
          id: "travessia",
          titulo: "A travessia",
          curto: "quem decide a ordem",
          detalhe:
            "A recursão pode ficar no visitante (flexível: cada operação escolhe a ordem) ou no nó (uniforme: todos percorrem igual). A primeira dá poder, a segunda evita repetir a travessia em cada visitante.",
          exemplo: "// no visitante: s.esq.aceitar(this) antes de s.dir.aceitar(this)",
          seViolar:
            "misturar as duas abordagens faz alguns visitantes visitarem filhos duas vezes — bug silencioso em árvores grandes.",
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
          titulo: "Compilador sobre a árvore sintática",
          cenario:
            "Uma linguagem tem uns quarenta tipos de nó sintático, estáveis desde a especificação, e precisa de análise de tipos, otimização, geração de código e formatação.",
          aplicacao:
            "Cada fase é um visitante. Adicionar uma otimização nova é criar uma classe, sem tocar na definição da árvore — e cada fase fica legível inteira, de cima a baixo.",
          tradeoff:
            "Um recurso novo na linguagem (um tipo de nó inédito) obriga a atualizar todos os visitantes de uma vez. Em compiladores maduros isso é raro; numa linguagem em desenho, é constante e doloroso.",
        },
        {
          titulo: "Exportação de documento em vários formatos",
          cenario:
            "Um editor representa o documento como árvore de blocos (parágrafo, lista, tabela, imagem) e precisa exportar para HTML, Markdown e PDF.",
          aplicacao:
            "Um visitante por formato de saída. Cada um sabe converter todos os tipos de bloco, e o código de HTML não se mistura com o de PDF.",
          tradeoff:
            "Um tipo de bloco novo (um embed de vídeo) quebra a compilação de todos os exportadores — o que é bom (nada passa esquecido) e ruim (uma feature pequena vira mudança em vários arquivos).",
        },
        {
          titulo: "Análise estática de configuração",
          cenario:
            "Uma ferramenta de infraestrutura precisa validar segurança, estimar custo e detectar recursos órfãos sobre a mesma árvore de configuração.",
          aplicacao:
            "Cada análise é um visitante que acumula seus achados durante a travessia. Rodar só a de segurança ou todas juntas é escolha de quem chama.",
          tradeoff:
            "Visitantes com estado acumulado não são reutilizáveis entre execuções nem seguros em paralelo — cada análise precisa de uma instância nova, o que é fácil de esquecer.",
        },
      ],
    },
    {
      tipo: "armadilhas",
      itens: [
        {
          titulo: "Adotar com tipos instáveis",
          texto:
            "É o erro que torna o padrão odiado. Se a estrutura ainda está sendo desenhada e tipos entram todo mês, cada um deles vira uma alteração em todos os visitantes existentes. O Visitor só se paga depois que o conjunto de tipos assentou — antes disso, ele multiplica o custo de cada mudança.",
        },
        {
          titulo: "Cair no instanceof",
          texto:
            "Quando o duplo despacho incomoda, aparece a tentação de escrever um visitante genérico com uma cadeia de `instanceof`. Isso devolve toda a cerimônia sem nenhum dos ganhos: some a verificação do compilador, e um tipo novo passa despercebido até dar erro em produção.",
        },
        {
          titulo: "Quebrar o encapsulamento dos nós",
          texto:
            "Para o visitante fazer seu trabalho, ele precisa ler os dados do nó — o que empurra tudo para público. A estrutura acaba virando um saco de dados anêmico. É um custo real do padrão, aceitável em ASTs (que são dados mesmo) e problemático em modelos de domínio com invariantes a proteger.",
        },
      ],
    },
    {
      tipo: "quando",
      usar: [
        "Os tipos são estáveis e as operações crescem.",
        "Você quer cada operação inteira num arquivo só.",
        "As operações não pertencem ao domínio dos nós.",
      ],
      evitar: [
        "Tipos novos aparecem com frequência.",
        "A linguagem tem união fechada e casamento de padrões.",
        "São poucas operações, naturais aos objetos.",
      ],
    },
  ],
};
