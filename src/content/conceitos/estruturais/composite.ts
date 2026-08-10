import type { Conceito } from "@/shared/types/conceito";

const MERMAID = `classDiagram
    class No {
        <<interface>>
        +tamanho() int
    }
    class Arquivo {
        -bytes
        +tamanho() int
    }
    class Pasta {
        -filhos
        +tamanho() int
        +adicionar(no)
    }
    No <|.. Arquivo
    No <|.. Pasta
    Pasta o-- No : contem`;

const CAMADAS = [
  { id: "cliente", titulo: "Cliente", descricao: "Trata folha e composto do mesmo jeito" },
  {
    id: "componente",
    titulo: "Componente",
    descricao: "A interface comum que apaga a diferença — coração do padrão",
    destaque: true,
  },
  { id: "folha", titulo: "Folha", descricao: "O item indivisível: faz o trabalho de verdade" },
  { id: "composto", titulo: "Composto", descricao: "Contém filhos e delega a eles, somando os resultados" },
];

const EXEMPLOS = [
  {
    lang: "typescript" as const,
    code: `interface No {
  tamanho(): number;
}

// Folha: o caso base, indivisivel
class Arquivo implements No {
  constructor(private nome: string, private bytes: number) {}
  tamanho(): number {
    return this.bytes;
  }
}

// Composto: contem outros nos (folhas OU compostos) e delega
class Pasta implements No {
  private filhos: No[] = [];
  constructor(private nome: string) {}

  adicionar(no: No): this {
    this.filhos.push(no);
    return this;
  }

  tamanho(): number {
    // a recursao acontece aqui — e o cliente nunca a ve
    return this.filhos.reduce((total, f) => total + f.tamanho(), 0);
  }
}

const raiz = new Pasta("/")
  .adicionar(new Arquivo("leia.md", 120))
  .adicionar(
    new Pasta("fotos")
      .adicionar(new Arquivo("a.jpg", 2048))
      .adicionar(new Arquivo("b.jpg", 4096)),
  );

// Uma chamada so, sem saber a profundidade da arvore
console.log(raiz.tamanho()); // 6264`,
  },
  {
    lang: "python" as const,
    code: `from abc import ABC, abstractmethod

class No(ABC):
    @abstractmethod
    def tamanho(self) -> int: ...

# Folha: o caso base, indivisivel
class Arquivo(No):
    def __init__(self, nome, bytes_):
        self._nome, self._bytes = nome, bytes_

    def tamanho(self):
        return self._bytes

# Composto: contem outros nos e delega
class Pasta(No):
    def __init__(self, nome):
        self._nome = nome
        self._filhos = []

    def adicionar(self, no):
        self._filhos.append(no)
        return self

    def tamanho(self):
        # a recursao mora aqui — o cliente nunca a ve
        return sum(f.tamanho() for f in self._filhos)

raiz = Pasta("/")
raiz.adicionar(Arquivo("leia.md", 120))
raiz.adicionar(
    Pasta("fotos").adicionar(Arquivo("a.jpg", 2048)).adicionar(Arquivo("b.jpg", 4096))
)

print(raiz.tamanho())  # 6264`,
  },
];

export const composite: Conceito = {
  slug: "composite",
  titulo: "Composite",
  categoria: "estrutural",
  resumo:
    "Compõe objetos em árvores e faz o cliente tratar um item isolado e um grupo inteiro exatamente do mesmo jeito, através de uma interface comum.",
  tags: ["arvore", "recursao", "hierarquia", "gof"],
  dificuldade: "intermediario",
  tempoLeitura: 6,
  relacionados: ["decorator", "iterator", "visitor"],
  problema: [
    "Estruturas hierárquicas (pastas, menus, organogramas, grupos de produtos) misturam itens simples e grupos, e o cliente precisa saber com qual está lidando antes de agir.",
    "O código enche de `if (é grupo) { percorre filhos } else { age direto }` — e cada operação nova repete a mesma ramificação, agora em outro lugar.",
  ],
  solucao: [
    "Definir uma interface comum (Componente) que folhas e compostos implementam. O composto guarda uma lista de componentes e, ao receber uma operação, delega aos filhos e combina os resultados.",
    "A recursão fica encapsulada no composto. O cliente chama um método na raiz e a árvore inteira se resolve sozinha, com profundidade arbitrária.",
  ],
  quandoUsar: [
    "Os dados formam naturalmente uma árvore parte-todo (sistema de arquivos, menu, categorias).",
    "Você quer aplicar a mesma operação a um item e a um grupo sem o cliente distinguir os dois.",
    "A profundidade da hierarquia é variável ou desconhecida em tempo de escrita.",
  ],
  quandoEvitar: [
    "A estrutura é plana ou tem profundidade fixa e pequena — uma lista resolve com menos cerimônia.",
    "Folhas e compostos têm comportamentos genuinamente diferentes, e forçar uma interface comum enche a folha de métodos que ela não sabe cumprir.",
  ],
  mermaid: MERMAID,
  camadas: CAMADAS,
  exemplos: EXEMPLOS,
  blocos: [
    {
      tipo: "tldr",
      texto:
        "Folhas e grupos implementam a mesma interface, e o grupo delega aos filhos. Assim o cliente chama `tamanho()` na raiz sem saber se ali existe um arquivo ou dez mil — a recursão mora no padrão, não no chamador.",
    },
    {
      tipo: "analogia",
      emoji: "📦",
      titulo: "A caixa de mudança",
      texto:
        "Ao calcular o peso de uma mudança, você não pergunta se cada volume é 'um objeto' ou 'uma caixa com objetos dentro' — você pesa. Uma caixa pesa a soma do que carrega, e dentro dela pode haver outras caixas. A balança tem uma operação só, e funciona igual para um livro solto e para a caixa que contém a estante inteira.",
    },
    {
      tipo: "secao",
      id: "problema",
      titulo: "O problema",
      resumo: [
        "Hierarquias parte-todo aparecem em todo canto: pastas com pastas, menus com submenus, kits de produto que contêm outros kits. O que muda é a profundidade — e ela raramente é conhecida de antemão.",
        "Sem uma interface comum, cada operação (calcular tamanho, renderizar, aplicar desconto) precisa perguntar 'isto é um item ou um grupo?' antes de decidir o que fazer.",
      ],
      extensao: [
        "Essa ramificação é pior do que parece: ela não fica num lugar só. Cada operação nova repete o `if`, e cada tipo novo de nó exige revisitar todos os `if` existentes. É o cheiro clássico que o polimorfismo resolve.",
        "O Composite troca a ramificação por despacho dinâmico: a decisão 'sou folha ou grupo?' já está codificada na classe do objeto. Chamar o método certo é trabalho da linguagem, não seu.",
        "O padrão tem um parentesco próximo com **Decorator** (ambos compõem objetos da mesma interface), mas a intenção difere: o Decorator embrulha UM objeto para acrescentar comportamento; o Composite agrupa N objetos para representar uma hierarquia. E costuma andar junto com **Iterator** (para percorrer a árvore) e **Visitor** (para adicionar operações sem tocar nos nós).",
      ],
    },
    {
      tipo: "secao",
      id: "transparencia",
      titulo: "Transparência × segurança",
      resumo: [
        "A decisão mais controversa do padrão: os métodos de gerenciar filhos (`adicionar`, `remover`) ficam na interface comum ou só no composto?",
      ],
      extensao: [
        "Na versão **transparente**, `adicionar` mora na interface. O cliente trata todo mundo igual de verdade — mas uma folha precisa implementar `adicionar`, e a única saída honesta é lançar exceção. Isso viola Liskov: o subtipo não cumpre o contrato do supertipo.",
        "Na versão **segura**, `adicionar` existe só no composto. O tipo passa a ser verdadeiro, mas o cliente precisa de um cast (ou de um type guard) para montar a árvore — a uniformidade quebra justamente na construção.",
        "A escolha honesta depende de onde a árvore é montada. Se a construção acontece num lugar controlado (um parser, um builder, um repositório) e o resto do sistema só lê, a versão segura é melhor: o código que monta já conhece os tipos concretos. Se clientes arbitrários precisam recompor a árvore, a transparente reduz atrito ao custo de um método que mente.",
      ],
    },
    {
      tipo: "ilustracao",
      arquetipo: "estrutura",
      blocos: [
        {
          id: "raiz",
          label: "Pasta /",
          nota: "composto — soma os filhos",
          destaque: true,
          filhos: [
            { id: "leia", label: "leia.md", nota: "folha — 120 bytes" },
            {
              id: "fotos",
              label: "Pasta fotos",
              nota: "composto dentro de composto",
              destaque: true,
              filhos: [
                { id: "a", label: "a.jpg", nota: "folha — 2048 bytes" },
                { id: "b", label: "b.jpg", nota: "folha — 4096 bytes" },
              ],
            },
          ],
        },
      ],
      legenda:
        "A árvore é o padrão. Chamar tamanho() na raiz desce até as folhas e volta somando — e o cliente que fez a chamada não escreveu nenhuma recursão.",
    },
    {
      tipo: "camadas-nav",
      titulo: "Navegue pelas camadas",
      camadas: [
        {
          id: "componente",
          titulo: "Componente",
          curto: "a interface que apaga a diferença",
          detalhe:
            "Declara as operações de negócio que valem tanto para um item quanto para um grupo. Quanto mais enxuta, mais fácil é honrá-la nos dois lados — cada método adicionado precisa fazer sentido para uma folha.",
          exemplo: "interface No { tamanho(): number }",
          seViolar:
            "se a interface cresce com métodos que só o composto sabe cumprir, a folha passa a lançar exceção e o polimorfismo vira mentira.",
        },
        {
          id: "folha",
          titulo: "Folha",
          curto: "o caso base, indivisível",
          detalhe:
            "Implementa a operação fazendo o trabalho real. Não tem filhos e é onde a recursão termina — sem uma folha bem definida, a árvore não tem fundo.",
          exemplo: "class Arquivo implements No { tamanho() { return this.bytes } }",
          seViolar:
            "folha que guarda filhos 'só num caso especial' já é um composto mal nomeado.",
        },
        {
          id: "composto",
          titulo: "Composto",
          curto: "contém filhos e combina resultados",
          detalhe:
            "Guarda uma lista de componentes (folhas ou outros compostos) e implementa a operação delegando a cada filho e agregando. A agregação é a parte pensada: somar, concatenar, escolher o máximo.",
          exemplo: "tamanho() { return this.filhos.reduce((t, f) => t + f.tamanho(), 0) }",
          seViolar:
            "composto que verifica o tipo concreto dos filhos (`if (f instanceof Arquivo)`) recriou dentro do padrão a ramificação que ele existia para eliminar.",
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
          titulo: "Árvore de componentes de UI",
          cenario:
            "Uma interface é feita de elementos que contêm outros elementos: um formulário tem seções, que têm campos, que podem ter ícones — e a profundidade depende da tela.",
          aplicacao:
            "Todo elemento implementa `render()`. Containers renderizam os filhos e compõem o resultado. É exatamente o modelo do DOM e do React: um componente devolve outros componentes, e a raiz não sabe quantos níveis existem abaixo.",
          tradeoff:
            "Operações que precisam de contexto de cima (tema, largura disponível) não fluem naturalmente pela recursão — daí nascerem mecanismos extras como context/provider para furar a hierarquia.",
        },
        {
          titulo: "Permissões em organograma",
          cenario:
            "Um gestor pode ver os dados da própria equipe, incluindo as equipes dos gestores abaixo dele, com profundidade variável conforme a área.",
          aplicacao:
            "Cada nó (pessoa ou equipe) implementa `colaboradores()`. Uma equipe devolve os próprios membros mais os das subequipes; uma pessoa devolve a si mesma. A consulta 'quem eu posso ver' vira uma chamada na raiz da subárvore do gestor.",
          tradeoff:
            "Em organogramas grandes, a recursão vira muitas idas ao banco. Na prática se troca a árvore em memória por consultas com CTE recursiva ou por colunas de caminho materializado — o padrão continua no modelo, mas some da camada de dados.",
        },
        {
          titulo: "Kits e combos em e-commerce",
          cenario:
            "Um 'kit gamer' contém teclado, mouse e headset; um deles pode ser outro kit ('combo periféricos'), e o preço e o peso precisam sair certos para o frete.",
          aplicacao:
            "Produto e Kit implementam `preco()` e `peso()`. O kit soma os filhos e aplica seu desconto. Adicionar um kit dentro de outro não exige código novo.",
          tradeoff:
            "Descontos aninhados compõem de formas surpreendentes (desconto sobre desconto) e estoque de kit depende do estoque de todos os filhos — regras que a recursão simples não expressa e que acabam num serviço à parte.",
        },
      ],
    },
    {
      tipo: "armadilhas",
      itens: [
        {
          titulo: "Folha que lança exceção",
          texto:
            "Colocar `adicionar()` na interface comum para o cliente 'tratar tudo igual' e implementar na folha com `throw new UnsupportedOperation` é violar Liskov de forma explícita: o código que recebe um Componente não pode confiar no contrato. Ou o método sai da interface, ou a folha aceita a operação de forma sensata.",
        },
        {
          titulo: "Ciclos na árvore",
          texto:
            "Nada no padrão impede alguém de adicionar um nó como filho de seu próprio descendente. Quando isso acontece, a primeira chamada recursiva vira stack overflow — em produção, longe de onde o ciclo foi criado. Se a árvore é montada por entrada externa, validar aciclicidade na inserção não é preciosismo.",
        },
        {
          titulo: "Recursão cara escondida",
          texto:
            "A beleza do padrão é esconder a recursão; o risco é esconder o custo junto. `raiz.tamanho()` parece uma chamada barata e pode percorrer milhões de nós ou disparar uma query por nó. Em árvores grandes, memoizar o resultado no composto ou materializar o agregado deixa de ser otimização e vira requisito.",
        },
      ],
    },
    {
      tipo: "quando",
      usar: [
        "Os dados formam uma árvore parte-todo com profundidade variável.",
        "A mesma operação precisa valer para um item e para um grupo, sem o cliente distinguir.",
        "Você quer que adicionar um tipo novo de nó não exija revisitar os chamadores.",
      ],
      evitar: [
        "A estrutura é plana ou de profundidade fixa — uma lista basta.",
        "Folha e composto têm contratos genuinamente diferentes.",
        "A travessia é cara e precisa de controle fino (paginação, corte por profundidade) que a recursão esconde.",
      ],
    },
  ],
};
