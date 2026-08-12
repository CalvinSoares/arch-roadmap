import type { Conceito } from "@/shared/types/conceito";

const ANTI_EXEMPLO = `// "So preciso que estas tres coisas aconteçam juntas."
async function confirmarPedido(pedido) {
  const tx = await coordenador.iniciar(); // 2PC entre 3 servicos
  await estoque.reservar(tx, pedido.itens);   // participante 1: TRAVA linhas
  await pagamentos.cobrar(tx, pedido.total);   // participante 2: TRAVA conta
  await notas.emitir(tx, pedido);              // participante 3: TRAVA sequencia
  await coordenador.commit(tx); // so agora os locks sao liberados
}

// Os locks ficam presos do "prepare" ate o "commit" — a duracao
// da chamada MAIS LENTA das tres, somada a latencia de rede.
//
// Agora o coordenador cai depois do prepare e antes do commit.
// Os tres participantes ficam "in-doubt": travados, sem saber se
// commitam ou abortam, esperando um coordenador que nao volta.
// O estoque daquele item esta congelado. Ninguem mais compra.`;

const EXEMPLOS = [
  {
    lang: "typescript" as const,
    code: `// 2PC: um coordenador conduz duas fases entre os participantes.
// Fase 1 (prepare): "voce consegue commitar? trave e prometa."
// Fase 2 (commit):  "todos disseram sim -> apliquem de verdade."

async function doisFases(coord: Coordenador, parts: Participante[]) {
  // FASE 1 — prepare: cada um trava recursos e vota
  const votos = await Promise.all(
    parts.map((p) => p.prepare()), // retorna "sim" (pronto) ou "nao"
  );

  if (votos.every((v) => v === "sim")) {
    // FASE 2a — todos prometeram: nao ha volta, commita em todos
    await Promise.all(parts.map((p) => p.commit()));
  } else {
    // FASE 2b — alguem recusou: aborta em todos
    await Promise.all(parts.map((p) => p.abort()));
  }
}

// Entre o prepare e o commit os recursos ficam TRAVADOS.
// Se o coordenador morrer nessa janela, os participantes ficam
// "in-doubt" — travados sem saber a decisao. Esse e o calcanhar
// do 2PC, e o motivo de sagas existirem.`,
  },
];

export const twoPhaseCommit: Conceito = {
  slug: "two-phase-commit",
  titulo: "Two-Phase Commit (2PC)",
  categoria: "dados",
  resumo:
    "Como fazer vários bancos commitarem uma transação juntos — ou nenhum. Um coordenador pergunta 'estão prontos?' (prepare), e só manda 'commit' se todos prometeram. Dá atomicidade entre sistemas, ao preço de recursos travados durante todo o protocolo e de um coordenador que, se cair na hora errada, deixa todo mundo travado sem saber o que fazer.",
  tags: ["distribuido", "transacao", "atomicidade", "coordenacao", "2pc"],
  dificuldade: "avancado",
  tempoLeitura: 9,
  nasceu: {
    quando: { rotulo: "1978", ano: 1978, precisao: "aproximada" },
    fonte:
      "Jim Gray, 'Notes on Data Base Operating Systems', Lecture Notes in Computer Science, 1978 — a descrição canônica do commit em duas fases",
    precursor:
      "O problema do acordo atômico entre nós já rondava os sistemas de transação distribuída do início dos anos 1970; Gray deu a ele o nome e a forma que ficaram.",
  },
  ondeAparece: [
    {
      onde: "transações XA",
      explicacao:
        "O padrão que coordena o commit entre bancos e filas de mensagens diferentes através de um coordenador — 2PC com outro nome.",
    },
    {
      onde: "PREPARE TRANSACTION do Postgres",
      explicacao:
        "O comando que deixa uma transação pronta para o commit de duas fases, aguardando a decisão final do coordenador.",
    },
    {
      onde: "MSDTC no mundo .NET",
      explicacao:
        "O coordenador de transações distribuídas da Microsoft, que orquestra o prepare e o commit entre os recursos participantes.",
    },
  ],
  emUmaLinha: {
    lang: "typescript",
    code: `// Prepare em todos; depois commit ou abort.
await coordenador.prepare(participantes);`,
  },
  custo: {
    indirecoes: 2,
    cobra: [
      "Trava os recursos de todos os participantes do prepare até o commit — a duração da chamada mais lenta, somada à rede",
      "Um coordenador que cai entre as fases deixa participantes 'in-doubt', travados sem saber se commitam ou abortam",
      "A disponibilidade despenca: basta um participante fora do ar para a transação inteira não poder concluir",
    ],
    naoValeSe:
      "os passos toleram acontecer em momentos diferentes e ser desfeitos por compensação. Aí uma saga entrega o mesmo objetivo sem travar recurso nenhum.",
  },
  relacionados: ["saga", "cap", "niveis-de-isolamento"],
  problema: [
    "Uma operação precisa mudar o estado de vários bancos (ou serviços) de forma atômica: ou todos aplicam, ou nenhum. Dentro de um banco só, a transação ACID resolve; entre bancos diferentes, não existe transação compartilhada.",
    "Sem coordenação, é fácil um banco commitar e o outro falhar, deixando o sistema num estado meio-aplicado que ninguém sabe reverter — dinheiro cobrado sem pedido, estoque baixado sem venda.",
  ],
  solucao: [
    "Eleger um coordenador que conduz o commit em duas fases. Na primeira (prepare), ele pergunta a cada participante se consegue commitar; cada um trava os recursos e responde sim ou não. Na segunda, se todos disseram sim, ele manda commitar; se algum disse não, manda abortar.",
    "A promessa do prepare é o coração do protocolo: quem votou sim garante que conseguirá commitar quando mandado, aconteça o que acontecer. É isso que dá a atomicidade — e é isso que obriga a manter os recursos travados até a decisão chegar.",
  ],
  quandoUsar: [
    "Quando a atomicidade entre sistemas é inegociável e os passos são curtos.",
    "Dentro de uma mesma fronteira confiável e de baixa latência, onde os participantes raramente falham.",
    "Ao integrar recursos que já falam um padrão de commit distribuído (XA), como um banco e um broker de mensagens.",
  ],
  quandoEvitar: [
    "Entre microsserviços independentes, onde o acoplamento e os locks distribuídos derrubam a disponibilidade.",
    "Quando os passos são longos ou envolvem terceiros que não vão manter recursos travados esperando você.",
  ],
  exemplos: EXEMPLOS,
  blocos: [
    {
      tipo: "tldr",
      texto:
        "2PC faz vários bancos commitarem como um só: um coordenador pergunta 'prontos?' (prepare), cada participante trava e promete, e só então vem o 'commit'. Entrega atomicidade real entre sistemas — e cobra caro por ela: recursos ficam travados o protocolo inteiro, e um coordenador que cai entre as fases deixa participantes travados 'in-doubt'. É por causa desses custos que sistemas distribuídos modernos preferem a saga, que troca atomicidade por compensação.",
    },
    {
      tipo: "analogia",
      emoji: "💍",
      titulo: "O 'sim' no altar",
      texto:
        "O celebrante não declara o casamento e depois pergunta se cada um aceita. Ele primeiro pergunta a cada um — 'você aceita?' — e só declara quando os dois já disseram sim. Se um hesita, ninguém está casado. O prepare é essa pergunta: cada participante promete o sim antes de qualquer coisa ser oficial. E, como no altar, se o celebrante desmaiar entre o 'sim' de um e a declaração final, os dois ficam num limbo constrangedor esperando alguém dizer o que vale — o famoso estado in-doubt.",
    },
    {
      tipo: "secao",
      id: "o-limbo",
      titulo: "A janela travada e o coordenador que cai",
      resumo: [
        "Entre o prepare e o commit, cada participante que votou sim mantém os recursos travados: ele prometeu commitar e precisa poder cumprir. Essa janela dura o tempo da rodada inteira — o participante mais lento define o ritmo, e ninguém mais toca aquelas linhas até a decisão.",
        "O ponto fatal é o coordenador cair depois de coletar os votos e antes de mandar a decisão. Os participantes ficaram **in-doubt**: prometeram, travaram, e agora esperam uma ordem que não vem. Eles não podem abortar (talvez o coordenador tenha decidido commit) nem commitar (talvez tenha sido abort). Ficam travados.",
      ],
      extensao: [
        "É por isso que se diz que o 2PC é um **protocolo bloqueante**: existe um estado do qual os participantes não conseguem sair sozinhos. Variações como o 3PC tentam reduzir esse bloqueio adicionando uma fase, mas trocam por outras suposições (sobre tempo e falhas) que raramente se sustentam na prática — e por isso quase ninguém usa.",
        "Ligando ao **CAP**: o 2PC escolhe consistência em detrimento de disponibilidade. Basta um participante indisponível para a transação inteira não poder concluir — a disponibilidade do conjunto é o produto das disponibilidades individuais, então ela só cai à medida que você adiciona participantes. Num sistema de três serviços com 99,9% cada, o 2PC entre eles já vale menos que qualquer um sozinho.",
        "Daí a preferência moderna pela **saga**: em vez de travar tudo e commitar junto, cada passo commita localmente na hora e, se um passo posterior falhar, os anteriores são desfeitos por ações de compensação (estornar a cobrança, liberar a reserva). A saga abre mão da atomicidade instantânea — existe um intervalo em que o sistema está parcialmente aplicado — em troca de não travar recurso nenhum e de sobreviver a participantes que falham. É o trade-off central de transações distribuídas: **atomicidade travada (2PC) × consistência eventual por compensação (saga)**.",
      ],
    },
    {
      tipo: "ilustracao",
      arquetipo: "fluxo",
      atores: [
        { id: "coord", label: "Coordenador" },
        { id: "prepare", label: "Fase 1: prepare", destaque: true },
        { id: "votos", label: "Todos votam sim" },
        { id: "commit", label: "Fase 2: commit", destaque: true },
        { id: "fim", label: "Aplicado em todos" },
      ],
      setas: [
        { label: "pergunta a cada participante" },
        { label: "cada um trava e promete" },
        { label: "coordenador decide" },
        { label: "todos aplicam e liberam" },
      ],
      legenda:
        "Do prepare até o commit, os recursos ficam travados em todos os participantes. Se o coordenador cair entre as duas fases, quem votou sim fica in-doubt, travado sem saber a decisão.",
    },
    {
      tipo: "casos",
      titulo: "Como isso aparece na prática",
      casos: [
        {
          titulo: "Banco e fila num commit só",
          cenario:
            "Um serviço precisa gravar um pedido no banco e publicar um evento numa fila, de forma que nunca aconteça um sem o outro. Uma falha entre as duas ações deixaria o sistema inconsistente.",
          aplicacao:
            "Como banco e broker suportam XA, um coordenador conduziu o 2PC entre os dois recursos, dentro do mesmo processo e da mesma rede de baixa latência.",
          tradeoff:
            "Funciona porque são dois participantes confiáveis e próximos. Ainda assim, muitos times preferem o padrão Outbox aqui — grava tudo no banco numa transação local e publica depois — justamente para não depender de XA.",
        },
        {
          titulo: "O 2PC entre microsserviços que travou o checkout",
          cenario:
            "Um time tentou garantir atomicidade entre os serviços de estoque, pagamento e nota fiscal com 2PC. Numa instabilidade de rede, o serviço de nota ficou lento e travou reservas de estoque em toda a plataforma.",
          aplicacao:
            "O 2PC foi substituído por uma saga: cada serviço commita seu passo localmente, e uma falha adiante dispara compensações (liberar a reserva, estornar a cobrança) em vez de segurar locks.",
          tradeoff:
            "Passou a existir uma janela em que o pedido está parcialmente processado antes de compensar ou concluir. Em troca, um serviço lento não trava mais os outros, e a disponibilidade deixou de ser refém do participante mais fraco.",
        },
      ],
    },
    {
      tipo: "anti-exemplo",
      titulo: "2PC entre microsserviços",
      comoSeParece:
        "Alguém quer que três serviços 'aconteçam juntos' e alcança o commit distribuído para conseguir atomicidade. Parece a escolha correta e rigorosa — até a primeira instabilidade de rede, quando os locks distribuídos transformam um serviço lento numa parada geral e um coordenador caído deixa recursos travados sem ninguém para destravá-los.",
      codigo: { lang: "typescript", code: ANTI_EXEMPLO },
      sintomas: [
        {
          quando: "Um participante fica lento",
          efeito:
            "Os locks do prepare ficam presos pelo tempo do mais lento, e a latência do conjunto vira a soma das piores — a plataforma inteira arrasta.",
        },
        {
          quando: "O coordenador cai",
          efeito:
            "Os participantes ficam in-doubt: travados, sem poder commitar nem abortar, esperando uma decisão que não chega até o coordenador voltar.",
        },
        {
          quando: "Mais serviços entram",
          efeito:
            "A disponibilidade da transação é o produto das disponibilidades de cada participante, então cada serviço novo a derruba um pouco mais.",
        },
      ],
      correcao:
        "Entre serviços independentes, troque atomicidade travada por consistência eventual: use uma saga. Cada passo commita localmente na hora, e uma falha adiante dispara compensações que desfazem os passos anteriores — ninguém segura lock esperando os outros, e um serviço fora do ar não congela o resto.",
    },
    {
      tipo: "armadilhas",
      titulo: "Onde isto dá errado",
      itens: [
        {
          titulo: "Usar 2PC entre microsserviços",
          texto:
            "É a tentação clássica de quem quer atomicidade entre serviços. Os locks distribuídos e o coordenador único derrubam a disponibilidade e acoplam serviços que deveriam ser independentes. Quase sempre a resposta certa é uma saga.",
        },
        {
          titulo: "Ignorar o estado in-doubt",
          texto:
            "Um coordenador que cai entre as fases deixa participantes travados sem saber a decisão. Sem um coordenador com log durável e recuperação, esses recursos ficam presos até intervenção manual — e ninguém planejou para isso.",
        },
        {
          titulo: "Subestimar a duração dos locks",
          texto:
            "Os recursos ficam travados do prepare ao commit, não por um instante. Sob latência de rede ou um participante lento, essa janela vira gargalo de concorrência e o throughput despenca.",
        },
        {
          titulo: "Achar que mais participantes é de graça",
          texto:
            "Cada participante adicional multiplica a chance de a transação não concluir: basta um indisponível para tudo parar. A disponibilidade do 2PC cai a cada nó que entra, não sobe.",
        },
      ],
    },
    {
      tipo: "codigo",
      titulo: "As duas fases, e onde mora o perigo",
      exemplos: EXEMPLOS,
    },
    {
      tipo: "quando",
      usar: [
        "Atomicidade inegociável entre sistemas, com passos curtos.",
        "Dentro de uma fronteira confiável e de baixa latência.",
        "Entre recursos que já falam XA, como um banco e um broker.",
      ],
      evitar: [
        "Entre microsserviços independentes — prefira saga.",
        "Quando os passos são longos ou dependem de terceiros.",
      ],
    },
  ],
};
