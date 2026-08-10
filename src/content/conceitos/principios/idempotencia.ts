import type { Conceito } from "@/shared/types/conceito";

const EXEMPLOS = [
  {
    lang: "typescript" as const,
    code: `// A chave de idempotência transforma "cobrar" em "garantir que foi cobrado".
interface Resultado {
  status: number;
  corpo: unknown;
}

// chave -> resultado da primeira execução (Redis/tabela com UNIQUE na vida real)
const executadas = new Map<string, Resultado>();

async function criarPagamento(chave: string, valor: number): Promise<Resultado> {
  // 1. Já vi essa chave? Devolve O MESMO resultado, sem executar de novo.
  const anterior = executadas.get(chave);
  if (anterior) return anterior;

  // 2. Inédita: executa e guarda o resultado ANTES de responder.
  //    Em produção, o "guardar" precisa ser atômico (INSERT com UNIQUE):
  //    duas chamadas simultâneas com a mesma chave não podem passar juntas.
  const cobranca = { id: crypto.randomUUID(), valor, status: "paga" };
  const resultado: Resultado = { status: 201, corpo: cobranca };
  executadas.set(chave, resultado);
  return resultado;
}

// O cliente gera UMA chave por operação e a repete em todo retry:
const chave = "pedido-8231-pagamento"; // derivada da operação, não do request
await criarPagamento(chave, 100); // executa e cobra
await criarPagamento(chave, 100); // timeout? retry? -> mesmo resultado, R$100 uma vez`,
  },
  {
    lang: "python" as const,
    code: `import uuid

# chave -> resultado (na vida real: tabela com UNIQUE ou SET NX no Redis)
executadas: dict[str, dict] = {}

def criar_pagamento(chave: str, valor: int) -> dict:
    # repetiu a chave? devolve o mesmo resultado, sem cobrar de novo
    if chave in executadas:
        return executadas[chave]

    cobranca = {"id": str(uuid.uuid4()), "valor": valor, "status": "paga"}
    resultado = {"status": 201, "corpo": cobranca}
    executadas[chave] = resultado
    return resultado

chave = "pedido-8231-pagamento"  # uma chave POR OPERACAO, repetida no retry
criar_pagamento(chave, 100)  # cobra
criar_pagamento(chave, 100)  # retry apos timeout -> mesma resposta, sem duplicar`,
  },
];

export const idempotencia: Conceito = {
  slug: "idempotencia",
  titulo: "Idempotência",
  categoria: "principio",
  resumo:
    "Executar a mesma operação duas vezes tem o mesmo efeito de executar uma: é o que torna o retry seguro. Em rede, onde 'não sei se foi' é resposta comum, é a diferença entre reenviar e cobrar em dobro.",
  tags: ["retry", "idempotency-key", "pagamentos", "http", "distribuidos"],
  dificuldade: "intermediario",
  tempoLeitura: 7,
  relacionados: ["webhooks", "race-condition", "saga"],
  problema: [
    "Toda chamada de rede tem três desfechos: funcionou, falhou, ou deu timeout — e no timeout você não sabe se o servidor processou. Reenviar às cegas duplica o efeito; não reenviar pode perder a operação.",
  ],
  solucao: [
    "Desenhe a operação para que repetir seja inofensivo. Onde a repetição não é natural (criar cobrança, enviar e-mail), o cliente manda uma chave de idempotência única por operação e o servidor guarda o resultado por chave: chave repetida devolve o resultado gravado em vez de executar de novo.",
  ],
  quandoUsar: [
    "Qualquer operação que mova dinheiro ou tenha efeito externo, atrás de retry.",
    "Consumidores de fila com entrega ao-menos-uma-vez.",
    "APIs públicas em que você não controla o cliente.",
  ],
  quandoEvitar: [
    "Operações já naturalmente idempotentes (PUT com estado completo, DELETE).",
    "Leituras — GET não tem efeito a repetir.",
  ],
  exemplos: EXEMPLOS,
  blocos: [
    {
      tipo: "tldr",
      texto:
        "Fazer duas vezes = fazer uma. O cliente manda a mesma chave em todo retry; o servidor executa só na primeira e, nas repetições, devolve o resultado guardado. Sem isso, todo timeout vira uma roleta de cobrança dupla.",
    },
    {
      tipo: "analogia",
      emoji: "🔘",
      titulo: "O botão do elevador",
      texto:
        "Apertar o botão cinco vezes não chama cinco elevadores: a primeira aperta, as outras encontram o pedido já registrado e não mudam nada. O painel 'lembra' que aquela intenção já existe. A chave de idempotência é isso — um jeito de o servidor reconhecer 'esse pedido eu já vi' e não executar de novo.",
    },
    {
      tipo: "secao",
      id: "problema",
      titulo: "O problema: o timeout não diz o que aconteceu",
      resumo: [
        "Seu app chama a API de pagamento e a conexão cai depois de 30 segundos. O dinheiro saiu? Você não sabe: o timeout pode ter acontecido antes de o servidor processar ou depois — a resposta é que se perdeu, não necessariamente a operação.",
        "A partir daí só existem duas escolhas ruins: reenviar (e arriscar cobrar duas vezes) ou desistir (e arriscar não cobrar). Retry automático — que toda biblioteca de HTTP e toda fila fazem por padrão — transforma essa raridade em rotina.",
      ],
      extensao: [
        "O nome vem da matemática: uma operação é idempotente quando f(f(x)) = f(x). Em HTTP, GET, PUT e DELETE são idempotentes por contrato — 'apagar o recurso 42' duas vezes deixa o mundo igual. POST não é: 'criar um pagamento' duas vezes cria dois. É por isso que a chave de idempotência vive quase sempre em POSTs.",
        "Entrega ao-menos-uma-vez não é defeito das filas — é o custo de não perder mensagem. Kafka, RabbitMQ e SQS reentregam na dúvida. A pergunta nunca é 'como evitar duplicatas na entrega' (não dá), e sim 'como tornar o processamento imune a elas'.",
      ],
    },
    {
      tipo: "ilustracao",
      arquetipo: "fluxo",
      atores: [
        { id: "cliente", label: "Cliente" },
        { id: "api", label: "API" },
        { id: "registro", label: "Registro de chaves", destaque: true },
        { id: "processamento", label: "Processamento" },
      ],
      setas: [
        { label: "POST + Idempotency-Key" },
        { label: "chave inédita?" },
        { label: "só se for a primeira vez", tracejada: true },
      ],
      legenda:
        "A chave é checada antes de qualquer efeito: repetida, a API devolve o resultado gravado e o processamento nem fica sabendo do retry.",
    },
    {
      tipo: "camadas-nav",
      titulo: "As três peças",
      camadas: [
        {
          id: "cliente",
          titulo: "Cliente",
          curto: "gera a chave — uma por operação, não por request",
          detalhe:
            "A chave nasce junto com a intenção ('pagar o pedido 8231') e se repete em todo retry daquela intenção. Pode ser um UUID guardado com o pedido ou um hash determinístico da operação. O erro clássico é gerar no momento do envio: cada retry ganha chave nova e a proteção evapora.",
          seViolar:
            "chave nova a cada tentativa = servidor vê operações 'diferentes' e executa todas. A idempotência morre no cliente, silenciosamente.",
        },
        {
          id: "borda",
          titulo: "Borda (API)",
          curto: "checa e trava a chave atomicamente",
          detalhe:
            "Antes de executar, tenta registrar a chave com INSERT numa coluna UNIQUE (ou SET NX no Redis). Conseguiu? É a primeira — executa. Violou a constraint? Alguém chegou antes — devolve o resultado gravado ou 409 enquanto a primeira termina.",
          exemplo: "INSERT INTO idem (chave) VALUES ($1)\n-- unique_violation? já foi executada",
          seViolar:
            "checar com SELECT e gravar depois abre uma corrida: duas chamadas simultâneas passam pela checagem juntas e executam as duas. A trava precisa ser atômica.",
        },
        {
          id: "resultado",
          titulo: "Armazenamento do resultado",
          curto: "guarda a resposta da primeira execução, com validade",
          detalhe:
            "Não basta lembrar 'já vi essa chave' — é preciso guardar o resultado (status + corpo) para o retry receber exatamente o que a primeira chamada recebeu. Um TTL generoso (24h+) cobre a janela de retries sem acumular para sempre.",
          seViolar:
            "sem o resultado gravado, o retry recebe um 'já executado' vazio — e o cliente que perdeu a primeira resposta fica sem saber o id da cobrança que criou.",
        },
      ],
    },
    { tipo: "codigo", exemplos: EXEMPLOS },
    {
      tipo: "casos",
      casos: [
        {
          titulo: "Cobrança PIX com retry do integrador",
          cenario:
            "Um PaaS de pagamentos expõe POST /pix. O integrador tem retry automático com backoff, e conexões caem todo dia — timeout depois que o PIX já saiu significa segunda chamada em segundos.",
          aplicacao:
            "Todo POST exige Idempotency-Key. A chave é gravada com UNIQUE junto do resultado; o retry bate na constraint e recebe a mesma resposta 201 com o mesmo id de transação. O integrador pode reenviar sem medo — a API garante no máximo um PIX por chave.",
          tradeoff:
            "Uma tabela a mais, com escrita no caminho crítico de toda cobrança, e a política de TTL vira contrato público: mudou o prazo, muda o comportamento do retry de todo cliente.",
        },
        {
          titulo: "Consumidor de fila que reprocessa",
          cenario:
            "O worker consome 'pedido-pago' e dá baixa no estoque. A fila entrega ao-menos-uma-vez: rebalanceamento, crash antes do ack ou timeout de visibilidade fazem a mesma mensagem chegar duas vezes.",
          aplicacao:
            "O id do evento é a chave: a baixa registra 'evento X processado' na mesma transação que decrementa o estoque. Redelivery encontra o registro e vira no-op. O efeito acontece exatamente uma vez, mesmo com a entrega acontecendo três.",
          tradeoff:
            "O registro de eventos processados cresce com o tráfego e precisa de expurgo; e a deduplicação só vale dentro da janela retida — reprocessamento de dias depois exige outra estratégia.",
        },
      ],
    },
    {
      tipo: "armadilhas",
      itens: [
        {
          titulo: "Chave por request em vez de por operação",
          texto:
            "Se a chave é gerada na hora do envio, cada retry cria uma chave nova — e o servidor, corretamente, executa todas. A chave pertence à intenção de negócio: nasce com o pedido e sobrevive a quantas tentativas forem necessárias.",
        },
        {
          titulo: "Checar e gravar em dois passos",
          texto:
            "SELECT para ver se a chave existe e INSERT depois é uma race condition clássica: duas chamadas simultâneas passam pela checagem antes de qualquer INSERT e executam as duas. A trava tem que ser uma operação atômica — UNIQUE no banco ou SET NX no Redis.",
        },
        {
          titulo: "Lembrar a chave mas esquecer o resultado",
          texto:
            "Responder 'já processado' sem corpo deixa o cliente que perdeu a primeira resposta no escuro: ele precisava do id da cobrança. Idempotência de verdade devolve a mesma resposta, não um aviso de que a resposta existiu.",
        },
        {
          titulo: "Confiar que 'só acontece uma vez'",
          texto:
            "Retry não é cenário raro: é o comportamento padrão de axios, fetch com retry, service meshes e toda fila. Desenhar o happy path e tratar duplicata como exceção inverte a realidade — a duplicata é parte do contrato de rede.",
        },
      ],
    },
    {
      tipo: "quando",
      usar: [
        "Operações com efeito externo (dinheiro, e-mail, estoque) atrás de qualquer retry.",
        "Consumidores de mensageria com entrega ao-menos-uma-vez.",
        "APIs públicas — você não controla o comportamento de retry dos clientes.",
      ],
      evitar: [
        "Operações já idempotentes por natureza (PUT de estado completo, DELETE por id).",
        "Leituras puras — repetir um GET não tem efeito colateral.",
        "Fluxos internos onde a operação inteira já roda numa única transação com constraint natural (ex.: UNIQUE no par pedido+tipo).",
      ],
    },
  ],
};
