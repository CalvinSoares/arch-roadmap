import type { Conceito } from "@/shared/types/conceito";
import { gof } from "@/content/conceitos/_nascimento";

const MERMAID = `classDiagram
    class Mediador {
        <<interface>>
        +notificar(origem, evento)
    }
    class DialogoReserva {
        -destino
        -data
        -botao
        +notificar(origem, evento)
    }
    class Componente {
        <<abstract>>
        #mediador
    }
    Mediador <|.. DialogoReserva
    Componente --> Mediador : avisa
    DialogoReserva --> Componente : coordena`;

const CAMADAS = [
  { id: "colegas", titulo: "Colegas", descricao: "Componentes que só conhecem o mediador" },
  {
    id: "mediador",
    titulo: "Mediador",
    descricao: "Concentra as regras de interação entre os colegas — coração do padrão",
    destaque: true,
  },
];

const EXEMPLOS = [
  {
    lang: "typescript" as const,
    code: `interface Mediador {
  notificar(origem: string, evento: string): void;
}

class Campo {
  valor = "";
  habilitado = true;
  constructor(
    private nome: string,
    private mediador: Mediador,
  ) {}

  digitar(v: string): void {
    this.valor = v;
    // o campo nao sabe quem se importa — so avisa
    this.mediador.notificar(this.nome, "mudou");
  }
}

// O mediador concentra TODAS as regras de interacao
class DialogoReserva implements Mediador {
  destino = new Campo("destino", this);
  data = new Campo("data", this);
  botao = { habilitado: false };

  notificar(origem: string, evento: string): void {
    if (evento !== "mudou") return;

    // regra 1: trocar o destino invalida a data escolhida
    if (origem === "destino") this.data.valor = "";

    // regra 2: so libera o botao com os dois preenchidos
    this.botao.habilitado = Boolean(this.destino.valor && this.data.valor);
  }
}

const d = new DialogoReserva();
d.destino.digitar("Lisboa");
d.data.digitar("2026-09-01");
console.log(d.botao.habilitado); // true`,
  },
  {
    lang: "python" as const,
    code: `class Campo:
    def __init__(self, nome, mediador):
        self._nome, self._mediador = nome, mediador
        self.valor = ""

    def digitar(self, v):
        self.valor = v
        # o campo nao sabe quem se importa — so avisa
        self._mediador.notificar(self._nome, "mudou")

# O mediador concentra TODAS as regras de interacao
class DialogoReserva:
    def __init__(self):
        self.destino = Campo("destino", self)
        self.data = Campo("data", self)
        self.botao_habilitado = False

    def notificar(self, origem, evento):
        if evento != "mudou":
            return

        # regra 1: trocar o destino invalida a data escolhida
        if origem == "destino":
            self.data.valor = ""

        # regra 2: so libera o botao com os dois preenchidos
        self.botao_habilitado = bool(self.destino.valor and self.data.valor)

d = DialogoReserva()
d.destino.digitar("Lisboa")
d.data.digitar("2026-09-01")
print(d.botao_habilitado)  # True`,
  },
];

export const mediator: Conceito = {
  slug: "mediator",
  titulo: "Mediator",
  categoria: "comportamental",
  resumo:
    "Concentra num objeto as regras de interação entre vários componentes, que passam a conversar através dele em vez de se conhecerem diretamente.",
  tags: ["acoplamento", "coordenacao", "ui", "gof"],
  dificuldade: "intermediario",
  tempoLeitura: 6,
  nasceu: gof(),
  ondeAparece: [
    {
      onde: "A store do Redux",
      explicacao:
        "Componentes não conversam entre si: todos falam com a store, que coordena as consequências.",
    },
    {
      onde: "Um event bus",
      explicacao:
        "Publicadores e assinantes se desconhecem; o barramento no meio é quem sabe ligar os dois.",
    },
  ],
  emUmaLinha: {
    lang: "typescript",
    code: `// Colegas falam com o mediador, não entre si.
mediador.notificar(this, "clique");`,
  },
  custo: {
    indirecoes: 1,
    cobra: [
      "O mediador tende a concentrar lógica e crescer até virar um objeto-deus difícil de manter",
      "Uma indireção a mais entre colegas que antes se falavam diretamente",
    ],
    naoValeSe:
      "há poucos componentes e a comunicação entre eles é simples — centralizar tudo só cria um gargalo de manutenção.",
  },
  relacionados: ["observer", "facade", "command"],
  problema: [
    "Componentes que se coordenam acabam se conhecendo: o campo de destino chama o de data, que chama o botão, que consulta os dois. O grafo de dependências vira uma teia, e cada peça só funciona junto com as outras.",
    "Reaproveitar um componente noutra tela fica impossível: ele carrega referências a colegas que só existem no contexto original.",
  ],
  solucao: [
    "Introduzir um mediador que conhece todos os colegas e concentra as regras de interação. Cada componente avisa o mediador quando algo acontece e não conhece mais ninguém.",
    "A teia de conexões vira uma estrela: N componentes ligados a um centro. Mudar uma regra de interação é mexer num lugar só.",
  ],
  quandoUsar: [
    "Um conjunto de componentes se coordena com regras que não pertencem a nenhum deles individualmente.",
    "Você quer reaproveitar componentes que hoje carregam referências aos colegas.",
    "As regras de interação mudam com frequência e estão espalhadas.",
  ],
  quandoEvitar: [
    "São dois componentes com uma regra simples — o mediador só adiciona uma camada.",
    "A comunicação é um-para-muitos por notificação, sem regras entre os receptores: aí Observer é mais direto.",
    "O conjunto é grande e heterogêneo demais: o mediador vira o god object que ninguém quer manter.",
  ],
  mermaid: MERMAID,
  camadas: CAMADAS,
  exemplos: EXEMPLOS,
  blocos: [
    {
      tipo: "tldr",
      texto:
        "Em vez de o campo de destino conhecer o de data, que conhece o botão, todos avisam um mediador. Ele guarda as regras — 'trocar destino limpa a data', 'botão só habilita com os dois preenchidos' — e a teia de dependências vira uma estrela.",
    },
    {
      tipo: "analogia",
      emoji: "🗼",
      titulo: "A torre de controle",
      texto:
        "Pilotos não negociam pista entre si por rádio; seria caos com dez aviões e impossível com cem. Todos falam com a torre, que conhece a posição de cada um e dá as ordens. Nenhum piloto precisa saber quem mais está no ar — e um avião novo entra no espaço aéreo sem que ninguém seja apresentado a ele.",
    },
    {
      tipo: "secao",
      id: "problema",
      titulo: "O problema",
      resumo: [
        "Coordenação entre componentes tende a virar conhecimento mútuo. Cada regra nova adiciona uma referência, e o número de ligações cresce muito mais rápido que o número de peças.",
        "O efeito colateral é que nenhum componente é reaproveitável: ele só compila junto com os colegas que aprendeu a chamar.",
      ],
      extensao: [
        "A comparação inevitável é com **Observer**, e a diferença é onde mora a regra. No Observer, o sujeito emite um evento e os observadores decidem sozinhos o que fazer — a lógica fica distribuída entre eles, e o sujeito não sabe nem quantos existem. No Mediator, os colegas apenas relatam, e a decisão sobre o que acontece em consequência é do mediador, num lugar só.",
        "Isso torna os padrões complementares, não concorrentes: é muito comum implementar o canal de avisos com Observer e a lógica de reação com Mediator. O que importa é responder à pergunta 'onde vive a regra de interação?'.",
        "Com **Facade** a distinção é de direção. A facade simplifica o acesso de fora para dentro, e o subsistema nem sabe que ela existe. O mediador coordena de dentro, e os colegas o conhecem explicitamente. Facade é uma porta; mediador é um centro nervoso.",
      ],
    },
    {
      tipo: "secao",
      id: "risco",
      titulo: "O risco embutido: centralizar demais",
      resumo: [
        "O padrão troca muitas conexões por um ponto central — e esse ponto tende a engordar. É o único padrão do GoF cujo principal risco é o sucesso do próprio uso.",
      ],
      extensao: [
        "Cada regra nova de interação vai naturalmente para o mediador, porque é onde as regras moram. Depois de um ano, ele conhece quinze componentes e tem oitocentas linhas de condicionais — o god object que o padrão veio evitar, agora com um nome respeitável.",
        "O contorno é dividir por contexto em vez de por tela: um mediador por grupo coeso de componentes, não um por aplicação. Se dois grupos não têm regras entre si, não devem compartilhar mediador.",
        "O sinal de que passou do ponto é o mediador precisar consultar o estado de vários colegas para decidir cada coisa. Quando isso acontece, a lógica provavelmente é de domínio e deveria estar num modelo próprio, com o mediador apenas refletindo o resultado na interface.",
      ],
    },
    {
      tipo: "ilustracao",
      arquetipo: "antes-depois",
      antes: {
        titulo: "Sem Mediator: teia de conexões",
        itens: [
          "destino conhece data, data conhece botão, botão consulta os dois",
          "cada regra nova adiciona uma referência entre peças",
          "nenhum componente compila sozinho",
          "testar um campo exige montar a tela inteira",
        ],
        nota: "As ligações crescem muito mais rápido que as peças: com seis componentes que se coordenam, já são até quinze caminhos possíveis para uma mudança se propagar.",
      },
      depois: {
        titulo: "Com Mediator: uma estrela",
        itens: [
          "cada componente conhece só o mediador",
          "as regras de interação ficam num lugar só",
          "componentes viram reaproveitáveis em outras telas",
          "testar uma regra é testar o mediador com colegas falsos",
        ],
        nota: "O custo é a centralização: o mediador concentra conhecimento e tende a engordar. Sem disciplina para dividi-lo por contexto, ele vira o gargalo de manutenção.",
      },
      legenda:
        "O padrão não elimina a complexidade da coordenação — ele a reúne. Isso é bom enquanto o conjunto for coeso e ruim quando o mediador vira depósito de regras não relacionadas.",
    },
    {
      tipo: "ilustracao",
      arquetipo: "estrutura",
      blocos: [
        {
          id: "mediador",
          label: "DialogoReserva (mediador)",
          nota: "conhece todos e guarda as regras",
          destaque: true,
          filhos: [
            { id: "destino", label: "Campo destino", nota: "avisa 'mudou' e nada mais" },
            { id: "data", label: "Campo data", nota: "avisa 'mudou' e nada mais" },
            { id: "botao", label: "Botão reservar", nota: "só obedece ao mediador" },
          ],
        },
      ],
      legenda:
        "As setas que existiriam entre os três colegas desapareceram: nenhum deles tem referência aos outros, só ao centro. É isso que os torna reaproveitáveis fora desta tela.",
    },
    {
      tipo: "camadas-nav",
      titulo: "Navegue pelas camadas",
      camadas: [
        {
          id: "colega",
          titulo: "Colega",
          curto: "relata, não decide",
          detalhe:
            "Cuida do próprio comportamento e avisa o mediador quando algo relevante acontece. Não conhece os outros componentes nem as consequências do que reporta — é isso que permite usá-lo em outro contexto.",
          exemplo: "digitar(v) { this.valor = v; this.mediador.notificar('destino', 'mudou') }",
          seViolar:
            "colega que chama outro colega direto 'só neste caso' recriou a teia — e a exceção vira regra em poucos meses.",
        },
        {
          id: "mediador",
          titulo: "Mediador",
          curto: "concentra as regras de interação",
          detalhe:
            "Conhece os colegas e traduz cada aviso em ações sobre os demais. Deve conter apenas regras de coordenação; regra de negócio pertence ao domínio, não a ele.",
          exemplo: "if (origem === 'destino') this.data.valor = '';",
          seViolar:
            "mediador que calcula preço, valida CPF e chama a API acumulou o sistema inteiro e virou o god object clássico.",
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
          titulo: "Formulário com campos interdependentes",
          cenario:
            "Numa reserva de viagem, escolher o destino filtra as datas disponíveis, a data altera as tarifas, e o botão de confirmar só habilita quando tudo está coerente.",
          aplicacao:
            "Um mediador do diálogo recebe os avisos de cada campo e aplica as regras de dependência. Os campos viram componentes genéricos, usáveis em qualquer formulário.",
          tradeoff:
            "Regras de dependência complexas tornam o mediador difícil de ler, e a ordem em que ele atualiza os colegas passa a importar — atualizar o botão antes de limpar a data produz um estado momentâneo inválido.",
        },
        {
          titulo: "Sala de chat",
          cenario:
            "Participantes enviam mensagens que devem chegar aos demais, com regras de silenciamento, banimento e histórico.",
          aplicacao:
            "A sala é o mediador: recebe a mensagem de um participante e decide para quem entregar, aplicando as regras. Nenhum participante tem referência a outro — é o exemplo canônico do padrão.",
          tradeoff:
            "Como todo tráfego passa pelo centro, ele vira o gargalo de desempenho e o ponto único de falha; escalar a sala exige quebrá-la em várias ou distribuir o estado.",
        },
        {
          titulo: "Coordenação entre widgets de um painel",
          cenario:
            "Num dashboard, selecionar uma região no mapa filtra o gráfico de vendas, que ajusta a tabela, que atualiza os totais.",
          aplicacao:
            "Um mediador do painel recebe as seleções e propaga os filtros para os widgets interessados. Cada widget continua sendo um componente independente, testável e reaproveitável.",
          tradeoff:
            "Propagações em cadeia podem gerar laços (o gráfico ajusta a tabela, que reajusta o gráfico) — o mediador precisa de proteção contra reentrância, algo que raramente se prevê na primeira versão.",
        },
      ],
    },
    {
      tipo: "armadilhas",
      itens: [
        {
          titulo: "O mediador vira god object",
          texto:
            "É a armadilha principal e quase inevitável sem disciplina: como toda regra de interação pertence ao mediador, ele cresce sem limite natural. Quando passar de algumas centenas de linhas ou coordenar mais de meia dúzia de colegas, divida por contexto — vários mediadores pequenos são melhores que um onisciente.",
        },
        {
          titulo: "Notificações em laço",
          texto:
            "O mediador reage a um aviso alterando um colega, que emite outro aviso, que faz o mediador alterar o primeiro. Sem guarda de reentrância, isso vira recursão infinita ou piscada visível na interface. Alterações feitas pelo mediador precisam ser silenciosas ou marcadas para não realimentarem o ciclo.",
        },
        {
          titulo: "Confundir com Observer e perder os dois",
          texto:
            "Usar Observer esperando coordenação central espalha a regra entre os observadores; usar Mediator para simples difusão de eventos cria um centro sem propósito. A pergunta que resolve: existe regra sobre COMO os componentes reagem juntos? Se sim, Mediator. Se cada um decide sozinho, Observer.",
        },
      ],
    },
    {
      tipo: "quando",
      usar: [
        "Componentes se coordenam com regras que não pertencem a nenhum deles.",
        "Você quer reaproveitar peças que hoje conhecem os colegas.",
        "As regras de interação mudam bastante e estão espalhadas.",
      ],
      evitar: [
        "São dois componentes e uma regra simples.",
        "É difusão de eventos sem regra entre receptores — use Observer.",
        "O conjunto é grande e sem coesão: o mediador viraria um depósito.",
      ],
    },
  ],
};
