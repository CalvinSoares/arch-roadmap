import type { Conceito } from "@/shared/types/conceito";

const EXEMPLOS = [
  {
    lang: "typescript" as const,
    code: `// A REGRA DA DEPENDENCIA: o codigo-fonte so aponta para DENTRO.
// Fora -> dentro. O dominio no centro nao conhece banco nem framework.
//
//   [ frameworks/db/web ]  -> [ casos de uso ]  -> [ entidades ]
//        (detalhe)              (aplicacao)          (dominio)
//   dependencia aponta  --------------------------------->  para dentro

// O caso de uso depende de uma INTERFACE, definida por ele:
interface RepoPedidos {                 // <- porta, no anel de aplicacao
  salvar(p: Pedido): Promise<void>;
}

class FinalizarPedido {                 // caso de uso, no centro
  constructor(private repo: RepoPedidos) {} // depende da abstracao
  async executar(p: Pedido) { await this.repo.salvar(p); }
}

// O detalhe (Prisma, Postgres) IMPLEMENTA a interface, na borda:
class RepoPedidosPrisma implements RepoPedidos { /* ... */ }
// A dependencia foi INVERTIDA: o banco depende do dominio, nao o contrario.
// Por isso o dominio nao tem um unico import de framework.`,
  },
];

export const cleanArchitecture: Conceito = {
  slug: "clean-architecture",
  titulo: "Clean Architecture",
  categoria: "arquitetura",
  resumo:
    "Uma síntese de arquiteturas em camadas concêntricas, governada por uma única regra: as dependências só apontam para dentro. O domínio fica no centro e não conhece banco, framework nem interface; os detalhes ficam nas bordas e dependem do domínio, nunca o contrário. Isso torna o núcleo do sistema testável e imune a trocar de banco ou de framework — ao preço de camadas, interfaces e mapeamentos que só se pagam quando há regra de negócio para proteger.",
  tags: ["arquitetura", "camadas", "dependencia", "dominio", "testabilidade"],
  dificuldade: "avancado",
  tempoLeitura: 9,
  nasceu: {
    quando: { rotulo: "2012", ano: 2012, precisao: "aproximada" },
    fonte:
      "Robert C. Martin, artigo 'The Clean Architecture' (2012) e o livro homônimo (2017), sintetizando arquiteturas anteriores em círculos concêntricos",
    precursor:
      "É a síntese de ideias mais antigas — a Arquitetura Hexagonal de Cockburn (2005) e a Onion Architecture de Palermo (2008) — em torno da mesma regra de dependência.",
  },
  ondeAparece: [
    {
      onde: "a regra da dependência",
      explicacao:
        "Dependências só apontam para dentro, das camadas externas para as internas; o domínio no centro não conhece banco nem framework.",
    },
    {
      onde: "domínio sem import de framework",
      explicacao:
        "O código de negócio que não importa Express, Prisma ou React é o teste prático da Clean Architecture funcionando de verdade.",
    },
    {
      onde: "casos de uso no centro",
      explicacao:
        "A camada de casos de uso orquestra o domínio e é chamada pelas bordas, sem depender de nenhuma delas.",
    },
  ],
  emUmaLinha: {
    lang: "typescript",
    code: `// Dependências apontam para o domínio.
class CriarPedido { constructor(private repo: PedidoRepo) {} }`,
  },
  custo: {
    indirecoes: 2,
    cobra: [
      "Camadas e inversões de dependência a mais, com mapeamentos entre elas para o domínio não vazar",
      "Muita cerimônia (interfaces, DTOs, mappers) que não se paga num sistema pequeno",
    ],
    naoValeSe:
      "o app é pequeno, é sobretudo CRUD e não tem regra de negócio rica — as camadas só adicionam indireção sem proteger nada.",
  },
  relacionados: ["hexagonal", "dip", "ocp"],
  problema: [
    "Sem uma regra de dependência, o código de negócio acaba encostado no framework: a entidade importa o ORM, a regra depende do formato do request HTTP, a lógica sabe que existe React. Trocar qualquer detalhe — banco, framework, UI — vira uma cirurgia que atravessa tudo.",
    "Pior, o que deveria ser a parte mais estável e valiosa (as regras de negócio) fica refém da parte mais volátil (as ferramentas). O núcleo não pode ser testado sem subir banco e framework, e uma atualização de biblioteca ameaça a lógica de negócio.",
  ],
  solucao: [
    "Organizar o sistema em anéis concêntricos — entidades, casos de uso, adaptadores, frameworks — e impor a regra da dependência: o código-fonte só aponta para dentro. O centro não sabe que as bordas existem.",
    "Inverter as dependências nas fronteiras (DIP): o caso de uso define a interface do repositório; o banco a implementa. Assim o detalhe depende do domínio, o domínio não importa framework nenhum, e o núcleo fica testável em isolamento.",
  ],
  quandoUsar: [
    "Em sistemas com regra de negócio rica que precisa sobreviver a trocas de banco, framework e UI.",
    "Quando testar o núcleo sem infraestrutura é um objetivo real e recorrente.",
    "Quando o custo de a lógica de negócio ficar acoplada a ferramentas já se mostrou caro.",
  ],
  quandoEvitar: [
    "Em apps pequenos e sobretudo CRUD, onde as camadas só adicionam indireção.",
    "Quando a cerimônia de interfaces e mappers supera a regra de negócio que haveria para proteger.",
  ],
  exemplos: EXEMPLOS,
  blocos: [
    {
      tipo: "tldr",
      texto:
        "Clean Architecture é um monte de camadas concêntricas com uma regra só que importa: as dependências apontam para dentro. O domínio fica no centro e não importa banco, framework nem UI; os detalhes ficam nas bordas e dependem do domínio, via inversão de dependência. O resultado é um núcleo testável e imune a trocar de ferramenta. O custo são as camadas, interfaces e mapeamentos — que valem quando há regra de negócio rica, e sobram num CRUD.",
    },
    {
      tipo: "analogia",
      emoji: "🎛️",
      titulo: "A usina e as tomadas",
      texto:
        "A usina que gera energia não sabe nada sobre os aparelhos que vão consumi-la — nem a marca, nem o modelo, nem se é um liquidificador ou um notebook. Ela expõe um padrão (a tomada), e cada aparelho se adapta a ele. Trocar o liquidificador por outro não muda nada na usina. Clean Architecture põe as regras de negócio na posição da usina: elas não conhecem o banco, o framework nem a tela — expõem contratos, e os detalhes se pluga nelas. Você troca o 'aparelho' (o banco, a UI) sem tocar na 'usina' (o domínio).",
    },
    {
      tipo: "secao",
      id: "regra-da-dependencia",
      titulo: "A única regra que importa",
      resumo: [
        "As camadas (entidades no centro, depois casos de uso, depois adaptadores, depois frameworks) são famosas pelo diagrama, mas o coração é uma frase: **as dependências de código só apontam para dentro**. Uma camada externa pode conhecer uma interna; a interna nunca conhece a externa.",
        "O teste prático é brutal e simples: procure no domínio um `import` de Express, Prisma, React. Se existir, a regra foi violada. O núcleo tem que ser escrito como se banco e framework não existissem — porque, para ele, não existem.",
      ],
      extensao: [
        "O mecanismo que faz isso funcionar nas fronteiras é a **inversão de dependência**. O caso de uso precisa persistir um pedido, mas não pode importar o banco (isso apontaria para fora). Então ele **define** a interface `RepoPedidos` — que pertence ao anel de dentro — e o adaptador de banco, no anel de fora, a **implementa**. A dependência de código passa a apontar de fora para dentro (o banco depende da interface do domínio), enquanto o fluxo de execução em tempo real vai de dentro para fora. Essa separação entre direção da dependência e direção da chamada é o truque central.",
        "Vale situar Clean Architecture entre os primos: ela é a **síntese** da Hexagonal (portas e adaptadores) e da Onion, todas girando em torno da mesma regra de dependência — a diferença é mais de vocabulário e de número de anéis que de essência. E vale o aviso honesto: o custo é real. Cada fronteira invertida é uma interface a mais, e mapear entre a entidade de domínio e o DTO de cada borda gera mappers que não fazem 'nada' visível. Num sistema com regra de negócio rica, isso se paga em testabilidade e longevidade; num CRUD que só lê e grava formulários, é cerimônia pura — e o certo ali é uma arquitetura mais rasa.",
      ],
    },
    {
      tipo: "casos",
      titulo: "Como isso aparece na prática",
      casos: [
        {
          titulo: "O núcleo testável sem subir nada",
          cenario:
            "Um sistema de precificação tinha regras complexas, mas testá-las exigia subir banco, filas e o framework web inteiro. Os testes eram lentos, frágeis e raramente rodados, e a lógica de preço vivia quebrando em produção.",
          aplicacao:
            "As regras foram movidas para o centro, com o banco e as filas atrás de interfaces implementadas nas bordas. Os testes do núcleo passaram a rodar com repositórios em memória, sem infraestrutura.",
          tradeoff:
            "Surgiram interfaces e mappers entre as camadas, e o código ficou maior. Em troca, a lógica de preço passou a ter testes rápidos e confiáveis, e os bugs de negócio caíram.",
        },
        {
          titulo: "A Clean Architecture que afogou um CRUD",
          cenario:
            "Um time aplicou Clean Architecture completa a um app que era essencialmente formulários lendo e gravando no banco. Cada tela nova exigia entidade, caso de uso, interface de repositório, DTO e três mappers — para praticamente nenhuma regra.",
          aplicacao:
            "A arquitetura foi achatada: o acesso a dados passou a ser mais direto, mantendo uma separação leve, sem a cerimônia completa de anéis e inversões onde não havia regra de negócio a proteger.",
          tradeoff:
            "Perdeu-se o isolamento total do domínio. Foi a escolha certa: não havia domínio rico para isolar, e a cerimônia estava custando velocidade sem entregar proteção.",
        },
      ],
    },
    {
      tipo: "armadilhas",
      titulo: "Onde isto dá errado",
      itens: [
        {
          titulo: "O framework vazando para o centro",
          texto:
            "Uma entidade que importa o ORM, ou um caso de uso que recebe o objeto de request do Express, quebra a regra da dependência. O núcleo tem que ser escrito sem conhecer as ferramentas — um único import de framework no domínio já denuncia a violação.",
        },
        {
          titulo: "Aplicar a arquitetura inteira num CRUD",
          texto:
            "Quando não há regra de negócio rica, as camadas, interfaces e mappers viram cerimônia pura: muito código que não protege nada. Clean Architecture se paga em domínios complexos, não em formulários.",
        },
        {
          titulo: "Confundir camadas com pastas",
          texto:
            "Criar pastas 'domain', 'application' e 'infra' sem impor a direção da dependência é teatro. O que vale é a regra — dentro não conhece fora — verificável por lint de dependência, não a organização visual.",
        },
      ],
    },
    {
      tipo: "codigo",
      titulo: "Dependência invertida na fronteira",
      exemplos: EXEMPLOS,
    },
    {
      tipo: "quando",
      usar: [
        "Em sistemas com regra de negócio rica que precisa sobreviver a trocas de ferramenta.",
        "Quando testar o núcleo sem infraestrutura é um objetivo real.",
        "Quando o acoplamento da lógica às ferramentas já se mostrou caro.",
      ],
      evitar: [
        "Em apps pequenos e sobretudo CRUD.",
        "Quando a cerimônia supera a regra de negócio a proteger.",
      ],
    },
  ],
};
