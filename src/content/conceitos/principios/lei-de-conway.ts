import type { Conceito } from "@/shared/types/conceito";

const EXEMPLOS = [
  {
    lang: "typescript" as const,
    code: `// A Lei de Conway nao e sobre codigo — e sobre quem escreve o codigo.
//
// "Organizacoes desenham sistemas que copiam a estrutura de
//  comunicacao da propria organizacao." — Melvin Conway, 1968
//
// 4 times -> 4 modulos que conversam como os 4 times conversam.
//
// Se o time de "pagamentos" e o de "pedidos" quase nao se falam,
// a integracao entre os modulos deles vai ser pobre e cheia de
// mal-entendidos — nao por incompetencia tecnica, por organograma.

// INVERSE CONWAY MANEUVER: em vez de brigar com a lei, use-a.
// Quer uma arquitetura de servicos independentes por dominio?
// Primeiro organize TIMES independentes por dominio.
// A arquitetura desejada emerge da estrutura social que a favorece.`,
  },
];

export const leiDeConway: Conceito = {
  slug: "lei-de-conway",
  titulo: "Lei de Conway",
  categoria: "principio",
  resumo:
    "Sistemas espelham a estrutura de comunicação de quem os constrói. Dois times que mal se falam produzem uma integração pobre entre seus módulos — não por falha técnica, mas por organograma. A consequência prática é poderosa: para obter a arquitetura que você quer, muitas vezes é preciso primeiro organizar os times na forma dessa arquitetura.",
  tags: ["principio", "organizacao", "times", "arquitetura", "conway"],
  dificuldade: "intermediario",
  tempoLeitura: 6,
  nasceu: {
    quando: { rotulo: "1968", ano: 1968, precisao: "aproximada" },
    fonte:
      "Melvin Conway, 'How Do Committees Invent?', 1968 — o artigo original; o termo 'Lei de Conway' foi popularizado por Fred Brooks em 'The Mythical Man-Month'",
    precursor:
      "Conway observou em 1968 que sistemas copiam a estrutura de comunicação de quem os constrói, décadas antes de isso virar argumento para times por serviço.",
  },
  ondeAparece: [
    {
      onde: "microsserviços por time",
      explicacao:
        "Cada time dono de um serviço faz a arquitetura espelhar o organograma — Conway em ação, muitas vezes de propósito.",
    },
    {
      onde: "o BFF que nasceu do time de mobile",
      explicacao:
        "Um backend-for-frontend costuma existir porque há um time de mobile separado, não por uma necessidade puramente técnica.",
    },
    {
      onde: "inverse Conway maneuver",
      explicacao:
        "Reorganizar os times de propósito para que a arquitetura desejada emerja é a Lei de Conway usada como alavanca.",
    },
  ],
  emUmaLinha: {
    lang: "typescript",
    code: `// A arquitetura espelha a comunicação dos times.
// Fronteira de serviço ≈ fronteira de time.`,
  },
  custo: {
    indirecoes: 0,
    cobra: [
      "Ignorá-la faz a arquitetura desejada brigar com a comunicação real dos times, e a comunicação vence",
      "Aplicá-la de propósito exige reorganizar pessoas, que é mais lento e mais político do que mudar código",
    ],
    naoValeSe:
      "o sistema é construído por um time só e pequeno — sem várias fronteiras organizacionais, não há estrutura social a espelhar.",
  },
  relacionados: ["hexagonal", "srp"],
  problema: [
    "Times desenham arquiteturas no quadro branco assumindo que basta decidir os módulos. Mas a estrutura real que emerge não é a do diagrama: é a das linhas de comunicação de quem constrói.",
    "Se dois times raramente conversam, a fronteira entre os módulos deles fica cheia de mal-entendidos e integrações frágeis. Force uma arquitetura contra o organograma e o organograma vence — silenciosamente, a cada decisão do dia a dia.",
  ],
  solucao: [
    "Reconhecer que arquitetura e organização são a mesma decisão vista de dois ângulos. Antes de desenhar módulos, olhar como os times se comunicam de verdade.",
    "Usar a lei a favor (o 'inverse Conway maneuver'): moldar os times na forma da arquitetura que se quer, para que ela emerja naturalmente em vez de ser imposta contra a corrente.",
  ],
  quandoUsar: [
    "Ao planejar uma migração para microsserviços ou uma grande reorganização de módulos.",
    "Quando integrações entre áreas vivem quebrando sem causa técnica clara.",
    "Ao montar ou dividir times, pensando na arquitetura que essa estrutura vai produzir.",
  ],
  quandoEvitar: [
    "Como explicação única: nem todo problema de arquitetura é organizacional.",
    "Em times pequenos e únicos, onde não há fronteiras sociais a refletir.",
  ],
  exemplos: EXEMPLOS,
  blocos: [
    {
      tipo: "tldr",
      texto:
        "A Lei de Conway diz que sistemas copiam a estrutura de comunicação de quem os constrói: quatro times produzem quatro módulos que se integram tão bem quanto os times se falam. Brigar com isso é perder — o organograma vence a arquitetura de quadro branco. A jogada esperta é o inverse Conway maneuver: organize os times na forma da arquitetura que você quer, e ela emerge sozinha.",
    },
    {
      tipo: "analogia",
      emoji: "🏛️",
      titulo: "A ponte construída por duas equipes",
      texto:
        "Uma ponte foi construída por duas equipes começando de margens opostas, que quase não se coordenaram. No meio, os dois lados não se encontraram no mesmo ponto — houve um degrau. O problema não foi de engenharia de concreto: foi de comunicação entre as equipes, e a ponte ficou com a cara exata dessa falta de conversa. Software é igual: a 'junta' entre dois módulos tem a qualidade da conversa entre os times que os fizeram.",
    },
    {
      tipo: "secao",
      id: "usar-a-favor",
      titulo: "Usar a lei a favor",
      resumo: [
        "Como a estrutura organizacional vai moldar o sistema de qualquer jeito, a escolha não é 'se' obedecer a Conway, e sim se você a deixa acontecer por acaso ou a usa de propósito.",
        "O 'inverse Conway maneuver' inverte a ordem: em vez de desenhar a arquitetura e torcer para os times a seguirem, você molda os times na forma da arquitetura desejada — e ela emerge porque a comunicação agora a favorece.",
      ],
      extensao: [
        "É por isso que a organização de 'times por domínio' (cada time dono de um serviço, de ponta a ponta) tende a produzir microsserviços coesos, enquanto uma organização por camada técnica (um time de front, um de back, um de banco) tende a produzir um sistema fatiado por tecnologia, com toda feature atravessando três times. A arquitetura que você consegue sustentar é a que o seu organograma permite.",
        "A lei também explica dores comuns que parecem técnicas e não são: a integração ruim entre dois serviços cujos times ficam em fusos e prioridades diferentes; o backend-for-frontend que nasce porque o time de mobile precisava de um contrato só seu; o módulo compartilhado que ninguém mantém direito porque não tem dono claro. Antes de reprojetar o código, vale perguntar se o problema não está no desenho dos times — porque, se estiver, o novo código vai reencontrar o mesmo degrau.",
      ],
    },
    {
      tipo: "casos",
      titulo: "Como isso aparece na prática",
      casos: [
        {
          titulo: "A migração para microsserviços que virou monólito distribuído",
          cenario:
            "Um time único e monolítico dividiu o sistema em dez serviços, mas continuou trabalhando como um time só, com todos mexendo em tudo. Os serviços ficaram tão acoplados que um deploy exigia coordenar os dez.",
          aplicacao:
            "Antes de continuar a divisão técnica, a empresa reorganizou as pessoas em times donos de domínios específicos. As fronteiras de serviço passaram a coincidir com as fronteiras dos times.",
          tradeoff:
            "A reorganização de pessoas foi lenta e politicamente cara. Em troca, os serviços passaram a poder ser desenvolvidos e implantados de forma independente — o que a divisão só de código nunca entregou.",
        },
        {
          titulo: "A integração que só melhorou depois de um canal de conversa",
          cenario:
            "Dois módulos de áreas que reportavam a diretorias diferentes viviam com bugs na fronteira. Cada revisão de contrato virava uma negociação demorada entre chefias.",
          aplicacao:
            "Criou-se um contrato de API versionado e um ritual de sincronização entre as duas áreas. A qualidade da fronteira melhorou junto com a qualidade da comunicação.",
          tradeoff:
            "Adicionou reuniões e um processo de contrato onde antes não havia. Em troca, a fronteira parou de ser a fonte crônica de incidentes — porque a conversa que faltava passou a existir.",
        },
      ],
    },
    {
      tipo: "armadilhas",
      titulo: "Onde isto dá errado",
      itens: [
        {
          titulo: "Desenhar arquitetura ignorando o organograma",
          texto:
            "Decidir os módulos no quadro branco sem olhar como os times se comunicam é planejar contra a corrente. A estrutura de comunicação real vai moldar o sistema de qualquer forma, e o diagrama vira ficção.",
        },
        {
          titulo: "Dividir o código sem dividir os times",
          texto:
            "Quebrar um monólito em serviços mantendo um time único que mexe em tudo produz um monólito distribuído: todo o acoplamento de antes, agora com latência de rede e deploys que precisam ser coordenados.",
        },
        {
          titulo: "Tratar todo problema como organizacional",
          texto:
            "Conway explica muita coisa, mas não tudo. Usar a lei como desculpa para não resolver um acoplamento genuinamente técnico é fugir do problema em vez de enfrentá-lo.",
        },
      ],
    },
    {
      tipo: "codigo",
      titulo: "A lei, e como usá-la a favor",
      exemplos: EXEMPLOS,
    },
    {
      tipo: "quando",
      usar: [
        "Ao planejar migração para microsserviços ou grande reorganização.",
        "Quando integrações entre áreas quebram sem causa técnica clara.",
        "Ao montar ou dividir times, pensando na arquitetura resultante.",
      ],
      evitar: [
        "Como explicação única para todo problema de arquitetura.",
        "Em times pequenos e únicos, sem fronteiras sociais a refletir.",
      ],
    },
  ],
};
