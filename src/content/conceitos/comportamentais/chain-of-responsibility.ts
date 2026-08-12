import type { Conceito } from "@/shared/types/conceito";
import { gof } from "@/content/conceitos/_nascimento";

const MERMAID = `classDiagram
    class Manipulador {
        <<interface>>
        +tratar(req) Resposta
        +encadear(proximo) Manipulador
    }
    class Autenticacao {
        +tratar(req)
    }
    class RateLimit {
        +tratar(req)
    }
    class Handler {
        +tratar(req)
    }
    Manipulador <|.. Autenticacao
    Manipulador <|.. RateLimit
    Manipulador <|.. Handler
    Autenticacao --> RateLimit : proximo
    RateLimit --> Handler : proximo`;

const CAMADAS = [
  { id: "cliente", titulo: "Cliente", descricao: "Entrega a requisição ao primeiro elo e espera a resposta" },
  {
    id: "elo",
    titulo: "Elo da corrente",
    descricao: "Trata ou repassa — e não sabe quem vem depois — coração do padrão",
    destaque: true,
  },
  { id: "fim", titulo: "Fim da corrente", descricao: "Quem realmente resolve, ou o fallback de 'ninguém tratou'" },
];

const EXEMPLOS = [
  {
    lang: "typescript" as const,
    code: `interface Requisicao {
  usuario?: string;
  rota: string;
}
type Resposta = { status: number; corpo: string };

abstract class Elo {
  private proximo?: Elo;

  encadear(proximo: Elo): Elo {
    this.proximo = proximo;
    return proximo; // permite encadear fluente
  }

  tratar(req: Requisicao): Resposta {
    // sem proximo, a corrente acabou sem ninguem resolver
    return this.proximo
      ? this.proximo.tratar(req)
      : { status: 404, corpo: "sem manipulador" };
  }
}

class Autenticacao extends Elo {
  tratar(req: Requisicao): Resposta {
    if (!req.usuario) return { status: 401, corpo: "sem credencial" };
    return super.tratar(req); // passa adiante
  }
}

class RateLimit extends Elo {
  private vistos = new Map<string, number>();
  tratar(req: Requisicao): Resposta {
    const n = (this.vistos.get(req.usuario!) ?? 0) + 1;
    this.vistos.set(req.usuario!, n);
    if (n > 100) return { status: 429, corpo: "devagar" };
    return super.tratar(req);
  }
}

class Handler extends Elo {
  tratar(req: Requisicao): Resposta {
    return { status: 200, corpo: "ok: " + req.rota };
  }
}

const auth = new Autenticacao();
auth.encadear(new RateLimit()).encadear(new Handler());
console.log(auth.tratar({ usuario: "ana", rota: "/pedidos" }));`,
  },
  {
    lang: "python" as const,
    code: `class Elo:
    def __init__(self):
        self._proximo = None

    def encadear(self, proximo):
        self._proximo = proximo
        return proximo  # permite encadear fluente

    def tratar(self, req):
        if self._proximo:
            return self._proximo.tratar(req)
        return {"status": 404, "corpo": "sem manipulador"}

class Autenticacao(Elo):
    def tratar(self, req):
        if not req.get("usuario"):
            return {"status": 401, "corpo": "sem credencial"}
        return super().tratar(req)  # passa adiante

class RateLimit(Elo):
    def __init__(self):
        super().__init__()
        self._vistos = {}

    def tratar(self, req):
        u = req["usuario"]
        self._vistos[u] = self._vistos.get(u, 0) + 1
        if self._vistos[u] > 100:
            return {"status": 429, "corpo": "devagar"}
        return super().tratar(req)

class Handler(Elo):
    def tratar(self, req):
        return {"status": 200, "corpo": "ok: " + req["rota"]}

auth = Autenticacao()
auth.encadear(RateLimit()).encadear(Handler())
print(auth.tratar({"usuario": "ana", "rota": "/pedidos"}))`,
  },
];

const ANTI_EXEMPLO = `abstract class Elo {
  private proximo?: Elo;
  encadear(e: Elo) { this.proximo = e; return e; }

  tratar(p: Pedido): void {
    if (this.aceita(p)) return this.processar(p);
    this.proximo?.tratar(p);   // <- se nao houver proximo, some em silencio
  }

  protected abstract aceita(p: Pedido): boolean;
  protected abstract processar(p: Pedido): void;
}

const corrente = new EloBoleto();
corrente.encadear(new EloPix()).encadear(new EloCartao());

// Chega um pedido de pagamento em cripto.
// Nenhum elo aceita. O '?.' engole. A funcao retorna void.
// Do lado de fora, parece que deu certo.
corrente.tratar(pedidoCripto);`;

export const chainOfResponsibility: Conceito = {
  slug: "chain-of-responsibility",
  titulo: "Chain of Responsibility",
  categoria: "comportamental",
  resumo:
    "Passa uma requisição por uma corrente de manipuladores; cada um decide se trata ou repassa adiante, sem que o remetente saiba quem vai atender.",
  tags: ["middleware", "pipeline", "desacoplamento", "gof"],
  dificuldade: "intermediario",
  tempoLeitura: 6,
  nasceu: gof(),
  ondeAparece: [
    {
      onde: "A cadeia de middleware",
      explicacao:
        "Cada elo decide se trata, se passa adiante com `next()`, ou se encerra a requisição ali.",
    },
    {
      onde: "Bubbling de evento do DOM",
      explicacao:
        "O clique sobe do alvo até a raiz, e qualquer nó no caminho pode tratar ou parar a propagação.",
    },
  ],
  emUmaLinha: {
    lang: "typescript",
    code: `// Cada elo trata ou passa adiante.
auth.proximo(rateLimit).proximo(handler);`,
  },
  custo: {
    indirecoes: 2,
    cobra: [
      "A cadeia adiciona saltos entre a requisição e o handler que de fato a trata",
      "Uma requisição que ninguém trata some em silêncio se não houver um handler final",
    ],
    naoValeSe:
      "sempre se sabe de antemão quem trata a requisição — sem essa incerteza, chamar o handler certo direto é mais claro.",
  },
  relacionados: ["decorator", "command", "facade"],
  problema: [
    "Uma requisição precisa passar por várias verificações — autenticação, permissão, rate limit, validação, log — e cada uma pode interrompê-la. Colocar tudo num método produz uma escada de `if` que ninguém consegue reordenar com segurança.",
    "As verificações variam por rota, por ambiente e por cliente. Codificar essa variação em condicionais faz o método crescer a cada requisito novo.",
  ],
  solucao: [
    "Cada verificação vira um manipulador independente com a mesma interface. Ele resolve a requisição ou a repassa para o próximo elo, sem conhecer os demais.",
    "A corrente é montada de fora, em tempo de configuração. Reordenar, inserir ou remover uma etapa é mexer na montagem, não no código das etapas.",
  ],
  quandoUsar: [
    "Várias etapas independentes processam a mesma requisição em sequência, e qualquer uma pode interrompê-la.",
    "A composição das etapas muda por contexto (rota, ambiente, plano do cliente).",
    "Quem envia não deve saber quem trata — só que alguém tratará.",
  ],
  quandoEvitar: [
    "A ordem e o conjunto de etapas são fixos e pequenos: chamadas diretas são mais legíveis.",
    "Toda requisição sempre passa por todas as etapas sem possibilidade de interrupção — aí é pipeline, não corrente de responsabilidade.",
    "Você precisa garantir que alguém vai tratar: a corrente, por natureza, permite que ninguém trate.",
  ],
  mermaid: MERMAID,
  camadas: CAMADAS,
  exemplos: EXEMPLOS,
  blocos: [
    {
      tipo: "tldr",
      texto:
        "A requisição entra pelo primeiro elo; cada um decide se resolve ali (devolvendo 401, 429…) ou chama o próximo. Quem enviou não conhece a corrente — e reordenar as etapas é mexer na montagem, não nas etapas.",
    },
    {
      tipo: "analogia",
      emoji: "🎫",
      titulo: "A fila do aeroporto",
      texto:
        "Do check-in até o portão você passa por vários balcões: documento, despacho de bagagem, raio-X, imigração. Cada um resolve o que é seu e libera para o próximo — ou barra você ali mesmo, e os balcões seguintes nem ficam sabendo. Nenhum atendente conhece o processo inteiro, e o aeroporto pode inserir uma checagem nova sem retreinar todos os outros.",
    },
    {
      tipo: "secao",
      id: "problema",
      titulo: "O problema",
      resumo: [
        "Preocupações transversais se acumulam sobre o mesmo ponto de entrada: autenticar, autorizar, limitar, validar, registrar, medir. Nenhuma é a regra de negócio, mas todas precisam acontecer antes dela.",
        "Empilhadas num método, viram uma escada de `if` com retornos antecipados, onde a ordem é implícita e ninguém sabe se mover uma linha quebra algo.",
      ],
      extensao: [
        "O ponto que separa este padrão dos vizinhos é a **interrupção**. No Decorator, todas as camadas costumam agir e a chamada segue até o fim. Na corrente, cada elo tem autoridade para encerrar — e é exatamente isso que o torna adequado a verificações.",
        "Há duas variantes na prática, e confundi-las causa discussão desnecessária. A **clássica do GoF** procura um único responsável: alguém trata e a corrente para, como no despacho de eventos de UI que sobe pela árvore até alguém consumir. A **variante middleware**, muito mais comum hoje, faz todos participarem em sequência e ainda permite agir na volta — é o modelo de Express, ASP.NET Core e da maioria dos servidores HTTP.",
        "A segunda variante é tão dominante que 'middleware' virou o nome popular do padrão. Vale saber que são o mesmo esqueleto com contratos diferentes: na clássica, repassar é a exceção; na de middleware, repassar é o caminho normal.",
      ],
    },
    {
      tipo: "secao",
      id: "montagem",
      titulo: "A corrente é configuração, não código",
      resumo: [
        "O valor do padrão aparece quando a montagem sai do código das etapas: a mesma coleção de elos serve a rotas diferentes em ordens diferentes.",
      ],
      extensao: [
        "Quando a corrente é montada em um ponto central, ela vira documentação executável: lendo a montagem você sabe exatamente o que acontece com uma requisição, em que ordem, sem abrir nenhum manipulador.",
        "Isso também torna a ordem testável. Trocar rate limit e autenticação de lugar muda o comportamento de forma sutil — limitar antes de autenticar gasta cota com requisição anônima; autenticar antes gasta CPU com quem já estourou a cota. São decisões reais, e ficam explícitas na montagem.",
        "O antipadrão correspondente é o elo que se auto-registra ou que decide sozinho quem vem depois. Aí a ordem volta a ser implícita, espalhada por N arquivos, e o benefício principal se perde.",
      ],
    },
    {
      tipo: "ilustracao",
      arquetipo: "fluxo",
      atores: [
        { id: "req", label: "Requisição" },
        { id: "auth", label: "Autenticação", destaque: true },
        { id: "rate", label: "Rate limit", destaque: true },
        { id: "handler", label: "Handler" },
      ],
      setas: [
        { label: "entra pelo 1º elo" },
        { label: "ok → próximo (senão 401)" },
        { label: "dentro da cota → próximo (senão 429)" },
      ],
      legenda:
        "Cada elo só conhece o próximo. Qualquer um pode encerrar ali mesmo — e quando isso acontece, os elos seguintes nem são chamados.",
    },
    {
      tipo: "ilustracao",
      arquetipo: "antes-depois",
      antes: {
        titulo: "Sem a corrente: escada de ifs",
        itens: [
          "um método com autenticação, cota, validação e log misturados",
          "a ordem é implícita e arriscada de mexer",
          "cada rota copia o trecho e adapta",
          "testar o rate limit exige montar uma requisição completa",
        ],
        nota: "As preocupações transversais ficam grudadas na regra de negócio, e o método cresce a cada requisito novo de infraestrutura.",
      },
      depois: {
        titulo: "Com a corrente: elos independentes",
        itens: [
          "cada preocupação é uma classe testável isolada",
          "a ordem vira montagem explícita e revisável",
          "rotas diferentes compõem correntes diferentes",
          "inserir uma etapa não toca nas existentes",
        ],
        nota: "O custo é indireção: o stack trace fica mais fundo e descobrir por que uma requisição parou exige saber qual elo a interrompeu — daí a importância de cada um dizer quem barrou.",
      },
      legenda:
        "A corrente não reduz a quantidade de verificações; ela separa cada uma e transforma a ordem, que era acidental, em decisão declarada num lugar só.",
    },
    {
      tipo: "camadas-nav",
      titulo: "Navegue pelas camadas",
      camadas: [
        {
          id: "cliente",
          titulo: "Cliente",
          curto: "entrega ao primeiro elo",
          detalhe:
            "Conhece só a entrada da corrente e o formato da resposta. Não sabe quantos elos existem nem qual deles vai atender — e é isso que permite mudar a composição sem tocar nele.",
          exemplo: "const resposta = corrente.tratar(req);",
          seViolar:
            "cliente que checa `if (resposta.status === 429)` para decidir a próxima etapa reabsorveu a lógica da corrente.",
        },
        {
          id: "elo",
          titulo: "Elo",
          curto: "trata ou repassa",
          detalhe:
            "Tem uma responsabilidade só e a decisão de encerrar. Guarda a referência ao próximo, mas não escolhe quem é — quem monta decide. Ao interromper, deve dizer claramente por quê.",
          exemplo: "if (!req.usuario) return 401; return super.tratar(req);",
          seViolar:
            "elo que conhece o tipo concreto do próximo (`if (proximo instanceof RateLimit)`) transforma a corrente numa lista fixa disfarçada.",
        },
        {
          id: "fim",
          titulo: "Fim da corrente",
          curto: "quem resolve, ou o fallback",
          detalhe:
            "O último elo costuma ser o handler de negócio. É essencial existir um comportamento definido para 'ninguém tratou' — normalmente um 404 explícito, nunca um retorno silencioso.",
          exemplo: "return this.proximo ? ... : { status: 404, corpo: 'sem manipulador' };",
          seViolar:
            "corrente que devolve `null` ou `undefined` quando ninguém trata empurra o bug para o cliente, longe da causa.",
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
          titulo: "Middleware de servidor HTTP",
          cenario:
            "Toda requisição de uma API precisa de CORS, parsing do corpo, autenticação, autorização por papel, rate limit e métricas antes de chegar ao controlador.",
          aplicacao:
            "Cada preocupação é um middleware registrado na ordem desejada; qualquer um pode encerrar devolvendo a resposta. Rotas públicas montam uma corrente menor, sem os elos de autenticação.",
          tradeoff:
            "A ordem passa a ser um detalhe crítico e silencioso: registrar métricas depois da autenticação faz você perder a medição das requisições rejeitadas, e nada no código acusa isso — só a análise do painel meses depois.",
        },
        {
          titulo: "Aprovação de despesas por alçada",
          cenario:
            "Uma despesa é aprovada pelo gestor até certo valor, pelo diretor acima disso e pelo comitê financeiro em valores altos, com regras que mudam por área.",
          aplicacao:
            "Cada nível é um elo que aprova o que está na sua alçada e repassa o que excede. Mudar limites ou inserir um nível novo é reconfigurar a corrente, sem tocar nas regras existentes.",
          tradeoff:
            "É a variante clássica, em que alguém precisa tratar — e ela permite, por construção, que a despesa chegue ao fim sem aprovador. Sem um elo final explícito de 'fora de alçada', o pedido some do fluxo sem erro.",
        },
        {
          titulo: "Filtros de moderação de conteúdo",
          cenario:
            "Uma postagem passa por detecção de spam, checagem de palavras banidas, análise de imagem e revisão por reputação do autor antes de ir ao ar.",
          aplicacao:
            "Cada filtro é um elo que pode bloquear, sinalizar ou liberar para o próximo. Os filtros caros (análise de imagem) ficam depois dos baratos, para serem evitados quando um anterior já bloqueou.",
          tradeoff:
            "A corrente para no primeiro bloqueio, então o autor recebe um motivo de cada vez e pode precisar de várias tentativas para publicar — bom para custo, ruim para experiência. Coletar todos os motivos exige abrir mão da interrupção.",
        },
      ],
    },
    {
      tipo: "anti-exemplo",
      titulo: "A corrente em que ninguém trata",
      comoSeParece:
        "Cada elo verifica se é o dono do pedido e, se não for, passa adiante. O último também passa adiante. O pedido chega ao fim da corrente e simplesmente desaparece — sem erro, sem log, sem resposta.",
      codigo: { lang: "typescript", code: ANTI_EXEMPLO },
      sintomas: [
        { quando: "Com entrada inesperada", efeito: "O pedido é descartado silenciosamente e quem chamou acredita que foi processado." },
        { quando: "No suporte", efeito: "Aparece como 'o pagamento sumiu': não há erro, não há log, não há registro de que passou por ali." },
        { quando: "Na refatoração", efeito: "Remover um elo que era o único a aceitar certo caso não quebra nenhum teste — só para de funcionar em produção." },
      ],
      correcao:
        "A corrente precisa de um fim explícito: ou um elo terminal que trata o que ninguém quis (e registra), ou `tratar` devolve um resultado que distingue 'tratado' de 'ninguém tratou'. Silêncio nunca pode ser um caminho válido de saída.",
    },
    {
      tipo: "armadilhas",
      itens: [
        {
          titulo: "Requisição que cai no vazio",
          texto:
            "O padrão não garante que alguém trate. Se nenhum elo assume e não existe um final explícito, a requisição termina em silêncio — e o sintoma aparece longe, como 'às vezes o pedido não aparece'. Toda corrente precisa de um fim que diga, em alto e bom som, que ninguém tratou.",
        },
        {
          titulo: "Elo com estado compartilhado",
          texto:
            "Manipuladores costumam ser instanciados uma vez e usados por todas as requisições, muitas vezes em paralelo. Guardar dados da requisição atual num campo do elo (como o contador do exemplo, se fosse por requisição) vaza informação entre usuários — uma das causas mais desagradáveis de bug em produção, porque só aparece sob concorrência.",
        },
        {
          titulo: "Depuração às cegas",
          texto:
            "Quando uma requisição é rejeitada, saber qual dos oito elos a barrou pode virar caça ao tesouro. Cada interrupção deveria identificar seu autor na resposta ou no log estruturado; sem isso, o desacoplamento que ajudou a escrever atrapalha a operar.",
        },
      ],
    },
    {
      tipo: "quando",
      usar: [
        "Várias etapas independentes processam a mesma requisição e qualquer uma pode interrompê-la.",
        "A composição muda por contexto (rota, ambiente, plano).",
        "Quem envia não deve conhecer quem trata.",
      ],
      evitar: [
        "As etapas são poucas, fixas e sempre executadas.",
        "Você precisa garantir tratamento — a corrente admite que ninguém trate.",
        "Você precisa de todos os motivos de rejeição de uma vez, e não do primeiro.",
      ],
    },
  ],
};
