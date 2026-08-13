import type { Conceito } from "@/shared/types/conceito";
import { gof } from "@/content/conceitos/_nascimento";

const MERMAID = `classDiagram
    class BancoCentral {
        -instancia$ BancoCentral
        -taxaSelic: number
        -BancoCentral()
        +getInstancia()$ BancoCentral
        +definirSelic(taxa) void
    }
    class ServicoDeCambio {
        +converter(valor)
    }
    class ServicoDeCredito {
        +calcularJuros(valor)
    }
    ServicoDeCambio ..> BancoCentral : getInstancia()
    ServicoDeCredito ..> BancoCentral : getInstancia()
    BancoCentral --> BancoCentral : guarda a propria instancia`;

const CAMADAS = [
  { id: "clientes", titulo: "Clientes", descricao: "Qualquer código acessa via getInstancia() — nunca dá new" },
  {
    id: "acesso",
    titulo: "getInstancia()",
    descricao: "Ponto único (e global) de acesso: cria na primeira chamada, reusa depois",
    destaque: true,
  },
  { id: "construtor", titulo: "Construtor privado", descricao: "Fecha a porta do new fora da classe" },
  { id: "instancia", titulo: "Instância única", descricao: "Guardada em campo estático pela própria classe" },
];

const EXEMPLOS = [
  {
    lang: "typescript" as const,
    code: `class BancoCentral {
  private static instancia?: BancoCentral;
  private taxaSelic = 15;

  private constructor() {}   // ninguém fora da classe dá new

  static getInstancia(): BancoCentral {
    if (!BancoCentral.instancia) {
      BancoCentral.instancia = new BancoCentral();
    }
    return BancoCentral.instancia;
  }

  definirSelic(taxa: number): void { this.taxaSelic = taxa; }
  selic(): number { return this.taxaSelic; }
}

const a = BancoCentral.getInstancia();
const b = BancoCentral.getInstancia();
console.log(a === b);       // true — sempre o mesmo objeto

a.definirSelic(12.25);
console.log(b.selic());     // 12.25 — mudou "para todo mundo"
// É exatamente isso que torna o padrão controverso:
// qualquer canto do código altera estado que todos leem.`,
  },
  {
    lang: "python" as const,
    code: `class BancoCentral:
    _instancia = None

    def __new__(cls):
        if cls._instancia is None:
            cls._instancia = super().__new__(cls)
            cls._instancia.taxa_selic = 15
        return cls._instancia

    def definir_selic(self, taxa):
        self.taxa_selic = taxa

a = BancoCentral()
b = BancoCentral()
print(a is b)           # True — sempre o mesmo objeto

a.definir_selic(12.25)
print(b.taxa_selic)     # 12.25 — mudou "para todo mundo"

# Em Python, um módulo já é um singleton natural:
# um objeto criado no nível do módulo costuma bastar.`,
  },
];

const ANTI_EXEMPLO = `class Config {
  private static instancia: Config;
  private valores = new Map<string, string>();

  static obter(): Config {
    if (!Config.instancia) Config.instancia = new Config();
    return Config.instancia;
  }

  set(k: string, v: string) { this.valores.set(k, v); }  // <- estado mutavel
  get(k: string) { return this.valores.get(k); }
}

// Nenhuma assinatura revela esta dependencia.
class Cobranca {
  cobrar(valor: number) {
    const moeda = Config.obter().get("moeda"); // acoplamento invisivel
    // ...
  }
}

// E aqui mora o problema: o teste precisa mexer no estado global
// para preparar o cenario — e nao tem como desfazer depois.
Config.obter().set("moeda", "BRL");`;

export const singleton: Conceito = {
  slug: "singleton",
  titulo: "Singleton",
  categoria: "criacional",
  resumo:
    "Garante que uma classe tenha uma única instância no processo e oferece um ponto global de acesso a ela — uma conveniência que cobra caro em acoplamento e testabilidade.",
  tags: ["gof", "instancia-unica", "estado-global", "injecao-de-dependencia"],
  dificuldade: "iniciante",
  tempoLeitura: 6,
  nasceu: gof(),
  ondeAparece: [
    {
      onde: "Qualquer módulo ES",
      explicacao:
        "Um módulo importado dez vezes é avaliado uma só; o `export` já é uma instância única do processo.",
    },
    {
      onde: "Pools de conexão",
      explicacao:
        "Abrir um pool por requisição derruba o banco — por isso ele é sempre único e compartilhado.",
    },
  ],
  emUmaLinha: {
    lang: "typescript",
    code: `// Um modulo ES ja e um singleton. Nao precisa de classe.
export const pool = criarPool();`,
  },
  custo: {
    indirecoes: 0,
    cobra: [
      "A dependência some das assinaturas e vira invisível",
      "Testes deixam de poder rodar em paralelo se houver estado mutável",
    ],
    naoValeSe:
      "o objeto guarda estado que muda. Aí o que você quer é uma instância injetada, não uma global.",
  },
  relacionados: ["factory-method"],
  problema: [
    "Alguns objetos precisam existir uma única vez por processo: o pool de conexões com o banco, a configuração carregada do disco, o logger que escreve no mesmo arquivo. Duas cópias significam recursos desperdiçados ou, pior, dados inconsistentes entre elas.",
    "Confiar em disciplina ('ninguém dá new duas vezes, combinado?') não é garantia: o construtor público continua lá, e basta um import distraído para nascer a segunda instância que corrompe a premissa do sistema inteiro.",
  ],
  solucao: [
    "O Singleton faz a própria classe guardar a unicidade: construtor privado impede o new externo, e um método estático getInstancia() cria o objeto na primeira chamada e devolve sempre a mesma instância dali em diante.",
    "Mas o pacote traz junto um ponto de acesso global — e é dele que vem a controvérsia. A alternativa moderna separa as duas coisas: crie UMA instância no ponto de composição da aplicação e injete-a em quem precisa; a unicidade vira decisão de configuração, não propriedade rígida da classe.",
  ],
  quandoUsar: [
    "Um recurso físico ou caro deve existir uma única vez por processo (pool de conexões, cache em memória, handle de hardware).",
    "Duas instâncias causariam conflito real, não só desperdício (dois schedulers disparando o mesmo job, dois writers no mesmo arquivo).",
    "Não há injeção de dependência disponível (script, plugin, legado) e um ponto único de acesso é o mal menor documentado.",
  ],
  quandoEvitar: [
    "A motivação é só conveniência de acesso global — injeção de dependência entrega a mesma instância única sem esconder o acoplamento.",
    "O objeto carrega estado mutável de negócio: vira estado global e os testes passam a depender da ordem de execução.",
    "Você precisa substituir a dependência por dublês nos testes — singleton hard-coded não aceita mock sem hacks.",
  ],
  mermaid: MERMAID,
  camadas: CAMADAS,
  exemplos: EXEMPLOS,
  blocos: [
    {
      tipo: "tldr",
      texto:
        "Uma classe que garante a própria instância única e a expõe globalmente. Funciona — mas é estado global disfarçado de padrão: entenda o mecanismo, use com parcimônia e prefira injeção de dependência sempre que ela estiver disponível.",
    },
    {
      tipo: "analogia",
      emoji: "🏛️",
      titulo: "O banco central do país",
      texto:
        "Um país tem exatamente UM banco central: só ele emite moeda e define a taxa básica de juros. Dois bancos centrais imprimindo dinheiro em paralelo seriam o caos — a unicidade não é detalhe, é a definição da instituição. Todo banco, empresa e cidadão se refere à mesma entidade, sem precisar carregá-la no bolso. Mas repare no reverso da moeda: quando o banco central muda a taxa, muda para o país inteiro de uma vez. Poder centralizado e globalmente acessível é exatamente o que torna o padrão útil — e perigoso.",
    },
    {
      tipo: "secao",
      id: "problema",
      titulo: "O problema",
      resumo: [
        "Alguns objetos precisam existir uma única vez por processo: o pool de conexões, a configuração carregada do disco, o logger que escreve no mesmo arquivo. Duas cópias significam recursos desperdiçados ou dados inconsistentes entre elas.",
        "Confiar em disciplina não é garantia: o construtor público continua lá, e basta um import distraído para nascer a segunda instância.",
      ],
      extensao: [
        "O Singleton do GoF resolve fazendo a classe policiar a si mesma: construtor privado + método estático que cria na primeira chamada e devolve sempre o mesmo objeto. Só que o padrão amarra DUAS responsabilidades num pacote só: garantir instância única E fornecer acesso global. A primeira é legítima; a segunda é a fonte de quase todos os problemas que deram ao padrão a fama de anti-pattern.",
        "Acesso global significa que qualquer linha de código pode ler e mutar o singleton sem declarar essa dependência: a assinatura da função mente sobre o que ela realmente usa, os testes passam a depender da ordem de execução e o acoplamento se espalha invisível. É estado global com nome de padrão — a crítica não é moda, é consequência estrutural do ponto de acesso.",
        "A alternativa moderna separa as responsabilidades: crie UMA instância no ponto de composição da aplicação (o main, o container de injeção de dependência) e injete-a em quem precisa. A unicidade vira decisão de configuração — visível na assinatura, trocável por um dublê no teste. É o que Spring e NestJS fazem com o escopo 'singleton' do container: uma instância só, sem o acesso global do padrão GoF.",
      ],
    },
    {
      tipo: "ilustracao",
      arquetipo: "fluxo",
      atores: [
        { id: "codigo", label: "Qualquer código" },
        { id: "acesso", label: "getInstancia()", destaque: true },
        { id: "instancia", label: "Instância única" },
        { id: "estado", label: "Estado compartilhado" },
      ],
      setas: [
        { label: "acessa de qualquer lugar" },
        { label: "cria na 1ª chamada, reusa depois", tracejada: true },
        { label: "todos leem e escrevem" },
      ],
      legenda:
        "Qualquer ponto do código chega à mesma instância — a conveniência do acesso global e o risco do estado compartilhado são o MESMO mecanismo.",
    },
    {
      tipo: "passos",
      titulo: "O fluxo, passo a passo",
      passos: [
        { titulo: "Fechar o construtor", texto: "Construtor privado impede `new` externo — a unicidade deixa de ser convenção." },
        { titulo: "Guardar a instância", texto: "Campo estático privado começa vazio e recebe o único exemplar." },
        { titulo: "Acessar via getInstancia()", texto: "Na primeira chamada cria; depois devolve sempre o mesmo objeto." },
        { titulo: "Preferir injeção", texto: "Mesmo existindo o singleton, receba a instância por parâmetro quando puder — testável e visível." },
      ],
    },
    {
      tipo: "camadas-nav",
      titulo: "Navegue pelas camadas",
      camadas: [
        {
          id: "construtor",
          titulo: "Construtor privado",
          curto: "fecha a porta do new fora da classe",
          detalhe:
            "É o que transforma 'combinado entre devs' em garantia estrutural: nenhum código externo consegue criar a segunda instância, porque o compilador (ou o runtime) recusa o new. A classe passa a ser a única dona do próprio ciclo de vida.",
          exemplo: "private constructor() {}",
          seViolar:
            "com o construtor público, a unicidade volta a ser convenção — e a segunda instância nasce exatamente no dia em que ninguém está olhando.",
        },
        {
          id: "instancia",
          titulo: "Campo estático privado",
          curto: "o único exemplar, guardado pela própria classe",
          detalhe:
            "Começa vazio e recebe a instância na primeira chamada (criação preguiçosa). Ser privado importa: só o getInstancia() decide quando criar e nunca há como trocar o objeto por fora.",
          exemplo: "private static instancia?: BancoCentral;",
          seViolar:
            "campo público mutável deixa qualquer código substituir a instância em voo — os módulos passam a enxergar objetos diferentes sem nenhum erro.",
        },
        {
          id: "acesso",
          titulo: "getInstancia()",
          curto: "ponto único — e global — de acesso",
          detalhe:
            "Cria sob demanda na primeira chamada e devolve sempre o mesmo objeto. Em plataformas multi-thread (Java, C#), a criação preguiçosa precisa de sincronização — double-checked locking ou o idioma do holder — ou dois threads criam duas instâncias na largada.",
          exemplo: "static getInstancia(): BancoCentral {\n  return (this.instancia ??= new BancoCentral());\n}",
          seViolar:
            "sem controle de concorrência na criação, o 'singleton' nasce em dose dupla sob carga — o tipo de bug que só aparece em produção.",
        },
        {
          id: "clientes",
          titulo: "Clientes",
          curto: "chamam de qualquer lugar — e é aí que mora o perigo",
          detalhe:
            "Nenhum cliente declara a dependência: ela não aparece no construtor nem na assinatura, só no corpo do método. Prática defensiva: mesmo existindo o singleton, receba a instância por parâmetro sempre que puder — o código fica testável e a dependência, visível.",
          exemplo: "function cotar(valor: number, banco = BancoCentral.getInstancia()) {\n  return valor * banco.selic();\n}",
          seViolar:
            "chamadas a getInstancia() espalhadas pelo domínio soldam cada módulo ao singleton — e o dia de trocar por injeção de dependência vira uma reforma.",
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
          titulo: "Pool de conexões em um backend SaaS",
          cenario:
            "Uma API Node.js fala com Postgres; abrir conexão é caro e o servidor de banco aceita um número finito delas. Se cada requisição criar o próprio pool, o limite estoura no primeiro pico.",
          aplicacao:
            "Um pool único por processo, criado na primeira chamada e reusado por todas as rotas — o singleton (ou seu primo idiomático, a instância exportada de um módulo) garante que as N rotas disputam as mesmas 10 conexões, não 10 por rota.",
          tradeoff:
            "Nos testes de integração o pool global vaza entre suítes (conexões abertas, estado residual). A versão madura cria o pool no boot e o injeta — mesma unicidade, sem o acesso global.",
        },
        {
          titulo: "Configuração e feature flags em uma fintech",
          cenario:
            "Credenciais, URLs de provedores e flags de rollout são carregadas do ambiente no boot. Reler o ambiente a cada uso é lento e permite que dois módulos enxerguem valores diferentes no meio de um deploy.",
          aplicacao:
            "Um Config singleton carrega tudo uma vez e todos leem do mesmo lugar — consistência garantida durante a vida do processo.",
          tradeoff:
            "Se a config aceita escrita em runtime, virou estado global mutável com outro nome. Congele o objeto após o boot; mudanças dinâmicas de flag pedem um serviço próprio, com invalidação explícita.",
        },
        {
          titulo: "Logger central em uma plataforma de streaming",
          cenario:
            "Milhares de pontos de log em dezenas de módulos precisam escrever no mesmo destino, com buffer único — N writers abrindo N handles intercalam linhas e derrubam o throughput.",
          aplicacao:
            "Um logger único com buffer interno, acessado globalmente — é o desenho de bibliotecas como o módulo logging do Python, em que getLogger() devolve instâncias registradas centralmente.",
          tradeoff:
            "Testes que verificam logs precisam resetar o singleton entre casos, ou um teste enxerga as linhas do outro. Loggers modernos atenuam criando filhos injetáveis (child loggers) por módulo ou requisição.",
        },
      ],
    },
    {
      tipo: "anti-exemplo",
      titulo: "Quando o Singleton vira variável global",
      comoSeParece:
        "A instância única virou um depósito de estado mutável que qualquer parte do sistema lê e escreve. Ninguém declara que depende dela — a dependência entra por dentro, invisível na assinatura de todo mundo.",
      codigo: { lang: "typescript", code: ANTI_EXEMPLO },
      sintomas: [
        { quando: "No teste", efeito: "Dois testes que precisam de configurações diferentes não podem rodar na mesma suíte, e a ordem de execução passa a mudar o resultado." },
        { quando: "Em produção", efeito: "A dependência não aparece em nenhum construtor, então ninguém descobre quem usa o quê sem ler todo o código." },
        { quando: "Ao paralelizar", efeito: "O estado compartilhado vira uma condição de corrida silenciosa entre requisições concorrentes." },
      ],
      correcao:
        "Singleton controla o **ciclo de vida** (uma instância só), não o **acesso**. Mantenha a instância única na composição da aplicação e injete-a por parâmetro: quem depende, declara. E se o objeto guarda estado mutável, provavelmente ele não deveria ser único.",
    },
    {
      tipo: "armadilhas",
      itens: [
        {
          titulo: "Estado global disfarçado",
          texto:
            "Se o singleton guarda estado mutável de negócio, qualquer módulo pode alterá-lo e todos os outros sentem — sem que nenhuma assinatura declare a dependência. Bugs passam a depender da ordem de execução e a leitura do código mente sobre os efeitos. Singleton aceitável é quase sempre imutável após a criação (config congelada) ou um recurso técnico sem regra de negócio (pool, logger).",
        },
        {
          titulo: "Testes reféns da instância",
          texto:
            "A instância estática sobrevive de um teste para o outro: o que o teste A escreveu, o teste B lê. E como getInstancia() está hard-coded no código de produção, substituir por um dublê exige hacks (resetar o campo estático, recarregar módulos). A correção estrutural é injeção de dependência: quem recebe a dependência pelo construtor aceita um mock de graça — a unicidade fica a cargo de quem compõe a aplicação.",
        },
        {
          titulo: "'Único' só dentro do processo",
          texto:
            "A garantia vale por processo — não por sistema. Com quatro workers no cluster, quatro pods no Kubernetes ou N execuções serverless, existem N 'singletons' independentes; um contador global ou um lock implementado assim simplesmente não funciona. Unicidade entre processos pede outro ferramental: lock distribuído, constraint no banco, fila com partição única.",
        },
      ],
    },
    {
      tipo: "quando",
      usar: [
        "Um recurso físico ou caro deve existir uma única vez por processo (pool de conexões, cache em memória, handle de hardware).",
        "Duas instâncias causariam conflito real, não só desperdício (dois schedulers disparando o mesmo job, dois writers no mesmo arquivo).",
        "Não há injeção de dependência disponível (script, plugin, legado) e o ponto único de acesso é o mal menor documentado.",
      ],
      evitar: [
        "A motivação é só conveniência de acesso global — injeção de dependência entrega a mesma instância única sem esconder o acoplamento.",
        "O objeto carrega estado mutável de negócio — vira estado global e os testes passam a depender da ordem de execução.",
        "Você precisa substituir a dependência por dublês nos testes — singleton hard-coded não aceita mock sem hacks.",
      ],
    },
  ],
};
