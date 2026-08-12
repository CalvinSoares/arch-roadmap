import type { Conceito } from "@/shared/types/conceito";
import { gof } from "@/content/conceitos/_nascimento";

const MERMAID = `classDiagram
    class Contexto {
      -estrategia: Estrategia
      +definirEstrategia(e)
      +executar(dados)
    }
    class Estrategia {
      <<interface>>
      +executar(dados)
    }
    class EstrategiaA {
      +executar(dados)
    }
    class EstrategiaB {
      +executar(dados)
    }
    Contexto o--> Estrategia : delega
    Estrategia <|.. EstrategiaA
    Estrategia <|.. EstrategiaB`;

const CAMADAS = [
  { id: "cliente", titulo: "Cliente", descricao: "Escolhe e injeta a estratégia" },
  {
    id: "contexto",
    titulo: "Contexto",
    descricao: "Delega à estratégia — onde o padrão atua",
    destaque: true,
  },
  { id: "interface", titulo: "Interface Estrategia", descricao: "Contrato comum dos algoritmos" },
  { id: "concretas", titulo: "Estratégias concretas", descricao: "Cada variação do algoritmo" },
];

const EXEMPLOS = [
  {
    lang: "typescript" as const,
    code: `interface Frete {
  calcular(pesoKg: number): number;
}

class Sedex implements Frete {
  calcular(pesoKg: number) { return 20 + pesoKg * 3; }
}
class Pac implements Frete {
  calcular(pesoKg: number) { return 12 + pesoKg * 1.5; }
}

class Carrinho {
  constructor(private frete: Frete) {}
  usarFrete(f: Frete) { this.frete = f; }
  total(subtotal: number, pesoKg: number) {
    return subtotal + this.frete.calcular(pesoKg);
  }
}

const carrinho = new Carrinho(new Pac());
console.log(carrinho.total(100, 2));   // 115
carrinho.usarFrete(new Sedex());
console.log(carrinho.total(100, 2));   // 126`,
  },
  {
    lang: "python" as const,
    code: `from typing import Protocol

class Frete(Protocol):
    def calcular(self, peso_kg: float) -> float: ...

class Sedex:
    def calcular(self, peso_kg: float) -> float:
        return 20 + peso_kg * 3

class Pac:
    def calcular(self, peso_kg: float) -> float:
        return 12 + peso_kg * 1.5

class Carrinho:
    def __init__(self, frete: Frete):
        self._frete = frete
    def usar_frete(self, frete: Frete):
        self._frete = frete
    def total(self, subtotal: float, peso_kg: float) -> float:
        return subtotal + self._frete.calcular(peso_kg)

carrinho = Carrinho(Pac())
print(carrinho.total(100, 2))   # 115.0
carrinho.usar_frete(Sedex())
print(carrinho.total(100, 2))   # 126.0`,
  },
];

const ANTI_EXEMPLO = `interface Frete { calcular(peso: number): number; }
class Sedex implements Frete { calcular(p: number) { return p * 2.5; } }
class Pac   implements Frete { calcular(p: number) { return p * 1.2; } }

class Carrinho {
  // A interface existe... e a decisao continua aqui dentro.
  private estrategia(tipo: string): Frete {
    switch (tipo) {
      case "sedex": return new Sedex();
      case "pac":   return new Pac();
      default: throw new Error("tipo desconhecido");
    }
  }

  total(peso: number, tipo: string) {
    return this.estrategia(tipo).calcular(peso);  // <- Carrinho conhece TODAS
  }
}

// Transportadora nova = editar Carrinho. O Aberto/Fechado continua violado,
// so que agora com tres arquivos em vez de um.`;

export const strategy: Conceito = {
  slug: "strategy",
  titulo: "Strategy",
  categoria: "comportamental",
  resumo:
    "Encapsula uma família de algoritmos intercambiáveis por trás de uma interface comum, deixando o cliente trocar a estratégia em tempo de execução.",
  tags: ["gof", "polimorfismo", "algoritmos", "composicao"],
  dificuldade: "iniciante",
  tempoLeitura: 6,
  nasceu: gof(),
  ondeAparece: [
    {
      onde: "O comparador de Array.sort",
      explicacao:
        "O algoritmo de ordenação é fixo; o critério de comparação entra por parâmetro.",
    },
    {
      onde: "Strategies do Passport",
      explicacao:
        "O nome é literal: local, OAuth e JWT são estratégias plugáveis atrás de uma interface só.",
    },
  ],
  emUmaLinha: {
    lang: "typescript",
    code: `// A estrategia entra de fora. So isso.
const total = (itens, calcularFrete) =>
  soma(itens) + calcularFrete(peso(itens));`,
  },
  custo: {
    indirecoes: 1,
    cobra: [
      "Uma interface e uma classe (ou função) por variante",
      "A escolha de qual estratégia usar migra para quem compõe — e precisa morar em algum lugar",
    ],
    naoValeSe:
      "existem duas variantes e elas nunca mudam. Um `if` é mais honesto que uma hierarquia.",
  },
  relacionados: ["observer", "factory-method"],
  problema: [
    "Um objeto precisa executar uma tarefa que tem várias variações de algoritmo — ordenar de formas diferentes, calcular frete por transportadora, aplicar descontos por tipo de cliente. Concentrar tudo numa classe leva a um emaranhado de condicionais que cresce a cada nova variação.",
    "Esses blocos condicionais violam o princípio Aberto/Fechado: adicionar um novo comportamento exige mexer no código que já funciona, aumentando o risco de regressão.",
  ],
  solucao: [
    "Extrai-se cada variação do algoritmo para uma classe própria que implementa uma interface comum (a 'estratégia'). O 'contexto' guarda uma referência a uma estratégia e delega o trabalho a ela.",
    "Como o contexto depende só da abstração, trocar de comportamento vira injetar outra estratégia. Novos algoritmos entram como novas classes, sem tocar no contexto.",
  ],
  quandoUsar: [
    "Há várias maneiras de fazer a mesma coisa e você quer escolher uma em tempo de execução.",
    "Uma classe está cheia de condicionais que selecionam comportamentos parecidos.",
    "Você quer isolar detalhes de um algoritmo (regras voláteis) do restante do código.",
    "Precisa testar variações de comportamento isoladamente, mockando a estratégia.",
  ],
  quandoEvitar: [
    "Só existem poucas variações estáveis que raramente mudam — a indireção não compensa.",
    "O cliente teria de conhecer as diferenças entre as estratégias para escolher, vazando complexidade.",
  ],
  mermaid: MERMAID,
  camadas: CAMADAS,
  exemplos: EXEMPLOS,
  blocos: [
    {
      tipo: "tldr",
      texto:
        "Cada variação de um algoritmo vira uma classe atrás de uma interface comum; o contexto só delega. Trocar de comportamento é injetar outra estratégia — sem if/else e sem tocar no código que já funciona.",
    },
    {
      tipo: "analogia",
      emoji: "🧭",
      titulo: "Como o app de mapas escolhe a rota",
      texto:
        "Mesmo destino, mas você troca entre 'mais rápida', 'sem pedágio' ou 'a pé'. Cada opção é um algoritmo diferente calculando o mesmo resultado (a rota). Você troca a estratégia sem trocar o mapa. Strategy é isso: algoritmos intercambiáveis atrás da mesma interface.",
    },
    {
      tipo: "secao",
      id: "problema",
      titulo: "O problema",
      resumo: [
        "Uma tarefa tem várias variações de algoritmo (frete por transportadora, desconto por cliente...). Concentrar tudo numa classe vira um emaranhado de if/else que cresce a cada variação.",
        "E isso viola o Aberto/Fechado: cada novo comportamento obriga a mexer no código que já funciona.",
      ],
      extensao: [
        "A raiz do problema é misturar o que é estável com o que varia. A estrutura da tarefa ('calcular o total do carrinho') quase não muda; a regra interna ('como calcular o frete') muda toda hora. Enquanto os dois moram na mesma classe, cada mudança na parte volátil arrisca a parte estável — e o condicional que escolhe a variação se duplica em todo lugar que precisa da mesma decisão.",
        "A alternativa clássica é herança: criar CarrinhoComSedex, CarrinhoComPac... Funciona até precisar variar uma segunda dimensão (desconto, embalagem) — aí as subclasses explodem em combinações, e o comportamento fica fixado em tempo de compilação. Strategy troca herança por composição: o comportamento é um objeto que se injeta e se troca em runtime, e cada dimensão de variação vira uma família de estratégias independente.",
        "Uma nuance de linguagem: em TypeScript, Python e afins, uma estratégia pode ser só uma função — passar calcularFrete como parâmetro já é Strategy em espírito. A classe vale a pena quando a estratégia tem dependências próprias, várias operações relacionadas ou precisa de configuração; o padrão é o contrato estável, não a cerimônia de classes.",
      ],
    },
    {
      tipo: "ilustracao",
      arquetipo: "fluxo",
      atores: [
        { id: "cliente", label: "Cliente" },
        { id: "contexto", label: "Contexto", destaque: true },
        { id: "interface", label: "Interface Estrategia" },
        { id: "concreta", label: "Estratégia concreta" },
      ],
      setas: [
        { label: "injeta e chama" },
        { label: "delega executar()" },
        { label: "despacha para", tracejada: true },
      ],
      legenda:
        "O contexto enxerga só a interface — qual algoritmo roda é decisão de quem injeta, em tempo de execução.",
    },
    {
      tipo: "ilustracao",
      arquetipo: "antes-depois",
      antes: {
        titulo: "Sem Strategy: um if/else que cresce",
        itens: [
          "calcularFrete() com um switch sobre o tipo de entrega",
          "cada modalidade nova reabre o mesmo método",
          "testar uma regra exige montar o objeto inteiro",
          "duas pessoas mexendo em modalidades diferentes conflitam no mesmo arquivo",
        ],
        nota: "O custo aparece na manutenção: o método vira o ponto de encontro de todas as regras, e ninguém consegue mudar uma sem ler as outras.",
      },
      depois: {
        titulo: "Com Strategy: uma classe por regra",
        itens: [
          "FreteSedex, FretePac, FreteRetirada implementam a mesma interface",
          "modalidade nova é arquivo novo — o cálculo existente não é tocado",
          "cada regra é testável isolada, sem montar o contexto",
          "quem injeta decide, em tempo de execução",
        ],
        nota: "O custo se desloca para a indireção: mais arquivos e um salto a mais para ler o fluxo. Vale quando as regras mudam com frequência — não quando são duas e estáveis.",
      },
      legenda:
        "O padrão não elimina a complexidade das regras: ele troca ramificação dentro de um método por polimorfismo entre classes. A pergunta certa é se as regras mudam o bastante para pagar a indireção.",
    },
    {
      tipo: "demo",
      titulo: "Troque a estratégia e veja recalcular",
      demo: "strategy",
    },
    {
      tipo: "passos",
      titulo: "O fluxo, passo a passo",
      passos: [
        { titulo: "Definir a interface", texto: "Uma interface comum descreve o algoritmo (ex.: calcularFrete)." },
        { titulo: "Implementar variações", texto: "Cada algoritmo vira uma classe que implementa a interface." },
        { titulo: "Injetar no contexto", texto: "O contexto recebe uma estratégia e guarda a referência." },
        { titulo: "Delegar", texto: "O contexto chama a estratégia — e você pode trocá-la em runtime." },
      ],
    },
    {
      tipo: "camadas-nav",
      titulo: "Navegue pelas camadas",
      camadas: [
        {
          id: "cliente",
          titulo: "Cliente",
          curto: "escolhe e injeta a estratégia",
          detalhe:
            "É o único que conhece as estratégias concretas. Decide qual usar — por escolha do usuário, configuração, feature flag — e injeta no contexto. Concentrar a escolha aqui mantém o resto do sistema ignorante das variações.",
          exemplo: "const carrinho = new Carrinho(new Pac());\ncarrinho.usarFrete(new Sedex()); // troca em runtime",
          seViolar:
            "se a escolha se espalhar por vários pontos do código, cada estratégia nova exige caçar todos os lugares que decidem — o condicional voltou, só que distribuído.",
        },
        {
          id: "contexto",
          titulo: "Contexto",
          curto: "delega sem saber qual concreta está atrás",
          detalhe:
            "Guarda a referência à abstração e delega o trabalho. Não contém nenhuma lógica das variações nem sabe quantas existem — por isso novas estratégias entram sem alterá-lo. É onde o Aberto/Fechado se materializa.",
          exemplo: "total(subtotal: number, pesoKg: number) {\n  return subtotal + this.frete.calcular(pesoKg);\n}",
          seViolar:
            "um instanceof ou checagem de tipo dentro do contexto quebra o polimorfismo: o contexto volta a conhecer as concretas e cada variação nova o obriga a mudar.",
        },
        {
          id: "interface",
          titulo: "Interface Estrategia",
          curto: "contrato comum dos algoritmos",
          detalhe:
            "Define a assinatura que toda variação honra: mesmas entradas, mesmo tipo de saída. É o que torna as estratégias intercambiáveis — e o ponto mais difícil de projetar bem: a interface precisa bastar para a estratégia mais exigente sem poluir as demais.",
          exemplo: "interface Frete {\n  calcular(pesoKg: number): number;\n}",
          seViolar:
            "parâmetros que só uma estratégia usa contaminam todas as outras; quando a interface vira um saco de opções, a intercambialidade é ilusão.",
        },
        {
          id: "concretas",
          titulo: "Estratégias concretas",
          curto: "cada variação do algoritmo, isolada",
          detalhe:
            "Cada classe implementa uma variação completa e testável sozinha — dá para cobrir a regra do Sedex sem montar carrinho nenhum. Idealmente são stateless: recebem tudo por parâmetro e não guardam estado entre chamadas, o que permite compartilhar instâncias com segurança.",
          exemplo: "class Sedex implements Frete {\n  calcular(pesoKg: number) { return 20 + pesoKg * 3; }\n}",
          seViolar:
            "estratégia que lê ou muda estado interno do contexto cria acoplamento circular — trocá-la em runtime passa a corromper dados, e a intercambialidade acaba.",
        },
      ],
    },
    {
      tipo: "diagrama",
      titulo: "Estrutura (diagrama de classes)",
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
          titulo: "Cálculo de frete por transportadora",
          cenario:
            "Um e-commerce cotiza com Correios, transportadora própria e retirada na loja — cada uma com tabela, prazo e regra de peso diferentes, e novas parcerias chegando todo trimestre.",
          aplicacao:
            "Interface Frete com calcular(); uma classe por transportadora; o checkout injeta a estratégia conforme a escolha do usuário. Parceria nova = classe nova, sem tocar no fluxo do pedido.",
          tradeoff:
            "Alguém ainda precisa mapear escolha→estratégia; na prática esse papel vai para uma factory, e o par Strategy + Factory vira o desenho completo.",
        },
        {
          titulo: "Precificação por tipo de cliente",
          cenario:
            "Varejo, atacado e assinante premium pagam preços diferentes pelo mesmo catálogo, e o comercial inventa política nova a cada campanha.",
          aplicacao:
            "Uma PoliticaPreco por perfil, selecionada no login ou na sessão. Cada política é testada isoladamente com casos de borda próprios — e a campanha nova entra sem regressão nas demais.",
          tradeoff:
            "Quando as dimensões se multiplicam (perfil × campanha × região), uma estratégia por combinação explode; passa a ser preciso compor estratégias, e composição tem custo próprio de design.",
        },
        {
          titulo: "Compressão e serialização plugáveis",
          cenario:
            "Um serviço exporta relatórios em JSON, CSV ou Parquet, e comprime a resposta com gzip ou brotli conforme o que o cliente aceita.",
          aplicacao:
            "Interfaces Serializador e Compressor; a escolha vem do content-type e do header Accept-Encoding. O pipeline de exportação é escrito uma vez e nunca sabe qual formato está gerando.",
          tradeoff:
            "Formatos têm capacidades desiguais (streaming, tipos ricos, schema) — a interface comum nivela por baixo, e recursos exclusivos de um formato ficam de fora do contrato.",
        },
      ],
    },
    {
      tipo: "anti-exemplo",
      titulo: "A Strategy que continua sendo um if/else",
      comoSeParece:
        "As classes de estratégia existem, implementam a interface, tudo parece certo — mas quem escolhe qual usar é um `switch` dentro da própria classe que deveria ignorar a escolha. O polimorfismo foi adiado, não aplicado.",
      codigo: { lang: "typescript", code: ANTI_EXEMPLO },
      sintomas: [
        { quando: "Ao adicionar variante", efeito: "É preciso editar a classe que deveria ser fechada para modificação — exatamente o que o padrão prometia evitar." },
        { quando: "No teste", efeito: "Testar `Carrinho` exige conhecer todas as estratégias reais, porque não há como injetar uma falsa." },
        { quando: "Na revisão", efeito: "O `switch` se multiplica: aparece de novo em cada lugar que precisa escolher, e eles saem de sincronia." },
      ],
      correcao:
        "A estratégia entra **de fora** — por construtor ou parâmetro. Se ainda for preciso mapear string para implementação, esse mapa vive na composição da aplicação (ou numa Factory), e não dentro de quem usa a estratégia.",
    },
    {
      tipo: "refatoracao",
      cheiro:
        "Um `switch` que cresce a cada regra nova de frete, dentro da classe que só queria somar o carrinho.",
      inicio: { lang: "typescript", code: `class Carrinho {
  total(peso: number, tipo: string) {
    let frete = 0;
    if (tipo === "sedex") frete = peso * 2.5;
    else if (tipo === "pac") frete = peso * 1.2;
    else if (tipo === "retirada") frete = 0;
    else throw new Error("tipo desconhecido");
    return this.soma() + frete;
  }
}` },
      passos: [
        {
          titulo: "Extrair o cálculo",
          motivo:
            "Antes de trocar a estrutura, isole o que varia numa função só. Este passo **não muda comportamento** — e é o que permite verificar os próximos com o teste existente.",
          depois: { lang: "typescript", code: `class Carrinho {
  total(peso: number, tipo: string) {
    return this.soma() + this.calcularFrete(peso, tipo);
  }

  private calcularFrete(peso: number, tipo: string) {
    if (tipo === "sedex") return peso * 2.5;
    if (tipo === "pac") return peso * 1.2;
    if (tipo === "retirada") return 0;
    throw new Error("tipo desconhecido");
  }
}` },
        },
        {
          titulo: "Virar uma função por variante",
          motivo:
            "Cada ramo do `if` era uma regra independente disfarçada de condição. Como funções separadas, cada uma passa a ser testável sozinha.",
          depois: { lang: "typescript", code: `type CalculoDeFrete = (peso: number) => number;

const sedex: CalculoDeFrete = (peso) => peso * 2.5;
const pac: CalculoDeFrete = (peso) => peso * 1.2;
const retirada: CalculoDeFrete = () => 0;

class Carrinho {
  total(peso: number, tipo: string) {
    const tabela: Record<string, CalculoDeFrete> = { sedex, pac, retirada };
    const calculo = tabela[tipo];
    if (!calculo) throw new Error("tipo desconhecido");
    return this.soma() + calculo(peso);
  }
}` },
        },
        {
          titulo: "Injetar de fora",
          motivo:
            "Aqui está a virada: o `Carrinho` deixa de conhecer as variantes. Ele recebe a que deve usar, e transportadora nova **não toca nesta classe** — que é o Aberto/Fechado saindo do slide e entrando no código.",
          depois: { lang: "typescript", code: `type CalculoDeFrete = (peso: number) => number;

class Carrinho {
  // A estrategia entra pelo construtor. O Carrinho nao conhece nenhuma.
  constructor(private readonly frete: CalculoDeFrete) {}

  total(peso: number) {
    return this.soma() + this.frete(peso);
  }
}

// O mapeamento string -> implementacao vira responsabilidade de
// quem COMPOE a aplicacao, nao de quem usa a estrategia.
const FRETES = {
  sedex: (peso: number) => peso * 2.5,
  pac: (peso: number) => peso * 1.2,
  retirada: () => 0,
} as const;

const carrinho = new Carrinho(FRETES[tipoEscolhido]);` },
        },
      ],
      veredito:
        "Ganhou-se: transportadora nova sem tocar no `Carrinho`, e cada cálculo testável isolado. Pagou-se: um parâmetro a mais no construtor e a decisão de qual frete usar migrou para a composição — ela não desapareceu, mudou de lugar. Se houvesse só duas variantes e elas nunca mudassem, o `if` original era mais honesto.",
    },
    {
      tipo: "armadilhas",
      itens: [
        {
          titulo: "Strategy para duas variações estáveis",
          texto:
            "Interface + duas classes + injeção para um comportamento que tem duas ramificações e não muda há dois anos é overkill: um if legível ganha em clareza e custo. O padrão paga o próprio preço quando a variação é real e crescente — aplique quando a terceira variação aparecer no horizonte, não antes (YAGNI).",
        },
        {
          titulo: "O if/else gigante só mudou de lugar",
          texto:
            "Se o cliente escolhe a estratégia com uma cadeia enorme de condicionais, o emaranhado migrou do contexto para o cliente — o problema trocou de endereço, não sumiu. Combine com Factory: um mapa de nome→estratégia reduz a escolha a um lookup e concentra o cadastro de variações num único lugar.",
        },
        {
          titulo: "Estratégias com estado compartilhado",
          texto:
            "Estratégia que acumula estado entre chamadas ou mexe em estado do contexto deixa de ser intercambiável: trocar no meio de uma operação corrompe dados, e uma instância compartilhada entre requests vira condição de corrida. Prefira estratégias stateless que recebem tudo por parâmetro — o que também as torna triviais de testar.",
        },
      ],
    },
    {
      tipo: "quando",
      usar: [
        "Há várias maneiras de fazer a mesma coisa e você quer escolher uma em tempo de execução.",
        "Uma classe está cheia de condicionais que selecionam comportamentos parecidos.",
        "Você quer isolar um algoritmo volátil do restante do código.",
      ],
      evitar: [
        "Só existem poucas variações estáveis que raramente mudam — a indireção não compensa.",
        "O cliente teria de conhecer as diferenças entre estratégias para escolher.",
      ],
    },
  ],
};
