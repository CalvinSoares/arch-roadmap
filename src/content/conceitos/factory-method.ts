import type { Conceito } from "@/shared/types/conceito";
import { gof } from "@/content/conceitos/_nascimento";

const MERMAID = `classDiagram
    class Criador {
      +factoryMethod() Produto
      +operacao()
    }
    class CriadorConcretoA {
      +factoryMethod() Produto
    }
    class Produto {
      <<interface>>
    }
    class ProdutoConcretoA
    Criador <|-- CriadorConcretoA
    Produto <|.. ProdutoConcretoA
    CriadorConcretoA ..> ProdutoConcretoA : cria`;

const CAMADAS = [
  { id: "cliente", titulo: "Cliente", descricao: "Chama criador.operacao()" },
  {
    id: "criador",
    titulo: "Criador (factoryMethod)",
    descricao: "Ponto de extensão — onde o padrão atua",
    destaque: true,
  },
  { id: "produto", titulo: "Produto (interface)", descricao: "Abstração usada pelo cliente" },
  { id: "concreto", titulo: "Produto Concreto", descricao: "Implementação instanciada" },
];

const EXEMPLOS = [
  {
    lang: "typescript" as const,
    code: `interface Botao {
  render(): string;
}

class BotaoWeb implements Botao {
  render() { return "<button>"; }
}
class BotaoMobile implements Botao {
  render() { return "TouchableOpacity"; }
}

abstract class Dialogo {
  abstract criarBotao(): Botao;      // factory method
  renderizar() { return this.criarBotao().render(); }
}

class DialogoWeb extends Dialogo {
  criarBotao() { return new BotaoWeb(); }
}

new DialogoWeb().renderizar(); // "<button>"`,
  },
  {
    lang: "python" as const,
    code: `from abc import ABC, abstractmethod

class Botao(ABC):
    @abstractmethod
    def render(self) -> str: ...

class BotaoWeb(Botao):
    def render(self): return "<button>"

class Dialogo(ABC):
    @abstractmethod
    def criar_botao(self) -> Botao: ...   # factory method
    def renderizar(self): return self.criar_botao().render()

class DialogoWeb(Dialogo):
    def criar_botao(self): return BotaoWeb()

DialogoWeb().renderizar()  # "<button>"`,
  },
];

const ANTI_EXEMPLO = `class FabricaDeRelatorio {
  static criar(tipo: string): Relatorio {
    switch (tipo) {
      case "pdf":   return new RelatorioPdf();
      case "csv":   return new RelatorioCsv();
      case "xlsx":  return new RelatorioXlsx();
      case "html":  return new RelatorioHtml();
      // ... e mais oito
      default: throw new Error("tipo desconhecido: " + tipo);
    }
  }
}

// Este arquivo importa TODAS as implementacoes.
// Consequencias:
// - formato novo = editar aqui (Aberto/Fechado violado)
// - o bundle carrega os doze, mesmo usando um
// - o erro de tipo desconhecido so aparece em runtime`;

export const factoryMethod: Conceito = {
  slug: "factory-method",
  titulo: "Factory Method",
  categoria: "criacional",
  resumo:
    "Define uma interface para criar objetos, deixando as subclasses decidirem qual classe concreta instanciar.",
  tags: ["polimorfismo", "gof", "desacoplamento"],
  dificuldade: "intermediario",
  tempoLeitura: 6,
  nasceu: gof(),
  ondeAparece: [
    {
      onde: "document.createElement",
      explicacao:
        "Você pede um elemento pelo nome e recebe a subclasse certa de HTMLElement, sem instanciar nenhuma delas.",
    },
    {
      onde: "React.createElement",
      explicacao:
        "O JSX compila para uma chamada de fábrica: você descreve o que quer, e o React decide o que construir.",
    },
    {
      onde: "Array.from",
      explicacao:
        "Um único ponto de criação que aceita fontes muito diferentes e devolve sempre um array.",
    },
  ],
  emUmaLinha: {
    lang: "typescript",
    code: `// Subclasse decide qual produto criar.
criarBotao(): Botao { return new BotaoMac(); }`,
  },
  custo: {
    indirecoes: 1,
    cobra: [
      "Uma classe e uma hierarquia a mais só para adiar a escolha do tipo concreto",
      "Cada produto novo tende a exigir uma subclasse de fábrica correspondente",
    ],
    naoValeSe:
      "só existe um tipo concreto e nada indica que vão surgir outros — aí `new` direto é mais honesto que a cerimônia.",
  },
  relacionados: ["adapter", "strategy"],
  problema: [
    "O código cliente precisa criar objetos, mas não deveria depender das classes concretas — senão cada novo tipo obriga a alterar o cliente (viola Aberto/Fechado).",
    "Um `new ClasseConcreta()` espalhado pelo código acopla o cliente a implementações específicas e dificulta testes e extensões.",
  ],
  solucao: [
    "Extraímos a criação para um método (o 'factory method') declarado numa classe/interface base.",
    "Cada subclasse sobrescreve esse método para retornar o produto concreto adequado. O cliente trabalha apenas com a abstração do produto.",
  ],
  quandoUsar: [
    "Você não sabe de antemão os tipos exatos de objetos que o código vai precisar criar.",
    "Quer permitir que usuários da sua biblioteca estendam os componentes internos.",
    "Quer isolar a lógica de construção do resto da aplicação.",
  ],
  quandoEvitar: [
    "Só existe um tipo de produto e não há previsão de variação — vira complexidade inútil.",
    "Uma simples função de criação ou injeção de dependência já resolve.",
  ],
  mermaid: MERMAID,
  camadas: CAMADAS,
  exemplos: EXEMPLOS,
  blocos: [
    {
      tipo: "tldr",
      texto:
        "Em vez de o cliente dar new na classe concreta, uma classe criadora declara um método de criação que as subclasses sobrescrevem. O cliente trabalha só com a interface do produto — e tipos novos entram sem alterar código existente.",
    },
    {
      tipo: "analogia",
      emoji: "🏭",
      titulo: "A linha de montagem da fábrica",
      texto:
        "A fábrica define a esteira e as etapas de montagem uma única vez. Cada unidade especializada decide qual modelo sai da linha — sedã, hatch ou picape — sem que o processo geral precise mudar. O cliente pede 'um carro' e recebe o produto certo; quem escolhe o modelo concreto é a subclasse, não quem faz o pedido.",
    },
    {
      tipo: "secao",
      id: "problema",
      titulo: "O problema",
      resumo: [
        "O código cliente precisa criar objetos, mas não deveria depender das classes concretas. Cada novo tipo obrigaria a alterar o cliente, violando o princípio Aberto/Fechado.",
        "Um `new ClasseConcreta()` espalhado pelo código acopla o cliente a implementações específicas e dificulta tanto os testes quanto futuras extensões.",
      ],
      extensao: [
        "A raiz está numa assimetria: você programa contra interfaces em todo lugar — parâmetros, retornos, campos — menos na hora de instanciar. O new é o único ponto do polimorfismo que não é polimórfico: ele exige o nome da classe concreta ali, em tempo de compilação. Todo lugar que escreve new fica amarrado àquela implementação, e a criação é justamente o detalhe que mais tende a variar (por plataforma, ambiente, formato, plano do cliente).",
        "O padrão resolve movendo o new para um método que subclasses sobrescrevem — e é aí que ele se diferencia das alternativas. Uma função factory simples (criarBotao(tipo)) centraliza a escolha num switch e basta para casos diretos; um container de injeção de dependência resolve quando a decisão é de configuração. Factory Method vale quando a criação depende de um contexto que a subclasse conhece e o método criador participa de um algoritmo maior da classe base — o clássico par com Template Method.",
        "Também não confunda com Abstract Factory: o Factory Method cria um produto por vez, via herança; o Abstract Factory agrupa a criação de uma família inteira de produtos relacionados (botão + input + modal do mesmo tema), via composição. Na prática, Abstract Factories costumam ser implementadas como um conjunto de factory methods.",
      ],
    },
    {
      tipo: "ilustracao",
      arquetipo: "fluxo",
      atores: [
        { id: "cliente", label: "Cliente" },
        { id: "criador", label: "Criador", destaque: true },
        { id: "factory", label: "factoryMethod()" },
        { id: "produto", label: "Produto concreto" },
      ],
      setas: [
        { label: "chama operacao()" },
        { label: "delega a criação" },
        { label: "instancia", tracejada: true },
      ],
      legenda:
        "O cliente nunca escreve new: a subclasse do criador decide qual produto concreto nasce.",
    },
    {
      tipo: "passos",
      titulo: "O fluxo, passo a passo",
      passos: [
        { titulo: "Declarar o factory method", texto: "A classe/interface base declara um método de criação que retorna a abstração do produto." },
        { titulo: "Sobrescrever na subclasse", texto: "Cada subclasse implementa o método para devolver o produto concreto adequado." },
        { titulo: "Chamar via abstração", texto: "O cliente usa operacao(), que internamente chama o factory method — sem saber qual concreto vem." },
        { titulo: "Estender sem alterar", texto: "Um novo produto exige apenas uma nova subclasse; o cliente permanece intocado." },
      ],
    },
    {
      tipo: "camadas-nav",
      titulo: "Navegue pelas camadas",
      camadas: [
        {
          id: "cliente",
          titulo: "Cliente",
          curto: "usa o criador sem conhecer concretos",
          detalhe:
            "Conhece apenas a classe base do criador e a interface do produto. Chama operacao() e recebe o resultado — qual produto concreto foi instanciado é invisível para ele. É essa ignorância que permite trocar a plataforma, o banco ou o formato sem tocá-lo.",
          exemplo: "function render(dialogo: Dialogo) {\n  return dialogo.renderizar(); // não sabe qual botão sai\n}",
          seViolar:
            "um new BotaoWeb() no cliente esvazia o padrão: a dependência da classe concreta que você queria remover voltou, e com ela a mudança em cascata a cada tipo novo.",
        },
        {
          id: "criador",
          titulo: "Criador (factoryMethod)",
          curto: "declara o ponto de extensão",
          detalhe:
            "Declara o método de criação retornando a abstração do produto e o usa dentro da própria lógica — renderizar() chama criarBotao() sem saber o que vem. As subclasses trocam só a peça criada; o algoritmo em volta é escrito uma vez na base.",
          exemplo: "abstract class Dialogo {\n  abstract criarBotao(): Botao; // ponto de extensão\n  renderizar() { return this.criarBotao().render(); }\n}",
          seViolar:
            "se a base instanciar o concreto diretamente, as subclasses não têm o que sobrescrever — cada variação vira um if dentro do criador, e o Aberto/Fechado se perde.",
        },
        {
          id: "produto",
          titulo: "Produto (interface)",
          curto: "abstração que circula no código",
          detalhe:
            "O contrato que todos os produtos honram. É o tipo de retorno do factory method e o único tipo que o cliente e o criador enxergam. Quanto mais completo o contrato, menos tentação de descobrir o tipo concreto depois.",
          exemplo: "interface Botao {\n  render(): string;\n}",
          seViolar:
            "declarar criarBotao(): BotaoWeb em vez da interface quebra o propósito: o cliente volta a enxergar a implementação e o desacoplamento vira só indireção.",
        },
        {
          id: "concreto",
          titulo: "Produto concreto",
          curto: "a implementação que nasce da subclasse",
          detalhe:
            "Cada variação implementa a interface do produto e costuma vir em par com um criador concreto — DialogoWeb cria BotaoWeb, DialogoMobile cria BotaoMobile. É onde mora o detalhe de plataforma, formato ou ambiente que o resto do sistema não precisa conhecer.",
          exemplo: "class BotaoWeb implements Botao {\n  render() { return \"<button>\"; }\n}",
          seViolar:
            "produto que expõe métodos fora da interface convida o cliente a fazer cast para o concreto — e o acoplamento volta pela porta dos fundos.",
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
          titulo: "SDK multi-plataforma",
          cenario:
            "Uma biblioteca de UI roda em web e mobile: o fluxo do diálogo (abrir, validar, confirmar) é idêntico, mas o botão é <button> num lado e TouchableOpacity no outro.",
          aplicacao:
            "Dialogo define renderizar() uma vez; DialogoWeb e DialogoMobile sobrescrevem apenas criarBotao(). Quem usa o SDK pode até criar DialogoDesktop próprio — o ponto de extensão é público.",
          tradeoff:
            "Cada plataforma nova adiciona um par criador+produto; a hierarquia cresce em dupla e precisa de disciplina para não divergir.",
        },
        {
          titulo: "Conexões de banco por ambiente",
          cenario:
            "A aplicação usa Postgres em produção, mas os testes precisam rodar em segundos com SQLite em memória, sem subir container.",
          aplicacao:
            "O repositório base declara criarConexao(): Conexao e escreve as queries contra a abstração; o ambiente decide qual subclasse entra. A suíte de testes ganha velocidade sem duplicar lógica de acesso.",
          tradeoff:
            "Diferenças reais de SQL e de comportamento entre os bancos podem vazar pela abstração — o contrato só segura o que os dois suportam, e o teste em SQLite não prova tudo.",
        },
        {
          titulo: "Parsers por formato de arquivo",
          cenario:
            "Um importador aceita CSV, XML e JSON de parceiros diferentes e precisa devolver os mesmos registros normalizados, com formatos novos chegando por contrato.",
          aplicacao:
            "Importador define o pipeline (ler, validar, gravar) e delega a criarParser(); cada formato vira uma subclasse. Formato novo = subclasse nova, pipeline intocado.",
          tradeoff:
            "Formatos muito diferentes (streaming linha a linha vs documento inteiro em memória) forçam a interface do parser a nivelar por baixo ou a crescer demais.",
        },
      ],
    },
    {
      tipo: "anti-exemplo",
      titulo: "A fábrica que conhece todos os produtos",
      comoSeParece:
        "Em vez de cada subclasse decidir o que criar, existe uma função estática com um `switch` que conhece todas as implementações. É o mesmo `new` espalhado de antes, agora concentrado num único ponto de acoplamento.",
      codigo: { lang: "typescript", code: ANTI_EXEMPLO },
      sintomas: [
        { quando: "Ao adicionar formato", efeito: "Um arquivo central precisa ser editado sempre, e ele vira ponto de conflito de merge entre times." },
        { quando: "No bundle", efeito: "Todas as implementações são importadas junto, inclusive as que aquele fluxo nunca vai usar." },
        { quando: "Com tipo inválido", efeito: "A falha acontece em tempo de execução, com uma string, em vez de em tempo de compilação." },
      ],
      correcao:
        "Factory Method é **polimorfismo**: a subclasse que já sabe o contexto sobrescreve o método de criação. Quando o que se quer é mesmo mapear uma string vinda de fora, isso é um registro (`Map<string, () => Produto>`) preenchido por quem compõe a aplicação — e aí formato novo se registra, não edita.",
    },
    {
      tipo: "refatoracao",
      cheiro:
        "O `new` do exportador espalhado por cinco lugares, cada um decidindo o tipo por conta própria.",
      inicio: { lang: "typescript", code: `// relatorio-controller.ts
if (formato === "pdf") exportador = new ExportadorPdf(config);
else if (formato === "csv") exportador = new ExportadorCsv(config);

// agendador.ts — a mesma decisao, de novo
if (formato === "pdf") exportador = new ExportadorPdf(config);
else if (formato === "csv") exportador = new ExportadorCsv(config);

// E em outros tres arquivos. Formato novo = cacar todos.` },
      passos: [
        {
          titulo: "Centralizar a criação",
          motivo:
            "Primeiro pare a hemorragia: um lugar só decide. Ainda é um `switch`, e ainda viola o Aberto/Fechado — mas agora **em um arquivo**, e não em cinco.",
          depois: { lang: "typescript", code: `// exportadores.ts
export function criarExportador(formato: string, config: Config): Exportador {
  switch (formato) {
    case "pdf": return new ExportadorPdf(config);
    case "csv": return new ExportadorCsv(config);
    default: throw new Error("formato desconhecido: " + formato);
  }
}` },
        },
        {
          titulo: "Trocar o switch por registro",
          motivo:
            "Um `switch` obriga a **editar** para estender; um registro permite **acrescentar**. E o arquivo central para de importar todas as implementações — cada uma se registra.",
          depois: { lang: "typescript", code: `// registro.ts — nao conhece nenhuma implementacao
type Construtor = (config: Config) => Exportador;
const registro = new Map<string, Construtor>();

export function registrar(formato: string, criar: Construtor) {
  registro.set(formato, criar);
}

export function criarExportador(formato: string, config: Config): Exportador {
  const criar = registro.get(formato);
  if (!criar) throw new Error("formato desconhecido: " + formato);
  return criar(config);
}

// exportador-pdf.ts — a implementacao se anuncia
registrar("pdf", (config) => new ExportadorPdf(config));` },
        },
        {
          titulo: "Fechar no tipo",
          motivo:
            "O registro resolveu a extensão e trouxe um problema novo: formato inválido só falha em execução. Um tipo derivado do próprio registro devolve o erro para o compilador.",
          depois: { lang: "typescript", code: `// Os formatos validos passam a sair do registro, nao de uma string solta.
const FABRICAS = {
  pdf: (c: Config) => new ExportadorPdf(c),
  csv: (c: Config) => new ExportadorCsv(c),
} as const;

export type Formato = keyof typeof FABRICAS;

export function criarExportador(formato: Formato, config: Config): Exportador {
  return FABRICAS[formato](config);  // nenhum default: o tipo garante
}

// criarExportador("xml", cfg) nao compila mais.` },
        },
      ],
      veredito:
        "Ganhou-se: um ponto de criação, extensão sem editar quem usa, e formato inválido pego em compilação. Pagou-se: uma indireção entre pedir e receber, e o `as const` obriga o objeto literal a viver no mesmo módulo do tipo. Note que o último passo desfaz parte do penúltimo — o registro dinâmico só vale se as implementações realmente vierem de fora (plugins).",
    },
    {
      tipo: "armadilhas",
      itens: [
        {
          titulo: "Factory para classe única (YAGNI)",
          texto:
            "Se existe um único produto e nenhuma variação prevista, o factory method é cerimônia: classe abstrata, subclasse e override para embrulhar um new que uma função simples resolveria. Introduza o padrão quando a segunda variação aparecer de verdade — extrair a criação depois é uma refatoração barata.",
        },
        {
          titulo: "Factory que retorna o tipo concreto",
          texto:
            "Declarar o método como criarBotao(): BotaoWeb em vez de retornar a interface mantém todo mundo acoplado à implementação — ganhou-se uma chamada a mais sem ganhar desacoplamento. O retorno do factory method é a abstração; se o chamador precisa saber o tipo exato, o padrão não está cumprindo o papel.",
        },
        {
          titulo: "Hierarquias paralelas explodindo",
          texto:
            "Cada produto novo pede um criador novo: com dez formatos, são dez parsers e dez importadores. Se a subclasse do criador existe só para escolher o produto — sem lógica própria —, um registro (mapa de chave para construtor) ou Abstract Factory resolve com muito menos classe. Herança é o mecanismo do padrão, não um objetivo.",
        },
      ],
    },
    {
      tipo: "quando",
      usar: [
        "Você não sabe de antemão os tipos exatos de objetos que o código vai precisar criar.",
        "Quer permitir que usuários da sua biblioteca estendam os componentes internos.",
        "Quer isolar a lógica de construção do resto da aplicação.",
      ],
      evitar: [
        "Só existe um tipo de produto e não há previsão de variação — vira complexidade inútil.",
        "Uma simples função de criação ou injeção de dependência já resolve.",
      ],
    },
  ],
};
