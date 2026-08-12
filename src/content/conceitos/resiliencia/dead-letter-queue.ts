import type { Conceito } from "@/shared/types/conceito";

const EXEMPLOS = [
  {
    lang: "typescript" as const,
    code: `// ERRADO: a mensagem envenenada volta para a fila para sempre.
// Ela bloqueia a ordem, queima CPU e enche o log — e nunca vai dar certo.
async function consumir(msg: Mensagem) {
  try {
    await processar(msg);
    await msg.confirmar();
  } catch {
    await msg.devolver(); // volta pro topo... e recomeca o ciclo
  }
}

// CERTO: contar tentativas e desviar o que nao tem conserto.
const MAX_TENTATIVAS = 5;

async function consumirComDLQ(msg: Mensagem) {
  try {
    await processar(msg);
    await msg.confirmar();
    return;
  } catch (erro) {
    // Falha de infra (banco fora) merece nova tentativa.
    // Falha de conteudo (JSON invalido) nao melhora tentando.
    const repetivel = ehTransitoria(erro);

    if (repetivel && msg.tentativas < MAX_TENTATIVAS) {
      await msg.devolverComAtraso(backoff(msg.tentativas));
      return;
    }

    // O contexto e o que torna a DLQ util: sem o erro e o
    // momento, ela vira um cemiterio que ninguem sabe ler.
    await dlq.publicar({
      original: msg.corpo,
      erro: String(erro),
      tentativas: msg.tentativas,
      falhouEm: msg.recebidoEm,
      origem: msg.fila,
    });
    await msg.confirmar(); // tira da fila principal: ja esta guardada
  }
}`,
  },
  {
    lang: "python" as const,
    code: `MAX_TENTATIVAS = 5

def consumir(msg, dlq, agora):
    try:
        processar(msg.corpo)
        msg.confirmar()
        return
    except Exception as erro:
        transitoria = eh_transitoria(erro)

        if transitoria and msg.tentativas < MAX_TENTATIVAS:
            msg.devolver_com_atraso(backoff(msg.tentativas))
            return

        # Guardar o suficiente para diagnosticar E reprocessar depois.
        dlq.publicar({
            "original": msg.corpo,
            "erro": repr(erro),
            "tentativas": msg.tentativas,
            "falhou_em": agora,      # injetado, nunca datetime.now() aqui
            "origem": msg.fila,
        })
        msg.confirmar()

# A DLQ so vale se alguem olhar. Um alerta em "profundidade da DLQ > 0"
# e o que separa uma rede de seguranca de um cemiterio silencioso.`,
  },
];

export const deadLetterQueue: Conceito = {
  slug: "dead-letter-queue",
  titulo: "Dead Letter Queue",
  categoria: "resiliencia",
  resumo:
    "Uma mensagem que nunca vai dar certo não pode ficar voltando para a fila: ela bloqueia a ordem, consome CPU e esconde o problema. A DLQ é o desvio para onde vai o que falhou demais — com contexto suficiente para diagnosticar e reprocessar.",
  tags: ["resiliencia", "fila", "mensageria", "poison-message", "producao"],
  dificuldade: "intermediario",
  tempoLeitura: 7,
  nasceu: {
    quando: { rotulo: "anos 1990", ano: 1993, precisao: "aproximada" },
    fonte:
      "A fila de mensagens mortas é parte do middleware de mensageria desde os anos 1990 (IBM MQSeries), depois padronizada em JMS e nos brokers modernos",
    precursor:
      "É o equivalente digital da caixa de 'correspondência não entregável' dos Correios: o que não pôde ser entregue vai para um canto separado, sem travar a fila.",
  },
  ondeAparece: [
    {
      onde: "redrive policy do SQS",
      explicacao:
        "Você declara o número máximo de recebimentos e a fila de destino; o broker faz o desvio sozinho.",
    },
    {
      onde: "Dead letter exchange do RabbitMQ",
      explicacao:
        "Mensagem rejeitada, expirada ou com fila cheia é roteada para uma exchange separada.",
    },
    {
      onde: "A caixa de devolvidos do correio",
      explicacao:
        "O nome vem daí: carta sem destinatário válido não circula para sempre — vai para um setor próprio.",
    },
  ],
  emUmaLinha: {
    lang: "typescript",
    code: `// Depois de N falhas, desvia — não trava a fila.
if (tentativas > 5) await dlq.send(msg);`,
  },
  custo: {
    indirecoes: 1,
    cobra: [
      "Uma fila a mais para monitorar, com alarme e processo de reprocessamento",
      "Mensagens paradas na DLQ são trabalho não feito que exige alguém para investigar",
    ],
    naoValeSe:
      "a falha de uma mensagem pode ser simplesmente descartada sem consequência — aí desviar para uma fila é guardar lixo.",
  },
  relacionados: ["retry", "idempotencia", "webhooks", "saga"],
  problema: [
    "Nem toda falha no consumo de uma fila é passageira. Uma mensagem com JSON inválido, com referência a um registro que não existe mais ou de uma versão de contrato que o consumidor não entende vai falhar em todas as tentativas.",
    "Se ela volta para a fila indefinidamente, vira uma *poison message*: consome capacidade, polui o log, e — em filas com ordenação — bloqueia todas as mensagens atrás dela.",
  ],
  solucao: [
    "Contar as tentativas de entrega e, ao passar do limite, desviar a mensagem para uma fila separada em vez de devolvê-la à principal.",
    "Guardar junto o contexto — erro, número de tentativas, momento, fila de origem — para que a DLQ sirva a diagnóstico e a reprocessamento, não só a descarte.",
  ],
  quandoUsar: [
    "Em qualquer consumo de fila em produção. Uma fila sem DLQ é uma fila com poison message esperando acontecer.",
    "Quando existe processamento assíncrono cujo insucesso precisa ser investigado depois, e não perdido.",
    "Quando a ordem importa e uma mensagem travada bloquearia as seguintes.",
  ],
  quandoEvitar: [
    "Quando a mensagem perde valor com o tempo e reprocessar depois não faz sentido — aí descartar com métrica é mais honesto.",
    "Como depósito permanente: DLQ que ninguém lê é só um jeito mais caro de perder dado.",
  ],
  exemplos: EXEMPLOS,
  blocos: [
    {
      tipo: "tldr",
      texto:
        "Depois de N tentativas, a mensagem sai da fila principal e vai para uma fila de desvio, com o erro e o contexto anexados. Isso desbloqueia quem estava atrás dela, para de queimar CPU com o que nunca vai dar certo, e preserva o dado para investigação e reprocessamento.",
    },
    {
      tipo: "analogia",
      emoji: "📮",
      titulo: "A caixa de devolvidos",
      texto:
        "Uma carta com endereço inexistente não fica circulando pelo país para sempre. Depois de algumas tentativas, ela vai para o setor de devolvidos — que guarda a carta, anota o motivo, e permite que alguém decida o que fazer. O que ninguém faz é deixá-la no meio do malote, atrasando as outras entregas por tempo indeterminado.",
    },
    {
      tipo: "secao",
      id: "problema",
      titulo: "A mensagem envenenada",
      resumo: [
        "O consumidor falha, devolve a mensagem para a fila, pega a mesma mensagem de novo, falha de novo. Se a causa for de conteúdo — e não de infraestrutura —, esse ciclo não tem fim.",
        "Em fila com ordenação por chave, o efeito é pior: nada atrás daquela mensagem é processado enquanto ela não sair da frente.",
      ],
      extensao: [
        "A distinção que resolve isto é entre falha **transitória** e falha **permanente**. Banco indisponível, timeout de rede, deploy em andamento: tentar de novo daqui a pouco funciona. JSON malformado, campo obrigatório ausente, referência a um pedido que foi apagado: tentar de novo daqui a mil anos dá o mesmo resultado. Retry serve à primeira; DLQ serve à segunda.",
        "Na prática nem sempre dá para classificar com segurança, e por isso a heurística padrão é por **contagem**: tenta N vezes com backoff e, se ainda assim falhar, trata como permanente e desvia. Não é perfeito — um incidente de infraestrutura longo o bastante manda mensagens boas para a DLQ —, e é justamente por isso que a DLQ precisa permitir reprocessamento em massa.",
        "O que separa uma DLQ útil de um cemitério é o **contexto**. Uma fila que guarda só o corpo original obriga quem investiga a reproduzir o erro do zero. Guardar a exceção, o número de tentativas, o momento da primeira falha e a fila de origem transforma o desvio em material de diagnóstico. E, principalmente: **alguém precisa ser avisado.** Um alerta simples em \"profundidade da DLQ maior que zero\" é o que impede que ela vire um lugar onde dados somem em silêncio.",
      ],
    },
    {
      tipo: "ilustracao",
      arquetipo: "fluxo",
      atores: [
        { id: "fila", label: "Fila principal" },
        { id: "consumidor", label: "Consumidor" },
        { id: "classifica", label: "Transitória ou permanente?", destaque: true },
        { id: "dlq", label: "Dead Letter Queue", destaque: true },
        { id: "humano", label: "Alerta e reprocessamento" },
      ],
      setas: [
        { label: "entrega" },
        { label: "falhou" },
        { label: "permanente, ou passou de N tentativas" },
        { label: "alguém precisa olhar", tracejada: true },
      ],
      legenda:
        "O desvio só resolve metade do problema. A outra metade é o alerta: DLQ sem ninguém observando é um jeito mais caro de perder mensagem.",
    },
    {
      tipo: "casos",
      titulo: "Como isso aparece na prática",
      casos: [
        {
          titulo: "O contrato que mudou sem avisar",
          cenario:
            "Um produtor passa a enviar `valor` como string em vez de número. O consumidor lança exceção ao desserializar e devolve a mensagem para a fila. Em uma hora há 40 mil mensagens circulando e o consumo de CPU do consumidor está no teto.",
          aplicacao:
            "Com DLQ configurada em 5 tentativas, as mensagens quebradas saem da fila principal e se acumulam no desvio. O alerta dispara, a fila principal volta ao normal, e as mensagens desviadas são reprocessadas depois da correção.",
          tradeoff:
            "As mensagens ficam paradas até alguém agir — o processamento delas deixa de ser em tempo real. É uma perda real, e ainda assim melhor que travar a fila inteira.",
        },
        {
          titulo: "O webhook do parceiro que some",
          cenario:
            "Um serviço entrega notificações para URLs cadastradas por clientes. Um cliente desativa o endpoint sem remover o cadastro, e as entregas passam a falhar indefinidamente para aquele destino.",
          aplicacao:
            "Após o limite de tentativas com backoff, a notificação vai para a DLQ e o endpoint é marcado como suspeito. O cliente recebe um aviso de que as entregas estão falhando.",
          tradeoff:
            "Um endpoint com instabilidade longa mas legítima pode ser marcado indevidamente, exigindo um caminho de reativação. Sem o limite, porém, um único cliente inativo consumiria capacidade de entrega para sempre.",
        },
      ],
    },
    {
      tipo: "armadilhas",
      titulo: "Onde isto dá errado",
      itens: [
        {
          titulo: "DLQ sem alerta",
          texto:
            "Uma fila de desvio que ninguém observa é um lugar onde mensagens desaparecem em silêncio — com a agravante de todo mundo achar que existe uma rede de segurança. O alerta em profundidade maior que zero é parte do padrão, não um extra.",
        },
        {
          titulo: "Guardar só o corpo original",
          texto:
            "Sem a exceção, o número de tentativas e o momento da falha, quem investiga precisa reproduzir o erro do zero, muitas vezes semanas depois. O contexto custa alguns campos e é o que torna a DLQ diagnosticável.",
        },
        {
          titulo: "Não ter caminho de reprocessamento",
          texto:
            "Corrigido o bug, as mensagens desviadas precisam voltar. Se a única forma for um script escrito às pressas durante o incidente, a DLQ vira arquivo morto. O caminho de volta se constrói antes de precisar dele.",
        },
        {
          titulo: "Reprocessar sem idempotência",
          texto:
            "Boa parte do que cai na DLQ falhou **depois** de ter efeito parcial. Reprocessar em massa sem chave de idempotência é a forma mais eficiente já inventada de cobrar todo mundo duas vezes.",
        },
        {
          titulo: "Limite de tentativas alto demais",
          texto:
            "Cinquenta tentativas com backoff longo mantêm a mensagem envenenada circulando por horas antes de sair — que é exatamente o problema que a DLQ deveria resolver. Poucas tentativas e um desvio rápido servem melhor.",
        },
        {
          titulo: "Uma DLQ só para todas as filas",
          texto:
            "Misturar desvios de origens diferentes dificulta o diagnóstico e impede reprocessar uma origem sem mexer nas outras. Uma DLQ por fila mantém a investigação e a correção com escopo pequeno.",
        },
      ],
    },
    {
      tipo: "codigo",
      titulo: "Classificar, contar e desviar",
      exemplos: EXEMPLOS,
    },
    {
      tipo: "quando",
      usar: [
        "Em qualquer consumo de fila em produção.",
        "Quando o insucesso precisa ser investigado depois, não perdido.",
        "Quando a ordem importa e uma mensagem travada bloqueia as seguintes.",
      ],
      evitar: [
        "Quando a mensagem perde valor e reprocessar não faz sentido — descartar com métrica é mais honesto.",
        "Como depósito permanente sem alerta e sem caminho de volta.",
      ],
    },
  ],
};
