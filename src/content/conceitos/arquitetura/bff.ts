import type { Conceito } from "@/shared/types/conceito";

const EXEMPLOS = [
  {
    lang: "typescript" as const,
    code: `// Sem BFF: uma API generica serve web, iOS e Android. O app mobile
// faz 5 chamadas e recebe campos que nao usa — rede lenta, bateria.
await Promise.all([
  fetch("/api/usuario"), fetch("/api/pedidos"),
  fetch("/api/enderecos"), fetch("/api/pontos"), fetch("/api/cupons"),
]); // 5 idas ao servidor so para montar UMA tela do celular.

// COM BFF: um backend por tipo de cliente, moldado a ELE.
// bff-mobile agrega e enxuga para a tela do app numa chamada so:
app.get("/mobile/home", async (req, res) => {
  const [usuario, pedidos, pontos] = await Promise.all([
    servicos.usuario(req.userId),
    servicos.pedidos(req.userId),
    servicos.fidelidade(req.userId),
  ]);
  res.json({                       // resposta sob medida para a home mobile:
    nome: usuario.nome,            // so os campos que ESTA tela usa
    ultimosPedidos: pedidos.slice(0, 3),
    pontos: pontos.total,
  });
});
// O app faz 1 chamada e recebe exatamente o que a tela precisa.
// O bff-web pode devolver algo diferente para a MESMA home no desktop.`,
  },
];

export const bff: Conceito = {
  slug: "bff",
  titulo: "Backend for Frontend (BFF)",
  categoria: "arquitetura",
  resumo:
    "Uma API genérica que tenta servir web, iOS e Android ao mesmo tempo acaba servindo mal a todos. O BFF é um backend por tipo de cliente, moldado às necessidades daquela interface: ele agrega chamadas, enxuga campos e formata a resposta sob medida. Cada frontend ganha um backend que fala a língua dele — ao preço de mais um serviço por cliente para manter, e do risco de duplicar lógica entre eles.",
  tags: ["arquitetura", "api", "frontend", "agregacao", "cliente"],
  dificuldade: "intermediario",
  tempoLeitura: 7,
  nasceu: {
    quando: { rotulo: "2015", ano: 2015, precisao: "aproximada" },
    fonte:
      "O padrão Backend for Frontend foi descrito por Sam Newman por volta de 2015, a partir da experiência do SoundCloud com apps móveis",
    precursor:
      "É uma especialização do API Gateway: em vez de um portão para todos, um backend por tipo de cliente, moldado às necessidades daquela interface.",
  },
  ondeAparece: [
    {
      onde: "um backend por app (web, iOS, Android)",
      explicacao:
        "Cada cliente ganha um backend feito sob medida para as necessidades dele, em vez de uma API genérica para todos.",
    },
    {
      onde: "o BFF do SoundCloud / Netflix",
      explicacao:
        "As empresas que popularizaram o padrão, cansadas de uma API única tentando servir web e mobile ao mesmo tempo.",
    },
    {
      onde: "agregar chamadas para o mobile",
      explicacao:
        "Um BFF junta várias chamadas de serviços numa resposta só, poupando a rede lenta e a bateria do celular.",
    },
  ],
  emUmaLinha: {
    lang: "typescript",
    code: `// API moldada para UMA experiência de UI.
const home = await bff.montarHome(userId); // agrega 3 serviços`,
  },
  custo: {
    indirecoes: 2,
    cobra: [
      "Mais um serviço por tipo de cliente para desenvolver, versionar e manter em pé",
      "Lógica pode se duplicar entre os BFFs se algo comum a todos os clientes for parar em cada um",
    ],
    naoValeSe:
      "há um único tipo de cliente, ou os clientes têm necessidades quase idênticas — aí um backend só serve a todos sem atrito.",
  },
  relacionados: ["api-gateway", "lei-de-conway", "hexagonal"],
  problema: [
    "Web, mobile e TV têm necessidades opostas. O desktop aguenta muitas chamadas e campos de sobra; o mobile quer uma resposta só, enxuta, porque a rede é lenta e a bateria acaba. Uma API genérica para todos vira um denominador comum que serve mal cada um.",
    "Tentar agradar a todos numa API só cria pressão constante: o time de mobile pede um campo agregado, o de web pede o oposto, e a API acumula variações e parâmetros até ninguém entender para quem cada coisa existe.",
  ],
  solucao: [
    "Dar a cada tipo de cliente um backend próprio, o BFF, cuja única responsabilidade é servir aquela interface: ele agrega as chamadas aos serviços de domínio, remove o que a tela não usa e formata a resposta como o cliente precisa.",
    "Deixar os serviços de domínio genéricos e estáveis, e concentrar a adaptação por cliente no BFF — que pode ser dono do time daquele frontend, mudando no ritmo dele.",
  ],
  quandoUsar: [
    "Quando clientes diferentes (web, mobile, TV) têm necessidades de dados e formato muito distintas.",
    "Para poupar a rede e a bateria do mobile agregando várias chamadas numa só.",
    "Quando cada frontend tem um time que quer evoluir seu backend no próprio ritmo.",
  ],
  quandoEvitar: [
    "Quando há um único tipo de cliente ou as necessidades são quase iguais.",
    "Quando a lógica que iria para os BFFs é de domínio e deveria viver nos serviços, não na borda.",
  ],
  exemplos: EXEMPLOS,
  blocos: [
    {
      tipo: "tldr",
      texto:
        "O BFF é um backend por tipo de cliente (web, iOS, Android), cuja função é servir aquela interface sob medida: agrega chamadas, enxuga campos, formata a resposta. Resolve o problema da API genérica que serve mal a todos porque tenta servir a todos. O custo é mais um serviço por cliente para manter, e o risco de duplicar entre os BFFs a lógica que era comum — que, se é de domínio, deveria ficar nos serviços, não na borda.",
    },
    {
      tipo: "analogia",
      emoji: "🧑‍🍳",
      titulo: "O garçom que conhece a mesa",
      texto:
        "Numa cozinha que atende salão, delivery e balcão, mandar o mesmo prato empratado do mesmo jeito para os três serve mal todo mundo: o delivery precisa embalado, o balcão precisa rápido, o salão precisa bonito. O BFF é o garçom especializado de cada canal: a cozinha (os serviços de domínio) prepara os ingredientes, e cada garçom monta e entrega do jeito que a sua mesa precisa. Um garçom por canal custa mais gente — mas cada mesa recebe exatamente o que espera, sem a cozinha ter que adivinhar para quem está cozinhando.",
    },
    {
      tipo: "secao",
      id: "por-cliente",
      titulo: "Um backend que fala a língua do cliente",
      resumo: [
        "O BFF não é uma camada a mais por capricho: ele existe porque a fronteira entre o backend genérico e a tela específica é onde mais aparece atrito. A resposta ideal para a home do app não é a ideal para a home do desktop, e forçar as duas numa API só empobrece ambas.",
        "A responsabilidade do BFF é estreita e clara: agregar (juntar várias chamadas numa só), adaptar (mandar só os campos que a tela usa) e formatar (a estrutura que aquele cliente consome). Ele é fino — a regra de negócio continua nos serviços.",
      ],
      extensao: [
        "O BFF é uma **especialização do API Gateway**, e a diferença importa. O gateway é um portão único para todos os clientes, focado em tarefas transversais (auth, rate limit, roteamento); o BFF é um portão **por cliente**, focado em moldar a resposta àquela interface. Muitos sistemas têm os dois: o gateway na frente cuida do transversal, e atrás dele há um BFF por tipo de cliente cuidando da adaptação. Confundi-los leva a um gateway inchado tentando também formatar respostas — ou a BFFs reimplementando auth que já era do gateway.",
        "A ligação com a **Lei de Conway** é direta e explica por que o padrão nasceu: um BFF costuma existir porque há um **time** dono daquele frontend, que quer evoluir seu backend sem depender do time de plataforma. A arquitetura (um backend por cliente) espelha a organização (um time por cliente). O risco a vigiar é a **duplicação**: se a mesma regra aparece no BFF de web e no de mobile, ou ela é de apresentação (tudo bem, cada tela é diferente) ou é de domínio — e aí ela vazou para a borda e deveria voltar para os serviços, antes que as cópias divirjam.",
      ],
    },
    {
      tipo: "casos",
      titulo: "Como isso aparece na prática",
      casos: [
        {
          titulo: "A home mobile que fazia cinco chamadas",
          cenario:
            "Para montar a tela inicial, o app fazia cinco requisições a uma API genérica e descartava metade dos campos que vinham. Em redes móveis lentas, a home demorava e consumia bateria e dados à toa.",
          aplicacao:
            "Um BFF mobile passou a agregar as cinco chamadas numa só e a devolver exatamente os campos daquela tela. O app passou a fazer uma requisição enxuta por tela.",
          tradeoff:
            "Surgiu um serviço BFF a mais para o time mobile manter e versionar. Em troca, a home ficou rápida, e o app deixou de carregar dados que nunca usava.",
        },
        {
          titulo: "A regra de negócio que vazou para os BFFs",
          cenario:
            "O cálculo de elegibilidade de um desconto foi implementado no BFF de web e, depois, copiado no BFF de mobile. As duas cópias divergiram, e web e app passaram a mostrar descontos diferentes para o mesmo usuário.",
          aplicacao:
            "O cálculo foi movido para o serviço de domínio, e os BFFs voltaram a só agregar e formatar. A regra passou a existir num lugar só, consumida por ambos.",
          tradeoff:
            "Os BFFs ficaram mais 'burros', dependendo de mais um serviço. É exatamente o objetivo: regra de negócio mora no domínio; o BFF só adapta para o cliente.",
        },
      ],
    },
    {
      tipo: "armadilhas",
      titulo: "Onde isto dá errado",
      itens: [
        {
          titulo: "Colocar regra de negócio no BFF",
          texto:
            "O BFF deve agregar e formatar, não decidir. Regra de negócio na borda tende a ser copiada para cada BFF e a divergir entre eles — web e mobile passam a discordar sobre o mesmo fato. Regra mora no domínio.",
        },
        {
          titulo: "Criar um BFF sem clientes distintos",
          texto:
            "Se há um tipo de cliente só, ou todos precisam do mesmo, o BFF é uma camada de rede a mais sem função. O padrão se paga quando as necessidades por cliente são genuinamente diferentes.",
        },
        {
          titulo: "Confundir BFF com API Gateway",
          texto:
            "O gateway é um portão único focado no transversal (auth, rate limit); o BFF é por cliente e focado em moldar a resposta. Fundir os dois gera um gateway inchado formatando respostas — responsabilidades que deveriam ficar separadas.",
        },
      ],
    },
    {
      tipo: "codigo",
      titulo: "Agregar e enxugar por cliente",
      exemplos: EXEMPLOS,
    },
    {
      tipo: "quando",
      usar: [
        "Quando clientes diferentes têm necessidades de dados e formato distintas.",
        "Para poupar rede e bateria do mobile agregando chamadas.",
        "Quando cada frontend tem um time que quer evoluir no próprio ritmo.",
      ],
      evitar: [
        "Quando há um único tipo de cliente ou necessidades quase iguais.",
        "Quando a lógica seria de domínio e deveria viver nos serviços.",
      ],
    },
  ],
};
