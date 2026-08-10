import type { Conceito } from "@/shared/types/conceito";

const MERMAID = `sequenceDiagram
    participant O as Orquestrador
    participant E as Estoque
    participant P as Pagamento
    participant En as Entrega
    O->>E: reservar estoque
    E-->>O: reservado
    O->>P: cobrar pagamento
    P-->>O: falha (cartão recusado)
    O->>E: compensar: liberar estoque
    E-->>O: estoque liberado
    O-->>O: saga abortada`;

const CAMADAS = [
  { id: "gatilho", titulo: "Início da operação", descricao: "Pedido que dispara a transação distribuída" },
  {
    id: "coordenacao",
    titulo: "Coordenação (orquestração/coreografia)",
    descricao: "Sequencia passos e decide compensar — onde a Saga atua",
    destaque: true,
  },
  { id: "locais", titulo: "Transações locais", descricao: "Cada serviço confirma sua parte" },
  { id: "compensacoes", titulo: "Compensações", descricao: "Desfazem semanticamente em caso de falha" },
];

const EXEMPLOS = [
  {
    lang: "typescript" as const,
    code: `interface Passo {
  executar(): Promise<void>;
  compensar(): Promise<void>;
}

// Orquestrador simples: executa em ordem e compensa ao falhar
async function executarSaga(passos: Passo[]): Promise<void> {
  const feitos: Passo[] = [];
  try {
    for (const passo of passos) {
      await passo.executar();
      feitos.push(passo);
    }
  } catch (erro) {
    // compensa na ordem inversa dos passos concluídos
    for (const passo of feitos.reverse()) {
      await passo.compensar();
    }
    throw erro;
  }
}

const reservarEstoque: Passo = {
  executar: async () => { /* reserva */ },
  compensar: async () => { /* libera reserva */ },
};`,
  },
  {
    lang: "python" as const,
    code: `from dataclasses import dataclass
from typing import Callable, Awaitable
import asyncio

@dataclass
class Passo:
    executar: Callable[[], Awaitable[None]]
    compensar: Callable[[], Awaitable[None]]

async def executar_saga(passos: list[Passo]) -> None:
    feitos: list[Passo] = []
    try:
        for passo in passos:
            await passo.executar()
            feitos.append(passo)
    except Exception:
        # compensa na ordem inversa
        for passo in reversed(feitos):
            await passo.compensar()
        raise

reservar_estoque = Passo(
    executar=lambda: asyncio.sleep(0),   # reserva
    compensar=lambda: asyncio.sleep(0),  # libera reserva
)`,
  },
];

export const saga: Conceito = {
  slug: "saga",
  titulo: "Saga",
  categoria: "arquitetura",
  resumo:
    "Coordena uma transação distribuída de longa duração como uma sequência de transações locais, cada uma com uma ação compensatória para desfazer semanticamente em caso de falha.",
  tags: ["transacao-distribuida", "microsservicos", "compensacao", "consistencia-eventual"],
  dificuldade: "avancado",
  tempoLeitura: 10,
  relacionados: ["cqrs"],
  problema: [
    "Em microsserviços, uma operação de negócio costuma atravessar vários serviços com bancos próprios — reservar estoque, cobrar pagamento, agendar entrega. Não existe uma transação ACID única que abranja todos eles, então não dá para simplesmente dar commit ou rollback no conjunto.",
    "Protocolos como two-phase commit tentam garantir atomicidade distribuída, mas travam recursos por muito tempo, não escalam bem e criam pontos de bloqueio. Para fluxos longos, que podem levar segundos, minutos ou depender de sistemas externos, essa abordagem é impraticável.",
  ],
  solucao: [
    "A Saga quebra a operação em uma sequência de transações locais: cada serviço faz sua parte e confirma localmente. Se um passo falha, a Saga executa transações compensatórias — operações que desfazem semanticamente os passos já concluídos (estornar o pagamento, liberar o estoque reservado). Não é um rollback técnico, e sim uma reversão de negócio.",
    "Há dois estilos de coordenação. Na orquestração, um componente central (o orquestrador) dita a ordem, envia comandos a cada serviço e decide quando compensar — fluxo explícito e fácil de observar, ao custo de um ponto central. Na coreografia, cada serviço reage a eventos e publica os seus, sem maestro — acoplamento menor, porém o fluxo fica implícito e mais difícil de rastrear.",
    "Sagas oferecem consistência eventual e atomicidade semântica, não isolamento: estados intermediários ficam visíveis. Isso exige projetar compensações idempotentes, lidar com passos que já não podem ser desfeitos (compensações pivotais/retriáveis) e tratar falhas das próprias compensações.",
  ],
  quandoUsar: [
    "Uma operação de negócio precisa de atomicidade entre vários serviços com bancos separados.",
    "O fluxo é longo ou depende de sistemas externos, tornando 2PC inviável.",
    "Você aceita consistência eventual e consegue definir compensações claras por passo.",
    "Já usa arquitetura orientada a eventos ou CQRS e quer coordenar processos de negócio.",
  ],
  quandoEvitar: [
    "Tudo cabe em uma única transação ACID local — não há por que distribuir.",
    "O domínio exige isolamento forte e não tolera estados intermediários visíveis.",
    "Não é possível compensar passos de forma segura (efeitos irreversíveis sem contrapartida).",
  ],
  mermaid: MERMAID,
  camadas: CAMADAS,
  exemplos: EXEMPLOS,
  blocos: [
    {
      tipo: "tldr",
      texto:
        "Quando uma operação atravessa vários serviços com bancos próprios, não existe rollback global: a Saga divide o fluxo em transações locais e, se um passo falha, executa compensações que desfazem os anteriores no plano do negócio — atomicidade semântica com consistência eventual.",
    },
    {
      tipo: "analogia",
      emoji: "🧳",
      titulo: "A reserva de viagem",
      texto:
        "Você monta uma viagem em três reservas: voo, hotel e carro. Cada uma é confirmada na hora, em empresas diferentes — não existe um 'botão único' que reserve tudo ou nada. Se a locadora não tem carro na data, você não deixa o resto pendurado: liga para o hotel e cancela, depois cancela o voo (pagando eventual taxa). Nada disso 'volta no tempo' — o hotel chegou a ter sua reserva por alguns minutos — mas, no fim, o mundo fica como se a viagem nunca tivesse sido marcada. É exatamente o que uma Saga faz: confirma passo a passo e, na falha, desfaz por compensação, na ordem inversa.",
    },
    {
      tipo: "secao",
      id: "problema",
      titulo: "O problema",
      resumo: [
        "Uma operação de negócio em microsserviços atravessa vários bancos: reservar estoque, cobrar pagamento, agendar entrega. Cada serviço garante ACID só dentro de casa — não existe commit/rollback que abranja o conjunto.",
        "O two-phase commit (2PC) promete atomicidade distribuída, mas trava recursos enquanto todos votam, cria um coordenador que vira gargalo e não sobrevive a fluxos longos ou a participantes externos (a operadora de cartão não entra na sua transação).",
      ],
      extensao: [
        "A raiz do problema é o teorema de que consistência forte distribuída custa disponibilidade e latência: para o 2PC funcionar, cada participante segura locks até o coordenador decidir — em fluxos de segundos ou minutos, isso significa linhas de banco travadas, throughput despencando e um ponto único cuja queda deixa todos em estado 'preparado' sem saber o desfecho. A Saga aceita o trade-off oposto: libera cada recurso imediatamente (commit local) e paga o preço em isolamento.",
        "Esse preço tem nome: estados intermediários visíveis. Entre o passo 1 e a compensação, outro cliente pode ver o estoque reservado de um pedido que vai falhar. A Saga entrega atomicidade SEMÂNTICA (no fim, tudo aconteceu ou nada 'vale') e consistência eventual, mas não entrega o I de ACID — quem precisa esconder intermediários usa contramedidas como reservas explícitas, status 'pendente' e bloqueio semântico no modelo de negócio.",
        "A escolha entre orquestração e coreografia define quem carrega essa complexidade. Orquestração: um componente central conhece a receita, comanda cada serviço e decide compensar — o fluxo é explícito, testável e observável, mas o orquestrador concentra acoplamento e precisa ser resiliente (persistir o estado da saga para retomar após crash). Coreografia: cada serviço reage a eventos e publica os seus ('PagamentoFalhou' faz o Estoque se auto-liberar) — não há ponto central, mas a receita fica espalhada, e responder 'em que passo esse pedido está?' exige rastreamento distribuído. Regra prática: poucos passos e times autônomos favorecem coreografia; fluxos longos com decisões condicionais favorecem orquestração.",
      ],
    },
    {
      tipo: "ilustracao",
      arquetipo: "fluxo",
      atores: [
        { id: "pedido", label: "Pedido" },
        { id: "estoque", label: "Reservar estoque" },
        { id: "pagamento", label: "Cobrar pagamento", destaque: true },
        { id: "compensa", label: "Compensar: liberar estoque" },
        { id: "fim", label: "Saga abortada" },
      ],
      setas: [
        { label: "passo 1 ok" },
        { label: "passo 2 falha" },
        { label: "desfaz na ordem inversa", tracejada: true },
        { label: "estado final consistente" },
      ],
      legenda:
        "Cada passo confirma localmente; a falha no meio dispara as compensações dos passos já feitos, em ordem inversa.",
    },
    {
      tipo: "camadas-nav",
      titulo: "Navegue pelas peças",
      camadas: [
        {
          id: "coordenacao",
          titulo: "Orquestrador / Coreografia",
          curto: "quem conhece a receita e decide compensar",
          detalhe:
            "Na orquestração, um componente central persiste o estado da saga, envia comandos e reage a respostas — a receita mora em um lugar só. Na coreografia, a receita se distribui: cada serviço assina eventos e sabe apenas seu próximo passo. Em ambos, alguém precisa decidir quando o fluxo avança e quando reverte.",
          exemplo: "await executarSaga([reservarEstoque, cobrarPagamento, agendarEntrega]);",
          seViolar:
            "sem coordenação definida, cada falha vira decisão ad-hoc: passos ficam órfãos, meio-executados, e ninguém sabe se o pedido terminou ou travou.",
        },
        {
          id: "locais",
          titulo: "Passos (transações locais)",
          curto: "cada serviço confirma sua parte — o coração da saga",
          detalhe:
            "Cada passo é uma transação ACID dentro de um único serviço: reservar estoque commita no banco do Estoque, cobrar commita no Pagamento. O contrato de cada passo é ser atômico localmente e reportar sucesso/falha de forma inequívoca ao coordenador (ou publicar o evento correspondente).",
          exemplo: "const passo: Passo = {\n  executar: async () => { /* commit local */ },\n  compensar: async () => { /* desfazer */ },\n};",
          seViolar:
            "um passo que toca dois bancos ao mesmo tempo recria o problema original dentro da saga — se ele falhar no meio, nem executar nem compensar têm resultado confiável.",
        },
        {
          id: "compensacoes",
          titulo: "Compensações",
          curto: "o desfazer de negócio de cada passo",
          detalhe:
            "Para cada passo que muda o mundo, existe a operação que o reverte semanticamente: reservou → libera; cobrou → estorna. Não é rollback técnico — o registro da cobrança e do estorno continuam existindo. Compensações precisam ser idempotentes (reentregas acontecem) e altamente confiáveis, pois rodam justamente quando algo já deu errado.",
          exemplo: "compensar: async () => estoque.liberarReserva(pedidoId), // idempotente",
          seViolar:
            "passo sem compensação no meio do fluxo trava a saga na falha: não dá para avançar nem reverter — o pedido fica eternamente 'meio feito'.",
        },
        {
          id: "mensageria",
          titulo: "Mensageria",
          curto: "o transporte confiável entre os passos",
          detalhe:
            "Comandos e eventos viajam por filas/tópicos com entrega garantida (at-least-once) e retries. O padrão outbox garante que 'commitar no banco' e 'publicar o evento' não se separem. É a mensageria que permite à saga sobreviver a quedas: a mensagem fica lá até alguém processá-la.",
          exemplo: 'bus.publicar({ tipo: "EstoqueReservado", pedidoId });',
          seViolar:
            "com chamadas HTTP diretas e sem persistência, qualquer serviço fora do ar quebra a corrente — e a entrega at-least-once sem idempotência duplica cobranças.",
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
          titulo: "Checkout de e-commerce distribuído",
          cenario:
            "No fechamento do pedido, quatro serviços entram em cena: Pedido, Estoque, Pagamento e Entrega — cada um com seu banco, e o Pagamento ainda depende da operadora de cartão.",
          aplicacao:
            "Uma saga orquestrada sequencia reservar estoque → cobrar → agendar entrega. Cartão recusado? O orquestrador dispara 'liberar reserva' e marca o pedido como falho — o cliente vê um erro limpo, não um pedido zumbi com estoque preso.",
          tradeoff:
            "Entre a reserva e a cobrança, o item aparece indisponível para outros clientes mesmo que a compra vá falhar — janela de isolamento fraco que times de estoque precisam aceitar e monitorar.",
        },
        {
          titulo: "Abertura de conta bancária",
          cenario:
            "Onboarding digital: verificar KYC no serviço de compliance, criar a conta no core bancário, emitir o cartão em um parceiro externo. O KYC pode levar minutos e o parceiro tem instabilidade conhecida.",
          aplicacao:
            "Saga de longa duração: cada etapa commita localmente e o estado persiste ('KYC aprovado, conta criada, cartão pendente'). Se a emissão do cartão falha em definitivo, compensa-se encerrando a conta recém-criada e notificando o cliente — sem contas fantasma no core.",
          tradeoff:
            "Compensar 'conta criada' não é apagar: regulação exige trilha de auditoria, então a compensação é um encerramento formal com registro — mais caro de projetar que um simples delete.",
        },
        {
          titulo: "Booking de viagem",
          cenario:
            "Uma plataforma vende o pacote voo + hotel + carro consumindo três fornecedores externos, cada um com API, prazos de cancelamento e políticas próprias.",
          aplicacao:
            "A saga reserva em sequência e guarda, por passo, o identificador de cancelamento do fornecedor. Sem carro disponível, cancela hotel e voo pelos códigos guardados — o cliente recebe 'pacote indisponível' em vez de um voo solto que ele não pediu.",
          tradeoff:
            "Compensação com custo real: fornecedores cobram taxa de cancelamento ou têm janelas de gratuidade — a ordem dos passos vira decisão financeira (reserve por último o mais caro de desfazer).",
        },
      ],
    },
    {
      tipo: "armadilhas",
      itens: [
        {
          titulo: "Compensação não-idempotente",
          texto:
            "Mensageria com entrega at-least-once VAI reentregar comandos de compensação — e um estorno executado duas vezes devolve o dinheiro em dobro. Toda compensação precisa de chave de idempotência (estornar POR pedido, não 'estornar X reais') e de checagem de estado antes de agir: liberar uma reserva já liberada deve ser um no-op silencioso.",
        },
        {
          titulo: "Passo não-compensável no meio do fluxo",
          texto:
            "Enviar o e-mail 'compra confirmada!' como passo 2 de 4 é irreversível: se o passo 3 falhar, não existe des-enviar. Ações sem compensação (e-mails, webhooks para terceiros, transferências liquidadas) devem ir para o fim da saga, depois do último ponto de falha possível — ou serem redesenhadas ('processando compra' antes, confirmação só no sucesso).",
        },
        {
          titulo: "Saga sem timeout",
          texto:
            "Se o serviço de pagamento simplesmente não responde, a saga sem timeout fica 'executando' para sempre — estoque preso, pedido pendurado, cliente no limbo. Cada passo precisa de prazo máximo e de um desfecho padrão ao estourá-lo (normalmente compensar tudo). Cuidado com o clássico: o timeout dispara a compensação e a resposta atrasada chega depois — o desenho precisa decidir quem vence.",
        },
      ],
    },
    {
      tipo: "quando",
      usar: [
        "Uma operação de negócio precisa de atomicidade entre vários serviços com bancos separados.",
        "O fluxo é longo ou depende de sistemas externos, tornando 2PC inviável.",
        "Você aceita consistência eventual e consegue definir compensações claras por passo.",
        "Já usa arquitetura orientada a eventos ou CQRS e quer coordenar processos de negócio.",
      ],
      evitar: [
        "Tudo cabe em uma única transação ACID local — não há por que distribuir.",
        "O domínio exige isolamento forte e não tolera estados intermediários visíveis.",
        "Não é possível compensar passos de forma segura (efeitos irreversíveis sem contrapartida).",
      ],
    },
  ],
};
