import type { Conceito } from "@/shared/types/conceito";

const MERMAID = `flowchart LR
    App[Aplicação] -->|escrita| P[(Primário)]
    App -->|leitura| R1[(Réplica 1)]
    App -->|leitura| R2[(Réplica 2)]
    P -. replicação do WAL .-> R1
    P -. replicação do WAL .-> R2`;

const EXEMPLOS = [
  {
    lang: "typescript" as const,
    code: `// Uma pool para escrever, outra para ler. A regra e simples de
// enunciar e facil de errar: escrita e "read-your-writes" vao ao
// primario; o resto vai a replica.

const primario = criarPool(process.env.DB_PRIMARIO);
const replica = criarPool(process.env.DB_REPLICA); // pode ser N replicas

async function executar(sql: string, params: unknown[], opts = { escrita: false }) {
  const pool = opts.escrita ? primario : replica;
  return pool.query(sql, params);
}

// Consulta pesada de relatorio: replica, sem tocar no primario.
await executar("SELECT ... FROM pedidos WHERE ...", [], { escrita: false });

// Debito: primario, sempre.
await executar("UPDATE contas SET saldo = saldo - $1 WHERE id = $2", [v, id], {
  escrita: true,
});

// A pegadinha: um SELECT que decide uma escrita NAO e leitura pura.
// Ele precisa do valor atual, entao vai ao primario tambem.`,
  },
];

export const replicaDeLeitura: Conceito = {
  slug: "replica-de-leitura",
  titulo: "Réplica de leitura",
  categoria: "dados",
  resumo:
    "Quando as leituras afogam o banco antes das escritas, a saída barata é copiar: o primário recebe todas as escritas e as replica para nós somente-leitura que absorvem as consultas. Escala leitura sem tocar no modelo — ao preço de um atraso de replicação que faz as réplicas verem o passado por um instante.",
  tags: ["distribuido", "replicacao", "escalabilidade", "leitura", "banco"],
  dificuldade: "intermediario",
  tempoLeitura: 7,
  nasceu: {
    quando: { rotulo: "meados dos anos 1990", ano: 1996, precisao: "aproximada" },
    fonte:
      "Replicação de banco é padrão em SGBDs comerciais desde os anos 1990 (Sybase, Oracle); 'read replica' virou um clique de console com o Amazon RDS (2009)",
    precursor:
      "A ideia de manter cópias sincronizadas para dividir carga vem da replicação de sistemas distribuídos dos anos 1980, muito antes de virar um botão na nuvem.",
  },
  ondeAparece: [
    {
      onde: "Read Replica do Amazon RDS",
      explicacao:
        "Um clique cria uma cópia somente-leitura que recebe a replicação do primário e absorve as consultas mais pesadas.",
    },
    {
      onde: "hot standby do Postgres",
      explicacao:
        "A réplica de streaming aplica o WAL do primário e serve SELECTs enquanto isso, aliviando o nó de escrita.",
    },
    {
      onde: "endpoint de leitura separado",
      explicacao:
        "A aplicação manda escritas para um host e leituras para outro — a divisão física entre gravar e consultar.",
    },
  ],
  emUmaLinha: {
    lang: "typescript",
    code: `// Escrita no primario; leitura na replica.
const pool = opts.escrita ? primario : replica;`,
  },
  custo: {
    indirecoes: 1,
    cobra: [
      "Introduz um atraso de replicação: a réplica vê o passado até o WAL do primário chegar e ser aplicado",
      "Obriga o código a rotear cada consulta, e a saber que um SELECT que decide uma escrita não é leitura pura",
      "Falha de replicação vira dado divergente silencioso — precisa de alerta sobre o lag, senão ninguém percebe",
    ],
    naoValeSe:
      "o gargalo é a escrita, não a leitura. Réplica não divide carga de escrita — para isso o caminho é sharding, que reparte as próprias linhas.",
  },
  relacionados: ["cqrs", "consistencia-eventual", "sharding"],
  problema: [
    "Um único banco aguenta bem até o dia em que as consultas — relatórios, buscas, telas de listagem — passam a competir com as escritas pelo mesmo nó, e a latência de todo mundo sobe junto.",
    "A leitura costuma ser muitas vezes mais frequente que a escrita, mas as duas disputam a mesma máquina. Escalar verticalmente o primário resolve por um tempo e fica caro rápido.",
  ],
  solucao: [
    "Manter um primário que recebe todas as escritas e replicá-lo para um ou mais nós somente-leitura. As consultas vão para as réplicas; o primário fica livre para as escritas.",
    "Rotear no código: escritas e leituras que precisam ver a própria escrita vão ao primário; o resto vai às réplicas, que podem ser adicionadas conforme a carga de leitura cresce.",
  ],
  quandoUsar: [
    "Quando a carga de leitura é muito maior que a de escrita e domina o uso do banco.",
    "Para isolar consultas pesadas (relatórios, exportações) do caminho transacional.",
    "Como primeiro passo de escala, antes de partir para o sharding, que é bem mais invasivo.",
  ],
  quandoEvitar: [
    "Quando o gargalo é a escrita: réplica não ajuda a escrever mais rápido.",
    "Quando toda leitura precisa do valor mais recente e o lag não é tolerável em lugar nenhum.",
  ],
  mermaid: MERMAID,
  exemplos: EXEMPLOS,
  blocos: [
    {
      tipo: "tldr",
      texto:
        "Réplica de leitura é a forma mais barata de escalar um banco que está afogando de tanto SELECT: o primário concentra as escritas e as espalha para nós somente-leitura que absorvem as consultas. O custo é o atraso de replicação — as réplicas veem o passado por um instante — e a responsabilidade de rotear cada consulta ao lugar certo. Lembre que um SELECT que decide uma escrita não é leitura pura: ele vai ao primário.",
    },
    {
      tipo: "analogia",
      emoji: "📚",
      titulo: "O original e as fotocópias da biblioteca",
      texto:
        "A biblioteca tem um único exemplar original que pode ser corrigido e anotado — e várias fotocópias espalhadas pelas salas para quem só quer ler. Cem pessoas leem as cópias ao mesmo tempo sem incomodar quem cuida do original. Quando o original muda, as cópias são refeitas — e há um intervalo em que uma sala ainda tem a versão antiga. É exatamente o trade-off da réplica: leitura barata e em paralelo, ao preço de um atraso até a cópia alcançar o original.",
    },
    {
      tipo: "secao",
      id: "o-lag",
      titulo: "O atraso que muda tudo",
      resumo: [
        "A réplica não é o primário no mesmo instante: ela recebe o log de mudanças (o WAL, no Postgres) e o aplica com um atraso — normalmente milissegundos, mas que cresce sob carga de escrita.",
        "Esse lag é a mesma janela da consistência eventual, e o caso que mais dói é o mesmo: ler da réplica logo depois de escrever no primário devolve o valor antigo. Roteamento cego 'todo SELECT vai à réplica' quebra exatamente aí.",
      ],
      extensao: [
        "Há uma sutileza que engana muita gente: **nem todo SELECT é uma leitura pura**. Um `SELECT saldo ... FOR UPDATE`, ou qualquer consulta cujo resultado decide uma escrita seguinte (checar estoque para depois debitar), precisa do valor atual e do lock — então vai ao primário, apesar de começar com SELECT. Rotear por 'a query começa com SELECT?' é uma heurística que falha justamente nas operações críticas.",
        "A relação com **CQRS** costuma confundir. Réplica de leitura é infraestrutura: o mesmo esquema, a mesma query, só que servida de outro nó. CQRS é modelagem: um modelo de escrita e um modelo de leitura **diferentes**, muitas vezes em tecnologias diferentes (o transacional grava, o Elasticsearch serve a busca). Réplica é o degrau anterior e mais barato; CQRS é a mudança de modelo que você faz quando espelhar o mesmo esquema não basta mais.",
        "Sob falha, a réplica introduz um modo de erro próprio: se a replicação para e ninguém percebe, as consultas continuam respondendo — com dado cada vez mais velho. Diferente de um banco que cai e grita, a réplica atrasada mente em silêncio. Por isso o lag de replicação é uma métrica de primeira classe: sem alerta sobre ele, a divergência só aparece quando um usuário reclama.",
      ],
    },
    {
      tipo: "casos",
      titulo: "Como isso aparece na prática",
      casos: [
        {
          titulo: "O relatório que derrubava o checkout",
          cenario:
            "Todo início de mês, a equipe financeira rodava um relatório pesado que varria meses de pedidos. Enquanto ele rodava, a latência do checkout subia e algumas compras expiravam por timeout.",
          aplicacao:
            "O relatório e as demais consultas analíticas passaram a rodar contra uma réplica dedicada, deixando o primário exclusivamente para o caminho transacional do checkout.",
          tradeoff:
            "O relatório passou a enxergar dados com alguns segundos de atraso em relação ao primário — irrelevante para um fechamento mensal, e um ótimo negócio diante do checkout protegido.",
        },
        {
          titulo: "O painel que mostrava o pedido inexistente",
          cenario:
            "Após criar um pedido, o usuário era redirecionado para o painel, que lia da réplica. Às vezes o pedido recém-criado ainda não tinha replicado, e o painel exibia 'nenhum pedido encontrado'.",
          aplicacao:
            "A leitura imediatamente após a criação passou a ir ao primário por alguns segundos (read-your-writes), enquanto as visitas posteriores ao painel seguiram na réplica.",
          tradeoff:
            "Uma fração pequena das leituras voltou ao primário logo após cada escrita. É um custo mínimo perto de um usuário achando que o pedido que ele acabou de fazer sumiu.",
        },
      ],
    },
    {
      tipo: "armadilhas",
      titulo: "Onde isto dá errado",
      itens: [
        {
          titulo: "Rotear por 'começa com SELECT'",
          texto:
            "Uma consulta que lê para decidir uma escrita — checar estoque, ler saldo com FOR UPDATE — precisa do valor atual e do lock, e tem que ir ao primário. A heurística de rotear todo SELECT para a réplica falha exatamente nas operações que menos podem falhar.",
        },
        {
          titulo: "Ignorar o lag de replicação",
          texto:
            "Réplica que para de replicar não cai: continua respondendo com dado cada vez mais velho, em silêncio. Sem alerta sobre o lag, a divergência só aparece quando um usuário reclama de um valor que 'sumiu'.",
        },
        {
          titulo: "Esperar que réplica escale escrita",
          texto:
            "Toda escrita continua indo ao único primário; a réplica só divide leitura. Se o gargalo é escrever, adicionar réplicas não move o ponteiro — o caminho passa a ser sharding.",
        },
        {
          titulo: "Ler da réplica logo depois de escrever",
          texto:
            "É o read-your-writes de novo: o usuário acabou de gravar e a leitura seguinte cai numa réplica atrasada, mostrando o valor antigo. A janela é curta, mas é onde o usuário mais tem certeza de qual valor deveria aparecer.",
        },
      ],
    },
    {
      tipo: "diagrama",
      titulo: "Um primário, muitas réplicas",
      mermaid: MERMAID,
    },
    {
      tipo: "codigo",
      titulo: "Roteando escrita e leitura",
      exemplos: EXEMPLOS,
    },
    {
      tipo: "quando",
      usar: [
        "Carga de leitura muito maior que a de escrita.",
        "Isolar consultas pesadas do caminho transacional.",
        "Primeiro degrau de escala, antes do sharding.",
      ],
      evitar: [
        "Quando o gargalo é a escrita.",
        "Quando nenhuma leitura tolera o atraso de replicação.",
      ],
    },
  ],
};
