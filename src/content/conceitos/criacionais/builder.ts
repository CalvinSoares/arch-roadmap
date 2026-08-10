import type { Conceito } from "@/shared/types/conceito";

const MERMAID = `classDiagram
    class PedidoBuilder {
        -itens: Lista~string~
        -cupom: string
        -embrulho: boolean
        +adicionarItem(item) PedidoBuilder
        +comCupom(codigo) PedidoBuilder
        +paraPresente() PedidoBuilder
        +construir() Pedido
    }
    class Pedido {
        +itens: Lista~string~
        +cupom: string
        +embrulho: boolean
    }
    class Director {
        <<opcional>>
        +pedidoPresentePadrao(builder) Pedido
    }
    PedidoBuilder ..> Pedido : construir() valida e monta
    Director ..> PedidoBuilder : encadeia receitas prontas`;

const CAMADAS = [
  { id: "cliente", titulo: "Cliente", descricao: "Encadeia apenas os passos que precisa" },
  {
    id: "builder",
    titulo: "Builder",
    descricao: "Acumula estado parcial passo a passo — cada método devolve o próprio builder",
    destaque: true,
  },
  {
    id: "construir",
    titulo: "construir()",
    descricao: "Ponto único de validação: checa invariantes e monta o objeto",
  },
  { id: "produto", titulo: "Produto", descricao: "Objeto completo e imutável — nunca existe pela metade" },
];

const EXEMPLOS = [
  {
    lang: "typescript" as const,
    code: `class Pedido {
  constructor(
    readonly itens: string[],
    readonly cupom?: string,
    readonly embrulho = false,
  ) {}
}
// Sem builder: new Pedido(itens, undefined, true)
// — quem lê não sabe o que o "true" significa

class PedidoBuilder {
  private itens: string[] = [];
  private cupom?: string;
  private embrulho = false;

  adicionarItem(item: string): this {
    this.itens.push(item);
    return this;                    // fluent: cada passo devolve o builder
  }
  comCupom(codigo: string): this {
    this.cupom = codigo;
    return this;
  }
  paraPresente(): this {
    this.embrulho = true;
    return this;
  }
  construir(): Pedido {
    if (this.itens.length === 0) throw new Error("Pedido sem itens");
    return new Pedido([...this.itens], this.cupom, this.embrulho);
  }
}

const pedido = new PedidoBuilder()
  .adicionarItem("Camiseta P")
  .comCupom("BEMVINDO10")
  .paraPresente()
  .construir();                     // só aqui o Pedido passa a existir
console.log(pedido.embrulho);       // true — e o nome do passo explica o porquê`,
  },
  {
    lang: "python" as const,
    code: `class Pedido:
    def __init__(self, itens, cupom=None, embrulho=False):
        self.itens = itens
        self.cupom = cupom
        self.embrulho = embrulho

class PedidoBuilder:
    def __init__(self):
        self._itens = []
        self._cupom = None
        self._embrulho = False

    def adicionar_item(self, item):
        self._itens.append(item)
        return self               # fluent: cada passo devolve o builder

    def com_cupom(self, codigo):
        self._cupom = codigo
        return self

    def para_presente(self):
        self._embrulho = True
        return self

    def construir(self):
        if not self._itens:
            raise ValueError("Pedido sem itens")
        return Pedido(list(self._itens), self._cupom, self._embrulho)

pedido = (
    PedidoBuilder()
    .adicionar_item("Camiseta P")
    .com_cupom("BEMVINDO10")
    .para_presente()
    .construir()                  # só aqui o Pedido passa a existir
)
print(pedido.embrulho)  # True`,
  },
];

export const builder: Conceito = {
  slug: "builder",
  titulo: "Builder",
  categoria: "criacional",
  resumo:
    "Constrói objetos complexos passo a passo por uma interface fluente, separando a montagem (incremental, com escolhas opcionais) do objeto final (completo e validado).",
  tags: ["gof", "fluent-interface", "imutabilidade", "telescoping-constructor"],
  dificuldade: "intermediario",
  tempoLeitura: 6,
  relacionados: ["factory-method", "abstract-factory"],
  problema: [
    "Objetos com muitos parâmetros opcionais empurram o código para o telescoping constructor: uma escada de construtores sobrecarregados ou chamadas como new Pedido(itens, null, true, null, false), em que ninguém sabe o que cada posição significa.",
    "A alternativa ingênua — criar vazio e preencher com setters — deixa o objeto existir em estados intermediários inválidos: qualquer código pode usá-lo pela metade, e a validação se espalha por todos os pontos de uso.",
  ],
  solucao: [
    "O Builder concentra a montagem em um objeto auxiliar: cada método configura uma parte e devolve o próprio builder (fluent interface), permitindo encadear apenas os passos relevantes, em ordem legível e com nome autoexplicativo.",
    "O objeto final só nasce no construir(), que valida as invariantes em um ponto único e entrega o produto completo — de preferência imutável. Opcionalmente, um Director guarda receitas de montagem reutilizáveis sobre o mesmo builder.",
  ],
  quandoUsar: [
    "O objeto tem muitos parâmetros opcionais ou combináveis e os construtores viraram uma escada ilegível.",
    "A construção exige validação entre campos ou passos ordenados antes de o objeto poder existir.",
    "Você quer um produto imutável, mas a montagem precisa ser incremental (dados chegam aos poucos).",
    "Os mesmos passos de construção produzem representações diferentes (builder de HTML e de PDF sobre o mesmo relatório).",
  ],
  quandoEvitar: [
    "Objetos com dois ou três campos autoexplicativos — o builder é cerimônia pura.",
    "A linguagem já resolve com parâmetros nomeados e default (Python, Kotlin) ou objeto literal tipado (TypeScript) e não há validação entre passos.",
    "O 'builder' seria só um espelho de setters sem validação alguma — um objeto de configuração simples comunica melhor.",
  ],
  mermaid: MERMAID,
  camadas: CAMADAS,
  exemplos: EXEMPLOS,
  blocos: [
    {
      tipo: "tldr",
      texto:
        "Monte objetos complexos passo a passo: cada método do builder configura uma parte e devolve o próprio builder; construir() valida tudo em um ponto único e entrega o objeto pronto — adeus construtor de oito parâmetros posicionais.",
    },
    {
      tipo: "analogia",
      emoji: "🥪",
      titulo: "O balcão de sanduíches",
      texto:
        "Você não entrega uma lista de doze ingredientes de uma vez ao atendente — escolhe o pão, depois a proteína, pula o que não quer, acrescenta extras. Cada escolha é opcional e tem nome claro. O atendente (builder) acumula os passos e monta na ordem certa; o sanduíche só existe quando você diz 'pode fechar'. Ninguém recebe um sanduíche pela metade nem precisa decorar em que posição da lista vai o queijo.",
    },
    {
      tipo: "secao",
      id: "problema",
      titulo: "O problema",
      resumo: [
        "Objetos com muitos parâmetros opcionais empurram o código para o telescoping constructor: uma escada de construtores sobrecarregados ou chamadas como new Pedido(itens, null, true, null), em que ninguém sabe o que cada posição significa.",
        "A alternativa ingênua — criar vazio e ir preenchendo com setters — deixa o objeto existir em estados intermediários inválidos, e a validação se espalha por todos os pontos de uso.",
      ],
      extensao: [
        "O nome 'telescoping constructor' vem da forma: construtor de 2 parâmetros chama o de 3, que chama o de 4, como um telescópio se abrindo. Cada combinação de opcionais pede mais uma sobrecarga, e o chamador acaba passando null/false posicionais para alcançar o parâmetro que interessa. É o cheiro clássico que o Builder resolve — popularizado nessa forma fluente por Joshua Bloch no Effective Java.",
        "Vale distinguir as duas encarnações do padrão. O Builder clássico do GoF separa construção de representação: um Director executa os mesmos passos sobre builders diferentes para produzir produtos diferentes (o mesmo roteiro gera relatório HTML ou PDF). O builder fluente do dia a dia ataca outro problema — legibilidade e validação de objetos com muitos opcionais — e raramente tem Director. Os dois compartilham o mecanismo: acumular estado parcial e entregar o produto no final.",
        "Honestidade necessária: em linguagens com parâmetros nomeados e valores default (Python, Kotlin, C#) ou objeto literal tipado (TypeScript), boa parte dos casos dispensa builder — new Pedido({ itens, embrulho: true }) já é legível. O builder volta a valer a pena quando há validação entre campos, passos que precisam de ordem, ou quando você quer imutabilidade com montagem incremental.",
      ],
    },
    {
      tipo: "ilustracao",
      arquetipo: "fluxo",
      atores: [
        { id: "cliente", label: "Cliente" },
        { id: "builder", label: "Builder", destaque: true },
        { id: "parcial", label: "Estado parcial" },
        { id: "produto", label: "Objeto completo" },
      ],
      setas: [
        { label: "encadeia passos com nome" },
        { label: "acumula escolhas", tracejada: true },
        { label: "construir() valida e monta" },
      ],
      legenda:
        "As escolhas se acumulam no builder — o objeto final só passa a existir depois que construir() valida tudo de uma vez.",
    },
    {
      tipo: "camadas-nav",
      titulo: "Navegue pelas camadas",
      camadas: [
        {
          id: "cliente",
          titulo: "Cliente",
          curto: "encadeia só os passos que precisa",
          detalhe:
            "Lê como uma frase: cada passo tem nome de negócio (comCupom, paraPresente) e os opcionais simplesmente não aparecem. A ordem dos passos costuma ser livre — quem garante a coerência é o construir(), não o chamador.",
          exemplo: "new PedidoBuilder()\n  .adicionarItem(\"Camiseta P\")\n  .paraPresente()",
          seViolar:
            "cliente que monta o objeto por setters depois do construir() reabre a janela de estados inválidos que o builder fechou.",
        },
        {
          id: "builder",
          titulo: "Builder (acumulador)",
          curto: "estado parcial que devolve a si mesmo",
          detalhe:
            "Guarda as escolhas em campos privados mutáveis; cada método configura uma parte e devolve this para permitir o encadeamento (fluent interface). É a única peça do arranjo autorizada a estar 'pela metade'.",
          exemplo: "comCupom(codigo: string): this {\n  this.cupom = codigo;\n  return this;\n}",
          seViolar:
            "métodos que não devolvem this quebram a fluência; builder exposto como estado compartilhado vira objeto mutável global.",
        },
        {
          id: "construir",
          titulo: "construir()",
          curto: "validação e nascimento em um ponto único",
          detalhe:
            "Checa as invariantes que envolvem mais de um campo (pedido tem itens? desconto é compatível com o vencimento?) e só então instancia o produto. Concentrar a validação aqui é metade do valor do padrão.",
          exemplo: "if (this.itens.length === 0) throw new Error(\"Pedido sem itens\");",
          seViolar:
            "construir() que aceita qualquer coisa transforma o builder em açúcar sintático — o objeto inválido nasce do mesmo jeito, só que mais bonito.",
        },
        {
          id: "produto",
          titulo: "Produto",
          curto: "completo e imutável desde o nascimento",
          detalhe:
            "O objeto final recebe tudo no construtor e idealmente não expõe setters. Quem tem uma instância de Pedido tem a garantia de que ele passou pela validação — não existe Pedido pela metade circulando no sistema.",
          exemplo: "class Pedido {\n  constructor(readonly itens: string[], readonly cupom?: string) {}\n}",
          seViolar:
            "produto mutável convida o código a contornar o builder e editar depois — as invariantes validadas no construir() deixam de ser garantia.",
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
          titulo: "Cobrança Pix com juros, multa e desconto",
          cenario:
            "Uma fintech emite cobranças com vencimento em que quase tudo é opcional — juros, multa, desconto por antecipação — mas as combinações têm regras: desconto só antes do vencimento, multa só depois.",
          aplicacao:
            "Um CobrancaBuilder expõe um passo nomeado por campo opcional e o construir() valida as combinações antes de chamar o provedor. O código de emissão lê como a regra de negócio, e cobrança inválida nem chega a existir como objeto.",
          tradeoff:
            "O builder vira o guardião das regras de combinação — quando a API do provedor muda uma regra, é preciso lembrar que a validação vive no builder, não só no contrato externo.",
        },
        {
          titulo: "Query builder de relatórios",
          cenario:
            "Um SaaS de analytics monta consultas com filtros, ordenação, agrupamento e paginação opcionais — é o mesmo problema que Knex e o construtor de queries do Prisma resolvem em produção.",
          aplicacao:
            "Cada tela encadeia só os passos que usa (porPeriodo, agrupadoPor, ordenadoPor) e o construir() gera o SQL/objeto de consulta coerente. Combinações inválidas (agrupamento sem métrica) falham na montagem, não no banco.",
          tradeoff:
            "O builder garante consulta sintaticamente válida, não consulta boa: continua fácil encadear passos que geram um plano de execução péssimo — ele não substitui a revisão do SQL gerado.",
        },
        {
          titulo: "Test data builders na suíte de testes",
          cenario:
            "Os testes de um e-commerce precisam de pedidos em dezenas de variações — pago, cancelado, com N itens, com cupom — e montar cada um na mão duplica detalhes irrelevantes em todo teste.",
          aplicacao:
            "Um umPedido() com defaults válidos e passos como .pago() e .comItens(3) deixa cada teste declarar apenas o que importa para o cenário. Mudou o modelo? Ajusta-se o builder, não os duzentos testes.",
          tradeoff:
            "Os defaults escondidos podem mascarar o que o teste realmente exige — um teste que passa por causa de um default do builder é um teste que mente sobre o próprio cenário.",
        },
      ],
    },
    {
      tipo: "armadilhas",
      itens: [
        {
          titulo: "construir() que não valida",
          texto:
            "Se qualquer sequência de passos produz um objeto — inclusive um quebrado —, o builder é só sintaxe bonita em volta do mesmo bug. As invariantes que cruzam campos (itens não vazios, desconto compatível com vencimento) pertencem ao construir(); as de campo único podem falhar já no próprio passo.",
        },
        {
          titulo: "Builder reutilizado entre produtos",
          texto:
            "Chamar construir() duas vezes na mesma instância vaza estado do primeiro objeto para o segundo — o cupom do pedido anterior aparece no próximo. Crie um builder por produto, ou faça o construir() resetar/invalidar a instância explicitamente.",
        },
        {
          titulo: "Builder para objeto de três campos",
          texto:
            "Em TypeScript, new Pedido({ itens, embrulho: true }) com um objeto literal tipado dá legibilidade de graça; em Python, parâmetros nomeados idem. Builder ali é uma classe inteira para resolver um problema que a linguagem já resolveu — reserve-o para quando houver validação entre passos ou montagem incremental de verdade.",
        },
      ],
    },
    {
      tipo: "quando",
      usar: [
        "O objeto tem muitos parâmetros opcionais ou combináveis e os construtores viraram uma escada ilegível.",
        "A construção exige validação entre campos ou passos ordenados antes de o objeto poder existir.",
        "Você quer um produto imutável com montagem incremental (dados chegam aos poucos).",
        "Os mesmos passos de construção produzem representações diferentes (Director + builders distintos).",
      ],
      evitar: [
        "Objetos com dois ou três campos autoexplicativos — cerimônia pura.",
        "A linguagem resolve com parâmetros nomeados/default ou objeto literal tipado e não há validação entre passos.",
        "O 'builder' seria só um espelho de setters sem validação — um objeto de configuração comunica melhor.",
      ],
    },
  ],
};
