import type { Conceito } from "@/shared/types/conceito";

const MERMAID = `classDiagram
    class Notificador {
        <<interface>>
        +enviar(msg)
    }
    class NotificadorEmail {
        +enviar(msg)
    }
    class NotificadorDecorator {
        <<abstract>>
        -interno: Notificador
        +enviar(msg)
    }
    class ComSMS {
        +enviar(msg)
    }
    class ComAuditoria {
        +enviar(msg)
    }
    Notificador <|.. NotificadorEmail
    Notificador <|.. NotificadorDecorator
    NotificadorDecorator <|-- ComSMS
    NotificadorDecorator <|-- ComAuditoria
    NotificadorDecorator o-- Notificador : envolve`;

const CAMADAS = [
  { id: "cliente", titulo: "Cliente", descricao: "Usa a interface sem saber quantas camadas existem" },
  {
    id: "decorators",
    titulo: "Decorators empilhados",
    descricao: "Cada um envolve o próximo e adiciona um comportamento — coração do padrão",
    destaque: true,
  },
  { id: "componente", titulo: "Componente concreto", descricao: "A implementação base que faz o trabalho essencial" },
  { id: "interface", titulo: "Interface comum", descricao: "Contrato que componente e decorators compartilham" },
];

const EXEMPLOS = [
  {
    lang: "typescript" as const,
    code: `interface Notificador {
  enviar(msg: string): void;
}

class NotificadorEmail implements Notificador {
  enviar(msg: string): void {
    console.log("Email: " + msg);
  }
}

// Decorator base: implementa a interface E envolve outro Notificador
abstract class NotificadorDecorator implements Notificador {
  constructor(protected interno: Notificador) {}
  enviar(msg: string): void {
    this.interno.enviar(msg);
  }
}

class ComSMS extends NotificadorDecorator {
  enviar(msg: string): void {
    super.enviar(msg);
    console.log("SMS: " + msg);
  }
}

class ComAuditoria extends NotificadorDecorator {
  enviar(msg: string): void {
    console.log("[audit] notificacao registrada");
    super.enviar(msg);
  }
}

// Empilhando em runtime: cada camada adiciona algo sem mudar as demais
const notificador = new ComAuditoria(new ComSMS(new NotificadorEmail()));
notificador.enviar("Pedido aprovado");`,
  },
  {
    lang: "python" as const,
    code: `from abc import ABC, abstractmethod

class Notificador(ABC):
    @abstractmethod
    def enviar(self, msg: str) -> None: ...

class NotificadorEmail(Notificador):
    def enviar(self, msg: str) -> None:
        print(f"Email: {msg}")

# Decorator base: implementa a interface e envolve outro Notificador
class NotificadorDecorator(Notificador):
    def __init__(self, interno: Notificador):
        self._interno = interno

    def enviar(self, msg: str) -> None:
        self._interno.enviar(msg)

class ComSMS(NotificadorDecorator):
    def enviar(self, msg: str) -> None:
        super().enviar(msg)
        print(f"SMS: {msg}")

class ComAuditoria(NotificadorDecorator):
    def enviar(self, msg: str) -> None:
        print("[audit] notificacao registrada")
        super().enviar(msg)

# Empilhando em runtime
notificador = ComAuditoria(ComSMS(NotificadorEmail()))
notificador.enviar("Pedido aprovado")`,
  },
];

export const decorator: Conceito = {
  slug: "decorator",
  titulo: "Decorator",
  categoria: "estrutural",
  resumo:
    "Adiciona comportamento a um objeto em tempo de execução envolvendo-o em camadas empilháveis que compartilham a mesma interface — composição no lugar de herança.",
  tags: ["composicao", "wrapper", "runtime", "gof"],
  dificuldade: "intermediario",
  tempoLeitura: 7,
  relacionados: ["adapter", "facade"],
  roadmapNodes: ["estruturais"],
  problema: [
    "Você precisa adicionar responsabilidades a um objeto — log, retry, cache, criptografia — mas criar uma subclasse para cada combinação explode: com 4 extras opcionais já são 16 classes possíveis, e a escolha fica congelada em tempo de compilação.",
    "Herança também é tudo-ou-nada: a subclasse ganha o comportamento extra para sempre, para todas as instâncias. Não dá para dizer 'este notificador específico, neste fluxo, também manda SMS'.",
  ],
  solucao: [
    "O Decorator envolve o objeto original em um wrapper que implementa a mesma interface, faz seu trabalho extra e delega ao objeto interno. Como wrapper e componente são intercambiáveis, decorators se empilham em qualquer ordem e quantidade, montados em runtime.",
    "O cliente continua falando com a interface e não sabe (nem precisa saber) quantas camadas existem entre ele e o componente concreto — cada camada adiciona uma responsabilidade e repassa o resto.",
  ],
  quandoUsar: [
    "Responsabilidades extras são opcionais e combináveis (log + retry + cache em qualquer arranjo).",
    "O comportamento precisa ser decidido em tempo de execução, por instância — não por classe.",
    "A classe base não pode ser alterada (código de terceiros, SDK fechado) mas aceita ser envolvida.",
  ],
  quandoEvitar: [
    "Só existe uma variação e ela é estável — uma subclasse ou um parâmetro resolve mais barato.",
    "O cliente depende da identidade concreta do objeto (instanceof, comparação por referência) — o wrapper quebra essas checagens.",
  ],
  mermaid: MERMAID,
  camadas: CAMADAS,
  exemplos: EXEMPLOS,
  blocos: [
    {
      tipo: "tldr",
      texto:
        "Envolva o objeto em camadas que implementam a mesma interface: cada camada adiciona um comportamento e delega ao interno. Você compõe responsabilidades em runtime, sem tocar na classe original nem criar uma subclasse por combinação.",
    },
    {
      tipo: "analogia",
      emoji: "🧥",
      titulo: "Roupas em camadas",
      texto:
        "Num dia frio você veste camisa, suéter por cima e casaco por cima do suéter. Cada camada adiciona algo — aquecimento, impermeabilidade — sem mudar quem você é: por baixo continua a mesma pessoa, e você segue 'usável' do mesmo jeito (andar, falar, trabalhar). E a composição é sua, na hora: esfriou mais, adiciona o cachecol; entrou no prédio, tira o casaco. Nenhuma combinação exigiu 'nascer de novo' como outra pessoa — que é exatamente o que a herança exigiria.",
    },
    {
      tipo: "secao",
      id: "problema",
      titulo: "O problema",
      resumo: [
        "Adicionar responsabilidades opcionais via herança explode em combinações: NotificadorComSMS, NotificadorComSMSEAuditoria, NotificadorComAuditoriaSemSMS... cada extra novo dobra o número de subclasses possíveis.",
        "Pior: herança fixa o comportamento em tempo de compilação e para todas as instâncias da classe. Não há como montar a combinação certa para um objeto específico, num fluxo específico, em runtime.",
      ],
      extensao: [
        "A raiz do problema é que herança responde 'o que este objeto É', mas responsabilidades extras são sobre 'o que este objeto TEM a mais' — uma relação de composição, não de identidade. Quando extras opcionais são modelados como identidade, cada combinação vira um tipo novo, e a hierarquia cresce geometricamente.",
        "Alternativas comuns falham de outros jeitos: flags booleanas na classe base (comSMS, comAuditoria) incham a classe com if's e violam aberto/fechado a cada extra novo; mixins resolvem parte, mas continuam decididos em tempo de definição da classe, não por instância.",
        "O Decorator paga um preço honesto por essa flexibilidade: muitas classes pequenas e uma pilha de objetos para depurar. Compare com o Proxy — estruturalmente idêntico (wrapper com a mesma interface), mas com intenção diferente: o Proxy controla o acesso ao objeto (lazy, cache, permissão); o Decorator adiciona comportamento. E com o Adapter: o Adapter muda a interface para encaixar contratos incompatíveis; o Decorator preserva a interface e enriquece o comportamento.",
      ],
    },
    {
      tipo: "ilustracao",
      arquetipo: "fluxo",
      atores: [
        { id: "cliente", label: "Cliente" },
        { id: "auditoria", label: "ComAuditoria", destaque: true },
        { id: "sms", label: "ComSMS", destaque: true },
        { id: "email", label: "NotificadorEmail" },
      ],
      setas: [
        { label: "enviar(msg)" },
        { label: "registra audit e delega" },
        { label: "manda SMS e delega" },
      ],
      legenda:
        "A chamada atravessa as camadas: cada decorator faz seu extra e repassa — o cliente vê uma interface só, sem saber quantas camadas existem.",
    },
    {
      tipo: "camadas-nav",
      titulo: "Navegue pelas camadas",
      camadas: [
        {
          id: "interface",
          titulo: "Interface comum",
          curto: "o contrato que todos compartilham",
          detalhe:
            "Componente concreto e decorators implementam a mesma interface. É isso que torna as camadas intercambiáveis e empilháveis: qualquer decorator aceita qualquer Notificador — concreto ou já decorado.",
          exemplo: "interface Notificador { enviar(msg: string): void; }",
          seViolar:
            "se o decorator expõe métodos próprios fora da interface, o cliente passa a depender da camada concreta e a pilha deixa de ser rearranjável.",
        },
        {
          id: "componente",
          titulo: "Componente concreto",
          curto: "o trabalho essencial, sem extras",
          detalhe:
            "A implementação base que resolve o problema de verdade (enviar o email, escrever no stream, executar a request). Ela não sabe que decorators existem — e é exatamente por isso que não precisa mudar quando um extra novo aparece.",
          exemplo: "class NotificadorEmail implements Notificador { ... }",
        },
        {
          id: "decorator-base",
          titulo: "Decorator base",
          curto: "envolve e delega por padrão",
          detalhe:
            "Guarda a referência ao componente interno e delega todas as chamadas. Serve de esqueleto: decorators concretos herdam a delegação e sobrescrevem só o que interessa. Em linguagens dinâmicas, às vezes é dispensável.",
          exemplo: "abstract class NotificadorDecorator implements Notificador {\n  constructor(protected interno: Notificador) {}\n}",
          seViolar:
            "decorator que esquece de delegar algum método 'engole' comportamento silenciosamente — o bug clássico do padrão.",
        },
        {
          id: "decorators",
          titulo: "Decorators concretos",
          curto: "um extra por camada",
          detalhe:
            "Cada decorator adiciona exatamente uma responsabilidade — antes, depois ou ao redor da delegação. A composição acontece no ponto de montagem: quem constrói a pilha decide ordem e quantidade em runtime.",
          exemplo: "new ComAuditoria(new ComSMS(new NotificadorEmail()))",
          seViolar:
            "decorator que faz três coisas ao mesmo tempo mata a graça do padrão: as responsabilidades voltam a ser inseparáveis.",
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
          titulo: "Streams de I/O (o caso clássico do Java)",
          cenario:
            "Uma plataforma processa arquivos grandes: às vezes comprimidos, às vezes criptografados, às vezes ambos — e a combinação só é conhecida na hora de abrir o arquivo.",
          aplicacao:
            "A API java.io é Decorator puro: new GZIPInputStream(new BufferedInputStream(new FileInputStream(f))). Cada wrapper adiciona buffer, descompressão ou decriptação sobre o mesmo contrato InputStream, montado conforme o arquivo.",
          tradeoff:
            "A montagem fica verbosa e a ordem importa (buffer por fora de gzip, não por dentro) — errar a ordem compila e roda, só que lento ou errado.",
        },
        {
          titulo: "HTTP client com middlewares em SaaS",
          cenario:
            "Um SaaS integra com dezenas de APIs externas; algumas precisam de retry com backoff, outras de circuit breaker, todas de telemetria — mas não nas mesmas combinações.",
          aplicacao:
            "Um HttpClient base é envolvido por decorators ComRetry, ComTelemetria, ComCircuitBreaker. Cada integração monta sua pilha na configuração: a do gateway de pagamento leva retry + breaker; a de analytics, só telemetria.",
          tradeoff:
            "Stack traces atravessam 4-5 camadas de wrappers, e um retry mal posicionado (por fora do breaker) pode martelar um serviço já caído.",
        },
        {
          titulo: "Precificação de frete em logística",
          cenario:
            "Uma transportadora calcula frete base por peso/distância, e o cliente adiciona opcionais: seguro, entrega expressa, embalagem reforçada — qualquer combinação.",
          aplicacao:
            "CalculoFrete é decorado por ComSeguro, ComExpressa, ComEmbalagem: cada camada soma seu custo ao valor delegado. O carrinho monta a pilha conforme os checkboxes marcados, sem uma classe por combinação.",
          tradeoff:
            "Quando os opcionais começam a interagir (seguro custa mais se for expressa), decorators independentes deixam de bastar — a regra cruzada pede outro modelo.",
        },
      ],
    },
    {
      tipo: "armadilhas",
      itens: [
        {
          titulo: "A identidade do objeto muda",
          texto:
            "O objeto decorado NÃO é o original: instanceof NotificadorEmail falha, comparação por referência falha, e um unwrap acidental (alguém guardou a referência interna) fura todas as camadas. Se o código ao redor depende de identidade concreta, o Decorator quebra de formas silenciosas.",
        },
        {
          titulo: "Ordem das camadas é semântica invisível",
          texto:
            "ComRetry(ComAuditoria(x)) audita cada tentativa; ComAuditoria(ComRetry(x)) audita só o resultado final. Os dois compilam e 'funcionam'. A ordem da pilha carrega significado que o compilador não checa — documente a montagem ou centralize-a numa factory.",
        },
        {
          titulo: "Interface larga, decorator sofrido",
          texto:
            "Decorator sobre uma interface de 20 métodos obriga cada wrapper a delegar os 20 — e cada método novo na interface exige revisitar todos os decorators (esquecer um é bug silencioso). O padrão brilha sobre interfaces pequenas; sobre interfaces largas, considere segregá-las antes.",
        },
      ],
    },
    {
      tipo: "quando",
      usar: [
        "Responsabilidades extras são opcionais e combináveis (log + retry + cache em qualquer arranjo).",
        "O comportamento precisa ser decidido em tempo de execução, por instância — não por classe.",
        "A classe base não pode ser alterada (código de terceiros, SDK fechado) mas aceita ser envolvida.",
      ],
      evitar: [
        "Só existe uma variação e ela é estável — uma subclasse ou um parâmetro resolve mais barato.",
        "O cliente depende da identidade concreta do objeto (instanceof, referência) — o wrapper quebra essas checagens.",
      ],
    },
  ],
};
