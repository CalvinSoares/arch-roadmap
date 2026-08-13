import type { Conceito } from "@/shared/types/conceito";
import { gof } from "@/content/conceitos/_nascimento";

const MERMAID = `classDiagram
    class Pedido {
        -estado: EstadoPedido
        +avancar()
        +cancelar()
        +mudarPara(estado)
    }
    class EstadoPedido {
        <<interface>>
        +avancar(pedido)
        +cancelar(pedido)
    }
    class Novo {
        +avancar(pedido)
        +cancelar(pedido)
    }
    class Pago {
        +avancar(pedido)
        +cancelar(pedido)
    }
    class Enviado {
        +avancar(pedido)
        +cancelar(pedido)
    }
    Pedido o-- EstadoPedido : delega
    EstadoPedido <|.. Novo
    EstadoPedido <|.. Pago
    EstadoPedido <|.. Enviado`;

const CAMADAS = [
  { id: "cliente", titulo: "Cliente", descricao: "Chama operações no contexto, sem saber o estado atual" },
  {
    id: "contexto",
    titulo: "Contexto",
    descricao: "Guarda o estado atual e delega toda operação a ele",
    destaque: true,
  },
  { id: "estados", titulo: "Estados concretos", descricao: "Um objeto por estado: comportamento + transições" },
];

const EXEMPLOS = [
  {
    lang: "typescript" as const,
    code: `interface EstadoPedido {
  avancar(pedido: Pedido): void;
  cancelar(pedido: Pedido): void;
}

class Pedido {
  private estado: EstadoPedido = new Novo();
  mudarPara(estado: EstadoPedido): void { this.estado = estado; }
  avancar(): void { this.estado.avancar(this); }
  cancelar(): void { this.estado.cancelar(this); }
}

class Novo implements EstadoPedido {
  avancar(p: Pedido): void {
    console.log("Pagamento confirmado");
    p.mudarPara(new Pago());        // o ESTADO decide a transicao
  }
  cancelar(p: Pedido): void {
    console.log("Cancelado sem custo");
  }
}

class Pago implements EstadoPedido {
  avancar(p: Pedido): void {
    console.log("Despachado para o cliente");
    p.mudarPara(new Enviado());
  }
  cancelar(p: Pedido): void {
    console.log("Cancelado com estorno");
  }
}

class Enviado implements EstadoPedido {
  avancar(): void { console.log("Ja enviado - nada a avancar"); }
  cancelar(): void { console.log("Nao e possivel cancelar apos envio"); }
}`,
  },
  {
    lang: "python" as const,
    code: `from abc import ABC, abstractmethod

class EstadoPedido(ABC):
    @abstractmethod
    def avancar(self, pedido) -> None: ...
    @abstractmethod
    def cancelar(self, pedido) -> None: ...

class Pedido:
    def __init__(self):
        self.estado: EstadoPedido = Novo()

    def avancar(self):  self.estado.avancar(self)
    def cancelar(self): self.estado.cancelar(self)

class Novo(EstadoPedido):
    def avancar(self, p):
        print("Pagamento confirmado")
        p.estado = Pago()            # o ESTADO decide a transicao
    def cancelar(self, p):
        print("Cancelado sem custo")

class Pago(EstadoPedido):
    def avancar(self, p):
        print("Despachado para o cliente")
        p.estado = Enviado()
    def cancelar(self, p):
        print("Cancelado com estorno")

class Enviado(EstadoPedido):
    def avancar(self, p):
        print("Ja enviado - nada a avancar")
    def cancelar(self, p):
        print("Nao e possivel cancelar apos envio")`,
  },
];

const ANTI_EXEMPLO = `interface EstadoPedido {
  avancar(p: Pedido): void;
  cancelar(p: Pedido): void;
}

class Pedido {
  estado: EstadoPedido = new Novo();
  avancar() { this.estado.avancar(this); }
  cancelar() { this.estado.cancelar(this); }
}

// As classes de estado existem... e o cliente fura a maquina:
const pedido = new Pedido();
pedido.estado = new Enviado(); // pulou o pagamento

// Transicao invalida virou assignment. O State virou Strategy
// acidental: quem troca o estado e quem esta do lado de fora.`;

export const state: Conceito = {
  slug: "state",
  titulo: "State",
  categoria: "comportamental",
  resumo:
    "Transforma cada estado de um objeto em uma classe própria: o comportamento muda conforme o estado atual, e é o próprio estado que decide a próxima transição.",
  tags: ["maquina-de-estados", "transicoes", "polimorfismo", "gof"],
  dificuldade: "intermediario",
  tempoLeitura: 7,
  nasceu: gof(),
  ondeAparece: [
    {
      onde: "XState",
      explicacao:
        "A biblioteca inteira é este padrão: estados nomeados, transições declaradas, comportamento que muda com o estado.",
    },
    {
      onde: "O ciclo de uma Promise",
      explicacao:
        "Pendente, resolvida e rejeitada respondem diferente ao mesmo `.then()` — e a transição é de mão única.",
    },
  ],
  emUmaLinha: {
    lang: "typescript",
    code: `// Comportamento muda com o estado atual.
pedido.estado.pagar(pedido); // delega`,
  },
  custo: {
    indirecoes: 1,
    cobra: [
      "Uma classe por estado, mais a máquina que gerencia as transições entre elas",
      "Espalhar o comportamento por várias classes dificulta ver o fluxo completo num lugar só",
    ],
    naoValeSe:
      "há dois ou três estados com pouca lógica — um enum e um switch se leem melhor que uma classe por estado.",
  },
  relacionados: ["strategy", "observer"],
  problema: [
    "Um objeto se comporta diferente conforme sua situação — pedido novo pode cancelar de graça, pago cancela com estorno, enviado não cancela. Modelar isso com um campo status e switch/if em cada método espalha a máquina de estados pelo código inteiro.",
    "Cada estado novo exige revisitar todos esses switches; cada método novo, reescrever todos os ramos. Transições inválidas passam batido porque nada centraliza o que pode virar o quê.",
  ],
  solucao: [
    "Cada estado vira uma classe que implementa a mesma interface de operações. O contexto guarda o estado atual e delega tudo a ele — o comportamento certo emerge por polimorfismo, sem um if sequer.",
    "As transições moram nos próprios estados: ao concluir uma operação, o estado troca o ponteiro do contexto para o próximo estado. A máquina fica explícita: cada classe diz o que faz e para onde vai.",
  ],
  quandoUsar: [
    "O comportamento do objeto depende fortemente do estado, com 3+ estados e regras diferentes por operação.",
    "Os mesmos switch (status) se repetem em vários métodos — a máquina está espalhada.",
    "As transições têm regras próprias e você quer cada uma explícita e testável isoladamente.",
  ],
  quandoEvitar: [
    "Dois estados e meia dúzia de linhas — um boolean com if é mais honesto que quatro classes.",
    "A máquina é grande, plana e orientada a eventos/tempo — uma biblioteca de statecharts (XState, Spring Statemachine) ou uma tabela de transições declarativa expressa melhor.",
  ],
  mermaid: MERMAID,
  camadas: CAMADAS,
  exemplos: EXEMPLOS,
  blocos: [
    {
      tipo: "tldr",
      texto:
        "Cada estado do objeto vira uma classe com o comportamento daquele estado; o contexto só delega. Quem decide a próxima transição é o próprio estado — não o cliente, não um switch central.",
    },
    {
      tipo: "analogia",
      emoji: "🚦",
      titulo: "O semáforo",
      texto:
        "O mesmo semáforo se comporta diferente em cada cor: no verde, carros passam; no amarelo, atenção; no vermelho, todo mundo para. Ninguém de fora escolhe a próxima cor — é o próprio estado que sabe seu sucessor: verde sabe que vira amarelo, amarelo sabe que vira vermelho. O objeto é um só (o semáforo na esquina), mas quem responde a cada instante é o estado atual, e a transição já vem embutida nele.",
    },
    {
      tipo: "secao",
      id: "problema",
      titulo: "O problema",
      resumo: [
        "Um pedido novo cancela de graça; pago, cancela com estorno; enviado, não cancela. Com um campo status, cada método do pedido vira um switch — e a mesma escadinha de casos se repete em avancar(), cancelar(), estornar()...",
        "A máquina de estados existe, mas está espalhada e implícita: adicionar o estado 'em separação' significa caçar todos os switches do sistema, e nada garante que uma transição proibida não aconteça por um caminho esquecido.",
      ],
      extensao: [
        "A raiz do problema é organizar o código pelo eixo errado. O switch agrupa por operação (todos os comportamentos de cancelar juntos), mas a coesão real está no estado: 'tudo que um pedido pago pode fazer' pertence junto. O State reorganiza o código por estado — cada classe é uma linha da tabela de transições.",
        "A diferença para o Strategy é sutil na estrutura (ambos delegam a um objeto trocável) e enorme na intenção: no Strategy, o CLIENTE escolhe o algoritmo e as estratégias não se conhecem; no State, os estados conhecem uns aos outros e trocam a si mesmos — o cliente nem sabe qual está ativo. Strategy é escolha externa e estável; State é evolução interna e dinâmica.",
        "Nem toda máquina pede o padrão: para máquinas grandes, planas e dirigidas por eventos, uma tabela declarativa de transições ou uma biblioteca de statecharts costuma expressar melhor (visualização, guards, estados aninhados). O State em classes brilha quando cada estado carrega comportamento rico, não só um nome.",
      ],
    },
    {
      tipo: "ilustracao",
      arquetipo: "fluxo",
      atores: [
        { id: "cliente", label: "Cliente" },
        { id: "contexto", label: "Pedido (contexto)", destaque: true },
        { id: "novo", label: "Estado: Novo" },
        { id: "pago", label: "Estado: Pago" },
        { id: "enviado", label: "Estado: Enviado" },
      ],
      setas: [
        { label: "avancar()" },
        { label: "delega ao estado atual" },
        { label: "transiciona", tracejada: true },
        { label: "transiciona", tracejada: true },
      ],
      legenda:
        "O cliente sempre chama o contexto; o estado atual responde e, ao concluir, aponta o contexto para o próximo estado — a transição é decisão interna.",
    },
    {
      tipo: "camadas-nav",
      titulo: "Navegue pelas camadas",
      camadas: [
        {
          id: "contexto",
          titulo: "Contexto",
          curto: "guarda o estado atual e delega",
          detalhe:
            "É o objeto que o mundo conhece (Pedido, Conexão, Player). Mantém a referência ao estado atual, delega cada operação a ele e oferece mudarPara() para os estados trocarem o ponteiro. Não contém nenhum if de status.",
          exemplo: "avancar(): void { this.estado.avancar(this); }",
          seViolar:
            "um if (status === ...) dentro do contexto é a máquina vazando de volta — em pouco tempo os switches se multiplicam de novo.",
        },
        {
          id: "interface",
          titulo: "Interface de estado",
          curto: "as operações que variam por estado",
          detalhe:
            "Declara as operações cujo comportamento depende do estado (avancar, cancelar). Todos os estados a implementam — inclusive para dizer 'não posso': recusar também é comportamento.",
          exemplo: "interface EstadoPedido {\n  avancar(p: Pedido): void;\n  cancelar(p: Pedido): void;\n}",
          seViolar:
            "operações fora da interface tentam adivinhar o estado por fora (instanceof) e o polimorfismo que sustenta o padrão se perde.",
        },
        {
          id: "estados",
          titulo: "Estados concretos",
          curto: "comportamento + transição de cada estado",
          detalhe:
            "Cada classe implementa o comportamento do seu estado e decide as transições: ao confirmar pagamento, Novo troca o contexto para Pago. A tabela de transições fica distribuída, mas cada linha é explícita e testável sozinha.",
          exemplo: "avancar(p: Pedido) {\n  p.mudarPara(new Pago());\n}",
          seViolar:
            "se quem troca o estado é o cliente (pedido.setStatus('pago')), vira Strategy acidental — e transições inválidas voltam a ser possíveis.",
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
          titulo: "Rastreamento de encomendas em logística",
          cenario:
            "Uma encomenda passa por postada → em trânsito → saiu para entrega → entregue, com desvios (extraviada, devolvida). Cada situação permite ações diferentes: redirecionar só antes de sair para entrega; abrir disputa só após extravio.",
          aplicacao:
            "Cada situação é um estado que implementa redirecionar(), reportarProblema(), confirmarEntrega(). O scan do leitor de código de barras chama avancar() e o estado atual decide o sucessor — inclusive o desvio para Extraviada após N dias sem scan.",
          tradeoff:
            "Estados de exceção (extraviada, devolvida) multiplicam as combinações; sem disciplina, cada 'caso especial' novo tenta virar flag dentro de um estado existente em vez de estado próprio.",
        },
        {
          titulo: "Ciclo de vida de uma cobrança Pix",
          cenario:
            "Uma cobrança nasce ativa, pode ser paga, expirar ou ser removida pelo recebedor. Pagar uma cobrança expirada deve falhar; remover uma paga, também — e cada erro tem mensagem e código próprios.",
          aplicacao:
            "Ativa, Paga, Expirada e Removida implementam pagar(), remover(), consultar(). O webhook de pagamento chama cobranca.pagar(): se o estado é Ativa, transiciona para Paga e dispara a liquidação; se Expirada, responde o erro certo sem nenhum if no serviço.",
          tradeoff:
            "O estado precisa ser persistido e recarregado: mapear linha do banco → objeto de estado exige uma factory, e transições concorrentes (pagamento e expiração no mesmo instante) pedem lock otimista — o padrão não resolve concorrência sozinho.",
        },
        {
          titulo: "Player de vídeo em streaming",
          cenario:
            "O botão play/pause do player faz coisas diferentes conforme o momento: tocando pausa, pausado retoma, buffering ignora o clique, erro tenta recarregar.",
          aplicacao:
            "Tocando, Pausado, Buffering e ComErro implementam aoClicarPlay(), aoTerminarBuffer(), aoFalhar(). O evento de rede que enche o buffer chega ao estado Buffering, que decide voltar para Tocando — a UI só repassa eventos ao contexto.",
          tradeoff:
            "Eventos assíncronos podem chegar 'atrasados' para um estado que já mudou (o buffer terminou depois do usuário pausar) — cada estado precisa decidir conscientemente o que ignorar.",
        },
      ],
    },
    {
      tipo: "passos",
      titulo: "Como montar a máquina",
      passos: [
        {
          titulo: "Listar estados e operações",
          texto:
            "Quais situações o objeto vive e quais operações mudam de comportamento nelas. Isso vira a interface de estado.",
        },
        {
          titulo: "Uma classe por estado",
          texto:
            "Cada estado implementa as operações — inclusive para recusar. Recusar também é comportamento explícito.",
        },
        {
          titulo: "Delegar no contexto",
          texto:
            "O Pedido (ou Player) guarda o estado atual e só repassa. Nenhum `if (status === ...)` no contexto.",
        },
        {
          titulo: "Deixar o estado transicionar",
          texto:
            "Quem decide o próximo é o estado atual (`p.mudarPara(new Pago())`), não o cliente. Assignment externo fura a máquina.",
        },
      ],
    },
    {
      tipo: "anti-exemplo",
      titulo: "O State que o cliente troca na mão",
      comoSeParece:
        "Há classes Novo/Pago/Enviado e o contexto delega — mas `pedido.estado` é público e o chamador atribui o próximo estado. A máquina existe no diagrama e é ignorada no código.",
      codigo: { lang: "typescript", code: ANTI_EXEMPLO },
      sintomas: [
        {
          quando: "No fluxo feliz",
          efeito: "Dá para pular de Novo para Enviado sem pagar — transição inválida virou uma linha.",
        },
        {
          quando: "Na auditoria",
          efeito: "Não há registro de quem autorizou a mudança; o histórico da máquina some.",
        },
        {
          quando: "No teste",
          efeito: "É preciso lembrar de setar estados 'impossíveis' para cobrir bugs que a máquina deveria tornar incompiláveis ou impossíveis.",
        },
      ],
      correcao:
        "Esconda o ponteiro: só os estados concretos chamam `mudarPara`. O cliente chama `avancar()`/`cancelar()` e nunca escolhe o sucessor — senão virou Strategy com nome errado.",
    },
    {
      tipo: "refatoracao",
      cheiro:
        "O mesmo `if (status === ...)` repetido em cada método, e nenhum lugar sabendo quais transições são válidas.",
      inicio: { lang: "typescript", code: `class Pedido {
  status = "novo";

  pagar() {
    if (this.status === "cancelado") throw new Error("cancelado");
    if (this.status === "pago") throw new Error("ja pago");
    this.status = "pago";
  }

  enviar() {
    if (this.status !== "pago") throw new Error("nao pago");
    this.status = "enviado";
  }

  cancelar() {
    // Esqueceram de checar "enviado". Pedido entregue vira cancelado.
    if (this.status === "cancelado") throw new Error("ja cancelado");
    this.status = "cancelado";
  }
}` },
      passos: [
        {
          titulo: "Nomear os estados",
          motivo:
            "Enquanto o estado é `string`, o compilador não ajuda: `\"pagoo\"` é um valor válido. Um union fecha o conjunto e transforma typo em erro de compilação.",
          depois: { lang: "typescript", code: `type Status = "novo" | "pago" | "enviado" | "cancelado";

class Pedido {
  status: Status = "novo";
  // ... os ifs continuam iguais, mas agora sobre um conjunto fechado
}` },
        },
        {
          titulo: "Declarar as transições numa tabela",
          motivo:
            "Este é o passo que corrige o bug: a regra sai de dentro dos métodos e vira **dado**, num lugar só. O caso esquecido em `cancelar` deixa de ser possível, porque a tabela é exaustiva por construção.",
          depois: { lang: "typescript", code: `type Evento = "pagar" | "enviar" | "cancelar";

// A regra inteira, visivel de uma vez. Ausencia = transicao proibida.
const TRANSICOES: Record<Status, Partial<Record<Evento, Status>>> = {
  novo:      { pagar: "pago", cancelar: "cancelado" },
  pago:      { enviar: "enviado", cancelar: "cancelado" },
  enviado:   {},                      // nao cancela o que ja saiu
  cancelado: {},                      // estado final
};

class Pedido {
  status: Status = "novo";

  aplicar(evento: Evento) {
    const proximo = TRANSICOES[this.status][evento];
    if (!proximo) {
      throw new Error(\`nao da para \${evento} um pedido \${this.status}\`);
    }
    this.status = proximo;
  }
}` },
        },
        {
          titulo: "Derivar o que era duplicado",
          motivo:
            "Com a tabela como fonte única, perguntas que antes exigiam mais `if` — 'este botão deve aparecer?' — passam a ser respondidas por consulta. E a interface para de reimplementar a regra.",
          depois: { lang: "typescript", code: `class Pedido {
  status: Status = "novo";

  aplicar(evento: Evento) {
    const proximo = TRANSICOES[this.status][evento];
    if (!proximo) throw new TransicaoInvalida(this.status, evento);
    this.status = proximo;
  }

  // Derivado da tabela: a UI para de duplicar a regra em condicional.
  pode(evento: Evento): boolean {
    return TRANSICOES[this.status][evento] !== undefined;
  }

  get eFinal(): boolean {
    return Object.keys(TRANSICOES[this.status]).length === 0;
  }
}

// <button disabled={!pedido.pode("cancelar")}>Cancelar</button>` },
        },
      ],
      veredito:
        "Ganhou-se: a regra num lugar só, transição inválida impossível, e a interface derivando o que antes duplicava. Pagou-se: uma tabela a mais para manter, e o erro deixou de ser específico por método — `TransicaoInvalida` é genérica, então mensagens amigáveis exigem trabalho extra. Com dois estados e uma transição, a tabela é cerimônia.",
    },
    {
      tipo: "armadilhas",
      itens: [
        {
          titulo: "State para máquina de dois estados",
          texto:
            "Ativo/inativo com uma regrinha por lado não justifica interface + duas classes + contexto delegando. Um boolean com if é mais legível e mais barato. O padrão paga a partir de 3+ estados com comportamento realmente distinto por operação.",
        },
        {
          titulo: "A máquina fica invisível",
          texto:
            "Com as transições distribuídas pelas classes, ninguém vê a máquina inteira: para saber se Pago pode virar Cancelado é preciso ler Pago.cancelar(). Mantenha um diagrama da máquina junto do código (ou um teste que percorre todas as transições) — senão cada dev inventa uma transição nova sem perceber conflito.",
        },
        {
          titulo: "Estados compartilhados com dados de instância",
          texto:
            "Uma otimização comum é reusar instâncias de estado (singleton por estado, já que muitos não têm campos). Mas se um estado guarda dados da transação atual (tentativas, timestamps), compartilhá-lo entre contextos mistura dados de pedidos diferentes — um bug de concorrência clássico. Ou o estado é stateless e compartilhável, ou é criado por contexto: nunca os dois.",
        },
      ],
    },
    {
      tipo: "quando",
      usar: [
        "O comportamento do objeto depende fortemente do estado, com 3+ estados e regras diferentes por operação.",
        "Os mesmos switch (status) se repetem em vários métodos — a máquina está espalhada pelo código.",
        "As transições têm regras próprias e você quer cada uma explícita e testável isoladamente.",
      ],
      evitar: [
        "Dois estados e meia dúzia de linhas — um boolean com if é mais honesto que quatro classes.",
        "Máquinas grandes, planas e dirigidas por eventos — uma tabela de transições declarativa ou uma lib de statecharts expressa melhor.",
      ],
    },
  ],
};
