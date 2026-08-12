import type { Conceito } from "@/shared/types/conceito";

const EXEMPLOS = [
  {
    lang: "typescript" as const,
    code: `// ERRADO: um pool para tudo. A dependencia lenta consome as 100 vagas
// e derruba ate as rotas que nunca falam com ela.
const pool = criarPool({ max: 100 });

// CERTO: comparticoes. Cada dependencia tem um teto proprio,
// e o pior caso de uma nao alcanca as outras.
class Comparticao {
  private emUso = 0;

  constructor(private readonly limite: number) {}

  async executar<T>(fn: () => Promise<T>): Promise<T> {
    if (this.emUso >= this.limite) {
      // Rejeitar rapido e melhor que enfileirar sem limite:
      // fila infinita so adia a falha e piora a latencia de todos.
      throw new Error("comparticao cheia");
    }
    this.emUso++;
    try {
      return await fn();
    } finally {
      this.emUso--;
    }
  }
}

const recomendacao = new Comparticao(10);  // pode afogar sozinha
const pagamento    = new Comparticao(40);  // critico, tem folga
const catalogo     = new Comparticao(50);`,
  },
  {
    lang: "python" as const,
    code: `import asyncio

class Comparticao:
    """Teto de concorrencia por dependencia, com rejeicao rapida."""

    def __init__(self, limite: int):
        self._sem = asyncio.Semaphore(limite)

    async def executar(self, coro):
        # locked() antes de acquire(): queremos REJEITAR, nao enfileirar.
        if self._sem.locked():
            raise RuntimeError("comparticao cheia")
        async with self._sem:
            return await coro

# Cada dependencia com seu teto. A soma pode passar do pool total —
# o objetivo nao e reservar capacidade, e impedir que UMA tome tudo.
recomendacao = Comparticao(10)
pagamento = Comparticao(40)`,
  },
];

export const bulkhead: Conceito = {
  slug: "bulkhead",
  titulo: "Bulkhead",
  categoria: "resiliencia",
  resumo:
    "Recursos compartilhados propagam falha: se todas as chamadas disputam o mesmo pool, a dependência mais lenta consome tudo e derruba as rotas que nem falavam com ela. O anteparo divide o recurso em compartimentos com teto próprio.",
  tags: ["resiliencia", "isolamento", "pool", "concorrencia", "producao"],
  dificuldade: "intermediario",
  tempoLeitura: 7,
  nasceu: {
    quando: { rotulo: "2007", ano: 2007, precisao: "aproximada" },
    fonte:
      "Michael Nygard, 'Release It!', 2007 — trouxe o compartimento estanque dos navios para o isolamento de recursos em software",
    precursor:
      "A palavra é náutica: as anteparas ('bulkheads') dividem o casco em compartimentos para que um furo não afunde o navio inteiro.",
  },
  ondeAparece: [
    {
      onde: "Pools separados por dependência",
      explicacao:
        "Um pool de conexões por serviço externo, em vez de um pool geral, é o padrão na forma mais direta.",
    },
    {
      onde: "resources.limits do Kubernetes",
      explicacao:
        "Teto de CPU e memória por pod impede que um contêiner faminto derrube os vizinhos do mesmo nó.",
    },
    {
      onde: "Os compartimentos de um navio",
      explicacao:
        "O nome vem daí: a antepara isola a água ao compartimento furado e o casco continua flutuando.",
    },
  ],
  emUmaLinha: {
    lang: "typescript",
    code: `// Pool isolado: a falha de A não esgota B.
const httpPagamentos = agent({ maxSockets: 10 });`,
  },
  custo: {
    indirecoes: 1,
    cobra: [
      "Particionar recursos (pools, filas, threads) reduz o pico disponível para cada partição",
      "Dimensionar cada compartimento no tamanho certo é mais um parâmetro a ajustar e monitorar",
    ],
    naoValeSe:
      "há um consumidor só ou nenhum recurso compartilhado a proteger — sem contágio possível, compartimentar não isola nada.",
  },
  relacionados: ["circuit-breaker", "timeout", "rate-limiting"],
  problema: [
    "Threads, conexões e memória são compartilhados entre todas as rotas. Basta uma dependência ficar lenta para que as requisições que dependem dela ocupem todo o recurso, esperando.",
    "A partir daí, rotas que não têm nenhuma relação com a dependência problemática também param — não porque falharam, mas porque não sobrou vaga para elas.",
  ],
  solucao: [
    "Dividir o recurso compartilhado em compartimentos, um por dependência ou por classe de tráfego, cada um com teto próprio de concorrência.",
    "Quando um compartimento enche, rejeitar rápido em vez de enfileirar sem limite — a fila infinita só adia a falha e piora a latência de todos.",
  ],
  quandoUsar: [
    "Quando um mesmo processo atende rotas com criticidade diferente.",
    "Quando há dependências externas com perfis de latência muito distintos.",
    "Quando um cliente ou tenant pode, sozinho, consumir a capacidade dos demais.",
  ],
  quandoEvitar: [
    "Em serviço que faz uma coisa só e fala com uma dependência só — não há o que isolar.",
    "Quando os tetos por compartimento ficam tão pequenos que desperdiçam capacidade ociosa.",
  ],
  exemplos: EXEMPLOS,
  blocos: [
    {
      tipo: "tldr",
      texto:
        "Se tudo divide o mesmo pool, a dependência mais lenta toma as vagas e derruba até quem não falava com ela. O anteparo dá a cada dependência um teto próprio de concorrência: quando o compartimento enche, só quem depende dele é afetado — o resto do sistema continua.",
    },
    {
      tipo: "analogia",
      emoji: "🚢",
      titulo: "As anteparas do casco",
      texto:
        "O casco de um navio é dividido em compartimentos estanques. Um furo alaga o compartimento atingido e para ali: o navio aderna, perde velocidade, e continua flutuando. Sem as anteparas, o mesmo furo alagaria o casco inteiro. A antepara não impede o furo — ela decide até onde a água chega.",
    },
    {
      tipo: "secao",
      id: "problema",
      titulo: "O recurso compartilhado é o canal da propagação",
      resumo: [
        "Um pool de 100 conexões parece folgado até uma dependência passar de 50ms para 30 segundos. Com 10 requisições por segundo tocando essa dependência, as 100 vagas se esgotam em dez segundos.",
        "A partir daí, toda requisição nova entra na fila do pool — inclusive as que iriam para rotas saudáveis, que agora falham por um motivo que não tem nada a ver com elas.",
      ],
      extensao: [
        "É a mesma mecânica que o Timeout ataca, vista do outro lado. Timeout limita **quanto tempo** cada chamada pode segurar o recurso; Bulkhead limita **quantas** chamadas de um mesmo tipo podem segurá-lo ao mesmo tempo. Um teto de tempo sem teto de concorrência ainda permite que uma dependência ocupe tudo — só por menos tempo de cada vez.",
        "Os três padrões dessa família se encaixam assim: **Timeout** garante que existe um fim; **Bulkhead** garante que o estrago fica contido enquanto esse fim não chega; **Circuit Breaker** garante que, depois de ficar claro que a coisa está ruim, nem se tenta. Nenhum substitui o outro.",
        "Uma decisão que costuma passar despercebida: quando o compartimento enche, o que fazer? Enfileirar parece gentil e é a escolha errada por padrão — uma fila sem limite transforma indisponibilidade em latência crescente, e o usuário espera minutos por algo que vai falhar de qualquer jeito. Rejeitar rápido devolve o controle a quem chamou, que ainda pode escolher um caminho degradado.",
      ],
    },
    {
      tipo: "ilustracao",
      arquetipo: "antes-depois",
      antes: {
        titulo: "Pool único",
        itens: [
          "100 conexões compartilhadas por todas as rotas",
          "A dependência lenta ocupa todas em segundos",
          "Rotas saudáveis ficam sem vaga",
          "O serviço inteiro aparece caído no painel",
        ],
        nota: "A falha de uma dependência periférica vira indisponibilidade total, porque o recurso era comum.",
      },
      depois: {
        titulo: "Compartimentos",
        itens: [
          "Um teto de concorrência por dependência",
          "A lenta enche o compartimento dela e para ali",
          "As outras rotas seguem com a capacidade delas",
          "A degradação fica visível e localizada",
        ],
        nota: "O incidente continua existindo — mas fica do tamanho da dependência que o causou.",
      },
      legenda:
        "O anteparo não evita a falha da dependência. Ele decide qual fração do sistema tem permissão de cair junto.",
    },
    {
      tipo: "casos",
      titulo: "Como isso aparece na prática",
      casos: [
        {
          titulo: "O relatório que derrubou a API",
          cenario:
            "A mesma aplicação serve a API do produto e um punhado de relatórios administrativos que rodam consultas pesadas. Numa segunda-feira, três gestores pedem relatórios ao mesmo tempo e as consultas prendem todas as conexões do pool.",
          aplicacao:
            "Um compartimento de 5 conexões para relatórios e o restante para a API. Os relatórios passam a se enfileirar entre si e a API não percebe nada.",
          tradeoff:
            "Relatórios simultâneos ficam mais lentos e alguns são recusados em horário de pico. Em compensação, deixam de ser capazes de derrubar a operação que paga a conta.",
        },
        {
          titulo: "O tenant barulhento",
          cenario:
            "Num SaaS multiempresa, um cliente grande dispara uma importação em massa e consome sozinho quase toda a capacidade de processamento assíncrono. Os demais clientes veem suas filas paradas por horas.",
          aplicacao:
            "Compartimento por tenant, com teto proporcional ao plano contratado. A importação do cliente grande passa a usar apenas a fatia dele.",
          tradeoff:
            "A importação grande demora mais do que demoraria com a máquina toda disponível, e sobra capacidade ociosa quando os outros tenants estão quietos. Isolamento sempre custa um pouco de eficiência.",
        },
      ],
    },
    {
      tipo: "armadilhas",
      titulo: "Onde isto dá errado",
      itens: [
        {
          titulo: "Enfileirar sem limite quando o compartimento enche",
          texto:
            "Fila ilimitada não é gentileza: ela converte indisponibilidade em latência crescente, e o usuário espera minutos por uma requisição que vai falhar do mesmo jeito. O padrão certo é rejeitar rápido, e enfileirar só com teto e prazo.",
        },
        {
          titulo: "Compartimentos pequenos demais",
          texto:
            "Dividir 100 conexões em dez compartimentos de dez faz cada rota estourar o teto sob carga normal, com o pool geral quase vazio. O objetivo não é reservar capacidade — é impedir que uma dependência tome tudo. A soma dos tetos pode e costuma passar do total.",
        },
        {
          titulo: "Isolar a conexão e esquecer a thread",
          texto:
            "Separar pools de conexão não resolve se todas as chamadas continuam disputando o mesmo pool de threads ou o mesmo laço de eventos. O compartimento precisa cobrir o recurso que efetivamente satura primeiro.",
        },
        {
          titulo: "Tetos definidos sem medição",
          texto:
            "Números escolhidos no chute costumam ser folgados demais para isolar ou apertados demais para servir. O teto se dimensiona a partir da concorrência real observada em pico, e precisa ser revisitado quando o tráfego muda de ordem de grandeza.",
        },
        {
          titulo: "Achar que o anteparo evita a falha",
          texto:
            "O compartimento não deixa a dependência mais confiável — ele apenas contém o estrago. Quem espera que o anteparo melhore a disponibilidade da dependência vai concluir que ele não funcionou.",
        },
      ],
    },
    {
      tipo: "codigo",
      titulo: "Compartimento com rejeição rápida",
      exemplos: EXEMPLOS,
    },
    {
      tipo: "quando",
      usar: [
        "Um processo que atende rotas com criticidade diferente.",
        "Dependências com perfis de latência muito distintos.",
        "Ambientes multiempresa, onde um cliente pode afogar os demais.",
      ],
      evitar: [
        "Serviço com uma dependência só — não há o que isolar.",
        "Quando os tetos ficam tão apertados que desperdiçam capacidade.",
        "Como substituto de timeout ou de disjuntor: os três resolvem coisas diferentes.",
      ],
    },
  ],
};
