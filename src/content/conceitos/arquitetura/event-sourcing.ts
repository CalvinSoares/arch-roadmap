import type { Conceito } from "@/shared/types/conceito";

const MERMAID = `sequenceDiagram
    participant C as Cliente
    participant A as Agregado (Conta)
    participant ES as Event Store
    participant P as Projeção
    participant R as Read Model
    C->>A: comando (sacar 100)
    A->>ES: carrega eventos da conta
    ES-->>A: replay reconstrói o estado
    A->>ES: grava DinheiroSacado(100)
    ES-->>P: publica o evento
    P->>R: atualiza saldo projetado
    C->>R: consulta saldo`;

const CAMADAS = [
  { id: "comando", titulo: "Comando", descricao: "A intenção de mudança que chega ao agregado" },
  { id: "agregado", titulo: "Agregado", descricao: "Valida regras sobre o estado reconstruído e emite eventos" },
  {
    id: "event-store",
    titulo: "Event Store",
    descricao: "Log imutável e append-only — a única fonte da verdade",
    destaque: true,
  },
  { id: "projecoes", titulo: "Projeções", descricao: "Consomem eventos e mantêm read models derivados" },
  { id: "read-models", titulo: "Read models", descricao: "Visões descartáveis e reconstruíveis a partir do log" },
];

const EXEMPLOS = [
  {
    lang: "typescript" as const,
    code: `type Evento =
  | { tipo: "ContaAberta"; saldoInicial: number }
  | { tipo: "DinheiroDepositado"; valor: number }
  | { tipo: "DinheiroSacado"; valor: number };

class ContaBancaria {
  private constructor(public saldo = 0, private novos: Evento[] = []) {}

  // Replay: o estado atual e derivado da sequencia de eventos
  static deEventos(eventos: Evento[]): ContaBancaria {
    const conta = new ContaBancaria();
    for (const e of eventos) conta.aplicar(e);
    return conta;
  }

  sacar(valor: number): void {
    if (valor > this.saldo) throw new Error("Saldo insuficiente");
    this.registrar({ tipo: "DinheiroSacado", valor });
  }

  private registrar(e: Evento): void {
    this.aplicar(e);
    this.novos.push(e);   // sera anexado ao event store, nunca sobrescrito
  }

  private aplicar(e: Evento): void {
    switch (e.tipo) {
      case "ContaAberta":        this.saldo = e.saldoInicial; break;
      case "DinheiroDepositado": this.saldo += e.valor; break;
      case "DinheiroSacado":     this.saldo -= e.valor; break;
    }
  }

  eventosPendentes(): Evento[] { return this.novos; }
}

const conta = ContaBancaria.deEventos([
  { tipo: "ContaAberta", saldoInicial: 0 },
  { tipo: "DinheiroDepositado", valor: 300 },
]);
conta.sacar(100);   // saldo derivado: 200`,
  },
  {
    lang: "python" as const,
    code: `from dataclasses import dataclass

@dataclass(frozen=True)
class ContaAberta:        saldo_inicial: int
@dataclass(frozen=True)
class DinheiroDepositado: valor: int
@dataclass(frozen=True)
class DinheiroSacado:     valor: int

class ContaBancaria:
    def __init__(self):
        self.saldo = 0
        self.novos = []

    # Replay: o estado atual e derivado da sequencia de eventos
    @classmethod
    def de_eventos(cls, eventos):
        conta = cls()
        for e in eventos:
            conta._aplicar(e)
        return conta

    def sacar(self, valor: int):
        if valor > self.saldo:
            raise ValueError("Saldo insuficiente")
        self._registrar(DinheiroSacado(valor))

    def _registrar(self, e):
        self._aplicar(e)
        self.novos.append(e)   # anexado ao event store, nunca sobrescrito

    def _aplicar(self, e):
        if isinstance(e, ContaAberta):        self.saldo = e.saldo_inicial
        if isinstance(e, DinheiroDepositado): self.saldo += e.valor
        if isinstance(e, DinheiroSacado):     self.saldo -= e.valor

conta = ContaBancaria.de_eventos([ContaAberta(0), DinheiroDepositado(300)])
conta.sacar(100)   # saldo derivado: 200`,
  },
];

const ANTI_EXEMPLO = `// Isto NAO e um evento. E uma foto do estado, com data.
await eventos.inserir({
  tipo: "PedidoAtualizado",
  pedidoId,
  payload: { status: "cancelado", total: 340.0, itens: [...] },
});

// Perguntas que este registro NAO responde:
// - por que foi cancelado? (cliente desistiu? fraude? falta de estoque?)
// - quem cancelou?
// - o total mudou junto ou ja estava assim?
// - qual item saiu, se algum saiu?

// O evento de verdade nomeia o FATO e carrega so o que mudou:
await eventos.inserir({
  tipo: "PedidoCanceladoPorFaltaDeEstoque",
  pedidoId,
  payload: { skuIndisponivel: "ABC-123", canceladoPor: "sistema" },
});`;

export const eventSourcing: Conceito = {
  slug: "event-sourcing",
  titulo: "Event Sourcing",
  categoria: "arquitetura",
  resumo:
    "Em vez de guardar o estado atual, o sistema guarda a sequência imutável de eventos que o produziu — o estado é sempre derivado por replay, e o histórico é a fonte da verdade.",
  tags: ["eventos", "event-store", "replay", "projecoes", "auditoria"],
  dificuldade: "avancado",
  tempoLeitura: 9,
  nasceu: {
    quando: { rotulo: "2005", ano: 2005, precisao: "aproximada" },
    fonte:
      "Martin Fowler, artigo 'Event Sourcing', 2005; desenvolvido por Greg Young no contexto de CQRS ao longo dos anos seguintes",
    precursor:
      "A ideia é tão velha quanto a contabilidade de partidas dobradas e o log de transações do banco (WAL): guardar o que aconteceu e derivar o estado depois.",
  },
  ondeAparece: [
    {
      onde: "git",
      explicacao:
        "O histórico de commits é o log imutável de eventos; a árvore de trabalho é só a projeção do estado atual, reconstruível a partir do log.",
    },
    {
      onde: "Redux: estado = fold de ações",
      explicacao:
        "O estado da store é o resultado de reduzir a sequência de actions despachadas — as ações são a verdade, o estado é derivado delas.",
    },
    {
      onde: "Kafka como event store",
      explicacao:
        "O tópico guarda os eventos em ordem e os consumidores montam suas próprias visões relendo o log desde o começo quando precisam.",
    },
  ],
  emUmaLinha: {
    lang: "typescript",
    code: `// Estado = redução dos eventos.
const conta = eventos.reduce(aplicar, Conta.vazia());`,
  },
  custo: {
    indirecoes: 2,
    cobra: [
      "Reconstruir o estado exige reprocessar eventos, o que pede snapshots quando o log cresce",
      "Mudar o formato de um evento antigo é caro: o passado é imutável e precisa de versionamento",
    ],
    naoValeSe:
      "não há valor no histórico completo nem em auditoria — guardar só o estado atual é muito mais simples de operar.",
  },
  relacionados: ["cqrs", "saga", "observer"],
  problema: [
    "Bancos tradicionais guardam só o estado atual: cada UPDATE sobrescreve o anterior e joga fora o COMO se chegou ali. Quando a auditoria pergunta 'por que este saldo é 200?', a resposta já foi destruída.",
    "Tabelas de auditoria, logs e triggers tentam remendar isso, mas são derivados de segunda classe: incompletos, dessincronizados do estado real e inúteis para reconstruir o passado com precisão.",
  ],
  solucao: [
    "Inverta a fonte da verdade: persista cada mudança como um evento imutável ('DinheiroSacado(100)') em um log append-only — o event store. O estado atual vira uma derivação: reaplique os eventos (replay) e ele reaparece.",
    "Projeções consomem o log e mantêm read models para consulta (saldo, extrato, relatórios). Como o log é completo, qualquer visão nova pode ser construída retroativamente — inclusive sobre dados de anos atrás.",
  ],
  quandoUsar: [
    "O histórico é requisito de negócio ou regulatório: auditoria completa, ledgers financeiros, rastreabilidade ponta a ponta.",
    "Você precisa de visões retroativas: reconstruir o estado em qualquer ponto do tempo ou criar projeções novas sobre o passado.",
    "O domínio já é naturalmente orientado a eventos e combina com CQRS — o log alimenta os read models e a integração entre serviços.",
  ],
  quandoEvitar: [
    "CRUDs em que só o estado atual importa — o custo de eventos, projeções e versionamento não retorna nada.",
    "O time ainda não domina consistência eventual e modelagem de eventos — a curva é íngreme e os erros de modelagem ficam gravados para sempre.",
    "Dados pessoais com forte exigência de apagamento e pouca capacidade de engenharia para lidar com isso (crypto-shredding, eventos expurgáveis).",
  ],
  mermaid: MERMAID,
  camadas: CAMADAS,
  exemplos: EXEMPLOS,
  blocos: [
    {
      tipo: "tldr",
      texto:
        "Não guarde o saldo — guarde os lançamentos. Cada mudança vira um evento imutável num log append-only; o estado atual é derivado por replay, e projeções transformam o log nas visões de leitura que você precisar.",
    },
    {
      tipo: "analogia",
      emoji: "🏦",
      titulo: "O extrato bancário",
      texto:
        "Seu banco não guarda seu saldo numa caixinha que alguém edita — o saldo É a soma de todos os lançamentos do extrato desde a abertura da conta. Ninguém 'corrige' um lançamento errado apagando a linha: entra um estorno, novo lançamento, e a história continua íntegra. Por isso o banco consegue dizer exatamente quanto você tinha em 14 de março de 2019: o histórico é a verdade, o saldo é só uma conta feita em cima dele.",
    },
    {
      tipo: "secao",
      id: "problema",
      titulo: "O problema",
      resumo: [
        "Persistência tradicional é destrutiva: cada UPDATE sobrescreve o estado anterior. O sistema sabe QUE o pedido está cancelado, mas não sabe mais se foi o cliente, o antifraude ou um bug — essa informação morreu no UPDATE.",
        "Auditorias coladas depois (tabela de histórico, trigger, log de aplicação) nascem incompletas: capturam o que alguém lembrou de logar, dessincronizam do estado real e não permitem reconstruir o passado com confiança.",
      ],
      extensao: [
        "A raiz é uma escolha silenciosa que quase ninguém percebe estar fazendo: tratar o estado atual como fonte da verdade e o histórico como subproduto opcional. O Event Sourcing inverte: o histórico é a fonte da verdade, e o estado atual é cache. Contabilidade faz isso há séculos — livro-razão não aceita borracha.",
        "Essa inversão destrava capacidades impossíveis no modelo destrutivo: viagem no tempo (qual era o estado na terça passada?), depuração forense (replay dos eventos exatos que causaram o bug), projeções retroativas (uma visão nova calculada sobre anos de eventos) e um trilho natural de integração — outros serviços assinam o mesmo log.",
        "O par com CQRS é quase obrigatório na prática: replay a cada consulta seria proibitivo, então o lado de escrita anexa eventos ao store enquanto projeções mantêm read models atualizados para a leitura — o event store faz o papel de write store, e a consistência eventual entre os lados vem junto no pacote. Cuidado também para não confundir com 'arquitetura orientada a eventos': usar eventos para comunicação entre serviços não é Event Sourcing; o padrão só existe quando o log É a persistência primária.",
      ],
    },
    {
      tipo: "ilustracao",
      arquetipo: "fluxo",
      atores: [
        { id: "comando", label: "Comando" },
        { id: "agregado", label: "Agregado" },
        { id: "store", label: "Event Store", destaque: true },
        { id: "projecao", label: "Projeção" },
        { id: "read", label: "Read model" },
      ],
      setas: [
        { label: "valida regras" },
        { label: "anexa evento" },
        { label: "publica", tracejada: true },
        { label: "atualiza visão", tracejada: true },
      ],
      legenda:
        "A escrita só anexa eventos ao log; tudo à direita do event store é derivado — e pode ser apagado e reconstruído por replay a qualquer momento.",
    },
    {
      tipo: "camadas-nav",
      titulo: "Navegue pelas camadas",
      camadas: [
        {
          id: "agregado",
          titulo: "Agregado (escrita)",
          curto: "valida comandos e emite eventos",
          detalhe:
            "Recebe o comando, reconstrói seu estado por replay dos eventos anteriores e valida as regras ('tem saldo?'). Se a regra passa, emite o evento novo — nunca altera nada, só descreve o que aconteceu.",
          exemplo: "const conta = ContaBancaria.deEventos(store.carregar(id));\nconta.sacar(100);",
          seViolar:
            "se o agregado gravar estado direto (UPDATE), o log deixa de ser completo e todo o resto — replay, auditoria, projeções — perde a garantia.",
        },
        {
          id: "eventos",
          titulo: "Eventos",
          curto: "fatos imutáveis, no passado",
          detalhe:
            "Nomeados no passado (DinheiroSacado, PedidoCancelado) porque descrevem algo que JÁ aconteceu — não são pedidos nem intenções. Uma vez gravados, nunca mudam nem são apagados; correções entram como eventos novos (estorno, ajuste).",
          exemplo: "{ tipo: 'DinheiroSacado', valor: 100, em: '2026-08-09T10:00Z' }",
          seViolar:
            "editar um evento gravado quebra o contrato do padrão: todo replay passado vira mentira e projeções reconstruídas divergem das antigas.",
        },
        {
          id: "event-store",
          titulo: "Event Store",
          curto: "o log append-only, fonte da verdade",
          detalhe:
            "Armazena os eventos por agregado (stream), em ordem, apenas anexando. Garante concorrência via versão esperada: dois saques simultâneos sobre a mesma conta conflitam na escrita, não corrompem o log.",
          exemplo: "store.anexar(contaId, eventos, { versaoEsperada: 7 });",
          seViolar:
            "sem controle de versão na escrita, dois comandos concorrentes anexam eventos baseados no mesmo estado antigo — e o saldo fica negativo com as regras 'validadas'.",
        },
        {
          id: "projecoes",
          titulo: "Projeções e read models",
          curto: "visões derivadas, descartáveis",
          detalhe:
            "Consomem o log e mantêm as visões de leitura: saldo atual, extrato, relatório regulatório. São descartáveis por definição — apagou, roda o replay e a visão renasce. É aqui que o Event Sourcing encaixa no CQRS.",
          exemplo: "aoReceber(DinheiroSacado, (e) => saldoView.decrementar(e.valor));",
          seViolar:
            "projeção sem idempotência quebra no replay e na reentrega: o mesmo evento aplicado duas vezes duplica o lançamento na visão.",
        },
        {
          id: "snapshots",
          titulo: "Snapshots (otimização)",
          curto: "atalho para streams longos",
          detalhe:
            "Uma conta com 500 mil eventos não pode ser reconstruída do zero a cada comando. O snapshot grava o estado consolidado até o evento N; o replay parte dele e aplica só o resto. É cache, não verdade — pode ser apagado sem perda.",
          exemplo: "// estado até o evento 499_000 + replay dos 1_000 restantes",
          seViolar:
            "tratar snapshot como fonte da verdade (e expurgar eventos antigos) transforma o Event Sourcing num banco comum com passos extras.",
        },
      ],
    },
    {
      tipo: "diagrama",
      titulo: "Estrutura",
      mermaid: MERMAID,
    },
    {
      tipo: "codigo",
      titulo: "Código",
      exemplos: EXEMPLOS,
    },
    {
      tipo: "casos",
      casos: [
        {
          titulo: "Ledger de uma fintech",
          cenario:
            "Uma instituição de pagamentos precisa provar ao regulador como cada saldo chegou ao valor atual, suportar conciliação com o BACEN e investigar qualquer divergência de centavos meses depois.",
          aplicacao:
            "Cada movimentação (Pix recebido, tarifa, estorno) é um evento no stream da conta. O saldo é projeção; o extrato é outra; o relatório regulatório, uma terceira. Divergência na conciliação? Replay do stream mostra o filme completo, evento por evento.",
          tradeoff:
            "Contas de alto volume acumulam milhões de eventos — snapshots e particionamento de streams deixam de ser otimização e viram requisito operacional desde o dia um.",
        },
        {
          titulo: "Carrinho e pedidos em e-commerce",
          cenario:
            "Um varejista quer entender por que clientes abandonam carrinhos: o que adicionaram, removeram, em que ordem, quanto tempo hesitaram — dados que um carrinho salvo como JSON do estado final não tem.",
          aplicacao:
            "ItemAdicionado, ItemRemovido, CupomAplicado, CheckoutIniciado viram eventos. O time de dados cria projeções retroativas sobre meses de histórico ('quantos removeram o item ao ver o frete?') sem ter previsto a pergunta quando os eventos foram gravados.",
          tradeoff:
            "O valor está na análise, não na operação — se ninguém consome o histórico, pagou-se o custo inteiro do padrão para servir um carrinho que um JSON resolveria.",
        },
        {
          titulo: "Rastreamento e disputas em logística",
          cenario:
            "Uma transportadora enfrenta disputas: 'a caixa chegou violada', 'o entregador não passou aqui'. A posição atual do pacote não responde nada — a sequência de custódias, sim.",
          aplicacao:
            "Cada scan, transferência de custódia e foto de entrega é um evento imutável no stream da encomenda. Na disputa, o replay reconstitui a cadeia completa: quem tinha o pacote, quando, onde. Projeções alimentam o mapa em tempo real e o SLA por rota.",
          tradeoff:
            "Eventos nascem em dispositivos offline e chegam fora de ordem — o modelo precisa separar o tempo do fato do tempo da gravação, e as projeções, tolerar eventos atrasados.",
        },
      ],
    },
    {
      tipo: "anti-exemplo",
      titulo: "Guardar o estado em vez do evento",
      comoSeParece:
        "Existe uma tabela de eventos, o vocabulário está lá, mas o que se grava é uma fotografia do objeto depois da mudança. Você tem o histórico do **que ficou**, e não do **que aconteceu** — que é a única coisa que o padrão existia para dar.",
      codigo: { lang: "typescript", code: ANTI_EXEMPLO },
      sintomas: [
        { quando: "Ao investigar", efeito: "O histórico mostra que o status virou 'cancelado' e não diz por quê — a informação que motivou a mudança nunca foi gravada." },
        { quando: "Numa projeção nova", efeito: "Uma pergunta de negócio que surgiu depois não pode ser respondida sobre o passado, porque o dado necessário não está lá." },
        { quando: "Na auditoria", efeito: "Dois eventos consecutivos com o objeto inteiro obrigam a comparar campo a campo para descobrir o que mudou." },
      ],
      correcao:
        "O evento nomeia um fato do negócio no passado (`PedidoCanceladoPorFaltaDeEstoque`), não uma transição genérica (`PedidoAtualizado`), e carrega o que mudou mais o motivo. Se o nome do evento pudesse ser usado para qualquer alteração daquela entidade, ele ainda é estado disfarçado.",
    },
    {
      tipo: "armadilhas",
      itens: [
        {
          titulo: "Versionamento de eventos",
          texto:
            "Eventos gravados são para sempre — mas o negócio muda. Quando DinheiroSacado ganha o campo 'canal', os milhões de eventos v1 no log não ganham junto. Você vai conviver com todas as versões históricas: upcasters que convertem v1→v2 no replay, campos opcionais, e disciplina para nunca renomear/remover retroativamente. É o custo mais subestimado do padrão.",
        },
        {
          titulo: "GDPR e o direito ao esquecimento",
          texto:
            "'Apague meus dados' colide de frente com 'eventos nunca são apagados'. As saídas têm custo: crypto-shredding (dados pessoais cifrados por usuário; apagar a chave torna os eventos ilegíveis), segregar PII fora do log com referência, ou expurgo seletivo que quebra a imutabilidade. Decida ANTES de gravar o primeiro evento — retrofit disso em produção é brutal.",
        },
        {
          titulo: "Replay lento sem estratégia de snapshot",
          texto:
            "Reconstruir um agregado com 2 milhões de eventos a cada comando não escala — e o problema aparece tarde, quando os streams já cresceram. Defina desde cedo a política de snapshots (a cada N eventos ou por tempo), lembre que snapshot também versiona (mudou a estrutura do estado? invalide e regenere) e teste o replay completo periodicamente: um log que nunca foi reproduzido é um backup que nunca foi restaurado.",
        },
      ],
    },
    {
      tipo: "quando",
      usar: [
        "O histórico é requisito de negócio ou regulatório: auditoria completa, ledgers financeiros, rastreabilidade ponta a ponta.",
        "Você precisa de visões retroativas: estado em qualquer ponto do tempo, projeções novas sobre eventos antigos.",
        "O domínio já é orientado a eventos e combina com CQRS — o log alimenta read models e a integração entre serviços.",
      ],
      evitar: [
        "CRUDs em que só o estado atual importa — eventos, projeções e versionamento viram custo sem retorno.",
        "O time ainda não domina consistência eventual e modelagem de eventos — erros de modelagem ficam gravados para sempre.",
        "Forte exigência de apagamento de dados pessoais sem engenharia para crypto-shredding ou segregação de PII.",
      ],
    },
  ],
};
