import type { Conceito } from "@/shared/types/conceito";

const EXEMPLOS = [
  {
    lang: "typescript" as const,
    code: `// Janela fixa: simples e com um defeito grave na virada.
// Com limite de 100/min, um cliente manda 100 as 10:00:59
// e mais 100 as 10:01:00 — 200 em dois segundos, dentro da regra.

// Token bucket: permite rajada controlada e alisa o resto.
interface Balde {
  tokens: number;
  /** ultimo instante em que reabastecemos. */
  atualizadoEm: number;
}

interface Config {
  capacidade: number;   // tamanho da rajada permitida
  porSegundo: number;   // taxa de reposicao
}

// 'agora' entra por parametro: funcao pura, testavel sem relogio.
function permitir(b: Balde, cfg: Config, agora: number, custo = 1): boolean {
  const decorrido = (agora - b.atualizadoEm) / 1000;
  b.tokens = Math.min(cfg.capacidade, b.tokens + decorrido * cfg.porSegundo);
  b.atualizadoEm = agora;

  if (b.tokens < custo) return false;
  b.tokens -= custo;
  return true;
}

// Ao recusar, diga QUANDO voltar. Sem isso o cliente vai adivinhar —
// e adivinhar errado significa todos voltando no mesmo instante.
function cabecalhos(b: Balde, cfg: Config) {
  return {
    "RateLimit-Limit": String(cfg.capacidade),
    "RateLimit-Remaining": String(Math.floor(b.tokens)),
    "Retry-After": String(Math.ceil((1 - b.tokens) / cfg.porSegundo)),
  };
}`,
  },
  {
    lang: "python" as const,
    code: `import math

class TokenBucket:
    """Rajada ate 'capacidade', reposicao continua a 'por_segundo'."""

    def __init__(self, capacidade: int, por_segundo: float):
        self.capacidade = capacidade
        self.por_segundo = por_segundo
        self.tokens = float(capacidade)
        self.atualizado_em = 0.0

    def permitir(self, agora: float, custo: int = 1) -> bool:
        decorrido = agora - self.atualizado_em
        self.tokens = min(
            self.capacidade, self.tokens + decorrido * self.por_segundo
        )
        self.atualizado_em = agora
        if self.tokens < custo:
            return False
        self.tokens -= custo
        return True

    def retry_after(self, custo: int = 1) -> int:
        falta = max(0.0, custo - self.tokens)
        return math.ceil(falta / self.por_segundo)

# Custo por PESO, nao por requisicao: um upload de 50MB
# nao deveria valer o mesmo que um GET de 200 bytes.
balde = TokenBucket(capacidade=100, por_segundo=10)`,
  },
];

export const rateLimiting: Conceito = {
  slug: "rate-limiting",
  titulo: "Rate limiting",
  categoria: "resiliencia",
  resumo:
    "Capacidade é finita, e demanda não pede licença. Limitar a taxa é escolher conscientemente quem é recusado quando a demanda passa do que se aguenta — em vez de deixar a sobrecarga escolher, degradando o serviço para todo mundo ao mesmo tempo.",
  tags: ["resiliencia", "throttling", "token-bucket", "capacidade", "producao"],
  dificuldade: "intermediario",
  tempoLeitura: 8,
  nasceu: {
    quando: { rotulo: "anos 1980", ano: 1986, precisao: "aproximada" },
    fonte:
      "Os algoritmos de token bucket e leaky bucket vêm das redes de telecomunicação dos anos 1980 (o leaky bucket é atribuído a Jonathan Turner, 1986)",
    precursor:
      "Moldar a vazão para não afogar o próximo é a mesma ideia do controle de tráfego em redes ATM — limitar o fluxo antes que ele estoure o buffer.",
  },
  ondeAparece: [
    {
      onde: "O 429 e o Retry-After",
      explicacao:
        "O código HTTP existe só para isto: recusar por excesso de taxa e dizer quando voltar.",
    },
    {
      onde: "limit_req do Nginx",
      explicacao:
        "Limitação por taxa embutida no servidor web, antes de a requisição chegar na sua aplicação.",
    },
    {
      onde: "Cotas de API",
      explicacao:
        "Todo provedor sério publica limite por minuto e por chave — é rate limiting virando contrato comercial.",
    },
  ],
  emUmaLinha: {
    lang: "typescript",
    code: `// Recusa de propósito quando passa do orçamento.
if (contador > LIMITE) return 429;`,
  },
  custo: {
    indirecoes: 1,
    cobra: [
      "Manter contadores por cliente e janela custa estado, ainda mais quando distribuído entre instâncias",
      "Um limite mal calibrado ou recusa tráfego legítimo, ou não protege de verdade",
    ],
    naoValeSe:
      "o recurso aguenta qualquer pico plausível sem se degradar — limitar aí só adiciona atrito e estado sem proteger nada.",
  },
  relacionados: ["bulkhead", "retry", "timeout"],
  problema: [
    "Nenhum sistema atende demanda infinita. Quando a chegada passa da capacidade, ou você escolhe quem recusar, ou a sobrecarga escolhe por você — e a escolha dela é degradar todo mundo ao mesmo tempo.",
    "Além disso, um único cliente mal comportado (um laço com bug, um job de importação, um raspador) pode consumir sozinho a capacidade que era de todos.",
  ],
  solucao: [
    "Contar requisições por chave — cliente, IP, rota, tenant — dentro de uma janela, e recusar o que passar do teto.",
    "Recusar cedo e barato, com resposta explícita (`429`) e indicação de quando tentar de novo, para o cliente poder se adaptar em vez de adivinhar.",
  ],
  quandoUsar: [
    "Em toda API pública ou exposta a clientes que você não controla.",
    "Para proteger recursos caros: envio de e-mail, geração de relatório, chamada a serviço pago por uso.",
    "Para isolar tenants num serviço multiempresa.",
  ],
  quandoEvitar: [
    "Em chamadas internas entre serviços de confiança, onde Bulkhead e fila resolvem melhor.",
    "Como remendo para uma consulta lenta — o certo é corrigir a consulta, não racionar o acesso a ela.",
  ],
  exemplos: EXEMPLOS,
  blocos: [
    {
      tipo: "tldr",
      texto:
        "Quando a demanda passa da capacidade, alguém vai ser recusado. Rate limiting é decidir isso de propósito — por cliente, por rota, por peso — recusando cedo e barato, e dizendo quando voltar. Sem ele, a sobrecarga decide, e ela degrada todo mundo de uma vez.",
    },
    {
      tipo: "analogia",
      emoji: "🎟️",
      titulo: "A catraca do estádio",
      texto:
        "O estádio tem 40 mil lugares. A catraca não existe para maltratar quem chegou por último — existe porque deixar entrar 60 mil não cria 20 mil lugares novos: cria um tumulto em que ninguém assiste ao jogo. Recusar na porta é rápido, previsível e reversível. Descobrir a lotação lá dentro não é nenhuma das três coisas.",
    },
    {
      tipo: "secao",
      id: "problema",
      titulo: "Alguém sempre é recusado",
      resumo: [
        "A pergunta não é *se* haverá recusa quando a demanda passar da capacidade — é *quem* recusa e *quando*. Sem limite explícito, a recusa acontece lá no fundo, depois de a requisição já ter consumido conexão, CPU e uma consulta ao banco.",
        "É a pior forma de recusar: cara para quem serve e imprevisível para quem chama.",
      ],
      extensao: [
        "Sob sobrecarga, um sistema sem limite não fica lento de forma uniforme — ele entra em colapso. As filas crescem, a latência sobe, os clientes começam a estourar timeout e a repetir, o que aumenta a carga, o que aumenta a latência. O nome disso é colapso congestivo, e a característica dele é que remover a carga extra não devolve o desempenho de imediato: o sistema fica preso processando trabalho que ninguém mais espera.",
        "Rate limiting corta esse ciclo no ponto mais barato possível: na borda, antes de gastar qualquer recurso caro. Uma requisição recusada em 1ms na entrada custa aproximadamente nada; a mesma requisição recusada depois de 40ms de banco custou uma conexão, uma consulta e uma vaga no pool.",
        "Há uma distinção que vale fixar. **Rate limiting** protege da *quantidade* de pedidos por unidade de tempo. **Bulkhead** protege da *concorrência simultânea* de um tipo de pedido. **Circuit Breaker** protege de insistir com uma dependência quebrada. Os três costumam ser confundidos porque todos recusam trabalho — mas medem coisas diferentes e falham em situações diferentes.",
        "Sobre algoritmos: janela fixa é a implementação mais simples e tem um defeito conhecido na virada — com limite de 100 por minuto, um cliente manda 100 às 10:00:59 e mais 100 às 10:01:00, ou seja, 200 em dois segundos sem violar a regra. Janela deslizante corrige isso ao custo de mais memória. **Token bucket** costuma ser a melhor escolha padrão: permite rajada até o tamanho do balde e alisa o restante, que é exatamente o comportamento que tráfego real tem.",
      ],
    },
    {
      tipo: "ilustracao",
      arquetipo: "fluxo",
      atores: [
        { id: "cliente", label: "Cliente" },
        { id: "chave", label: "Identifica a chave", destaque: true },
        { id: "balde", label: "Tem token disponível?", destaque: true },
        { id: "app", label: "Aplicação" },
        { id: "resposta", label: "Resposta" },
      ],
      setas: [
        { label: "requisição" },
        { label: "cliente, IP, tenant, rota" },
        { label: "sim — consome 1 token" },
        { label: "não → 429 + Retry-After", tracejada: true },
      ],
      legenda:
        "A decisão acontece antes de a requisição tocar em qualquer recurso caro. Ao recusar, o Retry-After é o que impede os clientes recusados de voltarem todos no mesmo instante.",
    },
    {
      tipo: "casos",
      titulo: "Como isso aparece na prática",
      casos: [
        {
          titulo: "O cliente com o laço infinito",
          cenario:
            "Uma integração de um cliente tem um bug: em vez de paginar, ela repete a primeira página num laço. Passa a mandar 4 mil requisições por minuto contra uma média histórica de 30, e a latência sobe para todos os outros clientes.",
          aplicacao:
            "Token bucket por chave de API, com capacidade de 200 e reposição de 20 por segundo. A integração com bug passa a receber `429` com `Retry-After`, e a plataforma volta ao normal em segundos.",
          tradeoff:
            "O cliente com bug fica parcialmente quebrado até corrigir o laço — o que é exatamente o objetivo, mas exige um canal de aviso e um limite generoso o bastante para não punir uso legítimo intenso.",
        },
        {
          titulo: "O endpoint de envio de e-mail",
          cenario:
            "Uma rota de 'recuperar senha' dispara e-mail a cada chamada. Um atacante a usa para bombardear a caixa de entrada de uma vítima, e o provedor de e-mail ameaça suspender a conta por reputação.",
          aplicacao:
            "Limite por endereço de destino e por IP de origem, bem mais apertado que o limite geral da API, com custo maior por requisição no balde.",
          tradeoff:
            "Um usuário legítimo que peça recuperação três vezes seguidas é bloqueado por alguns minutos. É um atrito real, aceito porque a alternativa é perder a reputação de envio do domínio inteiro.",
        },
      ],
    },
    {
      tipo: "armadilhas",
      titulo: "Onde isto dá errado",
      itens: [
        {
          titulo: "Recusar sem dizer quando voltar",
          texto:
            "Um `429` sem `Retry-After` obriga o cliente a adivinhar — e todos adivinham parecido, o que os faz voltar juntos. A resposta de recusa precisa carregar o momento de retorno, e idealmente o limite e o quanto resta.",
        },
        {
          titulo: "Janela fixa e a rajada na virada",
          texto:
            "Com limite de 100 por minuto, cabe mandar 100 no último segundo da janela e mais 100 no primeiro da seguinte: 200 em dois segundos, sem violar a regra escrita. Janela deslizante ou token bucket resolvem; janela fixa é a mais fácil de implementar e a mais fácil de furar.",
        },
        {
          titulo: "Contar requisição em vez de custo",
          texto:
            "Um `GET` de 200 bytes e um upload de 50 MB contam igual num limitador ingênuo. Quando o custo real varia em ordens de grandeza, o limite precisa ser por peso — tokens proporcionais ao trabalho, não uma unidade por chamada.",
        },
        {
          titulo: "Limitar por IP num mundo com NAT e proxy",
          texto:
            "Uma empresa inteira pode sair por um IP só, e uma botnet distribui-se por milhares. Limitar por IP pune escritório e não incomoda atacante. Onde houver identidade — chave de API, conta, sessão —, é ela que deve ser a chave.",
        },
        {
          titulo: "Contador local em serviço com várias réplicas",
          texto:
            "Cada instância mantendo o próprio contador multiplica o limite pelo número de réplicas: dez instâncias com teto de 100 permitem 1000. Ou o estado é compartilhado, ou o teto por instância é dividido — e aí o autoscaling muda o limite sem ninguém perceber.",
        },
        {
          titulo: "Limitar o sintoma em vez de corrigir a causa",
          texto:
            "Racionar acesso a um endpoint lento porque ele derruba o banco esconde o problema real, que é a consulta. O limite compra tempo para corrigir; quando vira solução permanente, o teto só desce com o tempo.",
        },
      ],
    },
    {
      tipo: "codigo",
      titulo: "Token bucket com o relógio injetado",
      exemplos: EXEMPLOS,
    },
    {
      tipo: "quando",
      usar: [
        "APIs públicas e qualquer superfície exposta a clientes que você não controla.",
        "Recursos caros: e-mail, relatório, chamada a serviço pago por uso.",
        "Isolamento entre tenants num serviço multiempresa.",
      ],
      evitar: [
        "Entre serviços internos de confiança, onde Bulkhead e fila servem melhor.",
        "Como remendo permanente para consulta lenta.",
        "Com contador local quando o serviço tem várias réplicas.",
      ],
    },
  ],
};
