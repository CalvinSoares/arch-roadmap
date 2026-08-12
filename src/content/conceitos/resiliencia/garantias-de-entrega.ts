import type { Conceito } from "@/shared/types/conceito";

const ANTI_EXEMPLO = `// "Configuramos exactly-once, entao nao precisa deduplicar."
consumidor.configurar({ entrega: "exactly-once" });

consumidor.escutar(async (msg) => {
  // Nenhuma verificacao: confia na garantia do broker.
  await creditarSaldo(msg.contaId, msg.valor);
});

// O que a garantia do broker realmente cobre:
//   produtor -> broker -> consumidor   (dentro do sistema dele)
//
// O que ela NAO cobre — e e onde mora o dinheiro:
//
//   1. creditarSaldo() roda e commita no banco
//   2. o processo morre ANTES de confirmar a mensagem
//   3. o broker, corretamente, reentrega
//   4. creditarSaldo() roda de novo
//
// O saldo foi creditado duas vezes, e o broker cumpriu o contrato:
// ele entregou uma vez para um consumidor que nao terminou.
// Efeito colateral fora do sistema do broker nao entra na garantia.`;

const EXEMPLOS = [
  {
    lang: "typescript" as const,
    code: `// A unica garantia que atravessa a rede com seguranca e at-least-once.
// "Exactly-once" util se constroi assim: entrega repetida + efeito unico.

async function consumir(msg: Mensagem) {
  // 1. A chave e do EVENTO, nao da tentativa: ela precisa ser a mesma
  //    em todas as reentregas da mesma mensagem.
  const chave = msg.id;

  // 2. Marcar e agir na MESMA transacao. Se estiverem separados,
  //    existe uma janela em que um aconteceu e o outro nao.
  await db.transacao(async (tx) => {
    const novo = await tx.processados.inserirSeAusente(chave);
    if (!novo) return;              // ja processamos: ignora em silencio
    await creditarSaldo(tx, msg.contaId, msg.valor);
  });

  await msg.confirmar();
}

// Por que nao da para ter exactly-once de verdade:
// depois de escrever no banco e antes de confirmar a mensagem,
// o processo pode morrer. Nenhuma ordem das duas operacoes elimina
// essa janela — so a idempotencia a torna inofensiva.`,
  },
  {
    lang: "python" as const,
    code: `# Tres semanticas, e o que cada uma custa:
#
#   at-most-once   confirma ANTES de processar
#                  -> nunca duplica, pode PERDER
#   at-least-once  confirma DEPOIS de processar
#                  -> nunca perde, pode DUPLICAR
#   exactly-once   nao existe entre sistemas distintos
#                  -> at-least-once + efeito idempotente

def consumir(msg, db):
    with db.transacao() as tx:
        # INSERT ... ON CONFLICT DO NOTHING: o banco decide quem chegou
        # primeiro, sem precisar de lock na aplicacao.
        novo = tx.execute(
            "INSERT INTO processados (chave) VALUES (%s) "
            "ON CONFLICT DO NOTHING RETURNING chave",
            (msg.id,),
        ).fetchone()

        if novo is None:
            return  # reentrega: ja fizemos

        creditar_saldo(tx, msg.conta_id, msg.valor)

    msg.confirmar()

# A tabela 'processados' precisa de expurgo: sem TTL ela cresce
# para sempre e vira o gargalo que o consumo nao tinha.`,
  },
];

export const garantiasDeEntrega: Conceito = {
  slug: "garantias-de-entrega",
  titulo: "Garantias de entrega",
  categoria: "resiliencia",
  resumo:
    "At-most-once perde, at-least-once duplica, e exactly-once não existe entre sistemas distintos. Entender qual das três você tem — e por que a terceira é vendida sem ser verdade — é o que decide se o cliente vai ser cobrado duas vezes.",
  tags: ["mensageria", "at-least-once", "exactly-once", "entrega", "resiliencia"],
  dificuldade: "avancado",
  tempoLeitura: 9,
  nasceu: {
    quando: { rotulo: "1984", ano: 1984, precisao: "aproximada" },
    fonte:
      "As semânticas de entrega (at-most-once, at-least-once) vêm da literatura de RPC — Birrell & Nelson, 'Implementing Remote Procedure Calls', ACM TOCS, 1984",
    precursor:
      "O debate 'exactly-once é mentira' voltou com força na era do Kafka (meados dos anos 2010), mas a impossibilidade já estava clara na teoria de RPC e no problema dos generais bizantinos.",
  },
  ondeAparece: [
    {
      onde: "SQS padrão × FIFO",
      explicacao:
        "A fila padrão é at-least-once assumido; a FIFO oferece deduplicação numa janela de minutos, não para sempre.",
    },
    {
      onde: "enable.idempotence do Kafka",
      explicacao:
        "Resolve duplicação do produtor para o broker — dentro do Kafka. O efeito no seu banco continua sendo seu problema.",
    },
    {
      onde: "O ACK do TCP",
      explicacao:
        "O protocolo retransmite quando não recebe confirmação, o que é at-least-once no nível do segmento.",
    },
  ],
  emUmaLinha: {
    lang: "typescript",
    code: `// Entre sistemas, prepare-se para at-least-once.
// Idempotência no consumidor fecha o ciclo.`,
  },
  custo: {
    indirecoes: 1,
    cobra: [
      "At-least-once obriga todo consumidor a ser idempotente para tolerar duplicatas",
      "Deduplicar de verdade exige guardar os ids já vistos, com estado e janela de retenção",
    ],
    naoValeSe:
      "a perda ocasional de uma mensagem é aceitável para o caso — aí at-most-once sai mais barato que qualquer garantia forte.",
  },
  relacionados: ["idempotencia", "outbox", "dead-letter-queue", "retry"],
  problema: [
    "Toda entrega que atravessa a rede pode falhar depois de ter efeito: a mensagem chegou, foi processada, e a confirmação se perdeu. Quem enviou não tem como distinguir isso de 'nunca chegou'.",
    "A escolha é entre confirmar antes de processar (e arriscar perder) ou depois (e arriscar duplicar). Não existe terceira opção — e mesmo assim 'exactly-once' aparece em material de marketing.",
  ],
  solucao: [
    "Assumir **at-least-once** como a garantia real de qualquer entrega entre sistemas, porque é a única que não perde dado.",
    "Tornar o efeito idempotente: registrar a chave do evento e aplicar o efeito na mesma transação, de modo que a reentrega não produza efeito novo.",
  ],
  quandoUsar: [
    "Sempre que houver consumo de fila, webhook recebido ou chamada de rede com efeito colateral.",
    "Ao integrar com terceiros, que quase invariavelmente entregam at-least-once.",
    "Ao decidir se um dado pode ser perdido — a resposta muda a semântica escolhida.",
  ],
  quandoEvitar: [
    "Não é uma escolha opcional: a garantia existe quer você a nomeie ou não. O que se pode evitar é o custo da deduplicação, quando o efeito já é naturalmente idempotente.",
    "Métrica de telemetria de alto volume é um caso legítimo de at-most-once: perder uma amostra custa menos que o registro de deduplicação.",
  ],
  exemplos: EXEMPLOS,
  blocos: [
    {
      tipo: "tldr",
      texto:
        "Confirmar antes de processar perde; confirmar depois duplica. Não há terceira via — 'exactly-once' entre sistemas distintos é impossível, e o que os brokers vendem com esse nome vale só dentro do próprio broker. A saída prática é at-least-once com efeito idempotente: entrega repetida, efeito único.",
    },
    {
      tipo: "analogia",
      emoji: "📞",
      titulo: "Os dois generais",
      texto:
        "Dois generais em morros opostos precisam atacar no mesmo horário e só podem se comunicar por mensageiros que atravessam o vale inimigo. O primeiro manda 'atacamos às 6h'. Mas ele não sabe se chegou — então o segundo confirma. Só que o segundo não sabe se a confirmação chegou. E assim por diante, para sempre. Nenhuma quantidade de mensagens produz certeza mútua. É um resultado provado, não uma limitação de tecnologia.",
    },
    {
      tipo: "secao",
      id: "tres",
      titulo: "As três semânticas, e o que cada uma custa",
      resumo: [
        "**At-most-once**: confirma a mensagem antes de processar. Se o processo morrer no meio, ninguém reentrega — a mensagem se perdeu, e nada duplica.",
        "**At-least-once**: confirma depois de processar. Se o processo morrer entre o efeito e a confirmação, a mensagem volta e o efeito acontece de novo.",
        "**Exactly-once**: seria confirmar e processar como uma coisa só, atomicamente, através da rede. Não é possível.",
      ],
      extensao: [
        "A impossibilidade não é de engenharia, é matemática: é o **problema dos dois generais**. Entre dois sistemas que só se comunicam por um canal que pode falhar, não existe protocolo que produza acordo garantido em número finito de mensagens. Qualquer confirmação pode se perder, e a confirmação da confirmação também.",
        "O que os brokers chamam de exactly-once é real, mas tem escopo. O Kafka consegue porque, num fluxo *ler-processar-escrever* inteiramente dentro do Kafka, o avanço do offset e a escrita do resultado entram na **mesma transação do próprio Kafka** — é um sistema fechado, não uma travessia de rede. No instante em que o efeito sai dali (seu banco, uma API de terceiro, um e-mail), a garantia acaba, e o problema volta a ser seu.",
        "A escolha, portanto, é entre perder e duplicar. Para quase todo efeito de negócio — crédito de saldo, envio de nota, baixa de estoque — perder é inaceitável e duplicar é corrigível. Por isso at-least-once é o padrão de fato, e por isso **Idempotência** deixa de ser um refinamento e vira pré-requisito.",
      ],
    },
    {
      tipo: "ilustracao",
      arquetipo: "antes-depois",
      antes: {
        titulo: "Confiar na garantia do broker",
        itens: [
          "O consumidor aplica o efeito direto, sem registro",
          "O processo morre entre o efeito e a confirmação",
          "O broker reentrega — corretamente",
          "O efeito acontece pela segunda vez",
        ],
        nota: "O broker cumpriu o contrato dele: entregou uma vez a um consumidor que não terminou. O efeito fora do broker nunca esteve coberto.",
      },
      depois: {
        titulo: "At-least-once com efeito idempotente",
        itens: [
          "A chave do evento é registrada e o efeito aplicado na mesma transação",
          "O processo morre entre o efeito e a confirmação",
          "O broker reentrega, igual",
          "A chave já existe: a reentrega não faz nada",
        ],
        nota: "A duplicação continua acontecendo — ela apenas deixou de ter consequência. É este o significado prático de 'exactly-once'.",
      },
      legenda:
        "Note que a diferença não está na entrega, que é idêntica nos dois casos, e sim no efeito. Não se elimina a reentrega; torna-se a reentrega inofensiva.",
    },
    {
      tipo: "secao",
      id: "chave",
      titulo: "A chave é do evento, e a transação é uma só",
      resumo: [
        "Deduplicar exige duas decisões que costumam ser tomadas erradas: qual é a chave, e onde ela é gravada em relação ao efeito.",
        "A chave precisa identificar o **evento**, não a tentativa — se cada reentrega gerar uma chave nova, a deduplicação nunca encontra nada.",
      ],
      extensao: [
        "Gravar a chave e aplicar o efeito precisam acontecer na **mesma transação**. Separados, existe uma janela: marcou e morreu antes de aplicar (perdeu o efeito para sempre, porque a reentrega vai achar a chave e desistir), ou aplicou e morreu antes de marcar (duplica na reentrega). A atomicidade entre os dois é o que faz o mecanismo funcionar.",
        "Quando o efeito não está no mesmo banco — mandar e-mail, chamar API de terceiro — não há transação possível, e a deduplicação vira melhor esforço com uma janela de risco declarada. Nesses casos, o certo é empurrar a idempotência para o outro lado: usar a chave de idempotência que o provedor oferece (o Stripe faz isso) em vez de tentar garantir do lado de cá.",
        "E a tabela de processados precisa de **expurgo**. Sem TTL, ela cresce para sempre e vira o gargalo que o consumo não tinha. A janela de retenção se define pelo tempo máximo em que uma reentrega ainda é plausível — normalmente dias, não anos.",
      ],
    },
    {
      tipo: "casos",
      titulo: "Como isso aparece na prática",
      casos: [
        {
          titulo: "O webhook de pagamento entregue duas vezes",
          cenario:
            "O provedor entrega o webhook de pagamento aprovado. O handler credita o saldo e leva 8 segundos para responder; o provedor considera timeout em 5 e reentrega. O saldo é creditado duas vezes.",
          aplicacao:
            "O id do evento do provedor vira a chave; a inserção na tabela de processados e o crédito acontecem na mesma transação. A reentrega passa a não fazer nada.",
          tradeoff:
            "Aparece uma tabela nova, com escrita a cada evento e necessidade de expurgo. É custo real de armazenamento e manutenção, trocado pela impossibilidade de crédito duplicado.",
        },
        {
          titulo: "A métrica que podia se perder",
          cenario:
            "Um coletor recebe milhões de amostras de telemetria por minuto. Deduplicar cada uma exigiria uma tabela de chaves maior que os próprios dados, e os painéis toleram bem uma amostra ausente.",
          aplicacao:
            "At-most-once assumido de propósito: confirma antes de processar, sem registro de deduplicação, com a perda documentada como decisão.",
          tradeoff:
            "Contagens ficam levemente subestimadas em cenários de falha, o que inviabiliza usar essas métricas para cobrança. A decisão precisa estar escrita, ou alguém vai construir faturamento em cima delas.",
        },
      ],
    },
    {
      tipo: "anti-exemplo",
      titulo: "Confiar no exactly-once do broker",
      comoSeParece:
        "A configuração diz `exactly-once`, então o consumidor aplica o efeito direto, sem registro de deduplicação. A garantia existe — só que o escopo dela termina onde o seu efeito começa.",
      codigo: { lang: "typescript", code: ANTI_EXEMPLO },
      sintomas: [
        {
          quando: "Ao reiniciar o pod",
          efeito:
            "Mensagens processadas cujo ACK não chegou antes do encerramento são reentregues, e o efeito é aplicado de novo.",
        },
        {
          quando: "No rebalanceamento",
          efeito:
            "Ao redistribuir partições entre consumidores, mensagens em voo voltam para outro consumidor e são processadas duas vezes.",
        },
        {
          quando: "Na conciliação",
          efeito:
            "O saldo diverge de um jeito que não bate com nenhum evento registrado, porque houve dois efeitos para um evento só.",
        },
      ],
      correcao:
        "A garantia do broker cobre o caminho dentro do broker. Efeito colateral fora dele — banco, e-mail, API de terceiro — nunca esteve incluído. Assuma at-least-once e torne o efeito idempotente: chave do evento e efeito na mesma transação.",
    },
    {
      tipo: "armadilhas",
      titulo: "Onde isto dá errado",
      itens: [
        {
          titulo: "Acreditar no rótulo exactly-once",
          texto:
            "A garantia é real dentro do sistema do broker e termina onde o seu efeito começa. Quem lê o rótulo e dispensa a deduplicação descobre isso num incidente de conciliação, meses depois.",
        },
        {
          titulo: "Chave da tentativa em vez do evento",
          texto:
            "Se a chave for gerada no consumidor a cada recebimento, toda reentrega produz uma chave nova e a deduplicação nunca encontra nada. A chave precisa vir do evento e ser estável entre reentregas.",
        },
        {
          titulo: "Marcar e agir em transações separadas",
          texto:
            "Marcar antes e morrer perde o efeito para sempre — a reentrega acha a chave e desiste. Agir antes e morrer duplica. Só a atomicidade entre os dois elimina a janela.",
        },
        {
          titulo: "Tabela de deduplicação sem expurgo",
          texto:
            "Sem TTL ela cresce indefinidamente, e o índice que garantia a unicidade vira o gargalo do consumo. A retenção se dimensiona pelo tempo máximo em que uma reentrega ainda é plausível.",
        },
        {
          titulo: "Deduplicar por conteúdo",
          texto:
            "Usar um hash do corpo como chave confunde dois eventos legítimos e idênticos — duas transferências do mesmo valor, para a mesma conta, no mesmo segundo — com uma reentrega. Só um identificador do evento distingue os dois casos.",
        },
        {
          titulo: "Confirmar antes de processar sem querer",
          texto:
            "Muitos clientes confirmam automaticamente ao entregar a mensagem ao handler. Isso é at-most-once por acidente: qualquer falha no processamento perde o dado em silêncio, e ninguém escolheu isso.",
        },
      ],
    },
    {
      tipo: "codigo",
      titulo: "Chave do evento e efeito na mesma transação",
      exemplos: EXEMPLOS,
    },
    {
      tipo: "quando",
      usar: [
        "Em todo consumo de fila, webhook recebido ou efeito disparado por rede.",
        "Ao integrar com terceiros, que entregam at-least-once na prática.",
        "Ao decidir explicitamente se um dado pode ser perdido.",
      ],
      evitar: [
        "Deduplicar quando o efeito já é naturalmente idempotente (um `UPDATE` que fixa valor absoluto).",
        "At-most-once para qualquer coisa que envolva dinheiro ou estado do cliente.",
      ],
    },
  ],
};
