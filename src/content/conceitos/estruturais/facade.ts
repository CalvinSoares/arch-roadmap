import type { Conceito } from "@/shared/types/conceito";
import { gof } from "@/content/conceitos/_nascimento";

const MERMAID = `classDiagram
    class CheckoutFacade {
        +finalizarPedido(pedido)
    }
    class Estoque {
        +reservar(itens)
    }
    class Pagamento {
        +cobrar(valor)
    }
    class Frete {
        +agendar(endereco)
    }
    class Notificacao {
        +confirmar(cliente)
    }
    CheckoutFacade --> Estoque : usa
    CheckoutFacade --> Pagamento : usa
    CheckoutFacade --> Frete : usa
    CheckoutFacade --> Notificacao : usa`;

const CAMADAS = [
  { id: "cliente", titulo: "Cliente", descricao: "Chama uma operação de alto nível e pronto" },
  {
    id: "facade",
    titulo: "Facade",
    descricao: "Um ponto de entrada que orquestra o subsistema — coração do padrão",
    destaque: true,
  },
  { id: "subsistema", titulo: "Subsistema", descricao: "Estoque, pagamento, frete, notificação — cada peça no seu ritmo" },
];

const EXEMPLOS = [
  {
    lang: "typescript" as const,
    code: `// Subsistema: cada peça tem sua propria API, cheia de detalhes
class Estoque {
  reservar(itens: string[]): string { return "res-42"; }
}
class Pagamento {
  cobrar(valor: number): string { return "pay-99"; }
}
class Frete {
  agendar(endereco: string): Date { return new Date(); }
}
class Notificacao {
  confirmar(email: string, previsao: Date): void {}
}

// Facade: uma operacao de alto nivel esconde a coreografia
class CheckoutFacade {
  constructor(
    private estoque = new Estoque(),
    private pagamento = new Pagamento(),
    private frete = new Frete(),
    private notificacao = new Notificacao(),
  ) {}

  finalizarPedido(itens: string[], valor: number, endereco: string, email: string): void {
    const reserva = this.estoque.reservar(itens);
    const cobranca = this.pagamento.cobrar(valor);
    const previsao = this.frete.agendar(endereco);
    this.notificacao.confirmar(email, previsao);
    console.log("Pedido ok:", reserva, cobranca);
  }
}

// Cliente: uma chamada, zero conhecimento do subsistema
new CheckoutFacade().finalizarPedido(["sku-1"], 150, "Rua A, 10", "ana@ex.com");`,
  },
  {
    lang: "python" as const,
    code: `# Subsistema: cada peca com sua propria API
class Estoque:
    def reservar(self, itens): return "res-42"

class Pagamento:
    def cobrar(self, valor): return "pay-99"

class Frete:
    def agendar(self, endereco): return "2026-08-12"

class Notificacao:
    def confirmar(self, email, previsao): pass

# Facade: um ponto de entrada esconde a coreografia
class CheckoutFacade:
    def __init__(self):
        self._estoque = Estoque()
        self._pagamento = Pagamento()
        self._frete = Frete()
        self._notificacao = Notificacao()

    def finalizar_pedido(self, itens, valor, endereco, email):
        reserva = self._estoque.reservar(itens)
        cobranca = self._pagamento.cobrar(valor)
        previsao = self._frete.agendar(endereco)
        self._notificacao.confirmar(email, previsao)
        print(f"Pedido ok: {reserva} {cobranca}")

# Cliente: uma chamada, zero conhecimento do subsistema
CheckoutFacade().finalizar_pedido(["sku-1"], 150, "Rua A, 10", "ana@ex.com")`,
  },
];

const ANTI_EXEMPLO = `import type { PgResult, PgError } from "pg";
import type { S3Object } from "@aws-sdk/client-s3";

class FachadaDePedido {
  // Parece simples... e devolve o tipo do driver do banco.
  async buscar(id: string): Promise<PgResult> { /* ... */ }

  // ... e aceita o tipo do SDK da AWS.
  async anexar(id: string, obj: S3Object): Promise<void> { /* ... */ }

  // ... e deixa escapar o erro do driver.
  async pagar(id: string): Promise<void> {
    try { /* ... */ } catch (e) { throw e as PgError; }
  }
}

// Quem usa a fachada agora importa 'pg' e o SDK da AWS.
// Trocar Postgres por outro banco continua tocando a aplicacao inteira —
// exatamente o que a fachada prometia evitar.`;

export const facade: Conceito = {
  slug: "facade",
  titulo: "Facade",
  categoria: "estrutural",
  resumo:
    "Oferece uma interface simples e de alto nível para um subsistema complexo, escondendo a coreografia entre as peças atrás de um único ponto de entrada.",
  tags: ["simplificacao", "subsistema", "ponto-de-entrada", "gof"],
  dificuldade: "iniciante",
  tempoLeitura: 5,
  nasceu: gof(),
  ondeAparece: [
    {
      onde: "fetch",
      explicacao:
        "Uma função esconde DNS, TLS, connection pooling, redirecionamento e parsing de resposta.",
    },
    {
      onde: "Um ORM",
      explicacao:
        "`user.save()` no lugar de montar transação, SQL, binding de parâmetro e tratamento de erro.",
    },
  ],
  emUmaLinha: {
    lang: "typescript",
    code: `// Uma chamada no lugar de seis, com os tipos que sao seus.
await pedidos.confirmar(pedidoId);`,
  },
  custo: {
    indirecoes: 1,
    cobra: [
      "Cada operação nova do subsistema precisa ser exposta de novo",
      "Recursos legítimos ficam inacessíveis até alguém adicioná-los à fachada",
    ],
    naoValeSe:
      "o subsistema já tem uma interface pequena e estável. Fachada sobre fachada só adiciona um salto.",
  },
  relacionados: ["adapter", "decorator"],
  problema: [
    "Para completar uma operação de negócio o cliente precisa conhecer meia dúzia de classes do subsistema, a ordem certa de chamada e os detalhes de cada uma — e esse conhecimento se repete em todo lugar que dispara a operação.",
    "O acoplamento se espalha: qualquer mudança interna no subsistema (uma classe renomeada, um passo novo) quebra todos os clientes que orquestravam as peças na mão.",
  ],
  solucao: [
    "A Facade é uma classe que expõe operações de alto nível ('finalizar pedido') e, por dentro, coordena as peças do subsistema na ordem certa. O cliente fala com uma interface pequena e estável.",
    "O subsistema não muda nem sabe da facade — e continua acessível diretamente para quem precisar de controle fino. A facade é uma porta conveniente, não uma prisão.",
  ],
  quandoUsar: [
    "Uma operação de negócio exige coordenar várias classes numa ordem específica, e vários clientes repetem essa coreografia.",
    "Você quer isolar o resto do sistema de uma biblioteca ou subsistema complexo (um ffmpeg, um SDK verboso).",
    "Definir a fronteira pública de um módulo/pacote: fora se fala só com a facade.",
  ],
  quandoEvitar: [
    "O subsistema já é simples — a facade vira só um repasse burocrático de chamadas.",
    "Os clientes precisam do controle fino que a facade esconde; forçá-los a passar por ela gera métodos com dezenas de parâmetros.",
  ],
  mermaid: MERMAID,
  camadas: CAMADAS,
  exemplos: EXEMPLOS,
  blocos: [
    {
      tipo: "tldr",
      texto:
        "Um subsistema com muitas peças ganha um ponto de entrada único com operações de alto nível: o cliente chama 'finalizarPedido' e a facade coordena estoque, pagamento, frete e notificação por dentro.",
    },
    {
      tipo: "analogia",
      emoji: "🛎️",
      titulo: "A recepcionista do hotel",
      texto:
        "No hotel você não liga para a governança pedir toalhas, para o restaurante reservar mesa e para a central de táxis marcar corrida — você liga para a recepção, e um balcão só resolve tudo. A recepcionista conhece cada setor, a ordem das coisas e os ramais certos; você conhece um número. E se um dia você quiser negociar direto com o chef, o restaurante continua lá — a recepção é conveniência, não muralha.",
    },
    {
      tipo: "secao",
      id: "problema",
      titulo: "O problema",
      resumo: [
        "Subsistemas crescem: finalizar um pedido envolve estoque, pagamento, frete e notificação, cada um com sua API e seus pré-requisitos. Sem um ponto de entrada, cada cliente reimplementa essa coreografia.",
        "O resultado é acoplamento espalhado: o checkout web, o app e o job de recompra conhecem as mesmas seis classes — e qualquer mudança interna quebra os três.",
      ],
      extensao: [
        "A raiz é a falta de uma fronteira: sem facade, a 'interface pública' do subsistema é a soma de todas as suas classes, e a Lei de Deméter morre no cliente — que navega objeto por objeto para montar a operação. O conhecimento sobre COMO o subsistema funciona vaza para quem só queria USÁ-LO.",
        "Não confunda com Adapter: o Adapter TRADUZ uma interface existente para outra que o cliente espera (contratos incompatíveis, geralmente 1-para-1); a Facade SIMPLIFICA — cria uma interface nova, menor e de nível mais alto sobre várias peças (1-para-muitos). Adapter é sobre compatibilidade; Facade é sobre conveniência.",
        "Também não é um Mediator: a facade só conhece o subsistema e o coordena de fora — as peças não sabem dela. No Mediator, os colegas conhecem e conversam através do mediador. E note o parentesco com camadas de serviço: um application service em DDD é, na prática, uma facade sobre o domínio.",
      ],
    },
    {
      tipo: "ilustracao",
      arquetipo: "estrutura",
      blocos: [
        { id: "cliente", label: "Cliente", nota: "conhece só finalizarPedido()" },
        {
          id: "facade",
          label: "CheckoutFacade",
          nota: "a única porta de entrada",
          destaque: true,
          filhos: [
            { id: "estoque", label: "Estoque", nota: "1. reserva os itens" },
            { id: "pagamento", label: "Pagamento", nota: "2. cobra" },
            { id: "frete", label: "Frete", nota: "3. agenda a entrega" },
          ],
        },
      ],
      legenda:
        "Os três subsistemas ficam atrás da facade, não em fila: ela chama cada um na ordem certa, e nenhum deles conhece os outros. O cliente enxerga uma chamada só.",
    },
    {
      tipo: "passos",
      titulo: "O fluxo, passo a passo",
      passos: [
        { titulo: "Identificar a coreografia", texto: "Liste as peças e a ordem que o cliente hoje repete à mão." },
        { titulo: "Criar a operação de alto nível", texto: "A facade expõe algo como finalizarPedido() com vocabulário de negócio." },
        { titulo: "Orquestrar por dentro", texto: "Ela chama estoque, pagamento, frete… na ordem certa e traduz erros." },
        { titulo: "Cliente fala só com a porta", texto: "Uma chamada; o subsistema continua acessível a quem precisa de controle fino." },
      ],
    },
    {
      tipo: "camadas-nav",
      titulo: "Navegue pelas camadas",
      camadas: [
        {
          id: "cliente",
          titulo: "Cliente",
          curto: "pede a operação de negócio",
          detalhe:
            "Chama a facade com a intenção completa ('finalizar pedido com estes itens') e recebe o resultado de alto nível. Não importa, não conhece e não instancia as peças internas.",
          exemplo: "checkout.finalizarPedido(itens, 150, endereco, email);",
          seViolar:
            "se o cliente importa uma classe interna 'só desta vez', o acoplamento que a facade eliminou volta a se espalhar.",
        },
        {
          id: "facade",
          titulo: "Facade",
          curto: "um ponto de entrada, operações de alto nível",
          detalhe:
            "Conhece as peças do subsistema, a ordem das chamadas e as conversões entre elas. Expõe poucas operações com nomes de negócio. Deve ser fina: coordena, mas não abriga regra de domínio própria.",
          exemplo: "finalizarPedido() { estoque.reservar(); pagamento.cobrar(); frete.agendar(); }",
          seViolar:
            "facade com regra de negócio própria vira god object: o subsistema esvazia e tudo passa a depender de uma classe gigante.",
        },
        {
          id: "subsistema",
          titulo: "Subsistema",
          curto: "as peças reais, intocadas",
          detalhe:
            "Estoque, pagamento, frete e notificação continuam com suas APIs completas e independentes. Não sabem que a facade existe — e podem ser usadas diretamente por quem precisa de controle fino.",
          exemplo: "// acesso direto continua possivel\nnew Frete().agendar(endereco);",
          seViolar:
            "se o subsistema começa a depender da facade (chamadas de volta), nasce um ciclo e a fronteira desaba.",
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
          titulo: "SDK de gateway de pagamentos",
          cenario:
            "Cobrar um cartão envolve tokenização, análise antifraude, autorização na adquirente e captura — quatro serviços com protocolos próprios que nenhum lojista quer conhecer.",
          aplicacao:
            "O SDK expõe uma facade: pagamentos.cobrar(cartao, valor). Por dentro, tokeniza, consulta o antifraude, autoriza e captura na ordem certa. A 'developer experience' de gateways como Stripe é essencialmente uma boa facade.",
          tradeoff:
            "Casos avançados (captura parcial, pré-autorização longa) não cabem na operação simples — o SDK precisa expor também a API granular, senão vira camisa de força.",
        },
        {
          titulo: "Processamento de vídeo em streaming",
          cenario:
            "Uma plataforma de vídeo converte uploads: demux, decodificação, filtros, re-encoding em múltiplas resoluções, empacotamento HLS — o ffmpeg tem centenas de flags para isso.",
          aplicacao:
            "Uma VideoFacade expõe transcodificar(arquivo, perfil). Os perfis ('720p-web', '4k-tv') encapsulam as combinações de flags validadas pelo time de mídia; o resto do sistema nunca vê uma flag do ffmpeg.",
          tradeoff:
            "Cada necessidade nova vira pedido de perfil novo ao time dono da facade — a conveniência centraliza também a fila de manutenção.",
        },
        {
          titulo: "Onboarding em banco digital",
          cenario:
            "Abrir uma conta exige KYC (documento + selfie), consulta a bureaus, criação da conta no core bancário, emissão de cartão e chave Pix — cinco sistemas, alguns de fornecedores externos.",
          aplicacao:
            "Uma OnboardingFacade expõe abrirConta(dadosCliente) e coordena os cinco passos, traduzindo erros de cada fornecedor em um resultado único. O app conversa com uma operação; a complexidade regulatória mora atrás do balcão.",
          tradeoff:
            "Fluxos longos e parcialmente assíncronos (KYC pode levar horas) não cabem numa chamada síncrona — a facade precisa devolver estados intermediários, e a 'interface simples' fica menos simples.",
        },
      ],
    },
    {
      tipo: "anti-exemplo",
      titulo: "A fachada que vaza o que deveria esconder",
      comoSeParece:
        "A fachada simplifica a chamada, mas devolve — ou aceita — os tipos do subsistema que ela existia para esconder. Quem usa continua acoplado ao que estava atrás; só o caminho ficou mais curto.",
      codigo: { lang: "typescript", code: ANTI_EXEMPLO },
      sintomas: [
        { quando: "Ao trocar a dependência", efeito: "A migração toca todos os chamadores, porque os tipos do subsistema entraram na assinatura pública." },
        { quando: "No teste", efeito: "Simular a fachada exige construir objetos do driver real, o que é quase tão trabalhoso quanto usar o driver." },
        { quando: "No `package.json`", efeito: "A dependência que deveria ser interna aparece como dependência direta de módulos que nunca deveriam conhecê-la." },
      ],
      correcao:
        "A fronteira da fachada é a assinatura, não a quantidade de linhas economizadas. Tipos de entrada, de saída **e de erro** precisam ser seus. Se traduzir tudo parecer caro demais, o problema pode ser que ali não cabia uma fachada.",
    },
    {
      tipo: "armadilhas",
      itens: [
        {
          titulo: "Facade que vira god object",
          texto:
            "Começa coordenando, depois valida, depois calcula desconto, depois grava log... Quando a facade acumula regra de negócio, o subsistema vira detalhe e ela vira o monólito interno que todos temem tocar. Facade coordena; regra mora nas peças.",
        },
        {
          titulo: "Abstração que vaza",
          texto:
            "Se finalizarPedido() retorna o objeto ReservaEstoque interno ou lança PagamentoAdquirenteException crua, o cliente acopla nos tipos do subsistema do mesmo jeito — só que agora com uma classe a mais no meio. A facade precisa traduzir entradas, saídas e erros para o seu próprio vocabulário.",
        },
        {
          titulo: "Balcão bonito, bagunça atrás",
          texto:
            "Facade esconde complexidade, não a conserta. Usá-la para 'embrulhar' um módulo caótico e declarar o problema resolvido só adia a dor: a bagunça continua crescendo, agora invisível. Se o subsistema está podre, a facade é o primeiro passo (isolar), não o último (refatorar por trás dela).",
        },
      ],
    },
    {
      tipo: "quando",
      usar: [
        "Uma operação de negócio exige coordenar várias classes numa ordem específica, e vários clientes repetem essa coreografia.",
        "Você quer isolar o resto do sistema de uma biblioteca ou subsistema complexo (um ffmpeg, um SDK verboso).",
        "Definir a fronteira pública de um módulo: fora dele, só se fala com a facade.",
      ],
      evitar: [
        "O subsistema já é simples — a facade vira só um repasse burocrático de chamadas.",
        "Os clientes precisam do controle fino que a facade esconde; forçá-los a passar por ela gera métodos com dezenas de parâmetros.",
      ],
    },
  ],
};
