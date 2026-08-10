import type { Conceito } from "@/shared/types/conceito";

const MERMAID = `classDiagram
    class Notificacao {
        <<abstraction>>
        #canal
        +enviar(msg)
    }
    class NotificacaoUrgente {
        +enviar(msg)
    }
    class Canal {
        <<interface>>
        +entregar(texto)
    }
    class CanalEmail {
        +entregar(texto)
    }
    class CanalSMS {
        +entregar(texto)
    }
    Notificacao <|-- NotificacaoUrgente
    Canal <|.. CanalEmail
    Canal <|.. CanalSMS
    Notificacao o-- Canal : ponte`;

const CAMADAS = [
  {
    id: "abstracao",
    titulo: "Abstração",
    descricao: "O QUE se faz — e guarda uma referência ao implementador — coração do padrão",
    destaque: true,
  },
  { id: "implementacao", titulo: "Implementação", descricao: "COMO se faz — hierarquia que varia em separado" },
];

const EXEMPLOS = [
  {
    lang: "typescript" as const,
    code: `// Lado B: COMO entregar (varia sozinho)
interface Canal {
  entregar(texto: string): void;
}

class CanalEmail implements Canal {
  entregar(texto: string): void {
    console.log("email:", texto);
  }
}
class CanalSMS implements Canal {
  entregar(texto: string): void {
    console.log("sms:", texto);
  }
}

// Lado A: O QUE notificar (varia sozinho)
class Notificacao {
  // a "ponte": composicao, nao heranca
  constructor(protected canal: Canal) {}

  enviar(msg: string): void {
    this.canal.entregar(msg);
  }
}

class NotificacaoUrgente extends Notificacao {
  enviar(msg: string): void {
    this.canal.entregar("[URGENTE] " + msg);
    this.canal.entregar("[URGENTE] repetindo: " + msg);
  }
}

// 2 tipos x 2 canais = 4 combinacoes, com 4 classes (nao 4 subclasses cruzadas)
new Notificacao(new CanalEmail()).enviar("bem-vindo");
new NotificacaoUrgente(new CanalSMS()).enviar("servidor caiu");`,
  },
  {
    lang: "python" as const,
    code: `from abc import ABC, abstractmethod

# Lado B: COMO entregar (varia sozinho)
class Canal(ABC):
    @abstractmethod
    def entregar(self, texto): ...

class CanalEmail(Canal):
    def entregar(self, texto):
        print("email:", texto)

class CanalSMS(Canal):
    def entregar(self, texto):
        print("sms:", texto)

# Lado A: O QUE notificar (varia sozinho)
class Notificacao:
    # a "ponte": composicao, nao heranca
    def __init__(self, canal):
        self._canal = canal

    def enviar(self, msg):
        self._canal.entregar(msg)

class NotificacaoUrgente(Notificacao):
    def enviar(self, msg):
        self._canal.entregar("[URGENTE] " + msg)
        self._canal.entregar("[URGENTE] repetindo: " + msg)

# 2 tipos x 2 canais = 4 combinacoes com 4 classes
Notificacao(CanalEmail()).enviar("bem-vindo")
NotificacaoUrgente(CanalSMS()).enviar("servidor caiu")`,
  },
];

export const bridge: Conceito = {
  slug: "bridge",
  titulo: "Bridge",
  categoria: "estrutural",
  resumo:
    "Separa uma abstração da sua implementação para que as duas variem independentemente, trocando uma hierarquia que cresce em produto por duas que crescem em soma.",
  tags: ["composicao", "duas-dimensoes", "desacoplamento", "gof"],
  dificuldade: "avancado",
  tempoLeitura: 6,
  relacionados: ["adapter", "strategy", "abstract-factory"],
  problema: [
    "Quando um conceito varia em duas dimensões ao mesmo tempo — tipo de notificação × canal de entrega, forma × renderizador — resolver por herança cria uma classe para cada combinação.",
    "A hierarquia cresce como produto: quatro tipos e três canais viram doze classes, e cada novidade de um lado multiplica pelo outro. Boa parte delas é código repetido.",
  ],
  solucao: [
    "Separar as duas dimensões em hierarquias próprias e ligá-las por composição. A abstração guarda uma referência ao implementador e delega a ele a parte que varia do outro lado.",
    "O crescimento passa a ser soma: quatro tipos e três canais são sete classes, e adicionar um canal novo não toca em nenhum tipo de notificação.",
  ],
  quandoUsar: [
    "O conceito varia em duas (ou mais) dimensões independentes e você vê classes com nomes compostos.",
    "Você quer trocar a implementação em tempo de execução, não só de compilação.",
    "Abstração e implementação devem poder evoluir e ser distribuídas separadamente.",
  ],
  quandoEvitar: [
    "Só existe uma dimensão de variação — herança simples ou Strategy bastam.",
    "As dimensões não são realmente independentes: certos pares não fazem sentido juntos.",
    "É um sistema pequeno e estável; a indireção extra não se paga.",
  ],
  mermaid: MERMAID,
  camadas: CAMADAS,
  exemplos: EXEMPLOS,
  blocos: [
    {
      tipo: "tldr",
      texto:
        "Quando algo varia em duas dimensões, herança gera uma classe por combinação (NotificacaoUrgenteSMS, NotificacaoUrgenteEmail…). O Bridge separa as dimensões em duas hierarquias ligadas por composição: o crescimento vira soma em vez de produto.",
    },
    {
      tipo: "analogia",
      emoji: "🔌",
      titulo: "Controle remoto e aparelho",
      texto:
        "Existem controles simples e controles com comandos avançados; existem TVs, caixas de som e projetores. Ninguém fabrica um 'controle-avançado-de-projetor' como produto indivisível — os controles falam um protocolo, e qualquer aparelho que o entenda funciona. Assim, um controle novo serve para todos os aparelhos, e um aparelho novo funciona com todos os controles.",
    },
    {
      tipo: "secao",
      id: "problema",
      titulo: "O problema",
      resumo: [
        "Herança resolve bem uma dimensão de variação. Com duas, ela obriga a escolher qual delas vira a hierarquia principal — e a outra precisa ser replicada dentro de cada ramo.",
        "O sintoma é fácil de reconhecer: classes com nomes compostos por duas ideias, como `NotificacaoUrgenteSMS`, e código quase idêntico repetido entre os ramos.",
      ],
      extensao: [
        "A conta é o argumento mais convincente. Com M tipos e N implementações, a herança cruzada produz M×N classes; a composição produz M+N. Com quatro e três, doze viram sete — e a distância aumenta a cada adição, além de eliminar a duplicação entre ramos irmãos.",
        "A confusão mais comum é com **Strategy**, e a diferença é de escopo e de intenção. Strategy troca um algoritmo dentro de um objeto: é uma decisão local, muitas vezes de um método só. Bridge separa duas hierarquias inteiras que existem por si, cada uma com seus próprios subtipos e sua própria evolução. Mecanicamente parecidos; arquiteturalmente, de tamanhos diferentes.",
        "Com **Adapter** a distinção é temporal e de propósito. Adapter é remediação: você tem duas interfaces incompatíveis que já existem e precisa conciliá-las. Bridge é projeto: você antecipa duas dimensões de variação e desenha as duas hierarquias desde o início. Adapter conserta o passado, Bridge organiza o futuro.",
      ],
    },
    {
      tipo: "secao",
      id: "quando-vale",
      titulo: "Quando a segunda dimensão é real",
      resumo: [
        "O Bridge só se paga se as duas dimensões forem genuinamente independentes. Aplicá-lo onde elas não são cria indireção sem ganho e, pior, permite combinações inválidas.",
      ],
      extensao: [
        "O teste é direto: qualquer valor de A pode se combinar com qualquer valor de B e produzir algo que faça sentido? Se metade das combinações não deve existir, o modelo está errado — e o padrão passa a exigir validações em tempo de execução para proibir o que o tipo deveria proibir.",
        "Outro teste é de evolução: as duas dimensões mudam por motivos diferentes e em ritmos diferentes? Canais de entrega mudam quando a infraestrutura muda; tipos de notificação mudam quando o produto muda. São eixos independentes de verdade, e por isso o padrão encaixa.",
        "Se a resposta a essas perguntas for não, o caminho costuma ser mais simples: uma dimensão por herança e a outra por um parâmetro, ou apenas Strategy no ponto específico que varia.",
      ],
    },
    {
      tipo: "ilustracao",
      arquetipo: "antes-depois",
      antes: {
        titulo: "Herança cruzada: M × N classes",
        itens: [
          "NotificacaoEmail, NotificacaoSMS, NotificacaoPush",
          "NotificacaoUrgenteEmail, NotificacaoUrgenteSMS, NotificacaoUrgentePush",
          "um canal novo cria uma classe por tipo existente",
          "a lógica de 'urgente' aparece repetida em cada canal",
        ],
        nota: "Com 4 tipos e 3 canais são 12 classes, boa parte delas quase idêntica — e cada adição multiplica em vez de somar.",
      },
      depois: {
        titulo: "Bridge: M + N classes",
        itens: [
          "Notificacao e NotificacaoUrgente de um lado",
          "CanalEmail, CanalSMS, CanalPush do outro",
          "um canal novo é uma classe, e serve a todos os tipos",
          "a lógica de 'urgente' existe uma vez só",
        ],
        nota: "O custo é uma indireção e a exigência de que as dimensões sejam mesmo independentes — se certas combinações não fizerem sentido, o padrão passa a permitir estados inválidos.",
      },
      legenda:
        "A troca não é entre mais e menos código, é entre multiplicação e soma. Quanto mais valores cada dimensão tiver, maior a diferença a favor do Bridge.",
    },
    {
      tipo: "ilustracao",
      arquetipo: "estrutura",
      blocos: [
        {
          id: "abs",
          label: "Abstração: Notificação",
          nota: "o QUE — guarda um Canal",
          destaque: true,
          filhos: [{ id: "urgente", label: "NotificaçãoUrgente", nota: "refina o comportamento" }],
        },
        {
          id: "impl",
          label: "Implementação: Canal",
          nota: "o COMO — hierarquia separada",
          destaque: true,
          filhos: [
            { id: "email", label: "CanalEmail", nota: "entrega por e-mail" },
            { id: "sms", label: "CanalSMS", nota: "entrega por SMS" },
          ],
        },
      ],
      legenda:
        "São duas árvores lado a lado, não uma dentro da outra. A ponte é a referência que a abstração guarda para um implementador — e é ela que permite combinar qualquer folha de cima com qualquer folha de baixo.",
    },
    {
      tipo: "camadas-nav",
      titulo: "Navegue pelas camadas",
      camadas: [
        {
          id: "abstracao",
          titulo: "Abstração",
          curto: "o que se faz",
          detalhe:
            "Define a operação de alto nível em termos de negócio e guarda uma referência ao implementador. Não sabe como a entrega acontece — só que existe alguém capaz de fazê-la.",
          exemplo: "class Notificacao { constructor(protected canal: Canal) {} }",
          seViolar:
            "abstração que faz `if (canal instanceof CanalSMS)` recriou o acoplamento entre as dimensões e desfez a ponte.",
        },
        {
          id: "refinada",
          titulo: "Abstração refinada",
          curto: "variações do que se faz",
          detalhe:
            "Estende a abstração mudando o comportamento de alto nível — repetir, agrupar, priorizar. Continua ignorando o canal concreto, e por isso serve a todos eles.",
          exemplo: "class NotificacaoUrgente extends Notificacao { enviar(m) { /* repete */ } }",
          seViolar:
            "refinamento que só existe para um canal específico é sinal de que as dimensões não eram independentes.",
        },
        {
          id: "implementador",
          titulo: "Implementador",
          curto: "como se faz",
          detalhe:
            "Interface enxuta com as operações primitivas de que a abstração precisa. Quanto menor, mais fácil adicionar implementações novas — cada método aqui é trabalho multiplicado por N.",
          exemplo: "interface Canal { entregar(texto: string): void }",
          seViolar:
            "implementador com métodos de alto nível ('enviarNotificacaoUrgente') absorveu responsabilidade da abstração e as duas hierarquias voltam a se acoplar.",
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
          titulo: "Notificações por múltiplos canais",
          cenario:
            "Um produto envia boas-vindas, alertas de segurança e lembretes de cobrança por e-mail, SMS, push e webhook — e ambos os lados crescem com o tempo.",
          aplicacao:
            "Tipos de notificação formam uma hierarquia; canais formam outra. Adicionar WhatsApp é uma classe nova que passa a servir a todos os tipos existentes, sem tocar em nenhum.",
          tradeoff:
            "Canais têm capacidades diferentes: SMS tem limite de caracteres, push aceita ação, e-mail aceita HTML. A interface comum acaba sendo o menor denominador, e explorar o que cada canal tem de melhor exige furar a abstração.",
        },
        {
          titulo: "Drivers de persistência",
          cenario:
            "Um repositório precisa funcionar sobre PostgreSQL em produção, SQLite em desenvolvimento e memória nos testes, com várias entidades diferentes.",
          aplicacao:
            "Os repositórios de domínio são a abstração; os drivers são a implementação. Trocar de banco é injetar outro driver, sem alterar nenhum repositório.",
          tradeoff:
            "Bancos diferem em transações, tipos e recursos avançados. Uma interface comum honesta é pequena; se ela crescer para expor especificidades, a promessa de intercambialidade se torna falsa e o teste em memória para de refletir a produção.",
        },
        {
          titulo: "Renderização multiplataforma",
          cenario:
            "Um aplicativo desenha as mesmas telas em web, mobile e desktop, com componentes que evoluem por conta própria.",
          aplicacao:
            "Os componentes são a abstração; os renderizadores de cada plataforma são a implementação. Um componente novo funciona nas três; uma plataforma nova recebe todos os componentes.",
          tradeoff:
            "Convenções de plataforma divergem (navegação, gestos, atalhos). Forçar uniformidade produz interfaces que parecem estrangeiras em todo lugar — às vezes a duplicação consciente vale mais que a ponte.",
        },
      ],
    },
    {
      tipo: "armadilhas",
      itens: [
        {
          titulo: "Aplicar sem a segunda dimensão",
          texto:
            "Bridge com uma implementação só é indireção pura, e costuma nascer de 'um dia vamos precisar trocar'. Enquanto a segunda implementação não existe, a interface é adivinhação — e quando ela chega, quase sempre não encaixa. Espere a segunda dimensão aparecer de verdade antes de construir a ponte.",
        },
        {
          titulo: "Interface do implementador que incha",
          texto:
            "Cada método adicionado à interface precisa ser implementado por todas as implementações. Uma interface que começou com um método e chegou a doze transforma 'adicionar um canal' de tarefa de uma hora em projeto de uma semana — e é o que faz times abandonarem o padrão no meio.",
        },
        {
          titulo: "Combinações inválidas permitidas",
          texto:
            "Se nem todo par abstração × implementação faz sentido, o padrão passa a permitir estados que o domínio proíbe, e a proteção precisa virar checagem em tempo de execução. Isso é sinal de que as dimensões não eram independentes — e de que o modelo precisa ser revisto antes do padrão.",
        },
      ],
    },
    {
      tipo: "quando",
      usar: [
        "O conceito varia em duas dimensões independentes.",
        "Você quer trocar a implementação em tempo de execução.",
        "Abstração e implementação evoluem por motivos diferentes.",
      ],
      evitar: [
        "Há uma dimensão só de variação.",
        "As dimensões não são independentes de fato.",
        "O sistema é pequeno e estável.",
      ],
    },
  ],
};
