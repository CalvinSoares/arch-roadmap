import type { Conceito } from "@/shared/types/conceito";

const ANTI_EXEMPLO = `// Grava no primario, le da replica, e assume que o dado ja esta la.
async function salvarPerfil(req, res) {
  await primario.update("perfis", req.userId, req.body); // escreve no primario
  const perfil = await replica.get("perfis", req.userId); // le da REPLICA
  res.json(perfil); // devolve... o valor ANTIGO
}

// A replica ainda nao aplicou a escrita (lag de replicacao de ~50ms).
// O usuario salva o nome novo, a tela recarrega e mostra o nome VELHO.
// Ele salva de novo. E de novo. Abre um chamado dizendo "nao salva".
//
// Nada esta quebrado: o sistema E eventualmente consistente e o
// codigo tratou "eventual" como "imediato". A leitura logo apos a
// propria escrita e o unico caso em que o usuario percebe o lag.`;

const EXEMPLOS = [
  {
    lang: "typescript" as const,
    code: `// Consistencia eventual: as replicas convergem, mas nao na mesma hora.
// A pergunta certa nao e "quando fica consistente?" e sim
// "quem nao pode ver dado velho, e por quanto tempo?".

// Padrao "read-your-writes": logo apos escrever, leia do primario.
async function salvarEExibir(userId: string, dados: Perfil) {
  await primario.update("perfis", userId, dados);
  // por alguns segundos, este usuario le do primario, nao da replica
  marcarLeituraForte(userId, { porSegundos: 5 });
  return lerPerfil(userId); // respeita a marca acima
}

function lerPerfil(userId: string) {
  return temLeituraForte(userId)
    ? primario.get("perfis", userId)  // ve a propria escrita
    : replica.get("perfis", userId);  // todo o resto, da replica
}

// A garantia forte fica so onde doi (a propria escrita).
// O resto continua barato e escalavel na replica.`,
  },
  {
    lang: "python" as const,
    code: `# Convergencia so faz sentido se conflitos concorrentes tem como
# ser resolvidos. Um contador que so cresce (CRDT) converge sozinho:
class ContadorGrow:
    def __init__(self):
        self.por_no: dict[str, int] = {}   # cada no conta o seu

    def incrementar(self, no: str):
        self.por_no[no] = self.por_no.get(no, 0) + 1

    def merge(self, outro: "ContadorGrow"):
        # pega o MAIOR de cada no: idempotente, comutativo, associativo
        for no, v in outro.por_no.items():
            self.por_no[no] = max(self.por_no.get(no, 0), v)

    def total(self) -> int:
        return sum(self.por_no.values())

# Duas replicas podem incrementar em paralelo e o merge sempre
# converge para o mesmo total, em qualquer ordem. Isso e o que
# torna "eventual" seguro: a reconciliacao nao depende de sorte.`,
  },
];

export const consistenciaEventual: Conceito = {
  slug: "consistencia-eventual",
  titulo: "Consistência eventual",
  categoria: "dados",
  resumo:
    "Quando o dado vive em cópias, mantê-las idênticas a cada instante custa latência e disponibilidade. A consistência eventual troca o 'sempre igual' por 'igual daqui a pouco': as réplicas convergem, e o sistema fica mais rápido e mais disponível — ao preço de janelas em que a leitura vê o passado.",
  tags: ["distribuido", "replicacao", "consistencia", "convergencia", "crdt"],
  dificuldade: "intermediario",
  tempoLeitura: 8,
  nasceu: {
    quando: { rotulo: "2007", ano: 2007, precisao: "aproximada" },
    fonte:
      "Werner Vogels, 'Eventually Consistent', ACM Queue, 2008; conceito central do paper Dynamo da Amazon (SOSP 2007)",
    precursor:
      "Já estava no sistema Bayou do Xerox PARC em meados dos anos 1990 — e o DNS, que todo mundo usa, é eventualmente consistente desde sempre.",
  },
  ondeAparece: [
    {
      onde: "DNS",
      explicacao:
        "Mudar um registro leva minutos ou horas para valer no mundo inteiro; o sistema converge, a propagação nunca é instantânea.",
    },
    {
      onde: "timeline com o post velho",
      explicacao:
        "Você publica e um amigo ainda não vê: a leitura dele bateu numa réplica que ainda não recebeu a sua escrita.",
    },
    {
      onde: "carrinho do Amazon Dynamo",
      explicacao:
        "O paper que popularizou o termo: o carrinho aceita escritas sempre e reconcilia divergências depois, priorizando disponibilidade.",
    },
  ],
  emUmaLinha: {
    lang: "typescript",
    code: `// A cópia alcança a verdade — depois.
// Leia a réplica sabendo que pode estar atrasada.`,
  },
  custo: {
    indirecoes: 1,
    cobra: [
      "Abre uma janela em que a leitura vê um valor já ultrapassado, e o código precisa saber onde isso é inaceitável",
      "A reconciliação de escritas concorrentes vira problema da aplicação, a não ser que o tipo de dado convirja sozinho",
      "Torna bugs intermitentes e difíceis de reproduzir: o mesmo caminho funciona ou falha dependendo do lag do momento",
    ],
    naoValeSe:
      "a operação exige ver a própria escrita na hora — como um saldo antes de um débito. Aí a leitura tem que ir ao primário, e o 'eventual' não serve.",
  },
  relacionados: ["cap", "replica-de-leitura", "event-sourcing"],
  problema: [
    "Para escalar leituras e sobreviver a falhas, o dado é copiado em várias réplicas. Manter todas idênticas a cada instante exige coordenar cada escrita com todas elas antes de responder — o que é lento e, numa partição de rede, impossível.",
    "A alternativa é responder assim que uma réplica aceitou a escrita e propagar para as outras em segundo plano. Ganha-se velocidade e disponibilidade, mas surge uma janela em que réplicas diferentes devolvem valores diferentes para a mesma pergunta.",
  ],
  solucao: [
    "Aceitar que as réplicas ficam iguais 'eventualmente' — em milissegundos, no caso feliz — e projetar em cima disso, em vez de fingir que a escrita é instantânea em todo lugar.",
    "Reservar consistência forte para as poucas operações que não toleram ver o passado (ler a própria escrita, checar saldo) e deixar o resto barato na réplica. Onde houver escrita concorrente, usar tipos que convergem sozinhos (CRDTs) ou uma regra de resolução explícita.",
  ],
  quandoUsar: [
    "Leituras que toleram alguns milissegundos de atraso: contadores, feeds, catálogos, perfis.",
    "Sistemas que precisam continuar aceitando escrita durante uma partição de rede.",
    "Cargas de leitura muito maiores que as de escrita, onde replicar barato é o que permite escalar.",
  ],
  quandoEvitar: [
    "Operações que leem para logo decidir uma escrita crítica — transferências, reservas, controle de estoque.",
    "Quando a aplicação não tem como resolver conflitos de escrita concorrente de forma correta.",
  ],
  exemplos: EXEMPLOS,
  blocos: [
    {
      tipo: "tldr",
      texto:
        "Consistência eventual é a promessa de que as réplicas ficarão iguais — só que não agora. Em troca do 'não agora', o sistema fica mais rápido e continua disponível na partição. O custo aparece numa janela em que a leitura vê o passado, e o lugar onde isso mais dói é a leitura logo depois da própria escrita. A saída é reservar consistência forte só onde ela é indispensável e deixar o resto convergir em paz.",
    },
    {
      tipo: "analogia",
      emoji: "📰",
      titulo: "A fofoca que se espalha pela cidade",
      texto:
        "Uma notícia nasce num bairro e leva um tempo para chegar aos outros. Por algumas horas, quem está longe do ponto de origem ainda não sabe — mas ninguém duvida de que, no fim do dia, a cidade inteira vai estar por dentro. Consistência eventual é isso: a informação converge para todos, só não ao mesmo tempo. O problema é quando alguém precisa agir agora com base numa versão que ainda não chegou até ele.",
    },
    {
      tipo: "secao",
      id: "a-janela",
      titulo: "A janela onde o passado aparece",
      resumo: [
        "O lag de replicação costuma ser de milissegundos, e na maioria das leituras ninguém percebe. O problema tem um nome e um lugar: **read-your-writes**, a leitura que vem logo depois da sua própria escrita.",
        "É o único caso em que o usuário tem certeza de qual deveria ser o valor — ele acabou de escrevê-lo. Se a leitura cai numa réplica atrasada, ele vê o valor antigo, conclui que 'não salvou' e repete a ação. O bug não é do banco: é de tratar 'eventual' como 'imediato' exatamente onde não podia.",
      ],
      extensao: [
        "Existem garantias intermediárias, mais fracas que a consistência forte e mais fortes que 'eventual pura', que resolvem os casos que mais incomodam sem pagar o preço cheio. **Read-your-writes** garante que você vê as suas próprias escritas (mas não necessariamente as dos outros na hora). **Monotonic reads** garante que, uma vez que você viu um valor, não vai ver um mais antigo depois — sem isso, um refresh pode fazer o dado 'andar para trás'. **Consistência causal** preserva a ordem de causa e efeito: se a resposta depende da pergunta, ninguém vê a resposta sem a pergunta.",
        "Quando há escrita concorrente de verdade — dois nós alterando o mesmo dado durante uma partição —, convergir exige uma regra de resolução. A mais comum e mais traiçoeira é **last-write-wins** (vence o timestamp maior), que descarta silenciosamente uma das escritas e depende de relógios sincronizados, coisa que sistemas distribuídos não têm. A alternativa robusta são os **CRDTs**: tipos de dado (contadores, conjuntos, mapas) cuja operação de merge é comutativa, associativa e idempotente, de modo que qualquer ordem de propagação chega ao mesmo resultado — convergência por construção, não por sorte.",
      ],
    },
    {
      tipo: "ilustracao",
      arquetipo: "antes-depois",
      antes: {
        titulo: "Consistência forte",
        itens: [
          "Toda escrita espera todas as réplicas confirmarem",
          "Leitura vê sempre o valor mais recente",
          "Na partição de rede, a escrita falha",
          "Latência de escrita cresce com o número de réplicas",
        ],
        nota: "Correto o tempo todo — pago em latência em cada escrita e em indisponibilidade na partição.",
      },
      depois: {
        titulo: "Consistência eventual",
        itens: [
          "A escrita responde assim que uma réplica aceita",
          "As outras réplicas convergem em segundo plano",
          "Na partição, o sistema continua aceitando escrita",
          "Leitura pode ver o passado por uma janela curta",
        ],
        nota: "Rápido e disponível — pago numa janela de dado velho, pior logo após a própria escrita.",
      },
      legenda:
        "A escolha não é entre certo e errado, e sim entre onde você paga: latência garantida em toda escrita, ou uma janela de inconsistência que precisa ser gerenciada onde dói.",
    },
    {
      tipo: "casos",
      titulo: "Como isso aparece na prática",
      casos: [
        {
          titulo: "O contador de curtidas que balança",
          cenario:
            "Um post mostra 1.240 curtidas. O usuário curte, o número vira 1.241, ele atualiza a página e vê 1.240 de novo — a leitura caiu numa réplica que ainda não recebeu o incremento.",
          aplicacao:
            "O contador virou um CRDT do tipo grow-only e a leitura logo após a ação passou a respeitar monotonic reads, fixando o usuário na réplica que já tinha o valor por alguns segundos.",
          tradeoff:
            "A leitura 'presa' à réplica atualizada reduz o espalhamento de carga por um instante. Em troca, o número nunca mais anda para trás na cara de quem acabou de curtir.",
        },
        {
          titulo: "O perfil que 'não salva'",
          cenario:
            "Um usuário edita o nome, o sistema grava no primário e recarrega lendo de uma réplica atrasada. A tela volta com o nome antigo e ele abre um chamado dizendo que a edição não funciona.",
          aplicacao:
            "As leituras dentro da janela de read-your-writes passaram a ir ao primário por alguns segundos após cada escrita daquele usuário, mantendo o resto do tráfego na réplica.",
          tradeoff:
            "Uma fração pequena das leituras volta a onerar o primário. É um custo muito menor que o de suporte e retrabalho gerados por um bug que parecia perda de dados.",
        },
      ],
    },
    {
      tipo: "anti-exemplo",
      titulo: "Ler da réplica logo depois de escrever",
      comoSeParece:
        "O código grava no primário e, na mesma requisição, lê da réplica para devolver o resultado. Funciona em todo teste local, onde primário e réplica são o mesmo banco, e falha em produção de forma intermitente — só quando o lag de replicação é maior que o tempo entre a escrita e a leitura.",
      codigo: { lang: "typescript", code: ANTI_EXEMPLO },
      sintomas: [
        {
          quando: "Logo após salvar",
          efeito:
            "A tela recarrega e mostra o valor antigo; o usuário conclui que a edição não foi salva e repete a ação várias vezes.",
        },
        {
          quando: "Sob mais carga",
          efeito:
            "O lag de replicação cresce com o volume de escrita, então o bug fica mais frequente exatamente quando o sistema é mais usado.",
        },
        {
          quando: "Ao tentar reproduzir",
          efeito:
            "No ambiente local não há réplica separada, o lag é zero e o problema some — o que faz o time duvidar de que ele exista.",
        },
      ],
      correcao:
        "Leituras dentro da janela de read-your-writes vão ao primário, não à réplica. Marque o usuário por alguns segundos após a escrita e roteie a leitura dele para o primário nesse intervalo; todo o resto continua na réplica, barato e escalável.",
    },
    {
      tipo: "armadilhas",
      titulo: "Onde isto dá errado",
      itens: [
        {
          titulo: "Tratar 'eventual' como 'imediato'",
          texto:
            "Ler da réplica logo após escrever no primário é o erro mais comum. A escrita ainda não propagou, a leitura vê o passado, e o usuário — que sabe o valor que acabou de digitar — conclui que o sistema perdeu o dado.",
        },
        {
          titulo: "Confiar em last-write-wins com relógio de parede",
          texto:
            "Resolver conflito pelo maior timestamp descarta silenciosamente uma escrita e depende de relógios sincronizados entre máquinas, o que não existe. Duas escritas concorrentes viram uma, e ninguém fica sabendo qual sumiu.",
        },
        {
          titulo: "Prometer convergência sem regra de merge",
          texto:
            "Dizer que 'as réplicas convergem' só é verdade se há como reconciliar escritas concorrentes. Sem CRDT ou regra explícita, a divergência não converge — ela persiste, e cada réplica fica com uma versão diferente para sempre.",
        },
        {
          titulo: "Esquecer monotonic reads",
          texto:
            "Sem garantir que o usuário não vê um valor mais antigo depois de já ter visto um mais novo, um simples refresh pode fazer o dado andar para trás na tela — o efeito mais desconcertante para quem está olhando.",
        },
      ],
    },
    {
      tipo: "codigo",
      titulo: "Read-your-writes e convergência por CRDT",
      exemplos: EXEMPLOS,
    },
    {
      tipo: "quando",
      usar: [
        "Leituras que toleram milissegundos de atraso: feeds, contadores, catálogos.",
        "Sistemas que precisam aceitar escrita durante uma partição.",
        "Cargas de leitura muito maiores que as de escrita.",
      ],
      evitar: [
        "Ler para decidir uma escrita crítica na sequência.",
        "Quando não há como resolver conflitos de escrita concorrente.",
      ],
    },
  ],
};
