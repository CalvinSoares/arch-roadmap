import type { Conceito } from "@/shared/types/conceito";

const EXEMPLOS = [
  {
    lang: "typescript" as const,
    code: `// ERRADO: intervalo fixo. Mil clientes falham juntos e voltam juntos,
// em ondas sincronizadas que impedem o servico de se levantar.
for (let i = 0; i < 3; i++) {
  try { return await chamar(); } catch { await dormir(1000); }
}

// CERTO: espera exponencial + jitter (ruido aleatorio que dessincroniza).
interface OpcoesRetry {
  tentativas: number;
  baseMs: number;
  tetoMs: number;
  /** injetado: sorteio nunca acontece dentro da funcao pura. */
  aleatorio: () => number;
}

function atraso(tentativa: number, o: OpcoesRetry): number {
  const exponencial = Math.min(o.tetoMs, o.baseMs * 2 ** tentativa);
  // "full jitter": sorteia em [0, exponencial]. Espalha melhor que somar ruido.
  return o.aleatorio() * exponencial;
}

async function comRetry<T>(fn: () => Promise<T>, o: OpcoesRetry): Promise<T> {
  let ultimo: unknown;
  for (let i = 0; i < o.tentativas; i++) {
    try {
      return await fn();
    } catch (e) {
      if (!valeTentarDeNovo(e)) throw e; // 400 nao melhora tentando
      ultimo = e;
      await dormir(atraso(i, o));
    }
  }
  throw ultimo;
}`,
  },
  {
    lang: "python" as const,
    code: `import random

def atraso(tentativa: int, base_ms: int, teto_ms: int, aleatorio=random.random) -> float:
    """Full jitter: sorteia em [0, exponencial]."""
    exponencial = min(teto_ms, base_ms * 2 ** tentativa)
    return aleatorio() * exponencial / 1000

# So repete o que pode melhorar sozinho.
REPETIVEIS = {408, 429, 500, 502, 503, 504}

def vale_tentar(status: int) -> bool:
    # 400, 401, 403, 404, 422: tentar de novo da o mesmo resultado
    return status in REPETIVEIS

# 429 costuma vir com Retry-After. Respeitar e obrigatorio:
# o servidor esta dizendo exatamente quanto esperar.
def espera(resposta, tentativa, base_ms, teto_ms):
    if (ra := resposta.headers.get("Retry-After")):
        return float(ra)
    return atraso(tentativa, base_ms, teto_ms)`,
  },
];

export const retry: Conceito = {
  slug: "retry",
  titulo: "Retry com backoff e jitter",
  categoria: "resiliencia",
  resumo:
    "Falhas passageiras se resolvem sozinhas se você esperar um pouco e tentar de novo. Mas repetir do jeito errado — sem espera crescente, sem ruído aleatório, sem filtrar o que é repetível — transforma um soluço em uma queda.",
  tags: ["resiliencia", "backoff", "jitter", "falha-transitoria", "producao"],
  dificuldade: "intermediario",
  tempoLeitura: 8,
  nasceu: {
    quando: { rotulo: "anos 1970", ano: 1976, precisao: "aproximada" },
    fonte:
      "O recuo exponencial no retry foi padronizado no Ethernet de Metcalfe & Boggs (1976); a retransmissão por timeout entrou no TCP em 1981",
    precursor:
      "O problema é o do cabo Ethernet compartilhado: se todos que colidiram tentam de novo na mesma hora, colidem de novo — daí o recuo aleatório e crescente.",
  },
  ondeAparece: [
    {
      onde: "O cabeçalho Retry-After",
      explicacao:
        "O servidor diz explicitamente quanto esperar — ignorar isso é repetir contra a vontade de quem sabe.",
    },
    {
      onde: "Redelivery de fila",
      explicacao:
        "Mensagem não confirmada volta para a fila e é reentregue: é retry embutido no protocolo.",
    },
    {
      onde: "Retransmissão do TCP",
      explicacao:
        "O protocolo já faz backoff exponencial quando um segmento não é confirmado a tempo.",
    },
  ],
  emUmaLinha: {
    lang: "typescript",
    code: `// Espera crescente com ruido, e so no que pode melhorar.
await dormir(aleatorio() * Math.min(teto, base * 2 ** tentativa));`,
  },
  custo: {
    indirecoes: 0,
    cobra: [
      "A latência do pior caso multiplica pelo número de tentativas",
      "A operação precisa ser idempotente, o que nem sempre é de graça",
    ],
    naoValeSe:
      "o erro é determinístico. Repetir um `400` devolve o mesmo `400`, gastando recurso alheio.",
  },
  relacionados: ["timeout", "circuit-breaker", "idempotencia"],
  problema: [
    "Boa parte das falhas em sistemas distribuídos é passageira: um pacote perdido, um failover de banco, um pod sendo reciclado. Desistir na primeira tentativa desperdiça uma recuperação que aconteceria sozinha em milissegundos.",
    "Mas repetir ingenuamente é pior que não repetir: N clientes que falham no mesmo instante e voltam no mesmo intervalo geram ondas sincronizadas que impedem o serviço de se levantar.",
  ],
  solucao: [
    "Repetir apenas o que pode melhorar sozinho, com espera que cresce a cada tentativa (backoff exponencial) e ruído aleatório (jitter) que dessincroniza os clientes.",
    "Limitar o número de tentativas e respeitar o orçamento de tempo do pedido — retry consome prazo, não o multiplica.",
  ],
  quandoUsar: [
    "Falhas de rede, timeouts, `503` e `429` — erros que indicam condição temporária.",
    "Operações idempotentes, ou que carreguem chave de idempotência.",
    "Na borda entre o seu sistema e uma dependência externa que você não controla.",
  ],
  quandoEvitar: [
    "Erros de cliente (`400`, `401`, `404`, `422`): tentar de novo produz exatamente o mesmo resultado.",
    "Operações que mudam estado sem idempotência — a segunda tentativa pode cobrar duas vezes.",
    "Em várias camadas ao mesmo tempo, o que multiplica a carga em vez de somá-la.",
  ],
  exemplos: EXEMPLOS,
  blocos: [
    {
      tipo: "tldr",
      texto:
        "Repita só o que pode melhorar sozinho, esperando cada vez mais (backoff exponencial) e com ruído aleatório (jitter) para os clientes não voltarem todos juntos. Retry sem jitter não ajuda o serviço a se levantar — ele mantém o serviço no chão em ondas.",
    },
    {
      tipo: "analogia",
      emoji: "🚪",
      titulo: "A porta giratória lotada",
      texto:
        "O prédio evacuou e todos correm para a porta. Se cada pessoa que não conseguiu passar tentar de novo exatamente cinco segundos depois, o tumulto se repete idêntico, de cinco em cinco segundos, para sempre. Se cada uma esperar um tempo diferente e crescente, a fila se dissolve sozinha. A porta é a mesma — o que muda é a coordenação de quem espera.",
    },
    {
      tipo: "secao",
      id: "problema",
      titulo: "Por que repetir ingenuamente piora tudo",
      resumo: [
        "Um serviço sob estresse precisa de folga para se recuperar. Retry sem backoff faz o contrário: no instante em que ele começa a falhar, a carga sobre ele **aumenta**, porque cada cliente agora manda duas ou três requisições no lugar de uma.",
        "E sem jitter, todas as tentativas chegam no mesmo milissegundo — a falha sincronizou os clientes, e eles passam a bater em uníssono.",
      ],
      extensao: [
        "O nome disso é *thundering herd*, e o mecanismo é sutil: em operação normal, os pedidos dos clientes chegam distribuídos ao longo do tempo por pura falta de coordenação. Uma queda momentânea coordena todo mundo — todos falham no mesmo instante, todos esperam o mesmo intervalo, todos voltam juntos. A falha virou um metrônomo.",
        "É por isso que o jitter importa mais que o backoff. Backoff exponencial sem ruído mantém as ondas, só mais espaçadas: 1s, 2s, 4s — mas ainda todos ao mesmo tempo. O ruído aleatório é o que devolve a distribuição que existia antes da falha.",
        "A variante recomendada é a chamada *full jitter*: em vez de somar um ruído pequeno ao intervalo exponencial, sorteia-se **dentro** do intervalo inteiro, de zero até o teto exponencial. Espalha melhor e, contraintuitivamente, termina mais rápido no agregado — porque algumas tentativas acontecem cedo e encontram o serviço já recuperado.",
        "Há também o efeito multiplicativo entre camadas. Se o gateway repete 3 vezes, o serviço repete 3 vezes e o cliente do banco repete 3 vezes, uma única requisição do usuário pode virar 27 no banco. Retry se configura em **uma** camada — normalmente a mais próxima da dependência que falha —, não em todas.",
      ],
    },
    {
      tipo: "ilustracao",
      arquetipo: "fluxo",
      atores: [
        { id: "falha", label: "Falha passageira" },
        { id: "classificar", label: "É repetível?", destaque: true },
        { id: "espera", label: "Espera exponencial + jitter", destaque: true },
        { id: "tentativa", label: "Nova tentativa" },
        { id: "limite", label: "Teto de tentativas / orçamento" },
      ],
      setas: [
        { label: "erro" },
        { label: "sim (503, 429, timeout)" },
        { label: "dorme um tempo sorteado" },
        { label: "ainda tem prazo?", tracejada: true },
      ],
      legenda:
        "Classificar vem antes de esperar: repetir um 404 é desperdício garantido. E o orçamento de tempo do pedido é quem decide se ainda cabe outra tentativa.",
    },
    {
      tipo: "secao",
      id: "classificar",
      titulo: "Nem toda falha é repetível",
      resumo: [
        "Retry só faz sentido quando a mesma requisição, repetida, pode dar outro resultado. `503` e `429` podem; `400` e `404` não vão mudar de ideia.",
        "Repetir erro de cliente é gastar recurso para receber o mesmo `não` três vezes — e, sob incidente, é carga que atrapalha quem tinha chance.",
      ],
      extensao: [
        "A classificação certa é por **natureza do erro**, não por código de status apenas. Um `500` pode ser um bug determinístico (nunca vai melhorar) ou uma indisponibilidade momentânea (vai). Na dúvida, a heurística prática é: `408`, `429`, `502`, `503`, `504` e erros de rede/timeout são repetíveis; o resto da família `4xx` não é.",
        "O `429` merece atenção especial: ele quase sempre vem com um `Retry-After`. Ignorar esse cabeçalho e usar o seu próprio backoff é repetir contra a vontade explícita de quem sabe quando estará pronto — e é um jeito rápido de ser bloqueado por uma API externa.",
        "Escritas exigem um cuidado a mais. Um timeout numa escrita é **ambíguo**: pode ser que o pedido não tenha chegado, ou que tenha sido executado e só a resposta se perdeu. Repetir sem chave de idempotência é como cobrar o cartão de novo porque a tela não carregou.",
      ],
    },
    {
      tipo: "casos",
      titulo: "Como isso aparece na prática",
      casos: [
        {
          titulo: "O failover de banco que ninguém percebeu",
          cenario:
            "O banco gerenciado faz failover para a réplica. Por cerca de 8 segundos, as conexões existentes morrem e as novas são recusadas. Sem retry, todas as requisições nesse intervalo viram erro para o usuário.",
          aplicacao:
            "Retry com base de 100ms, teto de 3s e full jitter, limitado a 4 tentativas, cobre a janela do failover sem que ninguém veja erro.",
          tradeoff:
            "A latência do p99 piora durante o failover, e o pool fica mais pressionado — em troca de o incidente ficar invisível para o usuário. É uma troca de latência por disponibilidade, e ela precisa caber no orçamento do pedido.",
        },
        {
          titulo: "A integração que virou ataque acidental",
          cenario:
            "Um job noturno sincroniza 50 mil registros com uma API externa. A API começa a devolver `429`, e o cliente HTTP repete imediatamente, três vezes, para cada registro.",
          aplicacao:
            "Passar a respeitar o `Retry-After`, adicionar jitter e limitar a concorrência do job resolve — e o backoff exponencial faz o job se adaptar sozinho ao limite da API.",
          tradeoff:
            "O job passa a demorar mais e precisa tolerar execução parcial. A alternativa que parecia mais rápida estava, na prática, garantindo o bloqueio da chave de API.",
        },
      ],
    },
    {
      tipo: "armadilhas",
      titulo: "Onde isto dá errado",
      itens: [
        {
          titulo: "Backoff sem jitter",
          texto:
            "Esperar 1s, 2s, 4s mantém todos os clientes sincronizados, só que em ondas mais espaçadas. A falha coordenou o rebanho, e sem ruído aleatório ele continua batendo em uníssono. O ruído é a parte que importa, não o crescimento.",
        },
        {
          titulo: "Repetir em todas as camadas",
          texto:
            "Gateway com 3 tentativas, serviço com 3 e cliente de banco com 3 transformam uma requisição do usuário em 27 no banco. As tentativas se multiplicam, não se somam. Configure retry em uma camada só — a mais próxima da dependência que falha.",
        },
        {
          titulo: "Repetir escrita sem idempotência",
          texto:
            "Timeout numa escrita é ambíguo: o pedido pode ter sido executado e só a resposta ter se perdido. Repetir sem chave de idempotência é cobrar duas vezes porque a tela não carregou.",
        },
        {
          titulo: "Retry que ignora o orçamento do pedido",
          texto:
            "Três tentativas com timeout de 2s cada consomem 6 segundos mais as esperas — e o cliente que tinha 3 segundos de paciência já foi embora na primeira. Cada tentativa gasta do mesmo orçamento; quando ele acaba, não há tentativa que valha.",
        },
        {
          titulo: "Repetir o que nunca vai melhorar",
          texto:
            "`400`, `401`, `404` e `422` devolvem exatamente o mesmo resultado na segunda tentativa. Repeti-los desperdiça recurso e, sob incidente, rouba capacidade de quem tinha chance de sucesso.",
        },
        {
          titulo: "Ignorar o Retry-After",
          texto:
            "Quando o servidor responde `429` com `Retry-After`, ele está dizendo exatamente quando estará pronto. Sobrepor isso com o seu próprio backoff é repetir contra a vontade de quem sabe — e o caminho mais curto para ter a chave bloqueada.",
        },
      ],
    },
    {
      tipo: "codigo",
      titulo: "Backoff exponencial com full jitter",
      exemplos: EXEMPLOS,
    },
    {
      tipo: "quando",
      usar: [
        "Falhas de rede, timeouts, `502`, `503` e `429`.",
        "Operações idempotentes ou com chave de idempotência.",
        "Numa camada só, a mais próxima da dependência que falha.",
      ],
      evitar: [
        "Erros de cliente da família `4xx` que não são `408` nem `429`.",
        "Escritas sem garantia de idempotência.",
        "Quando o orçamento de tempo do pedido já se esgotou.",
      ],
    },
  ],
};
