import type { Conceito } from "@/shared/types/conceito";
import { gof } from "@/content/conceitos/_nascimento";

const MERMAID = `classDiagram
    class Sujeito {
      +inscrever(o)
      +desinscrever(o)
      +notificar()
    }
    class Observador {
      <<interface>>
      +atualizar(estado)
    }
    class ObservadorConcreto {
      +atualizar(estado)
    }
    Sujeito o--> Observador : notifica
    Observador <|.. ObservadorConcreto`;

const CAMADAS = [
  { id: "fonte", titulo: "Fonte de estado", descricao: "Onde a mudança acontece" },
  {
    id: "sujeito",
    titulo: "Sujeito (lista de observadores)",
    descricao: "Registra e notifica — onde o padrão atua",
    destaque: true,
  },
  { id: "obs", titulo: "Observadores", descricao: "Reagem à notificação" },
  { id: "efeitos", titulo: "Efeitos (UI, log, cache)", descricao: "Resultado das reações" },
];

const EXEMPLOS = [
  {
    lang: "typescript" as const,
    code: `type Observador<T> = (estado: T) => void;

class Sujeito<T> {
  private observadores = new Set<Observador<T>>();
  inscrever(o: Observador<T>) { this.observadores.add(o); return () => this.observadores.delete(o); }
  notificar(estado: T) { this.observadores.forEach((o) => o(estado)); }
}

const preco = new Sujeito<number>();
const cancelar = preco.inscrever((p) => console.log("novo preço", p));
preco.notificar(42);  // "novo preço 42"
cancelar();`,
  },
  {
    lang: "python" as const,
    code: `class Sujeito:
    def __init__(self):
        self._observadores = []
    def inscrever(self, cb):
        self._observadores.append(cb)
        return lambda: self._observadores.remove(cb)
    def notificar(self, estado):
        for cb in list(self._observadores):
            cb(estado)

preco = Sujeito()
cancelar = preco.inscrever(lambda p: print("novo preço", p))
preco.notificar(42)  # novo preço 42
cancelar()`,
  },
];

const ANTI_EXEMPLO = `class Sujeito {
  private observadores: ((v: number) => void)[] = [];

  inscrever(o: (v: number) => void) {
    this.observadores.push(o);   // <- e para sair, como?
  }

  notificar(v: number) {
    this.observadores.forEach((o) => o(v));
  }
}

class Painel {
  constructor(private sujeito: Sujeito) {
    // A closure captura 'this'. Enquanto o sujeito viver,
    // este Painel inteiro fica vivo junto.
    sujeito.inscrever((v) => this.desenhar(v));
  }
  desenhar(v: number) { /* ... */ }
}

// Cada navegacao cria um Painel. Nenhum e coletado.
// Depois de 200 telas, sao 200 Paineis recebendo notificacao.`;

export const observer: Conceito = {
  slug: "observer",
  titulo: "Observer",
  categoria: "comportamental",
  resumo:
    "Define uma dependência um-para-muitos: quando um objeto muda de estado, todos os seus dependentes são notificados automaticamente.",
  tags: ["eventos", "gof", "pub-sub", "reatividade"],
  dificuldade: "intermediario",
  tempoLeitura: 7,
  nasceu: gof(
    "O MVC do Smalltalk-80 (1979) já fazia a view se inscrever no model para " +
      "ser notificada — o padrão tinha quinze anos quando ganhou nome."
  ),
  ondeAparece: [
    {
      onde: "addEventListener",
      explicacao:
        "Você registra interesse e é chamado quando acontece — sem perguntar de tempos em tempos.",
    },
    {
      onde: "EventEmitter do Node",
      explicacao:
        "`on` e `emit` são inscrição e notificação, com a lista de ouvintes por dentro.",
    },
    {
      onde: "RxJS",
      explicacao:
        "Observable e subscriber levam o padrão ao extremo, com composição de fluxos por cima.",
    },
    {
      onde: "Signals de Vue e Solid",
      explicacao:
        "A dependência é registrada na leitura, e a escrita notifica quem leu.",
    },
  ],
  emUmaLinha: {
    lang: "typescript",
    code: `// Inscrever devolve o cancelamento. Sem isso, vaza.
const cancelar = sujeito.inscrever((estado) => reagir(estado));`,
  },
  custo: {
    indirecoes: 1,
    cobra: [
      "A ordem de notificação deixa de ser garantida",
      "O rastro de execução some: quem disparou o efeito não aparece na pilha",
      "Todo inscrito precisa lembrar de cancelar",
    ],
    naoValeSe:
      "há um único interessado e ele é conhecido em tempo de compilação. Aí é uma chamada de função.",
  },
  relacionados: ["strategy", "factory-method"],
  problema: [
    "Vários objetos precisam reagir a mudanças em outro objeto, mas checar por mudança em loop (polling) é caro e acopla todos ao sujeito.",
    "Adicionar/remover interessados em tempo de execução sem alterar o objeto observado é difícil quando as dependências são fixas.",
  ],
  solucao: [
    "O 'sujeito' mantém uma lista de 'observadores' e expõe métodos para inscrever/desinscrever.",
    "Quando seu estado muda, ele percorre a lista e chama `notificar()` em cada observador — que reage por conta própria.",
  ],
  quandoUsar: [
    "Mudança em um objeto exige atualizar outros, e você não sabe quantos nem quais em tempo de compilação.",
    "Você quer baixo acoplamento entre quem emite e quem consome eventos.",
    "Base de sistemas reativos, UIs data-binding e filas de eventos.",
  ],
  quandoEvitar: [
    "A ordem de notificação importa e precisa ser garantida — Observer não define ordem.",
    "Cadeias longas de notificação podem virar cascatas difíceis de depurar.",
  ],
  mermaid: MERMAID,
  camadas: CAMADAS,
  exemplos: EXEMPLOS,
  blocos: [
    {
      tipo: "tldr",
      texto:
        "Um objeto (o sujeito) mantém a lista de interessados e os notifica a cada mudança de estado. Quem emite não conhece quem consome — e observadores entram e saem em tempo de execução.",
    },
    {
      tipo: "analogia",
      emoji: "📰",
      titulo: "Como assinar uma newsletter",
      texto:
        "Você se inscreve uma vez. Quando sai uma edição nova, todos os assinantes recebem automaticamente — e o jornal não precisa saber quem é cada um. Cancelar a inscrição para de receber. É exatamente isso que o Observer faz com objetos.",
    },
    {
      tipo: "secao",
      id: "problema",
      titulo: "O problema",
      resumo: [
        "Vários objetos precisam reagir quando outro muda de estado. Ficar checando em loop (polling) é caro e acopla todo mundo ao objeto observado.",
        "E você quer poder adicionar ou remover interessados em tempo de execução, sem mexer no objeto que emite as mudanças.",
      ],
      extensao: [
        "A raiz do problema é a direção da dependência. Sem o padrão, ou os consumidores ficam perguntando 'mudou? mudou?' (polling: CPU gasta à toa e latência entre a mudança e a reação), ou o objeto observado chama cada dependente pelo nome — e aí qualquer consumidor novo exige editar quem emite, violando o Aberto/Fechado. Observer inverte: o emissor conhece apenas uma interface de notificação, e a lista de quem escuta vira dado, não código.",
        "Há uma nuance clássica: push vs pull. No modelo push, o sujeito envia o estado junto da notificação (como nos exemplos abaixo); no pull, ele só avisa 'mudei' e cada observador busca o que precisa. Push é mais simples; pull evita mandar dado que ninguém usa e deixa cada observador ler só a fatia que lhe interessa.",
        "Compare com pub/sub via broker: no Observer o sujeito guarda a lista e chama os observadores diretamente, tudo in-process e síncrono por padrão. No pub/sub um mediador (canal, event bus, broker) fica no meio, e emissor e consumidor nem sabem da existência um do outro — é o Observer levado à escala distribuída, com custos de infraestrutura e entrega que o padrão original não tem.",
      ],
    },
    {
      tipo: "ilustracao",
      arquetipo: "fluxo",
      atores: [
        { id: "mudanca", label: "Mudança de estado" },
        { id: "sujeito", label: "Sujeito", destaque: true },
        { id: "notificar", label: "notificar()" },
        { id: "observadores", label: "Observadores" },
        { id: "efeitos", label: "Efeitos (UI, log, cache)" },
      ],
      setas: [
        { label: "dispara" },
        { label: "percorre a lista" },
        { label: "atualizar(estado)" },
        { label: "reagem", tracejada: true },
      ],
      legenda:
        "O sujeito não conhece ninguém pelo nome — só percorre a lista e avisa. Cada observador decide sozinho o próprio efeito.",
    },
    {
      tipo: "demo",
      titulo: "Veja funcionando",
      demo: "observer",
    },
    {
      tipo: "passos",
      titulo: "O fluxo, passo a passo",
      passos: [
        { titulo: "Inscrever", texto: "Cada observador se registra no sujeito (entra na lista)." },
        { titulo: "Mudar estado", texto: "Algo altera o estado do sujeito (ex.: novo preço)." },
        { titulo: "Notificar", texto: "O sujeito percorre a lista e chama atualizar() em cada um." },
        { titulo: "Reagir", texto: "Cada observador decide sozinho o que fazer com a novidade." },
      ],
    },
    {
      tipo: "camadas-nav",
      titulo: "Navegue pelas camadas",
      camadas: [
        {
          id: "fonte",
          titulo: "Fonte de estado",
          curto: "onde a mudança acontece",
          detalhe:
            "É o dado que muda: um preço, o status de um pedido, o valor de um campo. A fonte não precisa saber que existe alguém interessado — ela só altera o estado do sujeito. Manter essa separação é o que permite reaproveitar o mesmo mecanismo para qualquer tipo de mudança.",
          exemplo: "preco.notificar(42); // a fonte só empurra o novo estado",
          seViolar:
            "se os interessados lerem a fonte diretamente (polling), voltam o acoplamento e o custo de ficar perguntando — exatamente o que o padrão elimina.",
        },
        {
          id: "sujeito",
          titulo: "Sujeito (lista de observadores)",
          curto: "registra e notifica",
          detalhe:
            "Guarda a coleção de observadores e expõe inscrever/desinscrever — idealmente devolvendo uma função de cancelamento. Quando o estado muda, percorre a lista e chama cada um. É o coração do padrão: um-para-muitos com o 'muitos' definido em tempo de execução.",
          exemplo: "const cancelar = preco.inscrever((p) => atualizarTela(p));\ncancelar(); // sai da lista",
          seViolar:
            "se o sujeito conhecer os tipos concretos dos observadores e chamá-los pelo nome, cada consumidor novo exige editar o sujeito — o um-para-muitos vira acoplamento um-a-um.",
        },
        {
          id: "obs",
          titulo: "Observadores",
          curto: "reagem à notificação",
          detalhe:
            "Cada observador implementa a interface de atualização e decide o que fazer com a novidade. Devem ser rápidos e defensivos: a notificação costuma ser síncrona, então um observador lento segura todos os que vêm depois.",
          exemplo: 'preco.inscrever((p) => cache.invalidar("preco"));',
          seViolar:
            "um observador que lança exceção no meio da notificação pode impedir os demais de serem avisados — envolva cada chamada em tratamento de erro.",
        },
        {
          id: "efeitos",
          titulo: "Efeitos (UI, log, cache)",
          curto: "resultado das reações",
          detalhe:
            "Re-render de componente, linha de log, chave de cache invalidada, e-mail disparado. É onde o valor aparece — e onde mora o perigo: um efeito que altera outro sujeito dispara novas notificações e pode criar cadeias longas ou ciclos.",
          exemplo: "render(estado);\nlogger.info({ evento: \"preco-alterado\", estado });",
          seViolar:
            "efeito que emite evento que dispara efeito que emite evento — sem controle de profundidade ou batching, vira cascata impossível de depurar (ou loop infinito).",
        },
      ],
    },
    {
      tipo: "diagrama",
      titulo: "Estrutura (diagrama de classes)",
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
          titulo: "UI reativa: estado notifica componentes",
          cenario:
            "Numa SPA, o mesmo dado aparece em vários lugares — o contador do carrinho no header, a lista de itens e o resumo do checkout precisam refletir qualquer mudança na hora.",
          aplicacao:
            "O store é o sujeito; cada componente se inscreve no mount e re-renderiza ao ser notificado. É a base de Redux, Zustand, signals e do data-binding de frameworks reativos — você usa Observer todo dia sem escrever a classe Sujeito.",
          tradeoff:
            "Notificar a cada mudança pode re-renderizar demais; na prática entram seletores e memoização para cada componente reagir só à fatia de estado que consome.",
        },
        {
          titulo: "Notificações multi-canal",
          cenario:
            "Quando um pedido muda de status, o cliente deve receber e-mail, push e SMS — e o time quer adicionar WhatsApp sem mexer no fluxo do pedido.",
          aplicacao:
            "O serviço de pedidos emite 'StatusAlterado'; cada canal é um observador independente. Canal novo = observador novo, sem tocar em quem emite.",
          tradeoff:
            "Observadores in-process não sobrevivem a um restart: se o processo cair no meio da notificação, os canais restantes ficam sem aviso. Quando a entrega precisa de garantia, o passo seguinte é uma fila/broker.",
        },
        {
          titulo: "Invalidação de cache por evento",
          cenario:
            "Um cache acelera as leituras, mas serve dado velho quando a escrita acontece por outro caminho.",
          aplicacao:
            "Cada escrita notifica a mudança; um observador traduz o evento em chaves de cache a invalidar (ou atualiza o valor direto). O cache reage à mudança em vez de expirar no relógio.",
          tradeoff:
            "O mapeamento evento→chaves é manual e frágil: invalidar demais derruba o hit rate, invalidar de menos serve dado desatualizado.",
        },
      ],
    },
    {
      tipo: "anti-exemplo",
      titulo: "O Observer que vaza memória",
      comoSeParece:
        "Todo mundo lembra de se inscrever; quase ninguém lembra de sair. Como o sujeito guarda uma referência forte para cada observador, o objeto que deveria morrer continua vivo — e continua sendo notificado.",
      codigo: { lang: "typescript", code: ANTI_EXEMPLO },
      sintomas: [
        { quando: "Depois de horas", efeito: "A memória cresce sem teto e o processo é reiniciado pelo orquestrador — sem nenhum erro no log que aponte a causa." },
        { quando: "Na navegação", efeito: "Componentes já removidos da tela continuam reagindo e escrevendo em estado que não existe mais." },
        { quando: "Ao notificar", efeito: "O custo de cada evento cresce com o tempo, porque a lista só aumenta." },
      ],
      correcao:
        "`inscrever` devolve a função de cancelamento, e quem se inscreve é obrigado a chamá-la ao morrer — é o `return () => ...` do exemplo correto acima, e o `cleanup` do `useEffect`. Onde a linguagem permitir, referência fraca ajuda; disciplina de cancelamento resolve.",
    },
    {
      tipo: "refatoracao",
      cheiro:
        "A classe que muda o preço chamando, pelo nome, cada um dos quatro lugares que precisam reagir.",
      inicio: { lang: "typescript", code: `class Precos {
  constructor(
    private readonly vitrine: Vitrine,
    private readonly cache: Cache,
    private readonly auditoria: Auditoria,
    private readonly emails: Emails,
  ) {}

  atualizar(sku: string, preco: number) {
    this.salvar(sku, preco);

    // Toda reacao nova = editar esta classe e este metodo.
    this.vitrine.redesenhar(sku);
    this.cache.invalidar(sku);
    this.auditoria.registrar(sku, preco);
    this.emails.avisarInteressados(sku, preco);
  }
}` },
      passos: [
        {
          titulo: "Inverter a dependência",
          motivo:
            "`Precos` deixa de conhecer os quatro e passa a conhecer uma assinatura. Isto é o DIP: quem muda não sabe mais quem reage.",
          depois: { lang: "typescript", code: `type Ouvinte = (sku: string, preco: number) => void;

class Precos {
  private ouvintes: Ouvinte[] = [];

  inscrever(o: Ouvinte) {
    this.ouvintes.push(o);
  }

  atualizar(sku: string, preco: number) {
    this.salvar(sku, preco);
    this.ouvintes.forEach((o) => o(sku, preco));
  }
}` },
        },
        {
          titulo: "Devolver o cancelamento",
          motivo:
            "O passo anterior criou um vazamento: nada nunca sai da lista, e cada inscrito fica vivo enquanto `Precos` viver. **Inscrever tem que devolver como sair** — sem isso, o padrão trocou acoplamento por vazamento de memória.",
          depois: { lang: "typescript", code: `class Precos {
  private ouvintes = new Set<Ouvinte>();

  // Devolve o cancelamento. E o unico jeito de o inscrito poder morrer.
  inscrever(o: Ouvinte): () => void {
    this.ouvintes.add(o);
    return () => this.ouvintes.delete(o);
  }

  atualizar(sku: string, preco: number) {
    this.salvar(sku, preco);
    // copia a lista: um ouvinte pode se desinscrever durante a notificacao
    [...this.ouvintes].forEach((o) => o(sku, preco));
  }
}

const cancelar = precos.inscrever((sku) => cache.invalidar(sku));
// ao destruir o componente / encerrar o escopo:
cancelar();` },
        },
        {
          titulo: "Isolar a falha do ouvinte",
          motivo:
            "Falta o último detalhe, e ele é o que quebra em produção: um ouvinte que lança impede os seguintes de rodar. O e-mail falhando não pode cancelar a invalidação do cache.",
          depois: { lang: "typescript", code: `class Precos {
  private ouvintes = new Set<Ouvinte>();

  inscrever(o: Ouvinte): () => void {
    this.ouvintes.add(o);
    return () => this.ouvintes.delete(o);
  }

  atualizar(sku: string, preco: number) {
    this.salvar(sku, preco);

    for (const o of [...this.ouvintes]) {
      try {
        o(sku, preco);
      } catch (erro) {
        // Um ouvinte quebrado nao pode calar os outros. Mas engolir
        // em silencio esconde bug: registrar e obrigatorio.
        reportar("ouvinte de preco falhou", erro);
      }
    }
  }
}` },
        },
      ],
      veredito:
        "Ganhou-se: reação nova sem tocar em `Precos`, e cada ouvinte testável sozinho. Pagou-se: a ordem de notificação deixou de ser garantida, o rastro de execução ficou indireto (quem disparou não aparece na pilha), e todo inscrito passou a ter a obrigação de cancelar. Com um único interessado, conhecido em tempo de compilação, a chamada direta era mais clara.",
    },
    {
      tipo: "armadilhas",
      itens: [
        {
          titulo: "Vazamento de memória por não desinscrever",
          texto:
            "O sujeito guarda referência para cada observador. Um componente destruído que nunca se desinscreveu continua na lista: segue sendo notificado, executando efeito sobre UI morta e impedindo o garbage collector de liberá-lo. Sempre guarde a função de cancelamento e chame-a no teardown (ou use AbortSignal / referências fracas).",
        },
        {
          titulo: "Assumir ordem de notificação",
          texto:
            "O padrão não garante em que ordem os observadores são chamados. Código que depende de 'o observador A roda antes do B' funciona por acidente e quebra na primeira refatoração da lista. Se a ordem importa, torne-a explícita — prioridades, pipeline de handlers — ou repense se Observer é o padrão certo.",
        },
        {
          titulo: "Cascatas evento→evento→evento",
          texto:
            "Um observador que altera o estado de outro sujeito dispara nova rodada de notificações. Três níveis depois, ninguém sabe por que a tela re-renderizou cinco vezes — e um ciclo entre dois sujeitos trava tudo. Mantenha observadores sem efeitos que emitam eventos, agrupe mudanças (batching) e monitore a profundidade das cadeias.",
        },
      ],
    },
    {
      tipo: "quando",
      usar: [
        "Mudança em um objeto exige atualizar outros, e você não sabe quantos nem quais em tempo de compilação.",
        "Você quer baixo acoplamento entre quem emite e quem consome eventos.",
        "Base de sistemas reativos, UIs data-binding e filas de eventos.",
      ],
      evitar: [
        "A ordem de notificação importa e precisa ser garantida — Observer não define ordem.",
        "Cadeias longas de notificação podem virar cascatas difíceis de depurar.",
      ],
    },
  ],
};
