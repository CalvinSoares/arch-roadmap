import type { Conceito } from "@/shared/types/conceito";

const MERMAID = `sequenceDiagram
    participant C as Cliente
    participant CS as Command Service
    participant W as Write Store
    participant P as Projeção (evento)
    participant R as Read Store
    participant QS as Query Service
    C->>CS: enviar comando (criar/alterar)
    CS->>W: persistir mudança
    W-->>P: publica evento
    P->>R: atualiza read model
    C->>QS: consultar
    QS->>R: ler read model otimizado
    R-->>C: dados de leitura`;

const CAMADAS = [
  { id: "cliente", titulo: "Cliente", descricao: "Envia comandos e faz consultas" },
  {
    id: "command",
    titulo: "Command side",
    descricao: "Valida regras e persiste no write store — coração da mutação",
    destaque: true,
  },
  { id: "sincronizacao", titulo: "Sincronização", descricao: "Eventos/projeções alimentam a leitura" },
  { id: "query", titulo: "Query side", descricao: "Read models desnormalizados por tela" },
];

const EXEMPLOS = [
  {
    lang: "typescript" as const,
    code: `// Command side: recebe intenção, valida e persiste
interface Command { tipo: string; }
class CriarPedido implements Command {
  readonly tipo = "CriarPedido";
  constructor(public itens: string[]) {}
}

class CommandHandler {
  constructor(private writeStore: WriteStore, private bus: EventBus) {}
  async handle(cmd: CriarPedido): Promise<void> {
    const pedido = Pedido.novo(cmd.itens);      // regras de negócio
    await this.writeStore.salvar(pedido);
    this.bus.publicar({ tipo: "PedidoCriado", pedido });
  }
}

// Query side: lê de um read model desnormalizado
class ConsultaPedidos {
  constructor(private readStore: ReadStore) {}
  porCliente(clienteId: string) {
    return this.readStore.listar(clienteId);    // sem regras, só leitura
  }
}`,
  },
  {
    lang: "java" as const,
    code: `// Command side
record CriarPedido(List<String> itens) {}

class CommandHandler {
    private final WriteStore writeStore;
    private final EventBus bus;
    CommandHandler(WriteStore ws, EventBus bus) { this.writeStore = ws; this.bus = bus; }
    void handle(CriarPedido cmd) {
        Pedido pedido = Pedido.novo(cmd.itens());   // regras de negócio
        writeStore.salvar(pedido);
        bus.publicar(new PedidoCriado(pedido));
    }
}

// Query side: lê read model otimizado
class ConsultaPedidos {
    private final ReadStore readStore;
    ConsultaPedidos(ReadStore rs) { this.readStore = rs; }
    List<PedidoView> porCliente(String clienteId) {
        return readStore.listar(clienteId);         // só leitura
    }
}`,
  },
];

export const cqrs: Conceito = {
  slug: "cqrs",
  titulo: "CQRS (Command Query Responsibility Segregation)",
  categoria: "arquitetura",
  resumo:
    "Separa o modelo de escrita (commands) do modelo de leitura (queries), podendo usar stores e serviços distintos otimizados para cada lado.",
  tags: ["cqs", "event-sourcing", "escala", "read-model"],
  dificuldade: "avancado",
  tempoLeitura: 9,
  nasceu: {
    quando: {
      rotulo: "c. 2010",
      ano: 2010,
      precisao: "disputada",
      disputa:
        "Greg Young é quem cunha e populariza o termo entre 2009 e 2010, em " +
        "palestras e no blog; não há um marco único de publicação. Fowler " +
        "descreve o padrão em 2011, o que muita gente cita como origem.",
    },
    fonte:
      "Greg Young — palestras e posts sobre CQRS, 2009–2010; " +
      "Martin Fowler — *CQRS*, bliki, 2011",
    precursor:
      "É a separação de CQS (Meyer, 1988) levada da assinatura do método " +
      "para a arquitetura inteira — dois modelos, não só dois tipos de método.",
  },
  ondeAparece: [
    {
      onde: "réplica de leitura",
      explicacao:
        "Escritas vão para o primário e as consultas para réplicas: dois caminhos com modelos e escala próprios para ler e para gravar.",
    },
    {
      onde: "Elasticsearch ao lado do banco",
      explicacao:
        "O banco transacional guarda a verdade das escritas e um índice de busca serve as leituras — modelos de leitura e escrita separados de fato.",
    },
    {
      onde: "materialized views",
      explicacao:
        "A view materializada é um modelo de leitura pré-computado, alimentado a partir das escritas e otimizado só para consultar rápido.",
    },
  ],
  emUmaLinha: {
    lang: "typescript",
    code: `// Modelo de escrita ≠ modelo de leitura.
await comandos.criarPedido(cmd);
const view = await leituras.pedidoDetalhe(id);`,
  },
  custo: {
    indirecoes: 2,
    cobra: [
      "Dois modelos a manter, de escrita e de leitura, que podem divergir enquanto sincronizam",
      "A leitura passa a ser eventualmente consistente em relação à escrita",
    ],
    naoValeSe:
      "leitura e escrita cabem no mesmo modelo sem se atrapalhar — separar aí dobra o trabalho sem resolver gargalo nenhum.",
  },
  relacionados: ["cqs", "saga", "hexagonal"],
  problema: [
    "Um único modelo que serve leitura e escrita acaba sendo um mau compromisso para os dois: escrita pede normalização e invariantes; leitura pede dados agregados, desnormalizados e rápidos.",
    "Leitura e escrita escalam de formas distintas — amarradas ao mesmo modelo, uma prejudica a outra.",
  ],
  solucao: [
    "O command side recebe intenções de mudança, aplica regras e persiste no modelo de escrita. O query side atende consultas a partir de read models desnormalizados, moldados por tela.",
    "Os lados podem viver em stores diferentes; o read model é atualizado a partir do write model — normalmente via eventos, com consistência eventual.",
  ],
  quandoUsar: [
    "Leitura e escrita têm requisitos de modelo, carga ou escala muito diferentes.",
    "Há muitas visões de leitura distintas sobre os mesmos dados de escrita.",
    "Combina com Event Sourcing, integração por eventos ou domínios complexos (DDD).",
  ],
  quandoEvitar: [
    "CRUDs e domínios simples — a duplicação de modelos vira complexidade sem retorno.",
    "Quando a leitura precisa refletir a escrita imediatamente, sempre.",
  ],
  mermaid: MERMAID,
  camadas: CAMADAS,
  exemplos: EXEMPLOS,
  blocos: [
    {
      tipo: "tldr",
      texto:
        "Escrever e ler são trabalhos diferentes: comandos passam por regras e vão para o modelo de escrita; consultas leem read models desnormalizados, atualizados por projeções — geralmente com consistência eventual.",
    },
    {
      tipo: "analogia",
      emoji: "🍽️",
      titulo: "A cozinha e o salão do restaurante",
      texto:
        "O garçom anota o pedido e o entrega à cozinha (command side): lá existem regras, ordem e controle. O salão consulta o painel de 'pedidos prontos' (read model): uma visão simples, feita para ser lida de relance. Ninguém entra na cozinha para saber se o prato saiu — e o painel atualiza alguns segundos depois do fogão (consistência eventual).",
    },
    {
      tipo: "secao",
      id: "problema",
      titulo: "O problema",
      resumo: [
        "Um único modelo servindo leitura e escrita é um mau compromisso para os dois lados: as regras de escrita pedem normalização, invariantes e consistência forte; as telas de leitura pedem dados agregados, desnormalizados e rápidos.",
        "E os dois lados escalam diferente — quase sempre há muito mais leituras. Presos ao mesmo modelo e à mesma base, otimizar um tende a piorar o outro.",
      ],
      extensao: [
        "Os sintomas aparecem cedo: joins caros para montar telas, caches invalidados a cada escrita, índices de leitura que deixam o INSERT lento, e um ORM tentando servir dois senhores.",
        "Não confunda com CQS. CQS (Bertrand Meyer) é um princípio de nível de método: um método ou é comando (muda estado) ou é query (retorna dado) — nunca ambos. CQRS eleva a mesma ideia à arquitetura: modelos, serviços e possivelmente bancos inteiros separados por responsabilidade. CQS é sempre saudável e de graça; CQRS é uma decisão arquitetural com custo real.",
        "O preço principal do CQRS é a consistência eventual: entre a escrita e a projeção existe uma janela em que a leitura está desatualizada. Todo o design de UX e de contratos precisa assumir essa janela — de 'seu pedido está sendo processado' a versões/etags.",
      ],
    },
    {
      tipo: "ilustracao",
      arquetipo: "fluxo",
      atores: [
        { id: "cmd", label: "Comando" },
        { id: "write", label: "Write model", destaque: true },
        { id: "evento", label: "Evento / Projeção" },
        { id: "read", label: "Read model" },
        { id: "query", label: "Consulta" },
      ],
      setas: [
        { label: "valida regras" },
        { label: "publica" },
        { label: "atualiza", tracejada: true },
        { label: "serve" },
      ],
      legenda:
        "O caminho da escrita e o da leitura só se encontram na projeção — cada lado otimizado para o próprio trabalho.",
    },
    {
      tipo: "demo",
      titulo: "Veja a consistência eventual acontecendo",
      demo: "cqrs",
    },
    {
      tipo: "camadas-nav",
      titulo: "Navegue pelos lados",
      camadas: [
        {
          id: "command",
          titulo: "Command side (escrita)",
          curto: "intenções passam por regras",
          detalhe:
            "Recebe comandos ('criar pedido', 'alterar endereço'), valida invariantes de negócio e persiste no write store — normalizado e consistente. É o único lugar do sistema autorizado a mudar estado.",
          exemplo: "commandHandler.handle(new CriarPedido(itens));",
          seViolar:
            "se a tela escrever direto no banco, as invariantes deixam de valer e o read model diverge sem ninguém perceber.",
        },
        {
          id: "sincronizacao",
          titulo: "Projeção (sincronização)",
          curto: "eventos alimentam a leitura",
          detalhe:
            "Cada mudança confirmada vira evento ('PedidoCriado'); projetores consomem esses eventos e atualizam os read models. Pode ser síncrona (mesma transação) ou assíncrona (fila) — a assíncrona escala mais e cria a janela de consistência eventual.",
          exemplo: 'bus.on("PedidoCriado", (e) => readStore.upsert(view(e)));',
          seViolar:
            "projeção sem idempotência ou sem replay → um evento reprocessado corrompe o read model, e não há fonte para reconstruí-lo.",
        },
        {
          id: "query",
          titulo: "Query side (leitura)",
          curto: "read models por tela",
          detalhe:
            "Consultas leem estruturas desnormalizadas moldadas para cada visão (lista do cliente, dashboard, busca). Sem regras de negócio, sem joins — no limite, cada tela tem seu próprio read model, até em outra tecnologia (cache, índice de busca).",
          exemplo: "consultaPedidos.porCliente(id); // SELECT simples, sem join",
          seViolar:
            "regra de negócio na consulta → decisões tomadas sobre dados possivelmente defasados e lógica duplicada entre os lados.",
        },
      ],
    },
    {
      tipo: "diagrama",
      titulo: "Fluxo completo (sequência)",
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
          titulo: "Dashboard pesado sobre operação transacional",
          cenario:
            "Um marketplace tem checkout transacional e um painel do vendedor com agregações (vendas por dia, top produtos, funil).",
          aplicacao:
            "As escritas seguem no modelo normalizado; projeções alimentam tabelas agregadas por painel. O dashboard lê pré-calculado em milissegundos, sem competir com o checkout.",
          tradeoff:
            "Os números do painel podem atrasar alguns segundos — aceitável para analytics, inaceitável para saldo; escolha por visão.",
        },
        {
          titulo: "Busca com tecnologia dedicada",
          cenario:
            "O catálogo vive em SQL, mas a busca precisa de relevância, facetas e typo-tolerance.",
          aplicacao:
            "Eventos de produto projetam para um índice (ex.: OpenSearch/Meilisearch). O command side não sabe que a busca existe; o read model é um índice inteiro em outra tecnologia.",
          tradeoff:
            "Mais uma peça para operar e reindexar; o replay de eventos vira a ferramenta de reconstrução.",
        },
        {
          titulo: "Auditoria e Event Sourcing",
          cenario:
            "Um sistema financeiro precisa provar como cada saldo chegou ao valor atual.",
          aplicacao:
            "Com CQRS o passo para Event Sourcing é curto: o write store passa a ser o log de eventos, e todos os read models (saldo, extrato, relatórios) são projeções reconstruíveis do log.",
          tradeoff:
            "Event Sourcing amplifica custos (versionamento de eventos, replay, GDPR) — só vale onde o histórico é requisito, não luxo.",
        },
      ],
    },
    {
      tipo: "armadilhas",
      itens: [
        {
          titulo: "CQRS em CRUD simples",
          texto:
            "Duplicar modelos, handlers e projeções para um cadastro básico só multiplica arquivos. Se um modelo único serve bem os dois lados, aplique apenas CQS nos métodos e siga em frente.",
        },
        {
          titulo: "Fingir que a leitura é imediata",
          texto:
            "UI que lê logo após escrever e espera ver o dado novo quebra com projeção assíncrona. Desenhe para a janela: confirme com o resultado do comando, use 'processando…', ou leia a própria resposta da escrita.",
        },
        {
          titulo: "Read model como cópia 1:1",
          texto:
            "Projetar o read model idêntico ao write model desperdiça o padrão — o ganho vem de moldar cada visão à tela que a consome. Cópia espelhada é só replicação com passos extras.",
        },
      ],
    },
    {
      tipo: "quando",
      usar: [
        "Leitura e escrita têm requisitos de modelo, carga ou escala muito diferentes.",
        "Há muitas visões de leitura distintas sobre os mesmos dados de escrita.",
        "Combina com Event Sourcing, integração por eventos ou domínios complexos (DDD).",
      ],
      evitar: [
        "CRUDs e domínios simples — a duplicação de modelos vira complexidade sem retorno.",
        "Quando toda leitura precisa refletir a escrita imediatamente (consistência forte ponta a ponta).",
      ],
    },
  ],
};
