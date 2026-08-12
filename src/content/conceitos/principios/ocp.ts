import type { Conceito } from "@/shared/types/conceito";

const MERMAID = `classDiagram
    class Desconto {
        <<interface>>
        +aplicar(valor) number
    }
    class DescontoNatal {
        +aplicar(valor)
    }
    class DescontoFidelidade {
        +aplicar(valor)
    }
    class Carrinho {
        -descontos
        +total()
    }
    Desconto <|.. DescontoNatal
    Desconto <|.. DescontoFidelidade
    Carrinho o-- Desconto : usa sem conhecer`;

const CAMADAS = [
  {
    id: "fechado",
    titulo: "Fechado para modificação",
    descricao: "O código existente não é tocado a cada requisito novo — coração do princípio",
    destaque: true,
  },
  { id: "aberto", titulo: "Aberto para extensão", descricao: "Comportamento novo entra como código novo" },
  { id: "ponto", titulo: "Ponto de extensão", descricao: "A abstração escolhida com base no que realmente varia" },
];

const EXEMPLOS = [
  {
    lang: "typescript" as const,
    code: `// ANTES: cada promocao nova reabre a mesma funcao
function totalRuim(valor: number, tipo: string): number {
  if (tipo === "natal") return valor * 0.9;
  if (tipo === "fidelidade") return valor - 10;
  if (tipo === "primeira-compra") return valor * 0.85;
  return valor; // e assim por diante, para sempre
}

// DEPOIS: o eixo de variacao vira abstracao
interface Desconto {
  aplicar(valor: number): number;
}

class DescontoNatal implements Desconto {
  aplicar(valor: number): number {
    return valor * 0.9;
  }
}

class DescontoFidelidade implements Desconto {
  aplicar(valor: number): number {
    return Math.max(0, valor - 10);
  }
}

class Carrinho {
  constructor(private descontos: Desconto[] = []) {}

  // esta classe nao muda mais quando surge uma promocao nova
  total(bruto: number): number {
    return this.descontos.reduce((v, d) => d.aplicar(v), bruto);
  }
}

// promocao nova = classe nova, zero alteracao no que existe
class DescontoCupom implements Desconto {
  constructor(private percentual: number) {}
  aplicar(valor: number): number {
    return valor * (1 - this.percentual);
  }
}

console.log(new Carrinho([new DescontoNatal(), new DescontoCupom(0.05)]).total(200));`,
  },
  {
    lang: "python" as const,
    code: `from abc import ABC, abstractmethod

# ANTES: cada promocao nova reabre a mesma funcao
def total_ruim(valor, tipo):
    if tipo == "natal":
        return valor * 0.9
    if tipo == "fidelidade":
        return valor - 10
    if tipo == "primeira-compra":
        return valor * 0.85
    return valor

# DEPOIS: o eixo de variacao vira abstracao
class Desconto(ABC):
    @abstractmethod
    def aplicar(self, valor): ...

class DescontoNatal(Desconto):
    def aplicar(self, valor):
        return valor * 0.9

class DescontoFidelidade(Desconto):
    def aplicar(self, valor):
        return max(0, valor - 10)

class Carrinho:
    def __init__(self, descontos=()):
        self._descontos = list(descontos)

    # esta classe nao muda mais quando surge uma promocao nova
    def total(self, bruto):
        for d in self._descontos:
            bruto = d.aplicar(bruto)
        return bruto

# promocao nova = classe nova, zero alteracao no que existe
class DescontoCupom(Desconto):
    def __init__(self, percentual):
        self._p = percentual
    def aplicar(self, valor):
        return valor * (1 - self._p)

print(Carrinho([DescontoNatal(), DescontoCupom(0.05)]).total(200))`,
  },
];

export const ocp: Conceito = {
  slug: "ocp",
  titulo: "OCP — Aberto/Fechado",
  categoria: "principio",
  resumo:
    "Módulos devem ser abertos para extensão e fechados para modificação: adicionar comportamento novo deveria significar escrever código novo, não reabrir e alterar o que já funciona.",
  tags: ["solid", "extensibilidade", "abstracao", "design"],
  dificuldade: "intermediario",
  tempoLeitura: 6,
  nasceu: {
    quando: { rotulo: "1988", ano: 1988, precisao: "aproximada" },
    fonte:
      "Bertrand Meyer, 'Object-Oriented Software Construction', 1988 — a formulação original, via herança; Robert C. Martin a redefiniu depois via abstração polimórfica",
    precursor:
      "Meyer pensava em herança; a leitura moderna, com interfaces e injeção de dependência, veio com a popularização do polimorfismo nos anos 1990-2000.",
  },
  ondeAparece: [
    {
      onde: "sistema de plugins (ESLint, Babel)",
      explicacao:
        "Você adiciona uma regra ou transformação escrevendo um plugin novo, sem nunca editar o núcleo — aberto para extensão, fechado para modificação.",
    },
    {
      onde: "middleware do Express",
      explicacao:
        "Cada comportamento novo (auth, log, cors) entra como uma função na cadeia; o roteador em si não muda a cada requisito que aparece.",
    },
    {
      onde: "extensões do VS Code",
      explicacao:
        "O editor ganha linguagens, temas e comandos novos por extensões instaladas, com o executável do VS Code intacto entre uma e outra.",
    },
  ],
  emUmaLinha: {
    lang: "typescript",
    code: `// Estende sem editar o núcleo fechado.
pagamentos.registrar("pix", novoPixStrategy);`,
  },
  custo: {
    indirecoes: 1,
    cobra: [
      "Um ponto de extensão a projetar e manter antes mesmo de saber se aquilo vai variar",
      "Abstração escolhida no eixo errado engessa justamente onde a mudança de fato acontece",
    ],
    naoValeSe:
      "não há sinal de que aquele comportamento vá variar — abstrair por antecipação é complexidade paga sem retorno.",
  },
  relacionados: ["srp", "lsp", "strategy"],
  problema: [
    "Requisitos novos chegam como mais um caso: mais um tipo de desconto, mais um formato de exportação, mais um meio de pagamento. Cada um reabre a mesma função e adiciona um ramo.",
    "Código que já estava correto e testado é modificado por um motivo que não tem nada a ver com ele — e a chance de quebrar o que funcionava cresce a cada rodada.",
  ],
  solucao: [
    "Identificar o eixo que varia e transformá-lo numa abstração. O código que orquestra passa a depender da abstração e não precisa mais mudar quando surge uma variante.",
    "Comportamento novo entra como implementação nova. O que já existe permanece intocado — e, portanto, permanece testado.",
  ],
  quandoUsar: [
    "Um mesmo trecho é modificado repetidamente para acomodar variantes do mesmo tipo.",
    "Você já viu a terceira ocorrência do mesmo padrão de mudança e o eixo ficou evidente.",
    "Terceiros precisam estender o sistema sem alterar seu código (plugins, integrações).",
  ],
  quandoEvitar: [
    "Você ainda não sabe qual eixo vai variar — abstrair sem evidência produz a abstração errada.",
    "A variação é única e não há sinal de que virá outra.",
    "O custo da indireção supera o do `if`: nem todo ramo precisa virar classe.",
  ],
  mermaid: MERMAID,
  camadas: CAMADAS,
  exemplos: EXEMPLOS,
  blocos: [
    {
      tipo: "tldr",
      texto:
        "Se cada requisito novo obriga a reabrir a mesma função e acrescentar um `if`, o eixo de variação está sem abstração. Com ela, comportamento novo vira classe nova — e o código que já funcionava não é tocado nem re-testado.",
    },
    {
      tipo: "analogia",
      emoji: "🔌",
      titulo: "A tomada da parede",
      texto:
        "Comprar um abajur não exige chamar um eletricista para abrir a parede: você pluga na tomada. A instalação elétrica foi fechada para modificação e aberta para extensão no dia em que alguém padronizou o formato do plugue. Note que o padrão foi definido antes, e não para cada aparelho novo — é isso que o torna útil.",
    },
    {
      tipo: "secao",
      id: "problema",
      titulo: "O problema",
      resumo: [
        "Certas funções viram ímãs de mudança: toda semana alguém acrescenta mais um caso ao mesmo `switch`. Elas crescem, ficam difíceis de ler e concentram o risco de regressão.",
        "O incômodo real não é estético. Cada modificação em código testado exige re-testar, revisar e arriscar — mesmo quando o requisito novo nada tem a ver com os antigos.",
      ],
      extensao: [
        "O ponto sutil é que o princípio **não proíbe modificar código**. Ele diz que, para o eixo que você já sabe que varia, deveria existir um ponto de extensão. Correções de bug, mudanças de requisito no núcleo e refatorações continuam sendo modificação legítima.",
        "Isso leva ao equilíbrio mais importante da prática: OCP aplicado cedo demais é adivinhação. Abstrair um eixo antes de saber que ele varia costuma produzir a abstração errada — e uma abstração errada custa mais do que o `if` que ela substituiu, porque agora é preciso desfazê-la.",
        "A heurística que funciona é esperar a evidência. Na primeira ocorrência, escreva direto. Na segunda, observe. Na terceira, o eixo já se declarou e a abstração pode ser desenhada sobre fatos, não sobre suposição.",
      ],
    },
    {
      tipo: "secao",
      id: "mecanismos",
      titulo: "Como se fecha um módulo",
      resumo: [
        "OCP é um objetivo, não uma técnica. Vários mecanismos o alcançam, e a escolha depende de quanto de variação existe e de quem precisa estender.",
      ],
      extensao: [
        "**Strategy** é o mais direto: o comportamento variável vira um objeto injetado. É a forma usada no exemplo e serve à maioria dos casos de regra de negócio.",
        "**Template Method** fecha a sequência e abre os passos — útil quando a ordem é a invariante e o miolo é o que varia.",
        "**Registro de handlers** (um mapa de tipo → implementação) funciona bem quando as variantes são muitas e descobertas em tempo de execução, como em plugins.",
        "E há a opção de não usar padrão nenhum: em linguagens funcionais, passar uma função como parâmetro alcança o mesmo fechamento com muito menos cerimônia. O princípio é sobre onde a mudança chega, não sobre quantas classes existem.",
      ],
    },
    {
      tipo: "ilustracao",
      arquetipo: "antes-depois",
      antes: {
        titulo: "Fechado para extensão, aberto para modificação",
        itens: [
          "cada promoção nova acrescenta um if na mesma função",
          "código testado é reaberto por motivo alheio",
          "a função cresce e concentra todo o risco",
          "duas pessoas mexendo em promoções diferentes conflitam",
        ],
        nota: "O sistema resiste a crescer: cada requisito novo aumenta a chance de quebrar um requisito antigo que já estava resolvido.",
      },
      depois: {
        titulo: "Aberto para extensão, fechado para modificação",
        itens: [
          "promoção nova é uma classe nova",
          "o carrinho não muda mais por causa de promoções",
          "cada desconto é testável isoladamente",
          "quem estende não precisa entender o resto",
        ],
        nota: "O custo é ter acertado o eixo: se amanhã a variação for por região em vez de por tipo de promoção, a abstração escolhida atrapalha em vez de ajudar.",
      },
      legenda:
        "O princípio move o risco: em vez de arriscar o que já funciona a cada requisito, você arrisca ter escolhido o ponto de extensão errado. Por isso a evidência antes da abstração importa tanto.",
    },
    {
      tipo: "ilustracao",
      arquetipo: "estrutura",
      blocos: [
        {
          id: "carrinho",
          label: "Carrinho (fechado)",
          nota: "depende só da interface Desconto",
          destaque: true,
          filhos: [
            { id: "iface", label: "interface Desconto", nota: "o ponto de extensão" },
          ],
        },
        {
          id: "impls",
          label: "Implementações (abertas)",
          nota: "crescem sem tocar no carrinho",
          filhos: [
            { id: "natal", label: "DescontoNatal", nota: "existente" },
            { id: "fidelidade", label: "DescontoFidelidade", nota: "existente" },
            { id: "cupom", label: "DescontoCupom", nota: "adicionado hoje", opcional: true },
          ],
        },
      ],
      legenda:
        "A fronteira é a interface. Tudo à esquerda dela permanece parado enquanto o lado direito cresce — e é isso que significa fechar sem impedir a evolução.",
    },
    {
      tipo: "camadas-nav",
      titulo: "Navegue pelas camadas",
      camadas: [
        {
          id: "eixo",
          titulo: "O eixo de variação",
          curto: "o que realmente muda",
          detalhe:
            "A dimensão em que os requisitos novos chegam: tipo de desconto, formato de saída, meio de pagamento. Descobri-lo é o trabalho difícil; abstraí-lo é a parte mecânica.",
          exemplo: "// três meses de commits mostraram: o que varia é a regra de desconto",
          seViolar:
            "escolher o eixo errado cria uma abstração que precisa ser furada a cada requisito — pior do que não ter abstração.",
        },
        {
          id: "abstracao",
          titulo: "A abstração",
          curto: "o contrato do ponto de extensão",
          detalhe:
            "Deve ser mínima e estável: quanto menor a interface, mais fácil implementá-la e menos motivos ela terá para mudar. Cada método adicionado aqui é trabalho para todas as implementações.",
          exemplo: "interface Desconto { aplicar(valor: number): number }",
          seViolar:
            "interface que cresce a cada caso novo perde a estabilidade e passa a exigir modificação — exatamente o que o princípio queria evitar.",
        },
        {
          id: "cliente",
          titulo: "O código fechado",
          curto: "orquestra sem conhecer variantes",
          detalhe:
            "Depende só da abstração e não contém nenhuma decisão por tipo concreto. É o trecho que deveria parar de aparecer nos diffs quando um requisito de variação chega.",
          exemplo: "total(bruto) { return this.descontos.reduce((v, d) => d.aplicar(v), bruto) }",
          seViolar:
            "um `if (desconto instanceof DescontoNatal)` no código fechado reabre a porta e anula o princípio inteiro.",
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
          titulo: "Meios de pagamento em checkout",
          cenario:
            "O checkout aceitava cartão e boleto; em um ano entraram Pix, carteira digital e pagamento parcelado em duas formas diferentes.",
          aplicacao:
            "Cada meio implementa a mesma interface de cobrança e se registra num catálogo. O fluxo de checkout parou de mudar; meios novos entram sem tocar nele.",
          tradeoff:
            "Meios de pagamento têm fluxos genuinamente distintos (Pix é assíncrono, cartão tem pré-autorização). Uma interface única acaba com métodos que só alguns implementam de verdade, e a abstração começa a mentir.",
        },
        {
          titulo: "Exportadores de relatório",
          cenario:
            "Um relatório exportava CSV; depois vieram XLSX, PDF e um formato específico exigido por um cliente grande.",
          aplicacao:
            "Um exportador por formato, escolhido por um registro. Adicionar o formato do cliente foi uma classe nova, sem risco para os três já em produção.",
          tradeoff:
            "Formatos com capacidades diferentes (PDF tem paginação, CSV não) forçam a interface ao menor denominador comum, e recursos específicos acabam vazando por opções extras que só um exportador entende.",
        },
        {
          titulo: "Plugins de terceiros",
          cenario:
            "Uma plataforma precisa permitir que integradores adicionem comportamento sem acesso ao código-fonte nem ao ciclo de release.",
          aplicacao:
            "O ponto de extensão é publicado como contrato versionado; plugins são carregados em tempo de execução. Aqui o princípio deixa de ser conselho e vira requisito de arquitetura.",
          tradeoff:
            "A interface vira compromisso público e praticamente imutável: qualquer mudança quebra plugins de terceiros, então erros de desenho ficam para sempre — ou exigem manter duas versões em paralelo.",
        },
      ],
    },
    {
      tipo: "armadilhas",
      itens: [
        {
          titulo: "Abstrair antes da evidência",
          texto:
            "Criar uma interface porque 'um dia pode variar' é a forma mais comum de complexidade acidental. Com um implementador só, a interface é adivinhação — e quando o segundo caso chega, quase nunca encaixa. Espere o terceiro caso concreto antes de fechar o eixo.",
        },
        {
          titulo: "Abstração furada",
          texto:
            "O sintoma é o `if (x instanceof Y)` reaparecendo no código que deveria estar fechado, ou um parâmetro `opcoes` genérico que só uma implementação entende. Quando isso acontece, o eixo escolhido não era o certo — e insistir na abstração custa mais que voltar atrás.",
        },
        {
          titulo: "Fechar tudo, por precaução",
          texto:
            "Aplicar OCP em todos os pontos produz um sistema de interfaces com um implementador cada, onde seguir uma chamada exige abrir cinco arquivos. O princípio serve aos eixos que comprovadamente variam; os demais ficam melhor escritos de forma direta.",
        },
      ],
    },
    {
      tipo: "quando",
      usar: [
        "O mesmo trecho é reaberto repetidamente para acomodar variantes.",
        "O eixo de variação já se mostrou em pelo menos três casos.",
        "Terceiros precisam estender sem alterar seu código.",
      ],
      evitar: [
        "Você ainda não sabe o que vai variar.",
        "A variação é única e sem sinal de repetição.",
        "A indireção custa mais que o ramo condicional.",
      ],
    },
  ],
};
