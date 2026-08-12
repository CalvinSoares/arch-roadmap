import type { Conceito } from "@/shared/types/conceito";

const MERMAID = `flowchart TB
    App[Aplicação] --> Ro{Roteador:\\nhash da shard key}
    Ro -->|"0–5k"| S1[(Shard A)]
    Ro -->|"5k–10k"| S2[(Shard B)]
    Ro -->|"10k–15k"| S3[(Shard C)]`;

const EXEMPLOS = [
  {
    lang: "typescript" as const,
    code: `// Sharding: cada linha vive em UM shard, escolhido pela shard key.
// A escolha da chave decide tudo — inclusive os problemas futuros.

// Ingenuo: modulo pelo numero de shards.
function shardIngenuo(clienteId: number, totalShards: number) {
  return clienteId % totalShards;
  // A pegadinha: mudar totalShards de 4 para 5 remapeia QUASE TUDO.
  // Adicionar um shard vira uma migracao massiva de dados.
}

// Melhor: hashing consistente. Adicionar um shard remapeia so
// uma fracao das chaves, nao o mundo inteiro.
function shardConsistente(clienteId: number, anel: AnelDeHash) {
  return anel.noResponsavelPor(hash(clienteId));
}

// A consulta que tem a shard key e barata: vai direto ao shard certo.
buscarPedidos({ clienteId: 42 }); // roteia para 1 shard

// A consulta SEM a shard key e cara: precisa perguntar a TODOS
// e juntar as respostas (scatter-gather).
buscarPedidos({ status: "pago" }); // pergunta a todos os shards`,
  },
];

export const sharding: Conceito = {
  slug: "sharding",
  titulo: "Sharding",
  categoria: "dados",
  resumo:
    "Quando os dados não cabem mais numa máquina — nem em disco, nem em escrita —, a saída é reparti-los: cada shard guarda um pedaço, escolhido por uma chave. Escala escrita e volume de forma horizontal, ao preço alto de perder as junções fáceis, as transações entre shards e a chance de errar a chave e nunca mais conseguir corrigir barato.",
  tags: ["distribuido", "particionamento", "escalabilidade", "escrita", "banco"],
  dificuldade: "avancado",
  tempoLeitura: 9,
  nasceu: {
    quando: { rotulo: "anos 2000", ano: 2005, precisao: "aproximada" },
    fonte:
      "Prática consolidada na web dos anos 2000 — Google Bigtable (OSDI 2006), a arquitetura de shards do Flickr e a escala de MySQL de então",
    precursor:
      "O particionamento horizontal por chave é bem mais velho: os SGBDs paralelos e o 'declustering' dos anos 1980 (projeto Gamma, Teradata) já dividiam tabelas por nó.",
  },
  ondeAparece: [
    {
      onde: "sharded clusters do MongoDB",
      explicacao:
        "A coleção é dividida por uma shard key e cada pedaço vive num conjunto de réplicas diferente, roteado automaticamente.",
    },
    {
      onde: "Vitess (YouTube/MySQL)",
      explicacao:
        "A camada que faz muitos MySQL parecerem um banco só, repartindo as linhas por trás em dezenas de shards.",
    },
    {
      onde: "partição por hash do Cassandra",
      explicacao:
        "A chave de partição decide em qual nó do anel a linha mora — é o sharding embutido no próprio modelo de dados.",
    },
  ],
  emUmaLinha: {
    lang: "typescript",
    code: `// A shard key decide onde a linha mora.
const shard = anel.noResponsavelPor(hash(clienteId));`,
  },
  custo: {
    indirecoes: 1,
    cobra: [
      "Junções e transações que cruzam shards deixam de ser triviais — viram scatter-gather ou coordenação distribuída",
      "A escolha da shard key é quase irreversível: recarregá-la depois é uma migração massiva de dados vivos",
      "Uma chave mal escolhida concentra carga num shard (hot shard) e desfaz o ganho que motivou o sharding",
    ],
    naoValeSe:
      "réplicas de leitura, índice ou um banco maior ainda dão conta. Sharding é o último recurso de escala, não o primeiro — o custo operacional é permanente.",
  },
  relacionados: ["replica-de-leitura", "cap", "indice"],
  problema: [
    "Um banco cresce até bater num teto que a réplica não resolve: o volume não cabe mais em disco, ou a taxa de escrita satura o único primário. Comprar uma máquina maior adia o problema e fica caro rápido.",
    "Diferente da leitura, a escrita não se divide copiando: todas as réplicas precisam aplicar a mesma escrita. Para dividir escrita e volume de verdade, é preciso que dados diferentes vivam em máquinas diferentes.",
  ],
  solucao: [
    "Repartir os dados em shards, cada um responsável por um subconjunto das linhas, escolhido por uma shard key. Cada shard é um banco independente, com sua própria escrita, seu próprio disco e suas próprias réplicas.",
    "Rotear cada operação pela shard key: quem tem a chave vai direto ao shard certo; quem não tem precisa perguntar a todos. Escolher a chave com muito cuidado, porque trocá-la depois é caríssimo.",
  ],
  quandoUsar: [
    "Quando o volume de dados ou a taxa de escrita passou do que uma máquina (e suas réplicas) aguenta.",
    "Quando existe uma shard key natural que aparece na maioria das consultas — o id do cliente, do tenant, da conta.",
    "Depois de esgotar réplicas de leitura, índices e verticalização, não antes.",
  ],
  quandoEvitar: [
    "Enquanto réplica, índice ou uma instância maior ainda resolvem — o custo operacional do sharding é permanente.",
    "Quando as consultas mais importantes não carregam a shard key e virariam scatter-gather em todo shard.",
  ],
  mermaid: MERMAID,
  exemplos: EXEMPLOS,
  blocos: [
    {
      tipo: "tldr",
      texto:
        "Sharding reparte as linhas entre máquinas para escalar o que a réplica não escala: escrita e volume. Cada shard é um banco independente, e uma shard key decide onde cada linha mora. O ganho é horizontal e quase ilimitado; o preço é alto e permanente — junções e transações entre shards ficam difíceis, consultas sem a chave viram scatter-gather, e escolher a chave errada é um erro que sai caríssimo para desfazer.",
    },
    {
      tipo: "analogia",
      emoji: "🗄️",
      titulo: "O arquivo que virou vários armários",
      texto:
        "Um único arquivo de fichas por sobrenome funciona até encher a sala. Aí você compra vários armários e divide: A–F num, G–M noutro, e assim por diante. Achar a ficha da Maria é instantâneo — você sabe o armário. Mas 'liste todo mundo que mora em São Paulo' agora obriga a abrir todos os armários e juntar as fichas, porque a divisão foi por sobrenome, não por cidade. A chave que você escolheu para dividir decide para sempre quais buscas são baratas e quais são um pesadelo.",
    },
    {
      tipo: "secao",
      id: "a-chave",
      titulo: "A shard key decide o seu futuro",
      resumo: [
        "Toda a economia do sharding depende de uma decisão: a shard key. A consulta que carrega a chave vai direto a um shard e é barata; a que não carrega precisa perguntar a todos os shards e juntar as respostas — o **scatter-gather**, que fica mais lento quanto mais você escala.",
        "Pior: a chave é quase irreversível. Trocá-la depois significa recolocar todos os dados vivos em novos shards, uma migração que ninguém quer fazer. A escolha errada não dá erro — ela apenas torna as consultas importantes caras para sempre.",
      ],
      extensao: [
        "Duas falhas de chave são recorrentes. A primeira é o **hot shard**: uma chave que concentra tráfego (dividir por país num app dominado por um único país, ou por data num sistema onde tudo acontece hoje) joga a carga num shard só e desfaz o ganho. A chave boa distribui de forma uniforme **e** aparece nas consultas quentes — as duas coisas ao mesmo tempo, o que é mais raro do que parece.",
        "A segunda é o **rebalanceamento**. Repartir por `id % N` parece simples até você precisar do shard N+1: mudar o divisor remapeia quase todas as chaves de uma vez, transformando 'adicionar um shard' numa migração total. É por isso que sistemas sérios usam **hashing consistente** (um anel onde adicionar um nó remapeia só uma fatia das chaves) ou faixas explícitas com um catálogo de qual faixa vive onde.",
        "E há o que se perde de graça no banco único: **junções** entre tabelas que caíram em shards diferentes não existem mais sem trazer dados para a aplicação, e **transações** que tocam mais de um shard exigem coordenação distribuída (o território do 2PC, com todos os seus problemas). Muitos projetos evitam isso desenhando os dados para que tudo que muda junto caia no mesmo shard — o que faz a escolha da chave voltar a ser a decisão central.",
      ],
    },
    {
      tipo: "casos",
      titulo: "Como isso aparece na prática",
      casos: [
        {
          titulo: "O SaaS que shardou por tenant",
          cenario:
            "Uma plataforma multi-inquilino cresceu até o banco único não aguentar a escrita agregada de milhares de empresas clientes, cada uma isolada das outras.",
          aplicacao:
            "Os dados foram shardados pela `tenant_id`. Como quase toda consulta já filtrava por tenant, ela passou a ir direto a um único shard, e cada empresa ficou naturalmente isolada num pedaço do cluster.",
          tradeoff:
            "Relatórios que cruzam todos os tenants viraram scatter-gather e ganharam um pipeline próprio. Um tenant gigante pode virar hot shard, o que exige tratá-lo à parte.",
        },
        {
          titulo: "A chave de data que criou um hot shard",
          cenario:
            "Um sistema de eventos shardou por data para 'distribuir no tempo'. Como quase toda escrita e leitura é sobre o dia de hoje, um único shard — o de hoje — recebia praticamente toda a carga.",
          aplicacao:
            "A shard key foi trocada para um hash do id do evento, distribuindo a carga uniformemente. A migração exigiu recarregar o histórico inteiro em novos shards, com dupla escrita durante a transição.",
          tradeoff:
            "A migração foi longa e arriscada — exatamente o custo de corrigir uma shard key depois. Consultas por intervalo de datas passaram a tocar todos os shards, o que foi resolvido com um índice secundário por tempo.",
        },
      ],
    },
    {
      tipo: "armadilhas",
      titulo: "Onde isto dá errado",
      itens: [
        {
          titulo: "Shardar cedo demais",
          texto:
            "Sharding é o degrau mais caro e mais permanente de escala. Réplica de leitura, índice e uma máquina maior resolvem a maioria dos casos por muito mais tempo do que se imagina. Adotar sharding antes da hora paga um custo operacional pesado por um problema que ainda não existe.",
        },
        {
          titulo: "Escolher uma shard key que gera hot shard",
          texto:
            "Dividir por data num sistema focado no hoje, ou por país num app de um país só, concentra a carga num shard e desfaz o ganho. A chave precisa distribuir de forma uniforme, não só parecer uma divisão natural.",
        },
        {
          titulo: "Usar id % N e depois querer mudar N",
          texto:
            "O módulo pelo número de shards remapeia quase todas as chaves quando você adiciona um shard, transformando um crescimento rotineiro em migração total. Hashing consistente ou faixas com catálogo evitam esse remapeamento em massa.",
        },
        {
          titulo: "Contar com junções e transações entre shards",
          texto:
            "O que era um JOIN ou uma transação trivial no banco único vira scatter-gather ou coordenação distribuída entre shards. Se as operações centrais cruzam shards, ou a chave está errada, ou o sharding não era a resposta.",
        },
      ],
    },
    {
      tipo: "diagrama",
      titulo: "O roteador e os shards",
      mermaid: MERMAID,
    },
    {
      tipo: "codigo",
      titulo: "Roteamento e o custo da consulta sem chave",
      exemplos: EXEMPLOS,
    },
    {
      tipo: "quando",
      usar: [
        "Quando volume ou escrita passou do que uma máquina e suas réplicas aguentam.",
        "Quando há uma shard key natural presente na maioria das consultas.",
        "Depois de esgotar réplica, índice e verticalização.",
      ],
      evitar: [
        "Enquanto réplica, índice ou instância maior ainda resolvem.",
        "Quando as consultas quentes não carregam a shard key.",
      ],
    },
  ],
};
