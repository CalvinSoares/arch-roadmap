import type { Conceito } from "@/shared/types/conceito";

const MERMAID = `classDiagram
    class FabricaDeMoveis {
        <<interface>>
        +criarCadeira() Cadeira
        +criarMesa() Mesa
        +criarSofa() Sofa
    }
    class FabricaModerna {
        +criarCadeira() Cadeira
        +criarMesa() Mesa
        +criarSofa() Sofa
    }
    class FabricaVitoriana {
        +criarCadeira() Cadeira
        +criarMesa() Mesa
        +criarSofa() Sofa
    }
    class Cadeira {
        <<interface>>
    }
    class Mesa {
        <<interface>>
    }
    FabricaDeMoveis <|.. FabricaModerna
    FabricaDeMoveis <|.. FabricaVitoriana
    Cadeira <|.. CadeiraModerna
    Cadeira <|.. CadeiraVitoriana
    Mesa <|.. MesaModerna
    Mesa <|.. MesaVitoriana
    FabricaModerna ..> CadeiraModerna : cria
    FabricaModerna ..> MesaModerna : cria
    FabricaVitoriana ..> CadeiraVitoriana : cria
    FabricaVitoriana ..> MesaVitoriana : cria`;

const CAMADAS = [
  { id: "cliente", titulo: "Cliente", descricao: "Usa só as interfaces — nunca dá new em produto concreto" },
  {
    id: "fabrica-abstrata",
    titulo: "Fábrica abstrata (interface)",
    descricao: "Declara um método de criação para cada produto da família",
    destaque: true,
  },
  {
    id: "fabricas-concretas",
    titulo: "Fábricas concretas",
    descricao: "Uma por variante — cada uma cria produtos compatíveis entre si",
  },
  {
    id: "produtos",
    titulo: "Produtos (interfaces + variantes)",
    descricao: "Cada variante implementa as mesmas interfaces de produto",
  },
];

const EXEMPLOS = [
  {
    lang: "typescript" as const,
    code: `// Produtos: cada família implementa as mesmas interfaces
interface Botao { renderizar(): string; }
interface Checkbox { renderizar(): string; }

// Fábrica abstrata: um método de criação por produto da família
interface UIFactory {
  criarBotao(): Botao;
  criarCheckbox(): Checkbox;
}

// Família "tema escuro" — produtos que combinam entre si
class BotaoEscuro implements Botao {
  renderizar() { return "<button class='dark'>OK</button>"; }
}
class CheckboxEscuro implements Checkbox {
  renderizar() { return "<input type='checkbox' class='dark'>"; }
}

class TemaEscuroFactory implements UIFactory {
  criarBotao() { return new BotaoEscuro(); }
  criarCheckbox() { return new CheckboxEscuro(); }
}

// Cliente conhece só as abstrações — a família chega pronta
function montarFormulario(fabrica: UIFactory): string {
  const botao = fabrica.criarBotao();
  const check = fabrica.criarCheckbox();
  return check.renderizar() + botao.renderizar();
}

// A variante é decidida UMA vez, na composição da aplicação
console.log(montarFormulario(new TemaEscuroFactory()));`,
  },
  {
    lang: "python" as const,
    code: `from abc import ABC, abstractmethod

class Botao(ABC):
    @abstractmethod
    def renderizar(self) -> str: ...

class Checkbox(ABC):
    @abstractmethod
    def renderizar(self) -> str: ...

# Fábrica abstrata: um método de criação por produto da família
class UIFactory(ABC):
    @abstractmethod
    def criar_botao(self) -> Botao: ...
    @abstractmethod
    def criar_checkbox(self) -> Checkbox: ...

class BotaoEscuro(Botao):
    def renderizar(self) -> str:
        return "<button class='dark'>OK</button>"

class CheckboxEscuro(Checkbox):
    def renderizar(self) -> str:
        return "<input type='checkbox' class='dark'>"

class TemaEscuroFactory(UIFactory):
    def criar_botao(self) -> Botao:
        return BotaoEscuro()
    def criar_checkbox(self) -> Checkbox:
        return CheckboxEscuro()

# Cliente conhece só as abstrações — a família chega pronta
def montar_formulario(fabrica: UIFactory) -> str:
    botao = fabrica.criar_botao()
    check = fabrica.criar_checkbox()
    return check.renderizar() + botao.renderizar()

print(montar_formulario(TemaEscuroFactory()))`,
  },
];

export const abstractFactory: Conceito = {
  slug: "abstract-factory",
  titulo: "Abstract Factory",
  categoria: "criacional",
  resumo:
    "Cria famílias inteiras de objetos relacionados através de uma interface única, garantindo que os produtos de uma mesma variante sempre combinem entre si.",
  tags: ["gof", "familias-de-objetos", "consistencia", "variantes"],
  dificuldade: "intermediario",
  tempoLeitura: 7,
  relacionados: ["factory-method", "builder"],
  problema: [
    "Alguns objetos só fazem sentido juntos: um botão do tema escuro ao lado de um checkbox do tema claro denuncia o bug na primeira tela. Quando o código cria cada produto isoladamente com new, nada impede a mistura de variantes incompatíveis.",
    "Espalhar condicionais de variante (if tema === 'escuro') por cada ponto de criação multiplica os lugares que precisam mudar quando surge uma variante nova — e basta esquecer um deles para a inconsistência aparecer.",
  ],
  solucao: [
    "Declare uma interface de fábrica com um método de criação para cada produto da família (criarCadeira, criarMesa, criarSofa). Cada variante ganha uma fábrica concreta que devolve apenas produtos daquela variante.",
    "O cliente recebe a fábrica pela abstração e nunca decide qual classe concreta instanciar: escolhida a fábrica — uma única vez, na composição da aplicação —, todos os produtos criados a partir dela são compatíveis por construção.",
  ],
  quandoUsar: [
    "O sistema cria famílias de objetos relacionados que precisam ser usados juntos (tema, plataforma, região, provedor).",
    "Variantes inteiras trocam em conjunto e você quer decidir a variante em um único ponto.",
    "Você quer que o compilador impeça a mistura de produtos incompatíveis, em vez de confiar em disciplina.",
    "Já existem vários Factory Methods correlacionados pela mesma variante — agrupá-los em uma fábrica torna a relação explícita.",
  ],
  quandoEvitar: [
    "Só existe um produto por variante — um Factory Method simples resolve com menos cerimônia.",
    "A composição da família muda com frequência: cada produto novo altera a interface da fábrica e todas as concretas.",
    "Só há uma família e nenhuma previsão concreta de outra — o padrão vira abstração especulativa.",
  ],
  mermaid: MERMAID,
  camadas: CAMADAS,
  exemplos: EXEMPLOS,
  blocos: [
    {
      tipo: "tldr",
      texto:
        "Uma fábrica abstrata entrega famílias inteiras de objetos compatíveis entre si: o cliente escolhe a fábrica uma única vez e nunca mais decide qual variante instanciar — a consistência vem de graça.",
    },
    {
      tipo: "analogia",
      emoji: "🛋️",
      titulo: "A linha de móveis que combina",
      texto:
        "Uma loja vende duas linhas completas: moderna e vitoriana. Você não escolhe cadeira, mesa e sofá peça por peça — escolhe a LINHA, e a fábrica daquela linha entrega o conjunto. É impossível sair da loja com uma cadeira vitoriana de pés torneados ao lado de uma mesa moderna de vidro: quem garante a combinação não é o seu bom gosto, é a fábrica, que só produz peças da própria linha.",
    },
    {
      tipo: "secao",
      id: "problema",
      titulo: "O problema",
      resumo: [
        "Alguns objetos só fazem sentido juntos: um botão do tema escuro ao lado de um checkbox do tema claro denuncia o bug na primeira tela. Criando cada produto isoladamente com new, nada impede a mistura de variantes incompatíveis.",
        "E espalhar condicionais de variante por cada ponto de criação multiplica os lugares que precisam mudar quando surge uma variante nova — basta esquecer um para a inconsistência aparecer.",
      ],
      extensao: [
        "A relação com o Factory Method é direta: o Factory Method cria UM produto por vez; o Abstract Factory agrupa vários métodos de criação sob um mesmo contrato, amarrando-os pela variante. Na prática, cada método da fábrica abstrata é um factory method — o padrão é a composição deles.",
        "Essa amarração define os eixos de extensão do padrão: adicionar uma FAMÍLIA nova (linha industrial, tema de alto contraste) é barato — uma classe nova, nenhum código existente muda. Adicionar um PRODUTO novo à família (criarLuminaria) é caro — muda a interface da fábrica e todas as concretas. Escolha o padrão quando as famílias variam mais que a composição da família.",
        "A garantia de consistência é estrutural, não convencional: como o cliente só enxerga a interface da fábrica, o sistema de tipos impede que um produto vitoriano apareça no fluxo moderno. A decisão de qual fábrica usar sobe para a borda da aplicação — configuração, injeção de dependência ou leitura de ambiente no boot.",
      ],
    },
    {
      tipo: "ilustracao",
      arquetipo: "fluxo",
      atores: [
        { id: "cliente", label: "Cliente" },
        { id: "interface", label: "FabricaDeMoveis (interface)", destaque: true },
        { id: "concreta", label: "FabricaModerna" },
        { id: "familia", label: "Cadeira + Mesa + Sofá modernos" },
      ],
      setas: [
        { label: "pede a família" },
        { label: "variante resolvida no boot", tracejada: true },
        { label: "cria em conjunto" },
      ],
      legenda:
        "O cliente fala só com a interface; a fábrica concreta escolhida garante que todos os produtos criados pertencem à mesma variante.",
    },
    {
      tipo: "camadas-nav",
      titulo: "Navegue pelas camadas",
      camadas: [
        {
          id: "cliente",
          titulo: "Cliente",
          curto: "usa abstrações, nunca dá new",
          detalhe:
            "Recebe a fábrica pela interface e monta o que precisa chamando os métodos de criação. Não conhece nenhuma classe concreta — nem de fábrica, nem de produto. É por isso que trocar a variante inteira não exige tocar no cliente.",
          exemplo: "function montarFormulario(fabrica: UIFactory) {\n  const botao = fabrica.criarBotao();\n}",
          seViolar:
            "um new BotaoEscuro() dentro do cliente reata o acoplamento à variante e abre a porta para misturar famílias.",
        },
        {
          id: "fabrica-abstrata",
          titulo: "Fábrica abstrata",
          curto: "o contrato da família",
          detalhe:
            "Interface com um método de criação por produto da família. Ela define O QUE toda variante precisa saber produzir — é o único nome que o cliente conhece. Cada método devolve a interface do produto, nunca a classe concreta.",
          exemplo: "interface UIFactory {\n  criarBotao(): Botao;\n  criarCheckbox(): Checkbox;\n}",
          seViolar:
            "se um método devolve tipo concreto (BotaoEscuro), o cliente passa a depender da variante e o contrato perde o sentido.",
        },
        {
          id: "fabricas-concretas",
          titulo: "Fábricas concretas",
          curto: "uma por variante, produtos que combinam",
          detalhe:
            "Cada variante (tema escuro, linha vitoriana, região BR) implementa a fábrica abstrata criando apenas produtos da própria família. É aqui que a consistência é garantida: uma fábrica jamais devolve produto de outra variante.",
          exemplo: "class TemaEscuroFactory implements UIFactory {\n  criarBotao() { return new BotaoEscuro(); }\n}",
          seViolar:
            "uma fábrica que mistura produtos de famílias diferentes transforma a garantia estrutural em bug difícil de rastrear.",
        },
        {
          id: "produtos",
          titulo: "Produtos",
          curto: "interfaces comuns, variantes concretas",
          detalhe:
            "Cada produto tem uma interface (Cadeira, Botao) implementada por todas as variantes. As interfaces precisam capturar o comportamento comum — se uma variante exige métodos que a outra não tem, a família está mal recortada.",
          exemplo: "interface Botao { renderizar(): string; }\nclass BotaoEscuro implements Botao { /* ... */ }",
          seViolar:
            "produtos sem interface comum obrigam o cliente a fazer casts por variante — o acoplamento volta pela porta dos fundos.",
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
          titulo: "Tema claro/escuro em um design system",
          cenario:
            "Um SaaS B2B tem design system com botão, input, modal e tabela — cada componente com versão clara e escura que precisam aparecer sempre juntas.",
          aplicacao:
            "Uma UIFactory por tema cria a família completa de componentes. O app resolve a fábrica uma vez (preferência do usuário) e todo o resto do código monta telas sem saber qual tema está ativo — impossível renderizar modal claro sobre fundo escuro.",
          tradeoff:
            "Cada componente novo do design system exige mexer na interface da fábrica e em todas as concretas — o custo de manter a família fechada.",
        },
        {
          titulo: "Provedores de pagamento intercambiáveis",
          cenario:
            "Uma fintech integra dois PSPs; cada um exige um trio que precisa combinar: cliente de cobrança, parser de webhook e validador de assinatura — misturar peças de PSPs diferentes gera erro silencioso.",
          aplicacao:
            "Uma PspFactory por provedor cria o trio coerente. O orquestrador de cobranças recebe a fábrica do PSP escolhido por transação e nunca corre o risco de validar o webhook do provedor A com a chave do provedor B.",
          tradeoff:
            "A interface comum vira o mínimo denominador entre provedores — recursos exclusivos de um PSP ficam de fora do contrato ou vazam por interfaces paralelas.",
        },
        {
          titulo: "E-commerce multi-país",
          cenario:
            "Uma operação de e-commerce atua no Brasil e no México; imposto, formatação de moeda e regras de frete variam por país, e usar a regra de um com a moeda do outro corrompe o checkout.",
          aplicacao:
            "Uma RegiaoFactory por país cria calculadora de imposto, formatador de moeda e política de frete como família fechada. O checkout resolve a fábrica pelo país do pedido e opera consistente do carrinho à nota.",
          tradeoff:
            "Países muito parecidos geram fábricas quase idênticas — quando a diferença cabe em parâmetros, configuração por dados vence classes por variante.",
        },
      ],
    },
    {
      tipo: "armadilhas",
      itens: [
        {
          titulo: "Família de um produto só",
          texto:
            "Se a sua fábrica abstrata tem um único método de criação, você tem um Factory Method com nome pomposo e uma camada a mais. O Abstract Factory só paga o próprio custo quando existe uma FAMÍLIA — dois ou mais produtos que precisam variar juntos.",
        },
        {
          titulo: "Novo produto na família dói",
          texto:
            "Adicionar criarLuminaria() muda a interface da fábrica e quebra todas as concretas de uma vez. Se a composição da família muda com frequência, o padrão trabalha contra você — reavalie o recorte ou aceite interfaces segregadas por grupo de produtos.",
        },
        {
          titulo: "Cliente que fura a fábrica",
          texto:
            "Um único new CadeiraVitoriana() direto no cliente quebra a garantia de consistência sem nenhum aviso — o código compila e o bug aparece na tela. A regra 'produto só nasce na fábrica' precisa de reforço real: revisão, regra de lint ou construtores inacessíveis fora do módulo.",
        },
      ],
    },
    {
      tipo: "quando",
      usar: [
        "O sistema cria famílias de objetos relacionados que precisam ser usados juntos (tema, plataforma, região, provedor).",
        "Variantes inteiras trocam em conjunto e você quer decidir a variante em um único ponto.",
        "Você quer que o sistema de tipos impeça a mistura de produtos incompatíveis, em vez de confiar em disciplina.",
        "Já existem vários Factory Methods correlacionados pela mesma variante.",
      ],
      evitar: [
        "Só existe um produto por variante — um Factory Method simples resolve com menos cerimônia.",
        "A composição da família muda com frequência: cada produto novo altera a interface e todas as fábricas concretas.",
        "Só há uma família e nenhuma previsão concreta de outra — abstração especulativa.",
      ],
    },
  ],
};
