import type { Conceito } from "@/shared/types/conceito";

const EXEMPLOS = [
  {
    lang: "typescript" as const,
    code: `// Sem timeout: esta chamada pode ficar pendurada para sempre.
// O servidor nao precisa cair — basta ele aceitar a conexao e nunca responder.
const resposta = await fetch(url);

// Com timeout: um limite explicito, e o recurso e liberado.
async function buscarComPrazo(url: string, ms: number) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), ms);
  try {
    return await fetch(url, { signal: ctrl.signal });
  } finally {
    clearTimeout(timer); // sem isto, o timer segura o processo vivo
  }
}

// O orcamento e do PEDIDO, nao da chamada: se ja gastei 800ms,
// a proxima chamada nao pode ter 1000ms de prazo.
async function comOrcamento<T>(restanteMs: number, fn: (ms: number) => Promise<T>) {
  if (restanteMs <= 0) throw new Error("orcamento esgotado");
  return fn(restanteMs);
}`,
  },
  {
    lang: "python" as const,
    code: `import httpx

# Sem timeout, o httpx espera indefinidamente por padrao em alguns transportes.
# Pior: 'timeout' costuma significar tempo OCIOSO, nao tempo total.
async with httpx.AsyncClient(
    timeout=httpx.Timeout(
        connect=1.0,   # abrir a conexao
        read=2.0,      # esperar cada pedaco de resposta
        write=2.0,
        pool=1.0,      # esperar uma conexao livre no pool
    )
) as cliente:
    r = await cliente.get(url)

# Um servidor que manda 1 byte a cada 1.9s nunca estoura o 'read' de 2s
# e mantem a conexao presa por horas. Para isso existe o prazo TOTAL:
import asyncio

async def com_prazo_total(coro, segundos: float):
    return await asyncio.wait_for(coro, timeout=segundos)`,
  },
];

export const timeout: Conceito = {
  slug: "timeout",
  titulo: "Timeout",
  categoria: "resiliencia",
  resumo:
    "Todo pedido que sai da sua máquina precisa de um prazo máximo. Sem ele, a falha mais comum em produção não é o erro — é a espera infinita, que consome recursos até derrubar quem ainda estava saudável.",
  tags: ["resiliencia", "prazo", "latencia", "producao", "recursos"],
  dificuldade: "iniciante",
  tempoLeitura: 6,
  nasceu: {
    quando: { rotulo: "1981", ano: 1981, precisao: "aproximada" },
    fonte:
      "O timeout é tão antigo quanto os protocolos de rede confiáveis — o TCP (RFC 793, 1981) já retransmite por expiração de temporizador",
    precursor:
      "Desistir após um prazo é anterior à computação: qualquer protocolo de comunicação com espera acumulada precisa de um limite para não travar para sempre.",
  },
  ondeAparece: [
    {
      onde: "AbortController + fetch",
      explicacao:
        "O jeito padrão do browser de cancelar uma requisição que passou do prazo, liberando a conexão.",
    },
    {
      onde: "asyncio.wait_for",
      explicacao:
        "Impõe prazo total a qualquer corrotina do Python, e não só ao tempo ocioso entre bytes.",
    },
    {
      onde: "statement_timeout do Postgres",
      explicacao:
        "O banco mata a consulta que passar do limite, protegendo-se de query que trava a tabela.",
    },
  ],
  emUmaLinha: {
    lang: "typescript",
    code: `// Todo pedido que sai da maquina tem prazo.
await fetch(url, { signal: AbortSignal.timeout(2000) });`,
  },
  custo: {
    indirecoes: 0,
    cobra: [
      "Um número a calibrar por chamada, que envelhece quando o tráfego muda",
      "Requisições legítimas e lentas passam a falhar",
    ],
    naoValeSe:
      "nunca. Não existe caso legítimo de chamada de rede sem prazo — o que varia é o valor.",
  },
  relacionados: ["retry", "circuit-breaker", "idempotencia"],
  problema: [
    "Uma dependência lenta é pior que uma dependência fora do ar: quando ela cai, você recebe erro na hora; quando ela trava, você espera — e cada espera segura uma thread, uma conexão e uma vaga no pool.",
    "Sem prazo, a lentidão de um serviço vira indisponibilidade de todos os que dependem dele, mesmo os que estavam perfeitos.",
  ],
  solucao: [
    "Todo pedido que atravessa um limite de processo — rede, disco, banco, fila — carrega um prazo máximo declarado.",
    "Passado o prazo, o pedido é abortado e o recurso liberado, transformando espera indefinida em erro imediato e tratável.",
  ],
  quandoUsar: [
    "Sempre que a chamada sai do seu processo. Não há caso legítimo de chamada de rede sem prazo.",
    "Em consultas de banco que podem varrer tabela grande sob carga inesperada.",
    "Ao adquirir recursos escassos — conexão de pool, lock distribuído, semáforo.",
  ],
  quandoEvitar: [
    "Em trabalho de fundo genuinamente longo (um relatório de horas), onde o certo é acompanhar progresso, não cortar no meio.",
    "Como substituto de correção: timeout curto demais transforma lentidão passageira em erro constante.",
  ],
  exemplos: EXEMPLOS,
  blocos: [
    {
      tipo: "tldr",
      texto:
        "Todo pedido que sai do seu processo precisa de um prazo. Sem prazo, uma dependência lenta segura suas conexões até esgotar o pool — e o seu serviço cai por causa de um problema que era do vizinho. Timeout transforma espera infinita em erro tratável.",
    },
    {
      tipo: "analogia",
      emoji: "☎️",
      titulo: "A ligação em espera",
      texto:
        "Você liga para o suporte e a musiquinha começa. Se você se recusar a desligar, a linha fica ocupada — e ninguém mais da sua casa consegue usar o telefone. Não é o suporte que travou a sua casa: foi a sua decisão de esperar para sempre. Desligar depois de dez minutos não resolve o problema deles, mas devolve o telefone para você.",
    },
    {
      tipo: "secao",
      id: "problema",
      titulo: "Lento é pior que morto",
      resumo: [
        "Quando uma dependência cai, você recebe `connection refused` em milissegundos e segue a vida. Quando ela apenas trava, você espera — e a espera custa uma thread, uma conexão e uma vaga no pool, cada uma delas indisponível para os pedidos que estavam saudáveis.",
        "É assim que uma falha em um serviço vira uma falha em todos: o esgotamento de recursos se propaga para cima, e o serviço que cai não é o que quebrou.",
      ],
      extensao: [
        "O nome disso é exaustão de pool. Suponha um pool de 100 conexões e uma dependência que passou a responder em 30 segundos em vez de 50 milissegundos. Com 10 requisições por segundo, em dez segundos as 100 vagas estão ocupadas esperando — e a partir daí toda requisição nova, inclusive as que nem tocam nessa dependência, fica na fila do pool. O painel mostra o **seu** serviço com p99 explodindo, e a causa está a duas camadas de distância.",
        "Por isso o timeout é o primeiro padrão da família de resiliência, e não um detalhe de configuração: ele é a fronteira que impede o problema do vizinho de virar o seu. Retry, Circuit Breaker e Bulkhead pressupõem que existe um prazo — sem ele, não há evento de falha para reagir.",
        "Há um detalhe que quase todo mundo erra na primeira vez: a maioria das bibliotecas chama de *timeout* o tempo **ocioso**, não o tempo **total**. Um servidor que envia um byte a cada 1,9 segundo nunca estoura um read timeout de 2 segundos, e mantém a conexão presa por horas. É o ataque *slowloris*, e ele acontece por acidente com mais frequência do que por malícia.",
      ],
    },
    {
      tipo: "ilustracao",
      arquetipo: "antes-depois",
      antes: {
        titulo: "Sem prazo",
        itens: [
          "A dependência para de responder, mas não fecha a conexão",
          "Cada requisição segura uma conexão do pool, indefinidamente",
          "O pool esgota em segundos sob carga normal",
          "Requisições que nem usam essa dependência começam a falhar",
        ],
        nota: "O serviço que aparece caído no painel não é o que quebrou — é o que ficou esperando.",
      },
      depois: {
        titulo: "Com prazo",
        itens: [
          "A chamada é abortada ao estourar o limite",
          "A conexão volta para o pool imediatamente",
          "A falha vira um erro nomeado, tratável no código",
          "O resto do sistema continua atendendo",
        ],
        nota: "O prazo não conserta a dependência lenta — ele impede que a lentidão dela vire indisponibilidade sua.",
      },
      legenda:
        "O timeout não melhora a disponibilidade da dependência. Ele converte uma falha que se propaga numa falha que fica contida.",
    },
    {
      tipo: "secao",
      id: "orcamento",
      titulo: "O prazo é do pedido, não da chamada",
      resumo: [
        "Configurar timeout por chamada parece suficiente e não é. Se o seu handler faz três chamadas de 1 segundo cada, o cliente que tinha 2 segundos de paciência já foi embora antes da terceira começar.",
        "A forma correta é orçamento: o pedido entra com um tempo total, cada etapa consome uma parte, e o que sobra é o prazo da etapa seguinte.",
      ],
      extensao: [
        "Sem orçamento, os prazos se somam de um jeito que ninguém previu. Três chamadas de 1s parecem 1s de latência no desenho e são 3s no pior caso — e se cada uma tiver retry, viram 9s. O número que importa é o prazo do cliente lá na ponta, e ele precisa ser **decrescente** conforme desce a pilha.",
        "A regra prática: o timeout de quem chama tem que ser **menor** que o de quem chamou. Se o gateway espera 5s e o serviço interno espera 10s, o serviço interno vai continuar trabalhando por mais 5 segundos numa resposta que ninguém vai ler — gastando banco, CPU e conexão em trabalho garantidamente inútil.",
        "É por isso que sistemas maduros propagam o prazo restante no cabeçalho da requisição: gRPC tem `grpc-timeout`, e o `context.Context` do Go carrega o deadline explicitamente. Quando a etapa recebe o prazo em vez de configurá-lo, o orçamento fica correto por construção.",
      ],
    },
    {
      tipo: "casos",
      titulo: "Como isso aparece na prática",
      casos: [
        {
          titulo: "O checkout que caiu por causa do serviço de recomendação",
          cenario:
            "A página de checkout busca recomendações de produto para exibir num carrossel lateral. O serviço de recomendação teve um problema de índice e passou a responder em 40 segundos em vez de 80 milissegundos.",
          aplicacao:
            "A chamada de recomendação recebe um prazo de 200ms, e o carrossel vira um estado vazio quando o prazo estoura. O checkout não depende dela para funcionar.",
          tradeoff:
            "Alguns usuários deixam de ver recomendações durante o incidente — em troca de todos continuarem conseguindo comprar. Escolher o que é essencial exige decisão de produto, não só de engenharia.",
        },
        {
          titulo: "A consulta que travou a tabela na Black Friday",
          cenario:
            "Um relatório administrativo roda uma consulta sem índice adequado. Em volume normal ela leva 2 segundos; sob o volume de pico, passa a levar 4 minutos e segura locks que a escrita precisa.",
          aplicacao:
            "`statement_timeout` no papel de banco usado pelo relatório mata a consulta em 10 segundos. O relatório falha; as vendas continuam.",
          tradeoff:
            "O relatório passa a falhar em horário de pico e precisa de outra solução (réplica de leitura, pré-agregação). O timeout não resolve o problema — ele escolhe quem paga por ele.",
        },
      ],
    },
    {
      tipo: "armadilhas",
      titulo: "Onde isto dá errado",
      itens: [
        {
          titulo: "Confundir tempo ocioso com tempo total",
          texto:
            "A maioria das bibliotecas chama de timeout o intervalo máximo **entre bytes**, não a duração total da chamada. Um servidor que envia um byte a cada 1,9 segundo nunca estoura um read timeout de 2 segundos e prende a conexão por horas. Sempre imponha também um prazo total.",
        },
        {
          titulo: "Timeout de quem chama maior que o de quem chamou",
          texto:
            "Se o gateway desiste em 5 segundos e o serviço interno só desiste em 10, o serviço interno passa 5 segundos produzindo uma resposta que ninguém vai ler — gastando banco e CPU em trabalho garantidamente descartado. Os prazos precisam decrescer conforme se desce a pilha.",
        },
        {
          titulo: "Timeout sem cancelamento de verdade",
          texto:
            "Abortar a espera não é o mesmo que abortar o trabalho. Se você para de esperar mas a query continua rodando no banco, o recurso que você queria liberar continua ocupado — você só deixou de saber disso. O cancelamento precisa chegar até a ponta.",
        },
        {
          titulo: "Prazo escolhido pela média",
          texto:
            "Timeout dimensionado pela latência média corta metade das requisições legítimas assim que a carga sobe. O prazo se define pelo percentil alto (p99) mais uma folga, e sempre abaixo do que o cliente da ponta está disposto a esperar.",
        },
        {
          titulo: "Estourar o prazo e não saber se o trabalho aconteceu",
          texto:
            "Um timeout num pedido de escrita é ambíguo: pode ser que ele não tenha chegado, ou que tenha sido executado e só a resposta se perdeu. Quem estoura prazo em operação que muda estado precisa de idempotência para poder tentar de novo sem duplicar.",
        },
      ],
    },
    {
      tipo: "demo",
      titulo: "A régua que justifica o prazo",
      demo: "escala",
    },
    {
      tipo: "demo",
      titulo: "E se a dependência travar?",
      demo: "falha-timeout",
    },
    {
      tipo: "codigo",
      titulo: "Prazo por chamada e orçamento por pedido",
      exemplos: EXEMPLOS,
    },
    {
      tipo: "quando",
      usar: [
        "Toda chamada que atravessa um limite de processo — rede, banco, disco, fila.",
        "Ao adquirir recurso escasso: conexão de pool, lock distribuído, semáforo.",
        "Como orçamento decrescente ao longo da cadeia de chamadas.",
      ],
      evitar: [
        "Como remendo para lentidão crônica — o prazo esconde o sintoma, não corrige a causa.",
        "Em trabalho de fundo legitimamente longo, onde o certo é acompanhar progresso.",
        "Com valor escolhido pela latência média em vez do percentil alto.",
      ],
    },
  ],
};
