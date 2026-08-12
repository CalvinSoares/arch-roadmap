import type { Conceito } from "@/shared/types/conceito";

const EXEMPLOS = [
  {
    lang: "typescript" as const,
    code: `// Microsservicos: cada servico e autonomo — proprio deploy, proprio
// banco, propria escala. Eles se falam pela REDE, nao por chamada local.

// Servico de Pedidos NAO acessa a tabela de Estoque direto.
// Ele pede, pela rede, ao servico dono daquele dado:
const estoque = await fetch("http://estoque/itens/42").then((r) => r.json());
//              ^^^^^ e aqui entram TODAS as 8 falacias da rede:
//                    pode falhar, demorar, voltar diferente.

// E a transacao que cruza servicos perde o ACID:
// "cobrar + baixar estoque" nao cabe numa transacao de banco unica.
// Vira uma SAGA: cada passo commita local, e uma falha compensa os anteriores.

// A autonomia (deploy e escala independentes) e o premio.
// A rede no meio e a consistencia eventual sao a conta.`,
  },
];

export const microsservicos: Conceito = {
  slug: "microsservicos",
  titulo: "Microsserviços",
  categoria: "arquitetura",
  resumo:
    "Dividir o sistema em serviços pequenos e autônomos, cada um com seu deploy, seu banco e sua escala. Compra autonomia — times e serviços evoluem independentes — e cobra caro: a rede entra no meio de tudo, transações viram sagas, e cada serviço vira um sistema a operar. É uma troca de complexidade de código por complexidade operacional, e só vale quando a autonomia resolve um problema que você de fato tem.",
  tags: ["arquitetura", "distribuido", "escalabilidade", "servicos", "autonomia"],
  dificuldade: "avancado",
  tempoLeitura: 9,
  nasceu: {
    quando: { rotulo: "2014", ano: 2014, precisao: "aproximada" },
    fonte:
      "O termo foi consolidado por James Lewis e Martin Fowler no artigo 'Microservices' (2014), a partir da prática de Netflix, Amazon e outros",
    precursor:
      "A ideia de serviços pequenos e independentes vem da arquitetura orientada a serviços (SOA) dos anos 2000 e da filosofia Unix de programas que fazem uma coisa só.",
  },
  ondeAparece: [
    {
      onde: "Netflix, Amazon, Uber",
      explicacao:
        "As arquiteturas de referência que popularizaram serviços pequenos e independentes, cada um com seu deploy e seu banco.",
    },
    {
      onde: "um repositório e deploy por serviço",
      explicacao:
        "Cada serviço com seu próprio ciclo de vida — build, deploy e escala independentes — é a marca operacional do estilo.",
    },
    {
      onde: "banco por serviço",
      explicacao:
        "Cada serviço dono do seu banco, sem outro acessando as tabelas dele direto, é o que dá a autonomia e cobra a consistência eventual.",
    },
  ],
  emUmaLinha: {
    lang: "typescript",
    code: `// Deploy e banco por serviço — fronteira física.
// pedido-svc e estoque-svc não compartilham tabela.`,
  },
  custo: {
    indirecoes: 3,
    cobra: [
      "Cada serviço vira um sistema a operar: deploy, banco, monitoramento, alerta e plantão próprios",
      "Uma transação que atravessa serviços perde o ACID e vira saga, com consistência eventual e compensação",
    ],
    naoValeSe:
      "o sistema é pequeno e o time é um só — a complexidade distribuída custa muito mais do que a autonomia que ela compra.",
  },
  relacionados: ["monolito-modular", "lei-de-conway", "saga"],
  problema: [
    "Um monólito grande, tocado por muitos times, vira um gargalo: todo mundo faz deploy do mesmo artefato, uma mudança arriscada trava a fila de todos, e não dá para escalar só a parte que está sob carga — sobe-se o processo inteiro.",
    "A promessa dos microsserviços é romper esse acoplamento: cada serviço tem seu deploy, seu banco e sua escala, e cada time é dono do seu. Mas trocar chamadas locais por rede muda a natureza de todos os problemas.",
  ],
  solucao: [
    "Dividir o sistema por capacidade de negócio em serviços autônomos: cada um dono do seu dado (banco por serviço), com deploy e escala independentes, comunicando-se por rede — API síncrona ou eventos.",
    "Aceitar conscientemente o que a divisão cobra: as 8 falácias da rede em cada chamada, consistência eventual entre serviços, e transações que viram sagas — e pagar isso só onde a autonomia compensa.",
  ],
  quandoUsar: [
    "Quando vários times independentes precisam entregar sem travar uns aos outros no mesmo deploy.",
    "Quando partes do sistema têm perfis de escala muito diferentes e você quer escalar só uma.",
    "Quando as fronteiras de domínio já estão claras e estáveis o bastante para virar fronteiras de serviço.",
  ],
  quandoEvitar: [
    "No início de um produto, com time pequeno e fronteiras ainda incertas.",
    "Quando um monólito modular ainda resolve — dividir cedo paga o custo distribuído sem o benefício.",
  ],
  exemplos: EXEMPLOS,
  blocos: [
    {
      tipo: "tldr",
      texto:
        "Microsserviços dividem o sistema em serviços autônomos — deploy, banco e escala próprios — que se falam pela rede. O prêmio é autonomia: times e serviços evoluem sem travar uns aos outros. A conta é pesada: a rede (e suas 8 falácias) entra em cada chamada, transações entre serviços viram sagas com consistência eventual, e cada serviço é um sistema a operar. É trocar complexidade de código por complexidade operacional — só vale quando a autonomia resolve um problema real.",
    },
    {
      tipo: "analogia",
      emoji: "🍽️",
      titulo: "Food trucks × um restaurante grande",
      texto:
        "Um restaurante grande tem uma cozinha só: um cardápio, um chef coordenando, tudo sob o mesmo teto — simples de operar, difícil de escalar uma parte sem mexer no resto. Uma praça de food trucks é o oposto: cada truck é autônomo, abre e fecha sozinho, tem sua própria fila e pode ser trocado sem afetar os outros. Mas agora alguém precisa coordenar estacionamento, energia, lixo e a praça inteira — a complexidade saiu de dentro da cozinha e foi para o espaço entre os trucks. Microsserviços são a praça: autonomia de cada truck, ao preço de operar a praça.",
    },
    {
      tipo: "secao",
      id: "a-conta",
      titulo: "O que a rede cobra",
      resumo: [
        "O erro fundador é achar que microsserviços são 'o monólito, só que em pedaços'. Não são: no momento em que uma chamada de método vira uma chamada de rede, ela herda as 8 falácias — pode falhar, demorar, voltar diferente — e cada uma precisa de timeout, retry e tratamento de erro.",
        "E a transação some. Dentro de um banco, 'cobrar e baixar estoque' é ACID. Entre dois serviços com bancos diferentes, não existe transação compartilhada: vira uma saga, com consistência eventual e ações de compensação para desfazer o que já foi feito.",
      ],
      extensao: [
        "A regra que dá autonomia de verdade é **banco por serviço**: cada serviço é dono do seu dado e ninguém acessa as tabelas do outro direto. Sem isso, você tem um 'monólito distribuído' — o pior dos dois mundos: os serviços estão separados fisicamente (com latência de rede e deploys a coordenar) mas acoplados pelos dados (uma mudança de schema quebra vários). A separação física sem a separação de dados só adiciona custo.",
        "É por isso que microsserviços são, antes de tudo, uma decisão **organizacional** (Lei de Conway): a divisão só entrega o prometido se cada serviço tem um time dono, capaz de fazer deploy sozinho. Dividir o código em dez serviços mantendo um time único que mexe em tudo produz o monólito distribuído. O caminho saudável quase sempre começa por um **monólito modular** bem fronteirado — as fronteiras de módulo, já testadas dentro do processo, viram as fronteiras de serviço quando (e se) a escala ou a autonomia justificarem a distribuição.",
      ],
    },
    {
      tipo: "casos",
      titulo: "Como isso aparece na prática",
      casos: [
        {
          titulo: "O serviço de checkout que precisava escalar sozinho",
          cenario:
            "Numa Black Friday, só o checkout ficava sob carga extrema, mas ele vivia no mesmo monólito que o catálogo e o painel administrativo. Escalar o checkout obrigava a subir réplicas do sistema inteiro, caro e lento.",
          aplicacao:
            "O checkout foi extraído para um serviço próprio, com deploy e escala independentes, comunicando-se com o resto por eventos. Nos picos, só ele sobe réplicas.",
          tradeoff:
            "O fluxo de compra passou a atravessar a rede e virou uma saga, com consistência eventual entre checkout, estoque e pagamento. Foi o preço aceito para poder escalar a parte quente sem carregar o resto.",
        },
        {
          titulo: "O monólito distribuído que ninguém conseguia deployar",
          cenario:
            "Um time dividiu o sistema em oito serviços, mas todos liam e escreviam no mesmo banco compartilhado. Uma mudança de schema quebrava vários serviços de uma vez, e os deploys tinham que ser coordenados como se ainda fosse um monólito — agora com latência de rede.",
          aplicacao:
            "Cada serviço passou a ser dono do seu próprio banco, e o acesso a dados de outro serviço virou chamada de API ou evento. As fronteiras de dados foram alinhadas às fronteiras de serviço.",
          tradeoff:
            "Separar os bancos foi uma migração longa e cara, e o que era um JOIN virou chamada remota. Em troca, os serviços finalmente puderam ser desenvolvidos e implantados de forma independente.",
        },
      ],
    },
    {
      tipo: "armadilhas",
      titulo: "Onde isto dá errado",
      itens: [
        {
          titulo: "Banco compartilhado entre serviços",
          texto:
            "Serviços que leem e escrevem nas mesmas tabelas estão acoplados pelo dado: uma mudança de schema quebra vários, e os deploys voltam a precisar de coordenação. É o monólito distribuído — custo de rede sem a autonomia.",
        },
        {
          titulo: "Dividir cedo demais, com fronteiras incertas",
          texto:
            "No início, as fronteiras de domínio ainda estão se descobrindo. Congelá-las em serviços (com rede e banco separados) torna mover uma fronteira caríssimo — o que num monólito modular seria uma refatoração vira uma migração distribuída.",
        },
        {
          titulo: "Ignorar a rede entre os serviços",
          texto:
            "Tratar chamada remota como local — sem timeout, sem retry, sem tratar falha parcial — faz o sistema desmoronar no primeiro soluço de rede. As 8 falácias não são opcionais quando há rede no meio.",
        },
      ],
    },
    {
      tipo: "codigo",
      titulo: "Autonomia com a rede no meio",
      exemplos: EXEMPLOS,
    },
    {
      tipo: "quando",
      usar: [
        "Quando vários times precisam entregar sem travar uns aos outros.",
        "Quando partes do sistema têm perfis de escala muito diferentes.",
        "Quando as fronteiras de domínio já estão claras e estáveis.",
      ],
      evitar: [
        "No início de um produto, com time pequeno e fronteiras incertas.",
        "Quando um monólito modular ainda resolve.",
      ],
    },
  ],
};
