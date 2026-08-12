import type { Conceito } from "@/shared/types/conceito";

const MERMAID = `stateDiagram-v2
    [*] --> Fechado
    Fechado --> Aberto : taxa de falha > limiar
    Aberto --> MeioAberto : passou a janela de espera
    MeioAberto --> Fechado : sondagens tiveram sucesso
    MeioAberto --> Aberto : uma sondagem falhou
    note right of Fechado : passa tudo, contando falhas
    note right of Aberto : recusa na hora, sem chamar
    note right of MeioAberto : deixa passar algumas, em teste`;

const EXEMPLOS = [
  {
    lang: "typescript" as const,
    code: `type Estado = "fechado" | "aberto" | "meio-aberto";

interface Config {
  /** fracao de falhas que abre o disjuntor (ex.: 0.5 = 50%). */
  limiar: number;
  /** minimo de amostras antes de julgar — evita abrir com 1 de 1. */
  minimoAmostras: number;
  /** quanto tempo fica aberto antes de sondar. */
  esperaMs: number;
}

class Disjuntor {
  private estado: Estado = "fechado";
  private falhas = 0;
  private total = 0;
  private abertoDesde = 0;

  // 'agora' entra por parametro: nada de Date.now() aqui dentro.
  permitir(agora: number): boolean {
    if (this.estado === "aberto") {
      if (agora - this.abertoDesde < this.cfg.esperaMs) return false;
      this.estado = "meio-aberto"; // hora de sondar
    }
    return true;
  }

  registrar(ok: boolean, agora: number): void {
    if (this.estado === "meio-aberto") {
      // Em teste: um erro basta para voltar a abrir.
      if (ok) this.fechar();
      else this.abrir(agora);
      return;
    }
    this.total++;
    if (!ok) this.falhas++;
    if (this.total >= this.cfg.minimoAmostras &&
        this.falhas / this.total > this.cfg.limiar) {
      this.abrir(agora);
    }
  }

  constructor(private cfg: Config) {}
  private abrir(agora: number) { this.estado = "aberto"; this.abertoDesde = agora; }
  private fechar() { this.estado = "fechado"; this.falhas = 0; this.total = 0; }
}`,
  },
  {
    lang: "python" as const,
    code: `from dataclasses import dataclass

@dataclass
class Config:
    limiar: float = 0.5        # fracao de falhas que abre
    minimo_amostras: int = 20  # nao julga com poucos dados
    espera_s: float = 30.0     # quanto fica aberto antes de sondar

class Aberto(Exception):
    """Recusado sem chamar a dependencia — a falha vira imediata e barata."""

class Disjuntor:
    def __init__(self, cfg: Config):
        self.cfg, self.estado = cfg, "fechado"
        self.falhas = self.total = 0
        self.aberto_desde = 0.0

    def chamar(self, fn, agora: float):
        if self.estado == "aberto":
            if agora - self.aberto_desde < self.cfg.espera_s:
                raise Aberto()          # falha rapida: nao gasta prazo nem conexao
            self.estado = "meio-aberto"  # deixa UMA passar, em teste

        try:
            r = fn()
        except Exception:
            self._registrar(False, agora)
            raise
        self._registrar(True, agora)
        return r`,
  },
];

export const circuitBreaker: Conceito = {
  slug: "circuit-breaker",
  titulo: "Circuit Breaker",
  categoria: "resiliencia",
  resumo:
    "Quando uma dependência já está claramente fora do ar, continuar chamando não ajuda ninguém: gasta o seu prazo e atrapalha a recuperação dela. O disjuntor detecta o padrão de falha e passa a recusar na hora, até que valha a pena tentar de novo.",
  tags: ["resiliencia", "disjuntor", "falha-rapida", "producao", "cascata"],
  dificuldade: "avancado",
  tempoLeitura: 9,
  nasceu: {
    quando: { rotulo: "2007", ano: 2007, precisao: "aproximada" },
    fonte:
      "Michael Nygard, 'Release It!', 2007 — nomeou e popularizou o disjuntor de software; difundido em escala pelo Hystrix da Netflix (2012)",
    precursor:
      "O nome e a metáfora vêm do disjuntor elétrico: ele abre o circuito para proteger a instalação quando a corrente passa do seguro, e é rearmado depois.",
  },
  ondeAparece: [
    {
      onde: "Outlier detection do Envoy",
      explicacao:
        "O service mesh tira do balanceamento a instância que passa a falhar, e a devolve depois de um tempo.",
    },
    {
      onde: "Health check de load balancer",
      explicacao:
        "Parar de mandar tráfego para quem falhou nas últimas sondagens é o mesmo padrão, no nível do balanceador.",
    },
    {
      onde: "O disjuntor do seu quadro de luz",
      explicacao:
        "O nome é emprestado dele: corta o circuito antes que a sobrecarga queime a fiação inteira.",
    },
  ],
  emUmaLinha: {
    lang: "typescript",
    code: `// Ja falhou demais? Nem tenta.
if (!disjuntor.permitir(agora)) throw new Aberto();`,
  },
  custo: {
    indirecoes: 1,
    cobra: [
      "Três parâmetros para calibrar (limiar, amostras mínimas, janela de espera)",
      "Um estado a mais para observar e entender durante o incidente",
    ],
    naoValeSe:
      "não há caminho degradado. Sem alternativa, abrir o circuito só troca um erro lento por um rápido.",
  },
  relacionados: ["retry", "timeout", "bulkhead"],
  problema: [
    "Quando uma dependência está fora do ar, cada chamada nova é um desperdício garantido: consome o orçamento de tempo do pedido, ocupa uma conexão e termina em erro previsível.",
    "Pior, essas chamadas atrapalham a recuperação. Um serviço que caiu por sobrecarga precisa de folga para se levantar, e a insistência dos clientes é exatamente o que ele não tem.",
  ],
  solucao: [
    "Observar a taxa de falha e, ao ultrapassar um limiar, **abrir** o circuito: recusar imediatamente, sem chamar a dependência.",
    "Depois de uma janela de espera, deixar passar algumas requisições de sondagem. Se derem certo, fechar; se falharem, abrir de novo.",
  ],
  quandoUsar: [
    "Chamadas para dependências externas que podem ficar indisponíveis por minutos.",
    "Quando existe um caminho degradado aceitável — cache antigo, valor padrão, funcionalidade escondida.",
    "Quando a falha rápida é melhor que a espera: o usuário prefere um 'indisponível' em 50ms a um erro em 30 segundos.",
  ],
  quandoEvitar: [
    "Em dependência sem a qual a operação não tem sentido nenhum — abrir o circuito só troca um erro por outro.",
    "Em volume baixo, onde a taxa de falha é estatisticamente ruído e o disjuntor abre por acaso.",
    "Como substituto de timeout: sem prazo, não há evento de falha para o disjuntor contar.",
  ],
  mermaid: MERMAID,
  exemplos: EXEMPLOS,
  blocos: [
    {
      tipo: "tldr",
      texto:
        "Se a dependência já está claramente fora, pare de chamar. O disjuntor conta as falhas, abre o circuito ao passar do limiar e passa a recusar na hora — devolvendo o seu prazo e dando à dependência a folga que ela precisa para se levantar. De tempos em tempos, deixa uma sondagem passar para ver se já dá.",
    },
    {
      tipo: "analogia",
      emoji: "⚡",
      titulo: "O disjuntor do quadro de luz",
      texto:
        "Quando há curto-circuito, o disjuntor desarma. Ele não conserta o curto — ele impede que a corrente continue passando e queime a fiação inteira. E ninguém religa sem parar: você espera, religa uma vez para testar, e se desarmar de novo, sabe que o problema continua lá. O disjuntor de software faz exatamente isso, contando falhas em vez de amperes.",
    },
    {
      tipo: "secao",
      id: "problema",
      titulo: "Insistir custa dos dois lados",
      resumo: [
        "Chamar uma dependência que está fora não é neutro. Cada tentativa gasta uma conexão sua, consome o orçamento de tempo do pedido, e termina no mesmo erro — mas trinta segundos depois, em vez de imediatamente.",
        "E do outro lado é pior: um serviço que caiu por sobrecarga precisa de folga para se recuperar, e a insistência dos clientes é justamente o que impede isso.",
      ],
      extensao: [
        "O padrão resolve dois problemas que parecem um só. O primeiro é **proteger quem chama**: sem disjuntor, cada requisição paga o timeout inteiro para descobrir algo que já se sabia. Com trinta segundos de prazo e uma dependência morta, o seu pool esgota do mesmo jeito que esgotaria sem timeout nenhum — só um pouco mais devagar.",
        "O segundo é **proteger quem é chamado**. Um serviço sobrecarregado que recebe menos tráfego consegue drenar a fila e voltar. Um serviço sobrecarregado que recebe o mesmo tráfego mais os retries nunca sai do buraco. O disjuntor é, do ponto de vista da dependência, um mecanismo de alívio de carga imposto pelos clientes.",
        "Vale distinguir de **Retry**, que é o padrão irmão e resolve o problema oposto. Retry aposta que a falha é passageira e que insistir vale a pena. Circuit Breaker aposta que a falha é persistente e que insistir custa caro. Os dois convivem: repete-se algumas vezes; se o padrão de falha se mantém, o disjuntor abre e as repetições param. Sem o disjuntor, o retry sozinho vira o *thundering herd*.",
      ],
    },
    {
      tipo: "ilustracao",
      arquetipo: "estrutura",
      blocos: [
        {
          id: "chamador",
          label: "Quem chama",
          nota: "não sabe que existe disjuntor no caminho",
          filhos: [
            {
              id: "disjuntor",
              label: "Disjuntor",
              nota: "conta falhas e decide se deixa passar",
              destaque: true,
              filhos: [
                { id: "fechado", label: "Fechado", nota: "passa tudo, contando" },
                { id: "aberto", label: "Aberto", nota: "recusa na hora, sem chamar" },
                { id: "meio", label: "Meio-aberto", nota: "deixa poucas passarem, em teste" },
              ],
            },
            {
              id: "fallback",
              label: "Caminho degradado",
              nota: "cache antigo, valor padrão, seção escondida",
              opcional: true,
            },
          ],
        },
        { id: "dependencia", label: "Dependência externa", nota: "pode estar fora por minutos" },
      ],
      legenda:
        "O disjuntor se coloca entre quem chama e a dependência. O caminho degradado é opcional — e é ele que decide se abrir o circuito melhora a experiência ou só troca um erro por outro.",
    },
    {
      tipo: "secao",
      id: "estados",
      titulo: "Três estados, e o do meio é o que importa",
      resumo: [
        "**Fechado** é a operação normal: tudo passa, e as falhas vão sendo contadas. **Aberto** é a recusa imediata, sem tocar na dependência. **Meio-aberto** é o estado de teste, e é onde mora a sutileza.",
        "Ao sair do aberto, o disjuntor não pode simplesmente voltar a passar tudo — isso jogaria o tráfego acumulado de uma vez sobre um serviço que talvez mal tenha se levantado.",
      ],
      extensao: [
        "Meio-aberto deixa passar **poucas** requisições, em teste. Se elas tiverem sucesso, o circuito fecha; se uma falhar, ele volta a abrir imediatamente — não espera atingir limiar de novo, porque a evidência de que ainda está ruim já apareceu.",
        "O erro clássico é dimensionar o limiar por contagem absoluta em vez de taxa. \"Abre depois de 5 falhas\" se comporta de maneira completamente diferente a 10 requisições por segundo e a 10 mil: no segundo caso, 5 falhas é ruído estatístico normal. O limiar sensato é uma **fração** — e com um mínimo de amostras, para não abrir com uma falha em uma requisição.",
        "O disjuntor também precisa ser **por dependência**, não global. Um disjuntor único para todas as chamadas externas abre por causa do serviço de recomendação e derruba junto o de pagamento, que estava perfeito. E, em geral, por dependência *e por instância*: é assim que o *outlier detection* de um service mesh funciona.",
      ],
    },
    {
      tipo: "casos",
      titulo: "Como isso aparece na prática",
      casos: [
        {
          titulo: "O gateway de pagamento que ficou fora por 20 minutos",
          cenario:
            "O provedor de pagamento tem um incidente e passa a responder `503` em 100% das chamadas. Sem disjuntor, cada tentativa de compra espera o timeout de 10 segundos antes de falhar, e o pool de conexões do checkout esgota.",
          aplicacao:
            "O disjuntor abre após 50% de falha em 20 amostras e passa a recusar em microssegundos. A interface mostra 'pagamento temporariamente indisponível, tente em instantes' de imediato, e oferece o boleto como alternativa.",
          tradeoff:
            "Enquanto aberto, mesmo uma recuperação parcial do provedor não é aproveitada até a próxima sondagem — perde-se alguns minutos de vendas possíveis em troca de o resto do site continuar de pé.",
        },
        {
          titulo: "A busca que virou opcional",
          cenario:
            "O cluster de busca fica degradado sob carga de pico e responde em 15 segundos. A home usa a busca para montar um bloco de sugestões, e a página inteira passa a demorar 15 segundos.",
          aplicacao:
            "Disjuntor com limiar baixo e caminho degradado: com o circuito aberto, o bloco de sugestões cai para uma lista estática pré-computada, e a home volta a carregar em 200ms.",
          tradeoff:
            "As sugestões ficam genéricas durante o incidente, o que provavelmente reduz conversão naquele bloco. É uma perda mensurável e aceita — bem menor que a de uma home que não carrega.",
        },
      ],
    },
    {
      tipo: "armadilhas",
      titulo: "Onde isto dá errado",
      itens: [
        {
          titulo: "Limiar por contagem absoluta em vez de taxa",
          texto:
            "\"Abre depois de 5 falhas\" significa coisas opostas a 10 e a 10 mil requisições por segundo. No volume alto, 5 falhas é ruído normal e o circuito abre sem motivo. O limiar precisa ser uma fração das amostras, com um mínimo antes de julgar.",
        },
        {
          titulo: "Um disjuntor global para todas as dependências",
          texto:
            "Se o mesmo disjuntor cobre recomendação, busca e pagamento, o serviço menos importante derruba o mais crítico ao abrir o circuito de todos. O escopo correto é por dependência — e, quando possível, por instância.",
        },
        {
          titulo: "Janela de espera curta demais",
          texto:
            "Sondar de cinco em cinco segundos um serviço que leva minutos para voltar mantém uma pressão constante sobre quem está tentando se levantar, e nunca dá tempo de a recuperação acontecer. A espera precisa ser da ordem do tempo real de recuperação.",
        },
        {
          titulo: "Voltar de meio-aberto para fechado de uma vez",
          texto:
            "Ao sair do estado aberto, liberar todo o tráfego acumulado de uma vez derruba de novo o serviço que mal tinha se levantado. Meio-aberto existe para deixar passar poucas requisições em teste, e uma falha nelas basta para reabrir.",
        },
        {
          titulo: "Abrir o circuito sem ter para onde ir",
          texto:
            "Se a dependência é essencial e não há caminho degradado, abrir o circuito só troca um erro lento por um erro rápido. Continua sendo melhor — o prazo é devolvido —, mas o ganho é bem menor do que se imagina, e não justifica sozinho a complexidade.",
        },
        {
          titulo: "Contar timeout do cliente como falha da dependência",
          texto:
            "Se o seu timeout está apertado demais, você registra falha em chamadas que teriam funcionado. O disjuntor abre por causa da sua configuração, não da saúde do outro lado — e o diagnóstico aponta para o lugar errado.",
        },
      ],
    },
    {
      tipo: "diagrama",
      titulo: "A máquina de estados",
      mermaid: MERMAID,
    },
    {
      tipo: "codigo",
      titulo: "Um disjuntor com o relógio injetado",
      exemplos: EXEMPLOS,
    },
    {
      tipo: "quando",
      usar: [
        "Dependências externas que podem ficar fora por minutos.",
        "Quando existe caminho degradado aceitável.",
        "Junto com timeout e retry — os três se completam.",
      ],
      evitar: [
        "Em volume baixo, onde a taxa de falha é ruído estatístico.",
        "Como substituto de timeout: sem prazo não há falha para contar.",
        "Em dependência essencial e sem alternativa, onde o ganho é pequeno.",
      ],
    },
  ],
};
