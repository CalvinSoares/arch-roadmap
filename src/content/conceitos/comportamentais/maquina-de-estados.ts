import type { Conceito } from "@/shared/types/conceito";

const EXEMPLOS = [
  {
    lang: "typescript" as const,
    code: `// A máquina inteira cabe numa tabela: estado atual + evento -> próximo estado.
// Tudo que NÃO está na tabela é impossível por construção.
type Estado = "criada" | "ativa" | "paga" | "expirada" | "cancelada";
type Evento = "publicar" | "pagar" | "expirar" | "cancelar";

const TRANSICOES: Record<Estado, Partial<Record<Evento, Estado>>> = {
  criada:    { publicar: "ativa", cancelar: "cancelada" },
  ativa:     { pagar: "paga", expirar: "expirada", cancelar: "cancelada" },
  paga:      {},          // estado terminal: cobrança paga não expira nem cancela
  expirada:  {},
  cancelada: {},
};

function aplicar(atual: Estado, evento: Evento): Estado {
  const proximo = TRANSICOES[atual][evento];
  if (!proximo) {
    throw new Error(\`transição inválida: \${atual} + \${evento}\`);
  }
  return proximo;
}

aplicar("ativa", "pagar");    // "paga"
aplicar("paga", "expirar");   // Error — o bug do job de expiração morre AQUI,
                              // não no extrato do cliente três dias depois.

// No banco, a mesma ideia vira UPDATE condicional (e mata a corrida junto):
// UPDATE cobrancas SET estado = 'paga'
//  WHERE id = $1 AND estado = 'ativa'   -- 0 linhas = transição inválida`,
  },
  {
    lang: "python" as const,
    code: `# estado atual + evento -> proximo estado; fora da tabela = impossivel
TRANSICOES: dict[str, dict[str, str]] = {
    "criada":    {"publicar": "ativa", "cancelar": "cancelada"},
    "ativa":     {"pagar": "paga", "expirar": "expirada", "cancelar": "cancelada"},
    "paga":      {},      # terminal: paga nao expira nem cancela
    "expirada":  {},
    "cancelada": {},
}

def aplicar(atual: str, evento: str) -> str:
    proximo = TRANSICOES[atual].get(evento)
    if proximo is None:
        raise ValueError(f"transicao invalida: {atual} + {evento}")
    return proximo

aplicar("ativa", "pagar")   # "paga"
aplicar("paga", "expirar")  # ValueError — o bug morre na fronteira`,
  },
];

export const maquinaDeEstados: Conceito = {
  slug: "maquina-de-estados",
  titulo: "Máquina de estados",
  categoria: "comportamental",
  resumo:
    "Declare os estados possíveis e as transições permitidas numa tabela explícita: tudo que não está nela é impossível por construção. É a diferença entre 'status é uma string que a gente atualiza' e um ciclo de vida com regras.",
  tags: ["fsm", "ciclo-de-vida", "transicoes", "status", "invariantes"],
  dificuldade: "iniciante",
  tempoLeitura: 6,
  nasceu: {
    quando: { rotulo: "1955", ano: 1955, precisao: "aproximada" },
    fonte:
      "A teoria de autômatos finitos dos anos 1940-50 — os modelos de Mealy (1955) e Moore (1956), com raízes em McCulloch & Pitts (1943)",
    precursor:
      "Máquinas de estado são anteriores ao software: relés telefônicos e controladores eletromecânicos já eram máquinas de estado físicas décadas antes.",
  },
  ondeAparece: [
    {
      onde: "XState",
      explicacao:
        "A biblioteca de máquinas de estado do front: você declara estados e transições, e o que não está na tabela simplesmente não acontece.",
    },
    {
      onde: "PaymentIntent do Stripe",
      explicacao:
        "O status de uma cobrança (requires_payment_method, processing, succeeded) é uma máquina: cada webhook é um evento que só move para os estados permitidos.",
    },
    {
      onde: "useReducer do React",
      explicacao:
        "A assinatura (estado, ação) => próximoEstado é exatamente uma função de transição — o reducer é a tabela da máquina escrita em código.",
    },
  ],
  emUmaLinha: {
    lang: "typescript",
    code: `// Transições nomeadas; estados ilegais viram erro.
pedido.transicionar("pago"); // só de 'aguardando'`,
  },
  custo: {
    indirecoes: 0,
    cobra: [
      "A tabela de transições precisa ser mantida em dia conforme o fluxo ganha estados e eventos",
      "Estados e transições demais tornam a tabela grande e difícil de abarcar de uma vez",
    ],
    naoValeSe:
      "o fluxo tem um ou dois estados sem transições inválidas plausíveis — aí a máquina explícita é só cerimônia.",
  },
  relacionados: ["state", "race-condition", "idempotencia"],
  problema: [
    "Quando o status é uma string livre e cada canto do código faz o próprio UPDATE, as regras de ordem vivem espalhadas em ifs — e um dia uma cobrança paga é cancelada, um pedido entregue volta para 'separação', e ninguém sabe qual caminho o levou até ali.",
  ],
  solucao: [
    "Modele o ciclo de vida como máquina de estados: a lista fechada de estados e a tabela de transições viram a única porta de mudança. Transição fora da tabela é erro na hora, no lugar certo — não inconsistência silenciosa descoberta na conciliação.",
  ],
  quandoUsar: [
    "Entidades com ciclo de vida e regras de ordem: cobrança, pedido, documento, assinatura.",
    "Quando 'de qual status pode ir para qual' já gera discussão ou bug.",
  ],
  quandoEvitar: [
    "Fluxos triviais de dois estados sem regra de ordem (ativo/inativo).",
  ],
  exemplos: EXEMPLOS,
  blocos: [
    {
      tipo: "tldr",
      texto:
        "Estados possíveis + transições permitidas, declarados numa tabela — e toda mudança de estado passa por ela. 'Cobrança paga não pode ser cancelada' deixa de ser um if perdido num controller e vira uma regra que nenhum caminho do código consegue driblar.",
    },
    {
      tipo: "analogia",
      emoji: "🚇",
      titulo: "A catraca do metrô",
      texto:
        "A catraca só conhece dois estados: travada e liberada. Moeda na travada → libera; passar na liberada → trava de novo. Empurrar a catraca travada não a abre 'um pouco' — simplesmente não acontece. Ninguém escreveu if (empurrou && !pagou) recusar(): a física da catraca torna o estado inválido inalcançável. É exatamente o que a tabela de transições faz pelo seu domínio.",
    },
    {
      tipo: "secao",
      id: "problema",
      titulo: "O problema: o status que aceita qualquer coisa",
      resumo: [
        "status: string nasce inocente. Seis meses depois há cinco valores possíveis, quatro lugares que fazem UPDATE, e as regras de ordem — 'só cancela se ainda não pagou' — existem como ifs repetidos, cada um com uma versão levemente diferente.",
        "O bug típico não é um estado errado: é uma transição errada. O job de expiração roda atrasado e expira uma cobrança que foi paga há dez minutos. Cada estado isoladamente é válido; o caminho entre eles é que era proibido — e ninguém tinha escrito a proibição num lugar só.",
      ],
      extensao: [
        "A versão formal vem da computação teórica: autômatos finitos, com estados, alfabeto de eventos e função de transição. Você não precisa do formalismo — precisa da disciplina que ele impõe: enumerar estados (fechados, não strings livres), enumerar eventos, e tornar a função de transição o único caminho de mudança.",
        "Relação com o padrão State: a máquina de estados é o modelo (quais estados, quais transições); o padrão State é uma forma de implementá-la em OO, com uma classe por estado, útil quando cada estado carrega comportamento complexo. Para a maioria dos ciclos de vida, a tabela declarativa basta — e é mais fácil de ler, testar e desenhar.",
        "Em banco, a transição vira UPDATE condicional: SET estado = novo WHERE id = X AND estado = esperado. De brinde, isso fecha a corrida entre dois processos disputando a mesma transição — o segundo altera zero linhas.",
      ],
    },
    {
      tipo: "ilustracao",
      arquetipo: "fluxo",
      atores: [
        { id: "criada", label: "Criada" },
        { id: "ativa", label: "Ativa" },
        { id: "paga", label: "Paga", destaque: true },
        { id: "conciliada", label: "Conciliada" },
      ],
      setas: [
        { label: "publicar" },
        { label: "pagar" },
        { label: "conciliar", tracejada: true },
      ],
      legenda:
        "O caminho feliz de uma cobrança. Fora dele, cada estado tem saídas próprias (ativa também expira ou cancela) — e 'paga' não tem seta para cancelada: essa transição não existe.",
    },
    {
      tipo: "camadas-nav",
      titulo: "As três partes da máquina",
      camadas: [
        {
          id: "tabela",
          titulo: "Tabela de transições",
          curto: "a especificação executável do ciclo de vida",
          detalhe:
            "Estados fechados (enum, não string), eventos fechados, e o mapa estado+evento → próximo. É pequena o bastante para caber numa tela, ser revisada pelo time de produto e virar o desenho da documentação — porque ela É a regra, não uma descrição dela.",
          exemplo: 'ativa: { pagar: "paga", expirar: "expirada" }',
          seViolar:
            "regras de transição espalhadas em ifs voltam a divergir entre si — a tabela existe, mas na cabeça de cada dev, em versões diferentes.",
        },
        {
          id: "executor",
          titulo: "Executor",
          curto: "a única porta por onde o estado muda",
          detalhe:
            "Uma função aplicar(atual, evento) que consulta a tabela e rejeita o que não está nela. No banco, o mesmo papel é do UPDATE condicional com o estado esperado no WHERE — que também elimina a corrida entre dois processos disputando a transição.",
          seViolar:
            "qualquer UPDATE direto que não passe pelo executor reabre a porta dos fundos — e a máquina vira decoração.",
        },
        {
          id: "efeitos",
          titulo: "Efeitos de transição",
          curto: "o que acontece ao entrar ou sair de um estado",
          detalhe:
            "Notificar o cliente ao entrar em 'paga', agendar expiração ao entrar em 'ativa', liberar estoque ao entrar em 'cancelada'. Amarrar efeitos à transição (e não ao lugar do código que a disparou) garante que aconteçam por qualquer caminho que leve ao estado.",
          seViolar:
            "efeito disparado no controller em vez de na transição = o mesmo estado alcançado por outro caminho não dispara o efeito — e o cliente pago não recebe o e-mail.",
        },
      ],
    },
    { tipo: "codigo", exemplos: EXEMPLOS },
    {
      tipo: "casos",
      casos: [
        {
          titulo: "Ciclo de vida de uma cobrança PIX",
          cenario:
            "Uma cobrança nasce, fica ativa aguardando pagamento, e pode ser paga, expirar ou ser cancelada. O job de expiração roda em lote e o webhook de pagamento chega quando quer — às vezes os dois no mesmo segundo.",
          aplicacao:
            "A tabela declara: ativa → paga|expirada|cancelada; paga, expirada e cancelada são terminais. A transição roda como UPDATE condicional, então quando o webhook e o job disputam, o segundo altera zero linhas e desiste — a cobrança paga jamais expira, por construção.",
          tradeoff:
            "Todo caminho novo de negócio ('reativar cobrança expirada') exige mexer na tabela e pensar nas consequências — o que é mais lento que 'só mudar a string', e é exatamente o ponto.",
        },
        {
          titulo: "Onboarding com análise de documentos",
          cenario:
            "Cadastro passa por: dados enviados → em análise → aprovado ou reprovado, com reenvio de documentos permitido só após reprovação. Analistas humanos e validação automática atuam no mesmo cadastro.",
          aplicacao:
            "A máquina impede o analista de aprovar um cadastro que voltou para 'aguardando documentos' e impede o robô de reprovar quem já foi aprovado. Cada transição registra ator e timestamp — o histórico de transições vira a trilha de auditoria do compliance.",
          tradeoff:
            "Estados demais (análise-fase-1, fase-2, fase-3…) explodem a tabela; agrupar em estados de negócio e guardar o detalhe como dado do estado mantém a máquina legível.",
        },
      ],
    },
    {
      tipo: "armadilhas",
      itens: [
        {
          titulo: "Estado implícito em booleans combinados",
          texto:
            "isPaid + isCanceled + isExpired = oito combinações, cinco impossíveis — e nada impede paid=true com canceled=true. Booleans que descrevem ciclo de vida são uma máquina de estados desmontada: junte-os num enum e as combinações absurdas deixam de existir.",
        },
        {
          titulo: "A máquina que existe só na cabeça",
          texto:
            "O time 'sabe' as regras, mas cada regra vive num if diferente, e o UPDATE direto no banco não passa por nenhum deles. Se a tabela de transições não é código executado por toda mudança, ela não é a regra — é folclore.",
        },
        {
          titulo: "Esquecer as saídas de erro e de tempo",
          texto:
            "Todo estado não-terminal precisa responder: e se der errado? e se ninguém agir? Cobrança 'ativa' sem transição de expiração fica ativa para sempre; análise sem timeout prende o cadastro. Os caminhos infelizes fazem parte da máquina — geralmente são a maioria dela.",
        },
      ],
    },
    {
      tipo: "quando",
      usar: [
        "Entidades com ciclo de vida e regras de ordem — cobrança, pedido, contrato, entrega.",
        "Quando dois atores (jobs, webhooks, humanos) mudam o mesmo status concorrentemente.",
        "Quando o histórico de transições tem valor de auditoria.",
      ],
      evitar: [
        "Flags simples sem regra de ordem — ativo/inativo não precisa de máquina.",
        "Fluxos que mudam toda semana em fase de descoberta — formalizar cedo demais engessa.",
        "Modelar como estado o que é dado (o valor da cobrança não é um estado).",
      ],
    },
  ],
};
