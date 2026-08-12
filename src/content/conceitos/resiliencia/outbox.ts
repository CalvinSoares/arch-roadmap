import type { Conceito } from "@/shared/types/conceito";

const ANTI_EXEMPLO = `// A "escrita dupla": dois sistemas, duas operacoes, nenhuma atomicidade.
async function confirmarPedido(id: string) {
  await db.transacao(async (tx) => {
    await tx.pedidos.atualizar(id, { status: "CONFIRMADO" });
  });                                   // <- commitou aqui

  await broker.publicar("PedidoConfirmado", { id });  // <- e se falhar?
}

// Tres finais possiveis, e dois sao ruins:
//
// 1. commit OK + publish OK    -> tudo certo
// 2. commit OK + publish FALHA -> o pedido esta confirmado no banco
//                                 e ninguem foi avisado. O estoque nao
//                                 baixa, a nota nao sai, o cliente nao
//                                 recebe e-mail. E nao ha erro em lugar
//                                 nenhum: a transacao commitou.
// 3. publish antes do commit   -> pior ainda: avisou de algo que pode
//                                 nem ter acontecido (rollback depois)
//
// Inverter a ordem nao resolve. Envolver o broker na transacao do banco
// exigiria commit em duas fases entre sistemas — que e caro, fragil,
// e a maioria dos brokers nem oferece.`;

const EXEMPLOS = [
  {
    lang: "typescript" as const,
    code: `// A ideia: o evento vira uma LINHA, na MESMA transacao do dado.
// Um banco so, uma transacao so — atomicidade de verdade.

async function confirmarPedido(id: string, agora: Date) {
  await db.transacao(async (tx) => {
    await tx.pedidos.atualizar(id, { status: "CONFIRMADO" });

    // Nao publica: apenas registra a intencao de publicar.
    await tx.outbox.inserir({
      id: crypto.randomUUID(),      // vira a chave de deduplicacao do consumidor
      tipo: "PedidoConfirmado",
      payload: { pedidoId: id },
      criadoEm: agora,              // injetado, nunca new Date() aqui dentro
      publicadoEm: null,
    });
  });
  // Ou os dois aconteceram, ou nenhum. Nao existe meio-termo.
}

// Um processo separado drena a tabela e publica de verdade.
async function drenar(agora: Date) {
  const pendentes = await db.outbox.naoPublicados({ limite: 100 });

  for (const ev of pendentes) {
    await broker.publicar(ev.tipo, ev.payload, { chave: ev.id });
    // Se o processo morrer AQUI, o evento sera publicado de novo:
    // por isso o consumidor precisa deduplicar por ev.id.
    await db.outbox.marcarPublicado(ev.id, agora);
  }
}`,
  },
  {
    lang: "python" as const,
    code: `# A tabela outbox, com o indice que importa:
#
#   CREATE TABLE outbox (
#     id           uuid PRIMARY KEY,
#     tipo         text NOT NULL,
#     payload      jsonb NOT NULL,
#     criado_em    timestamptz NOT NULL,
#     publicado_em timestamptz
#   );
#   -- indice parcial: so as pendentes, que sao as unicas consultadas
#   CREATE INDEX ON outbox (criado_em) WHERE publicado_em IS NULL;

def confirmar_pedido(db, id: str, agora):
    with db.transacao() as tx:
        tx.execute("UPDATE pedidos SET status='CONFIRMADO' WHERE id=%s", (id,))
        tx.execute(
            "INSERT INTO outbox (id, tipo, payload, criado_em) "
            "VALUES (%s, %s, %s, %s)",
            (uuid4(), "PedidoConfirmado", {"pedido_id": id}, agora),
        )
    # commit atomico: o dado e o evento, ou nenhum dos dois


def drenar(db, broker, agora):
    # FOR UPDATE SKIP LOCKED: varias instancias drenam em paralelo
    # sem pegar a mesma linha e sem travar umas as outras.
    linhas = db.execute(
        "SELECT * FROM outbox WHERE publicado_em IS NULL "
        "ORDER BY criado_em LIMIT 100 FOR UPDATE SKIP LOCKED"
    )
    for ev in linhas:
        broker.publicar(ev.tipo, ev.payload, chave=ev.id)
        db.execute("UPDATE outbox SET publicado_em=%s WHERE id=%s", (agora, ev.id))`,
  },
];

export const outbox: Conceito = {
  slug: "outbox",
  titulo: "Transactional Outbox",
  categoria: "resiliencia",
  resumo:
    "Salvar no banco e publicar um evento são duas operações em dois sistemas — e não há transação que cubra as duas. O outbox transforma o evento numa linha da mesma transação, e deixa a publicação para depois.",
  tags: ["mensageria", "eventos", "atomicidade", "escrita-dupla", "resiliencia"],
  dificuldade: "avancado",
  tempoLeitura: 8,
  nasceu: {
    quando: { rotulo: "anos 2010", ano: 2017, precisao: "aproximada" },
    fonte:
      "O padrão Transactional Outbox foi catalogado por Chris Richardson em microservices.io e difundido com o change data capture do Debezium no fim dos anos 2010",
    precursor:
      "É a aplicação, entre banco e broker, da velha ideia do WAL: grave a intenção de publicar na mesma transação do dado e deixe outro processo despachar depois.",
  },
  ondeAparece: [
    {
      onde: "Debezium sobre a tabela outbox",
      explicacao:
        "Lê o log de transações do banco e publica o que entrou na tabela — sem o serviço nem saber do broker.",
    },
    {
      onde: "O log de transações do próprio banco",
      explicacao:
        "O WAL é, ele mesmo, um outbox: a intenção é escrita e durável antes de ser aplicada em qualquer outro lugar.",
    },
    {
      onde: "A pasta de saída de um cliente de e-mail",
      explicacao:
        "A mensagem é gravada localmente ao clicar em enviar, e transmitida depois — sem depender da rede no instante do clique.",
    },
  ],
  emUmaLinha: {
    lang: "typescript",
    code: `// Evento na mesma transação do estado.
await tx.insert(pedido);
await tx.insert(outbox, evento);`,
  },
  custo: {
    indirecoes: 1,
    cobra: [
      "Uma tabela de outbox e um processo de despacho a mais para manter e monitorar",
      "O evento é publicado depois do commit, então a entrega é assíncrona e ao menos uma vez",
    ],
    naoValeSe:
      "não há dois destinos a manter consistentes (banco e broker) — sem essa dupla escrita, o outbox não tem o que resolver.",
  },
  relacionados: ["saga", "garantias-de-entrega", "idempotencia", "event-sourcing"],
  problema: [
    "Confirmar um pedido no banco e publicar `PedidoConfirmado` no broker são duas operações em sistemas diferentes. Se a segunda falhar, o estado mudou e ninguém foi avisado — sem erro em lugar nenhum.",
    "Inverter a ordem só troca o defeito: publicar antes de commitar anuncia algo que pode ser desfeito por um rollback.",
  ],
  solucao: [
    "Gravar o evento como uma linha numa tabela `outbox`, dentro da **mesma transação** que altera o dado. Ou os dois acontecem, ou nenhum.",
    "Um processo separado lê as linhas pendentes e publica de verdade, marcando o que já saiu — com reentrega assumida em caso de falha.",
  ],
  quandoUsar: [
    "Sempre que uma mudança de estado no banco precisar produzir um evento externo confiável.",
    "Em sagas, onde perder o evento de um passo trava a coreografia inteira.",
    "Quando o broker é menos disponível que o banco, ou está fora do controle da sua equipe.",
  ],
  quandoEvitar: [
    "Quando o evento é dispensável — telemetria, log de auditoria informativo — e perder um não tem consequência.",
    "Quando o consumidor pode simplesmente ler o estado do banco em vez de receber notificação.",
    "Se não houver como deduplicar no consumidor: o outbox garante que o evento sai, não que sai uma vez só.",
  ],
  exemplos: EXEMPLOS,
  blocos: [
    {
      tipo: "tldr",
      texto:
        "Não dá para commitar no banco e publicar no broker atomicamente. Então o evento vira uma linha da mesma transação do dado, e um processo separado drena essa tabela e publica. A publicação passa a ser at-least-once — o que exige deduplicação no consumidor, mas nunca perde o evento.",
    },
    {
      tipo: "analogia",
      emoji: "📤",
      titulo: "A caixa de saída",
      texto:
        "Você escreve o e-mail no avião e clica em enviar. Ele não vai a lugar nenhum — vai para a caixa de saída, gravada no seu aparelho. Quando a conexão volta, o cliente drena a caixa e transmite. Você nunca fica na dúvida sobre ter escrito ou não: escrever e enfileirar foram a mesma ação. O envio é que ficou para depois.",
    },
    {
      tipo: "secao",
      id: "problema",
      titulo: "A escrita dupla",
      resumo: [
        "O nome do problema é *dual write*: duas escritas, em dois sistemas, que precisariam ser uma coisa só e não são.",
        "O caso ruim não dá erro — é justamente por isso que ele passa despercebido. A transação commitou, o serviço respondeu 200, e o evento simplesmente não existe.",
      ],
      extensao: [
        "Nenhuma ordem resolve. Publicar depois do commit arrisca o estado mudar sem ninguém saber; publicar antes arrisca anunciar algo que o rollback desfaz — e evento publicado não se desfaz. Repetir a publicação em caso de falha ajuda, mas não cobre o processo que morre entre uma coisa e outra.",
        "A solução clássica de livro seria commit em duas fases entre banco e broker. Na prática ela é cara, trava recursos durante a votação, e a maioria dos brokers modernos nem oferece — Kafka e SQS não participam de transação XA. O outbox é a alternativa que troca atomicidade distribuída por atomicidade local, que é barata e existe.",
        "O truque conceitual é reconhecer que **publicar não precisa ser síncrono; registrar a intenção de publicar, sim**. E registrar intenção é escrever uma linha — coisa que o banco já sabe fazer transacionalmente. Deslocado o problema para dentro de um sistema só, ele deixa de ser distribuído.",
        "Isso conecta diretamente com **Saga**: numa coreografia, cada passo publica o evento que dispara o próximo. Se um evento se perde, a saga trava no meio, com um pedido confirmado e um estoque que nunca baixou — e nada no log indicando o que houve. O outbox é o que torna a saga confiável.",
      ],
    },
    {
      tipo: "ilustracao",
      arquetipo: "fluxo",
      atores: [
        { id: "servico", label: "Serviço" },
        { id: "transacao", label: "Uma transação: dado + linha no outbox", destaque: true },
        { id: "tabela", label: "Tabela outbox" },
        { id: "drenador", label: "Drenador (processo separado)", destaque: true },
        { id: "broker", label: "Broker" },
      ],
      setas: [
        { label: "confirmar pedido" },
        { label: "commit atômico — ou os dois, ou nenhum" },
        { label: "lê pendentes" },
        { label: "publica e marca, com reentrega", tracejada: true },
      ],
      legenda:
        "A atomicidade acontece à esquerda, dentro de um banco só. À direita, a entrega é at-least-once por construção — e é por isso que o consumidor precisa deduplicar pela chave do evento.",
    },
    {
      tipo: "secao",
      id: "drenar",
      titulo: "Drenar sem duplicar demais e sem travar",
      resumo: [
        "O drenador é onde as decisões operacionais aparecem: como várias instâncias leem sem pegar a mesma linha, o que fazer quando a publicação falha, e como impedir que a tabela cresça para sempre.",
        "E há uma ordem que não tem saída boa: publicar e marcar não são atômicos entre si.",
      ],
      extensao: [
        "Se o processo morre depois de publicar e antes de marcar, o evento sai duas vezes. Inverter — marcar antes de publicar — é pior: uma falha ali perde o evento definitivamente, que é exatamente o que o padrão existia para evitar. Então a escolha é assumida: **publica primeiro, marca depois, e o consumidor deduplica** pelo id do evento — o mesmo raciocínio das garantias de entrega.",
        "Para escalar o drenador, `SELECT ... FOR UPDATE SKIP LOCKED` é a ferramenta certa: várias instâncias leem lotes diferentes sem bloquear umas às outras e sem pegar a mesma linha. Sem isso, ou só uma instância drena (e ela vira o gargalo), ou duas publicam o mesmo evento com frequência.",
        "A alternativa ao drenador por polling é **CDC**: uma ferramenta como o Debezium lê o log de transações do banco e publica o que entrou na tabela. Elimina o processo de polling e a latência dele, ao custo de uma peça de infraestrutura a mais e de acoplamento ao formato de replicação do banco.",
        "E a tabela precisa de expurgo. Linhas publicadas não servem mais para nada depois de um tempo, e sem limpeza o índice cresce até o drenador ficar lento — o gargalo aparece justamente no componente que deveria ser invisível.",
      ],
    },
    {
      tipo: "casos",
      titulo: "Como isso aparece na prática",
      casos: [
        {
          titulo: "A saga que travou no meio",
          cenario:
            "O serviço de pedidos confirma o pedido e publica `PedidoConfirmado`, que dispara a baixa de estoque. Numa instabilidade do broker, algumas publicações falham. Os pedidos ficam confirmados, o estoque não baixa, e não há erro em nenhum log.",
          aplicacao:
            "O evento passa a ser gravado na tabela outbox junto do pedido. Durante a instabilidade, as linhas se acumulam; quando o broker volta, o drenador publica tudo e a saga continua.",
          tradeoff:
            "Os eventos saem atrasados durante o incidente, então o estoque fica temporariamente inconsistente. É uma consistência eventual explícita, em vez de uma perda silenciosa.",
        },
        {
          titulo: "O broker menos disponível que o banco",
          cenario:
            "O broker é gerenciado por outra equipe e tem janelas de manutenção que o serviço não controla. Durante elas, qualquer operação que publique evento falha para o usuário final.",
          aplicacao:
            "Com o outbox, a operação do usuário depende apenas do banco. A publicação é assíncrona e se recupera sozinha quando o broker volta.",
          tradeoff:
            "A resposta ao usuário passa a significar 'foi registrado', não 'foi propagado'. A interface precisa refletir isso, ou alguém vai assumir que o efeito downstream já aconteceu.",
        },
      ],
    },
    {
      tipo: "anti-exemplo",
      titulo: "Commitar e publicar em seguida",
      comoSeParece:
        "A transação fecha, e logo depois vem a chamada ao broker. Parece sequencial e correto, e funciona em todos os testes — porque nos testes o broker nunca cai entre as duas linhas.",
      codigo: { lang: "typescript", code: ANTI_EXEMPLO },
      sintomas: [
        {
          quando: "Se o broker oscilar",
          efeito:
            "O estado muda no banco e o evento não sai. Não há exceção registrada em lugar nenhum: a transação commitou com sucesso.",
        },
        {
          quando: "Ao reiniciar o processo",
          efeito:
            "Uma morte entre o commit e o publish perde o evento definitivamente, e nada no sistema indica que ele deveria existir.",
        },
        {
          quando: "Numa saga",
          efeito:
            "O passo seguinte nunca é disparado, a coreografia trava, e o pedido fica num estado intermediário que ninguém consegue explicar depois.",
        },
      ],
      correcao:
        "Publicar não pode participar da transação do banco — mas **registrar a intenção de publicar** pode, porque é só uma linha. Grave o evento na tabela outbox junto do dado e deixe um processo separado publicar, assumindo at-least-once e deduplicando no consumidor.",
    },
    {
      tipo: "armadilhas",
      titulo: "Onde isto dá errado",
      itens: [
        {
          titulo: "Achar que o outbox garante entrega única",
          texto:
            "Ele garante que o evento **não se perde**, não que sai uma vez só. Publicar e marcar não são atômicos, então a reentrega é esperada e o consumidor precisa deduplicar pela chave do evento.",
        },
        {
          titulo: "Marcar como publicado antes de publicar",
          texto:
            "Parece proteger contra duplicata e é a única variante que perde evento: uma falha entre marcar e publicar apaga a intenção para sempre. Publicar primeiro é a ordem correta, com a duplicação assumida.",
        },
        {
          titulo: "Drenador único como gargalo",
          texto:
            "Uma instância só drenando limita a vazão de eventos ao que ela dá conta. Escalar exige `FOR UPDATE SKIP LOCKED` ou particionamento — sem isso, duas instâncias disputam as mesmas linhas.",
        },
        {
          titulo: "Tabela sem expurgo nem índice parcial",
          texto:
            "Linhas publicadas se acumulam e a consulta por pendentes fica lenta. Um índice parcial sobre `publicado_em IS NULL` mais limpeza periódica mantêm o custo constante.",
        },
        {
          titulo: "Payload que referencia em vez de descrever",
          texto:
            "Gravar só o id e esperar que o consumidor busque o estado atual reintroduz a corrida que o padrão evitava: quando ele buscar, o estado já pode ter mudado de novo. O evento carrega o que aconteceu.",
        },
        {
          titulo: "Ordem entre eventos assumida sem garantia",
          texto:
            "Drenar em paralelo publica fora de ordem. Se o consumidor depende da sequência, é preciso ordenar por chave de partição — ou o consumidor precisa tolerar chegada desordenada.",
        },
      ],
    },
    {
      tipo: "codigo",
      titulo: "Uma transação para o dado e o evento",
      exemplos: EXEMPLOS,
    },
    {
      tipo: "quando",
      usar: [
        "Quando uma mudança de estado precisa produzir evento externo confiável.",
        "Em sagas, onde perder um evento trava a coreografia.",
        "Quando o broker é menos disponível que o banco.",
      ],
      evitar: [
        "Para eventos dispensáveis, como telemetria informativa.",
        "Quando o consumidor pode simplesmente ler o estado do banco.",
        "Se não houver deduplicação no consumidor.",
      ],
    },
  ],
};
