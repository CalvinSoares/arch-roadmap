import type { Conceito } from "@/shared/types/conceito";

const EXEMPLOS = [
  {
    lang: "typescript" as const,
    code: `// Entrega "ao menos uma vez" significa: a mesma mensagem PODE
// chegar duas vezes (reenvio apos falha, timeout que era sucesso).
// A inbox e a memoria do consumidor: "ja processei este id?".

async function processar(msg: { id: string; payload: unknown }) {
  // 1. tenta registrar o id numa tabela com UNIQUE constraint
  const novo = await inbox.registrarSeNovo(msg.id); // INSERT ... ON CONFLICT
  if (!novo) return; // ja processado: ignora a duplicata, em silencio

  // 2. so agora executa o efeito, na MESMA transacao do registro
  await efeitoDeNegocio(msg.payload);
}

// O detalhe que separa o certo do quase-certo: registrar o id e
// aplicar o efeito precisam ser ATOMICOS. Se registrar e depois
// cair antes do efeito, a mensagem some (registrada, nao aplicada).
// Por isso os dois vao na mesma transacao do banco.`,
  },
];

export const inboxDeduplicacao: Conceito = {
  slug: "inbox-deduplicacao",
  titulo: "Inbox e deduplicação",
  categoria: "resiliencia",
  resumo:
    "Entrega confiável quase sempre significa 'ao menos uma vez' — e ao menos uma vez quer dizer que a mesma mensagem pode chegar duas. A inbox é a memória do consumidor: registra o id de cada mensagem já processada e ignora a repetida, transformando um canal que duplica num efeito que acontece uma vez só. É o par consumidor do Outbox, e o jeito prático de sobreviver ao 'exactly-once é mentira'.",
  tags: ["mensageria", "idempotencia", "deduplicacao", "entrega", "consumidor"],
  dificuldade: "intermediario",
  tempoLeitura: 7,
  nasceu: {
    quando: { rotulo: "anos 2010", ano: 2018, precisao: "aproximada" },
    fonte:
      "O padrão Inbox é o par consumidor do Outbox, difundido com a arquitetura de microsserviços e o change data capture no fim dos anos 2010",
    precursor:
      "Registrar 'já processei esta mensagem' para não repetir é a deduplicação de sempre — os brokers dos anos 1990 já ofereciam detecção de duplicatas.",
  },
  ondeAparece: [
    {
      onde: "tabela eventos_processados",
      explicacao:
        "Uma tabela que guarda os ids já vistos, consultada antes de processar, é a forma mais comum de implementar a inbox.",
    },
    {
      onde: "INSERT ... ON CONFLICT DO NOTHING",
      explicacao:
        "A restrição de unicidade no id da mensagem faz o banco recusar a duplicata sozinho, sem corrida entre checar e inserir.",
    },
    {
      onde: "dedup do SQS FIFO / Kafka",
      explicacao:
        "Brokers oferecem deduplicação por id numa janela de tempo, mas ela expira — a inbox durável cobre o que a janela do broker não alcança.",
    },
  ],
  emUmaLinha: {
    lang: "typescript",
    code: `// Já processei este messageId? Ignora.
if (await inbox.jaViu(msg.id)) return;`,
  },
  custo: {
    indirecoes: 1,
    cobra: [
      "Guardar e consultar os ids já processados custa armazenamento e uma leitura ou escrita por mensagem",
      "Definir a janela de retenção dos ids é um trade-off entre memória e a chance de reprocessar um antigo",
    ],
    naoValeSe:
      "o processamento já é naturalmente idempotente — se aplicar a mensagem duas vezes não muda o resultado, a inbox é redundante.",
  },
  relacionados: ["idempotencia", "garantias-de-entrega", "outbox"],
  problema: [
    "Nenhum sistema de mensageria entrega 'exatamente uma vez' de ponta a ponta: um ack perdido, um timeout que na verdade deu certo, um reenvio após falha — e o consumidor recebe a mesma mensagem de novo. É a garantia 'ao menos uma vez', a única honesta em rede.",
    "Se o efeito da mensagem não for idempotente — cobrar um cartão, enviar um e-mail, dar baixa em estoque —, a duplicata vira dinheiro cobrado duas vezes, e-mail repetido, estoque errado.",
  ],
  solucao: [
    "Dar ao consumidor uma memória: antes de processar, registrar o id da mensagem numa inbox com restrição de unicidade. Se o id já estava lá, a mensagem é duplicata e é ignorada.",
    "Fazer o registro do id e o efeito de negócio acontecerem de forma atômica (na mesma transação), para que não exista o estado 'registrei mas não apliquei' nem 'apliquei mas não registrei'.",
  ],
  quandoUsar: [
    "Consumidores de fila ou tópico cujo efeito não é idempotente por natureza.",
    "Quando o broker entrega 'ao menos uma vez' e a duplicata tem consequência real.",
    "Ao complementar o Outbox: o produtor não perde o evento, o consumidor não o processa duas vezes.",
  ],
  quandoEvitar: [
    "Quando o efeito já é idempotente (um UPSERT que sobrescreve, por exemplo).",
    "Quando duplicar o efeito é inofensivo e o custo de manter a inbox não se justifica.",
  ],
  exemplos: EXEMPLOS,
  blocos: [
    {
      tipo: "tldr",
      texto:
        "Mensageria confiável entrega 'ao menos uma vez', então a mesma mensagem pode chegar duas. A inbox é a memória do consumidor: registra o id de cada mensagem processada (com restrição de unicidade) e ignora a repetida. O detalhe que separa o certo do quase-certo é a atomicidade — registrar o id e aplicar o efeito na mesma transação, senão sobra a janela em que a mensagem foi registrada mas não aplicada, e some.",
    },
    {
      tipo: "analogia",
      emoji: "🎟️",
      titulo: "O carimbo na mão da festa",
      texto:
        "Na entrada da festa, sua mão é carimbada. Se você sair e voltar, o segurança vê o carimbo e não cobra o ingresso de novo — mesmo que você mostre o mesmo ticket duas vezes. A inbox é o carimbo: o consumidor marca 'esta mensagem eu já processei', e quando ela reaparece (porque a rede reenviou), ele a reconhece e deixa passar sem refazer o trabalho. Sem o carimbo, cada reentrada seria cobrada de novo.",
    },
    {
      tipo: "secao",
      id: "a-atomicidade",
      titulo: "O detalhe que separa o certo do quase-certo",
      resumo: [
        "Registrar o id e executar o efeito parecem dois passos, e tratá-los como dois passos é o erro. Se você registra o id e cai antes de aplicar o efeito, a mensagem fica marcada como processada sem ter sido — e o reenvio será ignorado, então ela some para sempre.",
        "A saída é fazer os dois de forma atômica: registrar o id e aplicar o efeito na mesma transação do banco. Ou os dois acontecem, ou nenhum — e a duplicata que chegar depois encontra o id já lá e é descartada com segurança.",
      ],
      extensao: [
        "A implementação mais robusta nem separa checar de inserir: um `INSERT` do id numa coluna com restrição de unicidade, com `ON CONFLICT DO NOTHING`, faz o próprio banco decidir. Se o insert afetou uma linha, é a primeira vez — processe; se afetou zero, é duplicata — ignore. Isso elimina a corrida do 'checar se existe e depois inserir', que sob concorrência deixaria duas cópias passarem (o clássico check-then-act de uma condição de corrida).",
        "A inbox é a metade consumidora de um par com o **Outbox**: o Outbox garante que o produtor não perca o evento (grava a intenção de publicar na mesma transação do dado); a inbox garante que o consumidor não o processe duas vezes. Juntos, eles dão o efeito prático de 'exactly-once' — não porque a rede entregou exatamente uma vez (ela não entrega), mas porque o produtor não perde e o consumidor deduplica. É assim que se contorna o fato de que **entrega exatamente-uma-vez de ponta a ponta é impossível**: você move a garantia do transporte para as pontas.",
      ],
    },
    {
      tipo: "casos",
      titulo: "Como isso aparece na prática",
      casos: [
        {
          titulo: "O cartão cobrado duas vezes",
          cenario:
            "Um consumidor de eventos de pagamento cobrava o cartão ao receber a mensagem. Numa reentrega após um timeout de rede (a mensagem tinha dado certo, mas o ack se perdeu), alguns clientes foram cobrados duas vezes.",
          aplicacao:
            "O consumidor passou a registrar o id do evento numa inbox com unicidade, na mesma transação da cobrança. A reentrega passou a encontrar o id já registrado e a ser ignorada.",
          tradeoff:
            "Cada evento ganhou uma escrita a mais e uma tabela de inbox a manter e limpar. Em troca, a cobrança dupla — que virava estorno, suporte e desconfiança — deixou de acontecer.",
        },
        {
          titulo: "A janela de dedup do broker que expirou",
          cenario:
            "Um sistema confiava só na deduplicação nativa do broker, com janela de cinco minutos. Uma mensagem represada por uma falha longa foi reprocessada horas depois, já fora da janela, e o efeito duplicou.",
          aplicacao:
            "A deduplicação passou a ser durável na inbox da aplicação, sem janela de expiração para os ids que importam, complementando a do broker em vez de depender só dela.",
          tradeoff:
            "A inbox cresce e precisa de uma política de retenção pensada. Em troca, a deduplicação deixou de ter um prazo de validade que ninguém tinha percebido que existia.",
        },
      ],
    },
    {
      tipo: "armadilhas",
      titulo: "Onde isto dá errado",
      itens: [
        {
          titulo: "Registrar o id fora da transação do efeito",
          texto:
            "Se marcar 'processado' e aplicar o efeito são passos separados, uma falha entre eles ou perde o efeito (marcou, não aplicou) ou duplica (aplicou, não marcou). Os dois têm que ser atômicos, na mesma transação.",
        },
        {
          titulo: "Checar-e-inserir em vez de restrição de unicidade",
          texto:
            "'Consultar se o id existe e depois inserir' é um check-then-act: sob concorrência, duas cópias checam ao mesmo tempo, ambas não encontram e ambas processam. A unicidade no banco resolve a corrida de uma vez.",
        },
        {
          titulo: "Confiar só na janela de dedup do broker",
          texto:
            "A deduplicação do broker costuma valer por uma janela de tempo. Uma mensagem atrasada além dela reaparece como nova. Para o que não pode duplicar nunca, a inbox durável na aplicação é o que segura.",
        },
      ],
    },
    {
      tipo: "codigo",
      titulo: "Registrar o id e aplicar o efeito, juntos",
      exemplos: EXEMPLOS,
    },
    {
      tipo: "quando",
      usar: [
        "Consumidores cujo efeito não é idempotente por natureza.",
        "Quando o broker entrega ao menos uma vez e a duplicata dói.",
        "Como par do Outbox, para o efeito prático de exactly-once.",
      ],
      evitar: [
        "Quando o efeito já é idempotente (um UPSERT, por exemplo).",
        "Quando duplicar o efeito é inofensivo e a inbox não se paga.",
      ],
    },
  ],
};
