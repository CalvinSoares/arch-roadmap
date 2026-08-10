import type { Conceito } from "@/shared/types/conceito";

const MERMAID = `classDiagram
    class Editor {
        -texto
        -cursor
        +salvar() Memento
        +restaurar(m)
    }
    class Memento {
        <<opaco>>
        -estado
    }
    class Historico {
        -pilha
        +guardar(m)
        +voltar() Memento
    }
    Editor ..> Memento : cria
    Historico o-- Memento : guarda sem ler`;

const CAMADAS = [
  {
    id: "originador",
    titulo: "Originador",
    descricao: "O objeto com estado; só ele sabe ler e escrever o memento — coração do padrão",
    destaque: true,
  },
  { id: "memento", titulo: "Memento", descricao: "O instantâneo opaco: dados sem comportamento" },
  { id: "zelador", titulo: "Zelador", descricao: "Guarda os mementos sem nunca abrir o conteúdo" },
];

const EXEMPLOS = [
  {
    lang: "typescript" as const,
    code: `// Memento: opaco para fora, legivel so pelo originador
class MementoEditor {
  constructor(
    readonly texto: string,
    readonly cursor: number,
  ) {}
}

class Editor {
  private texto = "";
  private cursor = 0;

  digitar(t: string): void {
    this.texto += t;
    this.cursor = this.texto.length;
  }

  // captura: um instantaneo do que importa
  salvar(): MementoEditor {
    return new MementoEditor(this.texto, this.cursor);
  }

  // restauracao: so o originador sabe remontar seu estado
  restaurar(m: MementoEditor): void {
    this.texto = m.texto;
    this.cursor = m.cursor;
  }

  toString(): string {
    return \`"\${this.texto}" (cursor \${this.cursor})\`;
  }
}

// Zelador: guarda e devolve, nunca inspeciona
class Historico {
  private pilha: MementoEditor[] = [];
  guardar(m: MementoEditor): void {
    this.pilha.push(m);
  }
  voltar(): MementoEditor | undefined {
    return this.pilha.pop();
  }
}

const ed = new Editor();
const h = new Historico();
h.guardar(ed.salvar());
ed.digitar("olá mundo");
const antes = h.voltar();
if (antes) ed.restaurar(antes);
console.log(ed.toString()); // "" (cursor 0)`,
  },
  {
    lang: "python" as const,
    code: `from dataclasses import dataclass

# Memento: dados congelados, sem comportamento
@dataclass(frozen=True)
class MementoEditor:
    texto: str
    cursor: int

class Editor:
    def __init__(self):
        self._texto = ""
        self._cursor = 0

    def digitar(self, t):
        self._texto += t
        self._cursor = len(self._texto)

    # captura
    def salvar(self):
        return MementoEditor(self._texto, self._cursor)

    # restauracao: so o originador remonta seu estado
    def restaurar(self, m):
        self._texto = m.texto
        self._cursor = m.cursor

    def __str__(self):
        return f'"{self._texto}" (cursor {self._cursor})'

# Zelador: guarda e devolve, nunca inspeciona
class Historico:
    def __init__(self):
        self._pilha = []

    def guardar(self, m):
        self._pilha.append(m)

    def voltar(self):
        return self._pilha.pop() if self._pilha else None

ed, h = Editor(), Historico()
h.guardar(ed.salvar())
ed.digitar("ola mundo")
ed.restaurar(h.voltar())
print(ed)  # "" (cursor 0)`,
  },
];

export const memento: Conceito = {
  slug: "memento",
  titulo: "Memento",
  categoria: "comportamental",
  resumo:
    "Captura o estado interno de um objeto num instantâneo opaco que pode ser guardado e restaurado depois, sem expor os detalhes desse estado a quem o guarda.",
  tags: ["snapshot", "undo", "encapsulamento", "gof"],
  dificuldade: "intermediario",
  tempoLeitura: 6,
  relacionados: ["command", "event-sourcing", "state"],
  problema: [
    "Para oferecer desfazer, checkpoint ou 'descartar alterações', é preciso guardar como o objeto estava antes — mas ler seus campos de fora quebra o encapsulamento que o objeto passou a existência protegendo.",
    "Se o histórico conhece a estrutura interna do objeto, qualquer mudança nessa estrutura quebra o histórico — e o objeto perde a liberdade de evoluir.",
  ],
  solucao: [
    "O próprio objeto produz um memento com seu estado e sabe se restaurar a partir dele. Quem guarda trata o memento como caixa-preta: armazena e devolve, sem ler.",
    "O encapsulamento fica intacto: os campos internos nunca são expostos, e o objeto pode mudar sua representação desde que continue lendo os mementos que produziu.",
  ],
  quandoUsar: [
    "Você precisa de desfazer, checkpoints ou 'cancelar edição' restaurando o estado anterior.",
    "O estado a preservar é interno e não deveria ser exposto a quem o armazena.",
    "Uma operação arriscada precisa de um ponto de retorno antes de começar.",
  ],
  quandoEvitar: [
    "O estado é grande e muda com frequência — instantâneos completos consomem memória rápido.",
    "A operação tem um inverso barato e exato: aplicar o inverso custa menos que guardar o estado.",
    "O objeto é imutável: aí o próprio valor antigo já é o memento, sem precisar do padrão.",
  ],
  mermaid: MERMAID,
  camadas: CAMADAS,
  exemplos: EXEMPLOS,
  blocos: [
    {
      tipo: "tldr",
      texto:
        "O objeto entrega um instantâneo de si mesmo que só ele sabe ler. O histórico guarda essa caixa-preta e devolve quando pedido — assim dá para voltar no tempo sem que ninguém de fora conheça os campos internos.",
    },
    {
      tipo: "analogia",
      emoji: "🎮",
      titulo: "O save do videogame",
      texto:
        "Quando você salva o jogo antes do chefão, o console grava um arquivo que só o jogo sabe interpretar — posição, vida, inventário, tudo num formato interno. O sistema de arquivos guarda aquilo como um monte de bytes e não faz ideia do que significa. Se o jogo mudar como representa o inventário na próxima versão, o sistema de arquivos não precisa saber de nada.",
    },
    {
      tipo: "secao",
      id: "problema",
      titulo: "O problema",
      resumo: [
        "Voltar atrás exige saber como era antes. A forma ingênua é o histórico ler os campos do objeto e guardá-los — o que expõe exatamente o que o encapsulamento protegia.",
        "Quando isso acontece, o objeto congela: mudar um campo interno quebra o histórico, o teste do histórico e às vezes o formato salvo em disco.",
      ],
      extensao: [
        "A saída do padrão é inverter quem produz o instantâneo. O objeto se conhece, então é ele quem captura e quem restaura; o zelador só transporta. Isso preserva a fronteira e ainda deixa o objeto livre para mudar sua representação, desde que continue capaz de ler os mementos antigos.",
        "A relação com **Command** é de complemento, não de concorrência. O Command guarda a intenção ('colar este texto aqui'); o Memento guarda o estado ('o documento estava assim'). Comandos com inverso exato e barato dispensam memento; comandos destrutivos (ordenar, formatar, substituir tudo) precisam dele para desfazer corretamente.",
        "Há também um parentesco conceitual com **Event Sourcing**: lá, o estado é reconstruído reaplicando eventos, e os snapshots existem justamente para não reaplicar tudo desde o começo — snapshots que são, em essência, mementos.",
      ],
    },
    {
      tipo: "secao",
      id: "opacidade",
      titulo: "Como manter o memento realmente opaco",
      resumo: [
        "A opacidade é o coração do padrão e a parte que mais se perde na prática, porque poucas linguagens oferecem o controle de visibilidade que o GoF assumia.",
      ],
      extensao: [
        "Em linguagens com classes aninhadas privadas (Java, C#), o memento pode ser uma classe interna do originador: só ele enxerga os campos, e o zelador recebe apenas uma interface vazia de marcação.",
        "Em TypeScript e Python, a opacidade é convenção reforçada por tipo: o zelador recebe o memento tipado como algo sem membros úteis, e o originador faz o cast de volta. Não é impenetrável, mas comunica a intenção — e o teste que importa é se algum código fora do originador lê os campos.",
        "O critério prático: se você precisar mudar um campo interno do objeto e isso obrigar a mexer no zelador, a opacidade já foi perdida, independentemente do que digam os modificadores de acesso.",
      ],
    },
    {
      tipo: "ilustracao",
      arquetipo: "fluxo",
      atores: [
        { id: "editor", label: "Editor", destaque: true },
        { id: "memento", label: "Memento (opaco)", destaque: true },
        { id: "hist", label: "Histórico" },
        { id: "volta", label: "Editor restaurado", destaque: true },
      ],
      setas: [
        { label: "salvar() captura" },
        { label: "guarda sem ler" },
        { label: "devolve → restaurar()", tracejada: true },
      ],
      legenda:
        "O instantâneo sai do editor e volta para o editor. O histórico é só um depósito no meio do caminho — ele nunca abre a caixa.",
    },
    {
      tipo: "ilustracao",
      arquetipo: "antes-depois",
      antes: {
        titulo: "Sem Memento: o histórico bisbilhota",
        itens: [
          "o histórico lê editor.texto e editor.cursor direto",
          "os campos internos precisam virar públicos",
          "renomear um campo quebra o histórico",
          "cada novo campo precisa ser lembrado em dois lugares",
        ],
        nota: "O objeto perde a liberdade de mudar por dentro: sua estrutura interna virou contrato público sem ninguém ter decidido isso.",
      },
      depois: {
        titulo: "Com Memento: o objeto se retrata",
        itens: [
          "o editor produz e consome o próprio instantâneo",
          "os campos continuam privados",
          "mudar a representação interna não afeta o histórico",
          "o zelador guarda caixas-pretas indistintas",
        ],
        nota: "O custo é memória: cada instantâneo copia o estado relevante, e um histórico longo de objetos grandes pesa — daí os limites de profundidade e os snapshots espaçados.",
      },
      legenda:
        "A troca é encapsulamento por espaço. Quando o estado é pequeno, é quase de graça; quando é grande, o padrão continua certo mas pede política de retenção.",
    },
    {
      tipo: "camadas-nav",
      titulo: "Navegue pelas camadas",
      camadas: [
        {
          id: "originador",
          titulo: "Originador",
          curto: "captura e restaura a si mesmo",
          detalhe:
            "É o único que conhece a estrutura do memento. Decide o que entra no instantâneo — normalmente o mínimo necessário para voltar ao estado, não o objeto inteiro.",
          exemplo: "salvar() { return new MementoEditor(this.texto, this.cursor) }",
          seViolar:
            "originador que aceita restaurar a partir de um objeto montado por terceiros abre a porta para estados inválidos que nenhuma regra criou.",
        },
        {
          id: "memento",
          titulo: "Memento",
          curto: "dados congelados, sem comportamento",
          detalhe:
            "Deve ser imutável: se alguém alterar o instantâneo depois de guardado, o passado muda e o desfazer leva a um estado que nunca existiu. Campos somente-leitura não são detalhe estético aqui.",
          exemplo: "class MementoEditor { constructor(readonly texto: string, readonly cursor: number) {} }",
          seViolar:
            "memento mutável faz o histórico apontar todo para o mesmo estado atual — o bug aparece como 'desfazer não faz nada'.",
        },
        {
          id: "zelador",
          titulo: "Zelador",
          curto: "guarda sem entender",
          detalhe:
            "Gerencia a coleção de instantâneos: ordem, limite de tamanho, descarte. Trabalha com o memento como valor opaco e por isso serve a qualquer originador.",
          exemplo: "class Historico { private pilha: MementoEditor[] = [] }",
          seViolar:
            "zelador que lê um campo do memento para decidir algo criou um acoplamento invisível que só quebra quando o originador evoluir.",
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
          titulo: "Formulário longo com 'descartar alterações'",
          cenario:
            "Um cadastro com cinquenta campos e várias abas permite editar à vontade e, no fim, descartar tudo e voltar ao que estava salvo.",
          aplicacao:
            "Ao abrir a edição, o formulário captura um memento do estado inicial. 'Descartar' restaura esse instantâneo de uma vez, sem precisar reverter campo a campo nem recarregar do servidor.",
          tradeoff:
            "Se outra pessoa alterou o registro nesse meio-tempo, restaurar o instantâneo local ressuscita dados velhos ao salvar — o memento precisa carregar a versão do registro para detectar o conflito.",
        },
        {
          titulo: "Checkpoint antes de operação em lote",
          cenario:
            "Um reajuste de preços altera milhares de produtos e, se algo der errado no meio, é preciso voltar ao estado anterior sem restaurar backup do banco inteiro.",
          aplicacao:
            "Antes de começar, o serviço captura mementos dos itens afetados e os guarda. Uma falha dispara a restauração dos instantâneos, revertendo apenas o que foi tocado.",
          tradeoff:
            "Memória e tempo crescem com o tamanho do lote, e o instantâneo envelhece: alterações concorrentes feitas durante a operação são desfeitas junto, sem que ninguém tenha pedido isso.",
        },
        {
          titulo: "Snapshot em Event Sourcing",
          cenario:
            "Uma conta com duzentos mil eventos levaria segundos para ser reconstruída do zero a cada consulta.",
          aplicacao:
            "A cada N eventos o agregado produz um memento do seu estado. A reconstrução carrega o último instantâneo e aplica só os eventos posteriores.",
          tradeoff:
            "O snapshot vira formato persistido e ganha o problema de versionamento: mudar o estado interno do agregado exige conseguir ler os instantâneos antigos ou descartá-los e reprocessar tudo.",
        },
      ],
    },
    {
      tipo: "armadilhas",
      itens: [
        {
          titulo: "Cópia rasa que compartilha referência",
          texto:
            "Guardar `this.itens` num memento sem copiar a lista significa guardar um ponteiro para a lista viva. O objeto continua alterando aquela mesma lista, e o 'instantâneo' acompanha as mudanças. Na hora de restaurar, nada volta — e o bug é dos mais difíceis de enxergar, porque o código parece certo.",
        },
        {
          titulo: "Histórico sem teto",
          texto:
            "Um memento por tecla digitada, guardados indefinidamente, é vazamento de memória com outro nome. Toda pilha de desfazer precisa de política: limite de profundidade, agrupamento de ações próximas no tempo ou instantâneos espaçados com comandos entre eles.",
        },
        {
          titulo: "Zelador que aprende a ler",
          texto:
            "Basta uma necessidade — 'quero mostrar na interface o texto de cada ponto do histórico' — para alguém abrir o memento no zelador. Feito isso, o encapsulamento acabou e o padrão virou uma classe a mais sem benefício. Se o histórico precisa exibir algo, o originador deve fornecer um rótulo junto, não abrir a caixa.",
        },
      ],
    },
    {
      tipo: "quando",
      usar: [
        "Você precisa de desfazer, checkpoint ou descarte de alterações.",
        "O estado a preservar é interno e não deve ser exposto a quem guarda.",
        "Uma operação arriscada precisa de ponto de retorno.",
      ],
      evitar: [
        "O estado é grande e muda a todo instante.",
        "A operação tem inverso exato e barato — guarde a operação, não o estado.",
        "O objeto já é imutável: o valor anterior é o próprio instantâneo.",
      ],
    },
  ],
};
