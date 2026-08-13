import type { Conceito } from "@/shared/types/conceito";

const EXEMPLOS = [
  {
    lang: "typescript" as const,
    code: `// Um contrato, várias implementações — o chamador não escolhe a classe.
interface Notificador {
  enviar(msg: string): void;
}

class Email implements Notificador {
  enviar(msg: string) { /* SMTP */ }
}
class Slack implements Notificador {
  enviar(msg: string) { /* webhook */ }
}

function avisar(n: Notificador, msg: string) {
  n.enviar(msg); // polimorfismo: o mesmo call, comportamentos diferentes
}
avisar(new Email(), "ok");
avisar(new Slack(), "ok");`,
  },
  {
    lang: "python" as const,
    code: `class Notificador(Protocol):
    def enviar(self, msg: str) -> None: ...

class Email:
    def enviar(self, msg: str) -> None: ...

class Slack:
    def enviar(self, msg: str) -> None: ...

def avisar(n: Notificador, msg: str) -> None:
    n.enviar(msg)  # duck typing + contrato = polimorfismo`,
  },
  {
    lang: "java" as const,
    code: `interface Notificador { void enviar(String msg); }

class Email implements Notificador {
  public void enviar(String msg) { /* ... */ }
}
class Slack implements Notificador {
  public void enviar(String msg) { /* ... */ }
}

void avisar(Notificador n, String msg) {
  n.enviar(msg); // resolve em runtime pela implementação real
}`,
  },
];

export const polimorfismo: Conceito = {
  slug: "polimorfismo",
  titulo: "Polimorfismo",
  categoria: "principio",
  resumo:
    "Um mesmo contrato, várias implementações: o código chama a abstração e o comportamento concreto chega em runtime. Herança é um caminho para isso — não o único. Sem polimorfismo, cada variação vira `if/switch` no cliente; com ele, novas variantes entram sem reabrir quem chama.",
  tags: ["principio", "oop", "heranca", "contrato", "substituicao"],
  dificuldade: "iniciante",
  tempoLeitura: 6,
  nasceu: {
    quando: { rotulo: "1967", ano: 1967, precisao: "aproximada" },
    fonte:
      "Simula 67 introduz classes e subclasses; o termo e a prática se espalham com Smalltalk e as linguagens OO seguintes",
    precursor:
      "A ideia de tratar objetos diferentes pela mesma mensagem — o coração do OO desde o início.",
  },
  ondeAparece: [
    {
      onde: "Array.prototype.sort(compareFn)",
      explicacao:
        "Você passa a estratégia de comparação; o sort não conhece seus tipos — polimorfismo por função.",
    },
    {
      onde: "strategies do Passport",
      explicacao:
        "Local, JWT, OAuth: o mesmo pipeline de auth, implementações diferentes atrás do contrato.",
    },
    {
      onde: "React: componentes como tipo",
      explicacao:
        "`<Botao />` e `<Link />` satisfazem o mesmo lugar na árvore — o pai fala com a interface do filho.",
    },
  ],
  emUmaLinha: {
    lang: "typescript",
    code: `function avisar(n: Notificador, msg: string) { n.enviar(msg); }`,
  },
  custo: {
    indirecoes: 1,
    cobra: [
      "O fluxo real fica menos óbvio no jump-to-definition — a implementação aparece em runtime",
      "Contrato frouxo demais empurra `instanceof` de volta ao cliente",
    ],
    naoValeSe:
      "só existem uma ou duas variações estáveis e um `if` claro é mais honesto que uma hierarquia especulativa.",
  },
  relacionados: [
    "encapsulamento",
    "strategy",
    "lsp",
    "composicao-sobre-heranca",
    "ocp",
  ],
  problema: [
    "Sem um contrato compartilhado, cada nova variante obriga a reabrir o cliente: mais um `case` no switch, mais um `if` de tipo. O código que deveria só ‘avisar’ passa a conhecer Email, Slack, SMS e o próximo canal da sprint.",
    "Herança mal usada finge polimorfismo: a subclasse quebra o contrato do pai (não substitui de verdade) e o chamador precisa saber qual filho recebeu — o oposto do objetivo.",
  ],
  solucao: [
    "Definir o contrato (interface, type, Protocol) pelo comportamento que o cliente precisa — não pela hierarquia de classes.",
    "Fazer cada variante implementar esse contrato. O cliente depende só da abstração; a escolha da implementação fica na composição (DI, factory, config).",
    "Usar herança quando o ‘é um’ for honesto e o subtipo for substituível (LSP); nos demais casos, preferir composição + interface (o mesmo polimorfismo, sem árvore).",
  ],
  quandoUsar: [
    "Várias implementações do mesmo papel (pagamento, notificação, storage).",
    "Quando o cliente não deve mudar ao nascer uma variante nova (OCP).",
    "Em APIs de biblioteca: o usuário passa o comportamento (callback, strategy).",
  ],
  quandoEvitar: [
    "Uma única implementação previsível — a interface vira cerimônia.",
    "Quando o cliente precisa de métodos específicos de cada variante (cheira a contrato errado).",
  ],
  exemplos: EXEMPLOS,
  blocos: [
    {
      tipo: "tldr",
      texto:
        "Polimorfismo é chamar um contrato e receber comportamentos diferentes sem o cliente escolher a classe. Herança é um meio; interface + composição é outro — e costuma ser o mais saudável. O anti-padrão é o switch de tipos no cliente a cada variante nova.",
    },
    {
      tipo: "analogia",
      emoji: "🔌",
      titulo: "A tomada, não o aparelho",
      texto:
        "A parede oferece um contrato (tomada). Geladeira, abajur e carregador ‘implementam’ o plug. Você não reescreve a instalação elétrica para cada aparelho novo — só encaixa. Polimorfismo é a tomada; herança malfeita é soldar o cabo na parede.",
    },
    {
      tipo: "secao",
      id: "heranca",
      titulo: "Herança entra onde?",
      resumo: [
        "Herança cria uma família de tipos e permite tratar o filho como o pai. Isso é polimorfismo — desde que o filho possa substituir o pai de verdade (LSP).",
        "Mas polimorfismo não exige `extends`. Uma interface implementada por classes sem parentesco comum, ou funções que obedecem à mesma assinatura, resolvem o mesmo problema. Strategy, Repository e boa parte do código moderno usam isso.",
      ],
      extensao: [
        "A trilha liga daqui para **Composição sobre herança** e para **Strategy**: quando o comportamento varia, o caminho saudável costuma ser ‘receber uma peça que fala o contrato’, não ‘subclassear e sobrescrever’.",
      ],
    },
    {
      tipo: "ilustracao",
      arquetipo: "fluxo",
      atores: [
        { id: "cliente", label: "Cliente" },
        { id: "contrato", label: "Contrato", destaque: true },
        { id: "impl", label: "Implementação" },
      ],
      setas: [{ label: "chama" }, { label: "resolve em runtime" }],
      legenda:
        "O cliente fala com o contrato; a implementação concreta chega em runtime — trocar A por B não mexe no cliente.",
    },
    {
      tipo: "casos",
      titulo: "Como isso aparece na prática",
      casos: [
        {
          titulo: "O switch de gateway de pagamento",
          cenario:
            "Cada novo meio (cartão, pix, boleto) ganhava um `case` no service de checkout. O arquivo virava o mapa da empresa de pagamentos.",
          aplicacao:
            "Um contrato `Gateway.cobrar(pedido)` e uma implementação por meio; o checkout só recebe o gateway configurado.",
          tradeoff:
            "Mais arquivos e fiação na composição. Em troca, meio novo = classe nova, sem reabrir o checkout.",
        },
        {
          titulo: "Testes sem bater no SMTP real",
          cenario:
            "Testar o fluxo de cadastro exigia e-mail de verdade ou um mock global frágil.",
          aplicacao:
            "O serviço depende de `Notificador`; no teste entra um fake que grava a mensagem em memória.",
          tradeoff:
            "Uma interface a mais. Em troca, o teste fica determinístico e rápido.",
        },
      ],
    },
    {
      tipo: "armadilhas",
      titulo: "Onde isto dá errado",
      itens: [
        {
          titulo: "Interface com um só implementador eterno",
          texto:
            "Se nunca houve segunda variante e não há fronteira de teste, a interface é especulação. Polimorfismo prematuro também custa.",
        },
        {
          titulo: "Contrato que vaza o tipo concreto",
          texto:
            "Métodos que só fazem sentido numa implementação empurram `instanceof` de volta — o cliente deixou de ser polimórfico.",
        },
        {
          titulo: "Herança que quebra substituição",
          texto:
            "Filho que lança ‘não suportado’ nos métodos do pai não é polimorfismo útil: o chamador precisa saber qual filho recebeu (veja LSP).",
        },
      ],
    },
    {
      tipo: "anti-exemplo",
      comoSeParece:
        "O cliente escolhe o comportamento com switch de tipo em vez de falar com um contrato.",
      codigo: {
        lang: "typescript",
        code: `type Canal = "email" | "slack";
function avisar(canal: Canal, msg: string) {
  if (canal === "email") enviarEmail(msg);
  else if (canal === "slack") enviarSlack(msg);
  // próximo canal = reabrir esta função
}`,
      },
      sintomas: [
        {
          quando: "nasce um canal novo",
          efeito: "todo switch de canal no sistema precisa ser reaberto",
        },
        {
          quando: "o teste quer um fake",
          efeito: "não há onde encaixar — o comportamento está hardcoded",
        },
      ],
      correcao:
        "Contrato `Notificador` + implementações; o cliente chama `n.enviar(msg)`.",
    },
    {
      tipo: "codigo",
      titulo: "Do switch ao contrato",
      exemplos: EXEMPLOS,
    },
    {
      tipo: "passos",
      titulo: "Do if ao polimorfismo",
      passos: [
        {
          titulo: "Nomeie o papel",
          texto: "O que o cliente precisa fazer? ‘Enviar aviso’, não ‘falar SMTP’.",
        },
        {
          titulo: "Escreva o contrato",
          texto: "Interface/type com só o que o cliente usa.",
        },
        {
          titulo: "Implemente as variantes",
          texto: "Uma classe (ou função) por comportamento real.",
        },
        {
          titulo: "Injete na borda",
          texto: "Quem monta o app escolhe a implementação; o domínio só recebe o contrato.",
        },
      ],
    },
    {
      tipo: "quando",
      usar: [
        "Várias implementações do mesmo papel.",
        "Cliente estável quando nasce variante nova.",
        "Testes com fake atrás do mesmo contrato.",
      ],
      evitar: [
        "Uma variante só, sem fronteira de teste.",
        "Contrato que força o cliente a conhecer os filhos.",
      ],
    },
  ],
};
