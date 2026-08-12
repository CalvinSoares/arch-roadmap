import type { Conceito } from "@/shared/types/conceito";
import { gof } from "@/content/conceitos/_nascimento";

const MERMAID = `classDiagram
    class Comando {
        <<interface>>
        +executar()
        +desfazer()
    }
    class ColarTexto {
        -documento
        -texto
        -posicao
        +executar()
        +desfazer()
    }
    class Historico {
        -pilha
        +executarERegistrar(cmd)
        +desfazerUltimo()
    }
    Comando <|.. ColarTexto
    Historico --> Comando : empilha`;

const CAMADAS = [
  { id: "invocador", titulo: "Invocador", descricao: "Dispara o comando sem saber o que ele faz" },
  {
    id: "comando",
    titulo: "Comando",
    descricao: "A ação virada objeto: dados + executar/desfazer — coração do padrão",
    destaque: true,
  },
  { id: "receptor", titulo: "Receptor", descricao: "Quem sabe fazer o trabalho de verdade" },
];

const EXEMPLOS = [
  {
    lang: "typescript" as const,
    code: `interface Comando {
  executar(): void;
  desfazer(): void;
}

class Documento {
  texto = "";
}

// A acao vira objeto: carrega os dados que ela precisa para se desfazer
class ColarTexto implements Comando {
  constructor(
    private doc: Documento,
    private trecho: string,
    private posicao: number,
  ) {}

  executar(): void {
    const d = this.doc;
    d.texto = d.texto.slice(0, this.posicao) + this.trecho + d.texto.slice(this.posicao);
  }

  desfazer(): void {
    const d = this.doc;
    d.texto = d.texto.slice(0, this.posicao) + d.texto.slice(this.posicao + this.trecho.length);
  }
}

// O invocador nao conhece nenhum comando concreto
class Historico {
  private pilha: Comando[] = [];

  executar(cmd: Comando): void {
    cmd.executar();
    this.pilha.push(cmd);
  }

  desfazer(): void {
    this.pilha.pop()?.desfazer();
  }
}

const doc = new Documento();
const h = new Historico();
h.executar(new ColarTexto(doc, "olá", 0));
h.desfazer(); // volta ao estado anterior`,
  },
  {
    lang: "python" as const,
    code: `from abc import ABC, abstractmethod

class Comando(ABC):
    @abstractmethod
    def executar(self): ...
    @abstractmethod
    def desfazer(self): ...

class Documento:
    def __init__(self):
        self.texto = ""

# A acao vira objeto: guarda o que precisa para se desfazer
class ColarTexto(Comando):
    def __init__(self, doc, trecho, posicao):
        self._doc, self._trecho, self._pos = doc, trecho, posicao

    def executar(self):
        d = self._doc
        d.texto = d.texto[: self._pos] + self._trecho + d.texto[self._pos :]

    def desfazer(self):
        d = self._doc
        fim = self._pos + len(self._trecho)
        d.texto = d.texto[: self._pos] + d.texto[fim:]

# O invocador nao conhece nenhum comando concreto
class Historico:
    def __init__(self):
        self._pilha = []

    def executar(self, cmd):
        cmd.executar()
        self._pilha.append(cmd)

    def desfazer(self):
        if self._pilha:
            self._pilha.pop().desfazer()

doc, h = Documento(), Historico()
h.executar(ColarTexto(doc, "ola", 0))
h.desfazer()`,
  },
];

export const command: Conceito = {
  slug: "command",
  titulo: "Command",
  categoria: "comportamental",
  resumo:
    "Transforma uma ação em objeto, com os dados de que ela precisa. Isso permite enfileirar, agendar, registrar e desfazer operações — e desacopla quem pede de quem executa.",
  tags: ["undo", "fila", "acao-como-objeto", "gof"],
  dificuldade: "intermediario",
  tempoLeitura: 7,
  nasceu: gof(),
  ondeAparece: [
    {
      onde: "Ações do Redux",
      explicacao:
        "Um objeto que descreve o que fazer, sem executar nada — logável, serializável e reexecutável.",
    },
    {
      onde: "Filas de job",
      explicacao:
        "O trabalho vira dado, atravessa a fila e é executado por outro processo em outro momento.",
    },
    {
      onde: "Undo do editor",
      explicacao:
        "Cada operação sabe se desfazer, e a pilha de comandos é o histórico.",
    },
  ],
  emUmaLinha: {
    lang: "typescript",
    code: `// Ação vira objeto: executar e desfazer.
historico.push(new ApagarTexto(sel));
historico.at(-1).executar();`,
  },
  custo: {
    indirecoes: 1,
    cobra: [
      "Cada ação vira um objeto com ciclo de vida próprio, em vez de uma chamada direta",
      "Suportar undo exige guardar estado suficiente para reverter, o que nem toda ação torna simples",
    ],
    naoValeSe:
      "a ação não precisa ser enfileirada, desfeita nem registrada — sem isso, chamar o método direto é mais simples.",
  },
  relacionados: ["memento", "observer", "saga"],
  problema: [
    "Botões, atalhos e menus disparam ações, e cada um acaba conhecendo o objeto que faz o trabalho e como chamá-lo — o mesmo comportamento reimplementado em três lugares.",
    "Requisitos como desfazer, refazer, fila de execução, retry e log de auditoria exigem tratar 'a ação' como algo que se guarda. Uma chamada de método direta não se guarda: ela acontece e some.",
  ],
  solucao: [
    "Encapsular a ação num objeto que carrega os parâmetros e expõe `executar()` (e, quando aplicável, `desfazer()`). A ação passa a ser um valor: dá para colocar numa lista, mandar pela rede, salvar em disco.",
    "O invocador (botão, fila, agendador) depende só da interface Comando. Trocar o que um botão faz vira trocar o objeto que ele segura, sem tocar no botão.",
  ],
  quandoUsar: [
    "Você precisa de desfazer/refazer, ou de um histórico auditável de operações.",
    "As ações precisam ser enfileiradas, agendadas para depois ou reexecutadas em caso de falha.",
    "O mesmo comportamento é disparado por vários gatilhos (menu, atalho, botão, API).",
  ],
  quandoEvitar: [
    "A ação é uma chamada simples, sem histórico nem fila — um objeto por operação é cerimônia pura.",
    "O estado necessário para desfazer é grande ou volátil demais para caber no comando.",
  ],
  mermaid: MERMAID,
  camadas: CAMADAS,
  exemplos: EXEMPLOS,
  blocos: [
    {
      tipo: "tldr",
      texto:
        "Em vez de chamar `documento.colar(texto)`, você cria um objeto `ColarTexto(documento, texto, posição)` com `executar()` e `desfazer()`. Como a ação virou valor, ela pode ser empilhada para o Ctrl+Z, posta numa fila, gravada num log ou repetida após falha.",
    },
    {
      tipo: "analogia",
      emoji: "🧾",
      titulo: "A comanda do restaurante",
      texto:
        "O garçom não vai à cozinha explicar como grelhar — ele escreve uma comanda e a prende no varal. A comanda é a ação virada papel: tem tudo que a cozinha precisa, pode esperar na fila, ser feita fora de ordem, ser reimpressa se sumir, e no fim do dia vira o histórico do movimento. O garçom não sabe cozinhar; a cozinha não sabe quem é a mesa 12.",
    },
    {
      tipo: "secao",
      id: "problema",
      titulo: "O problema",
      resumo: [
        "Uma chamada de método é um evento efêmero: ela acontece e desaparece. Não dá para adiar, repetir, inspecionar antes de rodar nem reverter depois.",
        "Requisitos muito comuns — Ctrl+Z, fila de jobs, retry, auditoria, macro — todos pedem a mesma coisa: tratar a intenção como dado, não como salto de execução.",
      ],
      extensao: [
        "Há também o acoplamento entre gatilho e execução. Sem o padrão, o handler do botão conhece o serviço, monta os argumentos e chama. Multiplique por menu, atalho de teclado e endpoint de API e você tem a mesma lógica em três lugares, divergindo com o tempo.",
        "O Command resolve os dois de uma vez porque objetiviza a intenção. E é o mesmo raciocínio que sustenta padrões bem maiores: um evento em **Event Sourcing** é um comando já executado e imutável; um passo de **Saga** é um comando com sua compensação ao lado. Reconhecer o Command ajuda a ler essas arquiteturas.",
        "Cuidado com uma confusão comum: em CQRS, 'Command' nomeia o lado de escrita (comando × consulta) e nem sempre implica este padrão. São ideias compatíveis, mas de escalas diferentes — uma é sobre um objeto, a outra sobre a arquitetura.",
      ],
    },
    {
      tipo: "secao",
      id: "desfazer",
      titulo: "Como desfazer de verdade",
      resumo: [
        "Existem duas estratégias, e escolher errado é a principal fonte de bug do padrão: guardar a operação inversa ou guardar o estado anterior.",
      ],
      extensao: [
        "A **operação inversa** é econômica: colar guarda posição e tamanho, e desfazer recorta aquele trecho. Funciona enquanto a ação for reversível por cálculo — e falha silenciosamente quando não é (ordenar uma lista destrói a ordem original; aplicar 'maiúsculas' destrói a caixa anterior).",
        "O **estado anterior** é o Memento: antes de executar, o comando guarda um instantâneo do que vai mudar, e desfazer restaura. É sempre correto e custa memória proporcional ao que foi tocado. Para edições pontuais é a escolha segura.",
        "Na prática se mistura: comandos com inverso barato e exato usam o inverso; o resto usa memento do trecho afetado. O erro clássico é assumir que toda ação tem inverso — o teste que pega isso é executar, desfazer e comparar com o estado original byte a byte.",
      ],
    },
    {
      tipo: "ilustracao",
      arquetipo: "fluxo",
      atores: [
        { id: "botao", label: "Botão / atalho" },
        { id: "cmd", label: "ColarTexto", destaque: true },
        { id: "hist", label: "Histórico", destaque: true },
        { id: "doc", label: "Documento" },
      ],
      setas: [
        { label: "cria com os dados" },
        { label: "registra na pilha" },
        { label: "executar() aplica" },
      ],
      legenda:
        "O gatilho só monta o objeto; quem decide executar e guardar é o histórico. Como o comando ficou na pilha, o Ctrl+Z tem a quem pedir desfazer.",
    },
    {
      tipo: "ilustracao",
      arquetipo: "antes-depois",
      antes: {
        titulo: "Sem Command: a ação é um salto",
        itens: [
          "o handler do botão chama documento.colar() direto",
          "menu, atalho e API repetem a mesma montagem",
          "não há o que empilhar: Ctrl+Z precisa de lógica própria",
          "para auditar, cada chamada precisa lembrar de logar",
        ],
        nota: "A intenção do usuário nunca existe como dado — ela vira execução imediatamente e não deixa rastro reaproveitável.",
      },
      depois: {
        titulo: "Com Command: a ação é um objeto",
        itens: [
          "os três gatilhos criam o mesmo ColarTexto",
          "o histórico empilha e desfaz sem conhecer comandos concretos",
          "a fila pode adiar, repetir ou distribuir a execução",
          "auditoria é serializar a pilha",
        ],
        nota: "O custo é uma classe por operação e a disciplina de manter executar/desfazer simétricos — sem isso, o Ctrl+Z corrompe o documento.",
      },
      legenda:
        "O ganho não é evitar o acoplamento em si, é fazer a intenção existir como valor. Tudo o que se pede depois — desfazer, fila, retry, log — é consequência disso.",
    },
    {
      tipo: "camadas-nav",
      titulo: "Navegue pelas camadas",
      camadas: [
        {
          id: "invocador",
          titulo: "Invocador",
          curto: "dispara sem saber o quê",
          detalhe:
            "Botão, atalho, item de menu, worker de fila ou agendador. Guarda uma referência a um Comando e chama `executar()`. É o que permite reconfigurar a interface sem tocar na lógica.",
          exemplo: "botaoColar.onClick = () => historico.executar(cmd);",
          seViolar:
            "invocador que faz `if (cmd instanceof ColarTexto)` voltou a conhecer os concretos e perdeu a razão de existir.",
        },
        {
          id: "comando",
          titulo: "Comando",
          curto: "a ação com seus dados",
          detalhe:
            "Guarda tudo que a operação precisa (receptor e parâmetros) e expõe `executar()`/`desfazer()`. Deve ser autocontido: se depender de estado global que muda, o desfazer erra o alvo.",
          exemplo: "new ColarTexto(doc, 'olá', 0)",
          seViolar:
            "comando que lê a posição do cursor no momento do desfazer usa um valor diferente do que usou ao executar — e o documento corrompe.",
        },
        {
          id: "receptor",
          titulo: "Receptor",
          curto: "quem sabe fazer",
          detalhe:
            "O objeto de domínio que realmente executa (o documento, o pedido, a conta). Não conhece o padrão e continua utilizável diretamente.",
          exemplo: "class Documento { texto: string }",
          seViolar:
            "receptor que registra a si mesmo no histórico assumiu a responsabilidade do invocador e amarra o domínio à infraestrutura de undo.",
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
          titulo: "Editor com desfazer ilimitado",
          cenario:
            "Um editor de texto ou de imagem precisa de Ctrl+Z e Ctrl+Y confiáveis, incluindo ações compostas como 'substituir tudo', que altera dezenas de trechos.",
          aplicacao:
            "Cada edição vira um comando; ações compostas viram um comando composto que executa e desfaz os filhos na ordem inversa. O histórico é uma pilha de comandos, e refazer é uma segunda pilha.",
          tradeoff:
            "O histórico cresce com o uso e precisa de teto (últimas N ações) ou de snapshots periódicos. E toda operação nova nasce com a obrigação de implementar o inverso corretamente — esquecer disso só aparece quando o usuário desfaz.",
        },
        {
          titulo: "Fila de jobs assíncronos",
          cenario:
            "Emitir nota fiscal, gerar relatório e enviar e-mail em massa não podem bloquear a requisição do usuário nem se perder se o processo cair.",
          aplicacao:
            "A requisição cria um comando serializado e o publica na fila; workers consomem e executam. Como o comando é dado, ele sobrevive a restart, pode ser repetido em caso de falha e fica no log para auditoria.",
          tradeoff:
            "Reexecução exige idempotência: um comando 'cobrar cartão' repetido por retry cobra duas vezes se não houver chave de idempotência. E comandos serializados versionam mal — um deploy que muda os campos precisa saber ler os antigos que ainda estão na fila.",
        },
        {
          titulo: "Ações de teclado configuráveis",
          cenario:
            "Uma IDE permite ao usuário remapear atalhos, e a mesma ação existe no menu, na paleta de comandos e num botão da barra.",
          aplicacao:
            "Cada ação é um comando registrado num catálogo por id. Atalhos, menus e a paleta apontam para ids; remapear é trocar a associação tecla → id, sem tocar em nenhuma implementação.",
          tradeoff:
            "O catálogo vira uma superfície pública que precisa de estabilidade: renomear o id de um comando quebra os atalhos que o usuário configurou e as extensões que dependem dele.",
        },
      ],
    },
    {
      tipo: "armadilhas",
      itens: [
        {
          titulo: "Desfazer assimétrico",
          texto:
            "O bug mais comum e mais caro: `executar` e `desfazer` que não são exatamente inversos. Funciona nos testes com um passo e corrompe o documento depois de dez desfazeres seguidos. A verificação que pega isso é de propriedade — executar uma sequência aleatória, desfazer tudo e exigir que o estado final seja idêntico ao inicial.",
        },
        {
          titulo: "Comando que depende de estado externo",
          texto:
            "Se o comando lê a seleção atual, o usuário logado ou o relógio no momento do `desfazer` em vez de ter congelado isso na criação, ele desfaz a coisa errada. Comando é um registro do que aconteceu: todos os dados relevantes entram nele no momento da criação.",
        },
        {
          titulo: "Uma classe por clique",
          texto:
            "Aplicar Command a tudo produz dezenas de classes de três linhas que só repassam uma chamada, sem histórico, sem fila e sem desfazer. Se nenhuma das capacidades do padrão está em uso, o que existe é indireção pura — chamar o método direto é a resposta certa.",
        },
      ],
    },
    {
      tipo: "quando",
      usar: [
        "Você precisa de desfazer/refazer ou de histórico auditável.",
        "As ações precisam ser enfileiradas, adiadas ou repetidas após falha.",
        "O mesmo comportamento é disparado por vários gatilhos e deve ficar num lugar só.",
      ],
      evitar: [
        "A ação é uma chamada direta sem histórico, fila ou reversão.",
        "Desfazer exigiria guardar mais estado do que a operação vale.",
        "As ações mudam de assinatura com frequência e ficam serializadas em filas de longa duração.",
      ],
    },
  ],
};
