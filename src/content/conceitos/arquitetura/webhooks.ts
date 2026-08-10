import type { Conceito } from "@/shared/types/conceito";

const EXEMPLOS = [
  {
    lang: "typescript" as const,
    code: `import { createHmac, timingSafeEqual } from "node:crypto";

// O contrato de um receptor de webhook decente:
// 1. verificar a assinatura  2. deduplicar  3. enfileirar  4. responder 200 JÁ
const processados = new Set<string>();      // Redis/tabela na vida real
const fila: unknown[] = [];                 // SQS/RabbitMQ na vida real

function verificarAssinatura(corpo: string, assinatura: string, segredo: string) {
  const esperada = createHmac("sha256", segredo).update(corpo).digest("hex");
  // comparação em tempo constante — timing attack não revela a assinatura
  return (
    esperada.length === assinatura.length &&
    timingSafeEqual(Buffer.from(esperada), Buffer.from(assinatura))
  );
}

async function receberWebhook(req: {
  corpo: string;
  cabecalhos: Record<string, string>;
}): Promise<{ status: number }> {
  // 1. sem assinatura válida, o corpo é só uma história que alguém contou
  if (!verificarAssinatura(req.corpo, req.cabecalhos["x-assinatura"], SEGREDO)) {
    return { status: 401 };
  }

  const evento = JSON.parse(req.corpo) as { id: string; tipo: string };

  // 2. entrega é ao-menos-uma-vez: o mesmo evento VAI chegar de novo
  if (processados.has(evento.id)) return { status: 200 }; // duplicata: ok e tchau

  // 3. + 4. guarda para processar depois e responde rápido —
  // processar inline estoura o timeout do emissor, que reenvia, que duplica...
  processados.add(evento.id);
  fila.push(evento);
  return { status: 200 };
}

const SEGREDO = process.env.WEBHOOK_SECRET ?? "";`,
  },
];

export const webhooks: Conceito = {
  slug: "webhooks",
  titulo: "Webhooks",
  categoria: "arquitetura",
  resumo:
    "Em vez de perguntar 'já aconteceu?' de minuto em minuto, você registra uma URL e o outro sistema te chama quando acontece. É o Observer atravessando a internet — com tudo que a rede cobra por isso: assinatura, retry e duplicata.",
  tags: ["integracao", "eventos", "http", "notificacao", "polling"],
  dificuldade: "iniciante",
  tempoLeitura: 6,
  relacionados: ["observer", "idempotencia", "append-only"],
  problema: [
    "Para saber se o pagamento foi confirmado, seu sistema pergunta à API do provedor a cada 30 segundos — 99% das respostas são 'ainda não', o rate limit chega antes da resposta útil, e a notícia ainda atrasa até meio minuto.",
  ],
  solucao: [
    "Inverta a direção: você cadastra uma URL e o provedor faz um POST nela no momento do evento. A latência cai para o tempo de uma request, o desperdício some — e em troca você assume os deveres de um bom receptor: validar assinatura, tolerar duplicata e responder rápido.",
  ],
  quandoUsar: [
    "Integração com sistemas de terceiros que oferecem notificação de eventos.",
    "Quando a latência da notícia importa (pagamento, entrega, alerta).",
  ],
  quandoEvitar: [
    "Consumidores que não podem expor endpoint público — aí é polling ou fila.",
    "Como única fonte da verdade — webhook avisa; quem garante é a conciliação.",
  ],
  exemplos: EXEMPLOS,
  blocos: [
    {
      tipo: "tldr",
      texto:
        "Você deixa uma URL registrada e o outro sistema te chama quando o evento acontece — o contrário de ficar perguntando. O preço: seu endpoint vira porta pública, e precisa verificar assinatura, engolir duplicatas e responder 200 antes de processar.",
    },
    {
      tipo: "analogia",
      emoji: "🔔",
      titulo: "A campainha em vez do 'já chegou?'",
      texto:
        "Você não liga para a pizzaria a cada dois minutos perguntando se a pizza saiu — deixa o endereço e o entregador toca a campainha. O endereço é a URL do webhook; a campainha é o POST. E como todo mundo pode tocar uma campainha, você olha pelo olho mágico antes de abrir: essa é a assinatura.",
    },
    {
      tipo: "secao",
      id: "problema",
      titulo: "O problema: perguntar até a resposta mudar",
      resumo: [
        "Polling é a solução ingênua para 'quero saber quando X acontecer': pergunte sempre. O custo cresce dos dois lados — você paga requests inúteis e rate limit; o provedor paga carga de consultas cuja resposta não mudou — e a notícia ainda chega atrasada pelo intervalo do loop.",
        "Webhook resolve latência e desperdício num golpe, mas muda a natureza do seu sistema: agora existe um endpoint público seu que terceiros chamam, e tudo que vale para uma API pública (autenticidade, disponibilidade, idempotência) passa a valer para ele.",
      ],
      extensao: [
        "O contrato implícito do emissor sério: ele assina o corpo (HMAC com segredo compartilhado), reenvia com backoff quando você não responde 2xx a tempo, e desiste depois de N tentativas — indo parar numa fila de mortos que alguém precisa olhar. Entrega é ao-menos-uma-vez e sem garantia de ordem: 'pagamento.confirmado' pode chegar antes de 'pagamento.criado'.",
        "Por isso os quatro deveres do receptor: verificar a assinatura (o corpo sem ela é só uma história), deduplicar pelo id do evento, enfileirar e responder 200 imediatamente (processar inline estoura o timeout do emissor, que reenvia, que duplica), e tratar o webhook como notificação — a fonte da verdade é a API do provedor, consultada na conciliação periódica.",
      ],
    },
    {
      tipo: "ilustracao",
      arquetipo: "fluxo",
      atores: [
        { id: "provedor", label: "Provedor (PSP)" },
        { id: "endpoint", label: "Seu endpoint", destaque: true },
        { id: "fila", label: "Fila interna" },
        { id: "worker", label: "Worker" },
      ],
      setas: [
        { label: "POST assinado (HMAC)" },
        { label: "valida, deduplica, 200 já" },
        { label: "processa no seu ritmo", tracejada: true },
      ],
      legenda:
        "O endpoint faz o mínimo síncrono possível — validar, deduplicar, enfileirar — e devolve 200 em milissegundos; o trabalho de verdade acontece depois, no worker.",
    },
    {
      tipo: "camadas-nav",
      titulo: "As três pontas da entrega",
      camadas: [
        {
          id: "emissor",
          titulo: "Emissor",
          curto: "assina, tenta de novo, desiste com registro",
          detalhe:
            "Do lado de quem envia: assinar o corpo com HMAC + timestamp (anti-replay), reenviar com backoff exponencial quando não vier 2xx, e ter uma fila de mortos com visibilidade — webhook que falhou para sempre é incidente do cliente, não log perdido.",
          seViolar:
            "emissor sem retry transforma qualquer instabilidade do receptor em evento perdido para sempre — e sem assinatura, qualquer um forja um 'pagamento aprovado'.",
        },
        {
          id: "transporte",
          titulo: "Transporte",
          curto: "HTTPS, assinatura e janela de tempo",
          detalhe:
            "O POST viaja pela internet aberta: HTTPS obrigatório, assinatura HMAC do corpo cru (antes de qualquer parse), e timestamp assinado com tolerância curta — um request capturado não pode ser reapresentado amanhã.",
          exemplo: "x-assinatura: hmac-sha256(corpo + timestamp, segredo)",
          seViolar:
            "validar a assinatura sobre o JSON re-serializado (em vez do corpo cru) quebra com qualquer diferença de espaços — e valida coisa nenhuma.",
        },
        {
          id: "receptor",
          titulo: "Receptor",
          curto: "valida, deduplica, enfileira, 200",
          detalhe:
            "O handler síncrono faz só o essencial e responde. Dedupe pelo id do evento (a entrega é ao-menos-uma-vez), fila interna para o processamento pesado, e tolerância a desordem — decidir pelo estado atual consultado, não pela ordem de chegada.",
          seViolar:
            "processar inline: o timeout do emissor vence no meio, ele reenvia, e agora o mesmo pagamento está sendo processado duas vezes em paralelo.",
        },
      ],
    },
    { tipo: "codigo", exemplos: EXEMPLOS },
    {
      tipo: "casos",
      casos: [
        {
          titulo: "Confirmação de pagamento PIX",
          cenario:
            "O checkout gera um QR Code e precisa liberar o pedido no instante em que o cliente paga — esperar um polling de 30s mata a experiência no caixa.",
          aplicacao:
            "O PSP chama seu webhook com 'pix.confirmado' assinado. O endpoint valida o HMAC, deduplica pelo id da transação, enfileira e responde 200; o worker libera o pedido e avisa o front por WebSocket. Uma conciliação horária consulta a API do PSP e pesca qualquer evento que a rede tenha engolido.",
          tradeoff:
            "Você ganhou latência de segundos, mas agora opera um endpoint público de missão crítica — com monitoração, janela de manutenção coordenada e a conciliação como rede de segurança obrigatória.",
        },
        {
          titulo: "CI disparado por push",
          cenario:
            "A cada push no repositório, a esteira de build precisa começar imediatamente — clonar o repo de minuto em minuto para 'ver se mudou' não escala para centenas de projetos.",
          aplicacao:
            "O GitHub chama o webhook do servidor de CI com o evento de push assinado. O CI valida, enfileira o build e responde — o pipeline começa dois segundos depois do git push, e o custo de polling de centenas de repositórios simplesmente desaparece.",
          tradeoff:
            "Um webhook perdido = build que nunca rodou; por isso os servidores de CI sérios mantêm um resync periódico comparando o último commit conhecido com o real.",
        },
      ],
    },
    {
      tipo: "armadilhas",
      itens: [
        {
          titulo: "Processar dentro do handler",
          texto:
            "O emissor dá 10 segundos e você gasta 30 processando: timeout, retry, e o mesmo evento processado duas vezes em paralelo. O handler síncrono valida, deduplica, enfileira e responde — o resto é trabalho do worker.",
        },
        {
          titulo: "Confiar no corpo sem verificar a assinatura",
          texto:
            "Um endpoint público que aceita qualquer POST como verdade permite que qualquer um 'aprove' o próprio pagamento com um curl. A assinatura HMAC sobre o corpo cru é o que separa notificação de terceiro confiável de entrada de usuário anônimo.",
        },
        {
          titulo: "Assumir entrega única e em ordem",
          texto:
            "Retry gera duplicata; rede gera desordem. Sem dedupe por id, o mesmo pagamento credita duas vezes; sem tolerância a desordem, o 'confirmado' que chegou antes do 'criado' quebra o fluxo. Os dois são o caso normal, não o excepcional.",
        },
        {
          titulo: "Webhook como fonte da verdade",
          texto:
            "Webhook é notificação de melhor esforço: emissores perdem eventos, DLQs transbordam, endpoints ficam fora do ar. Quem decide estado de dinheiro é a consulta à API do provedor — a conciliação periódica não é paranoia, é o contrato.",
        },
      ],
    },
    {
      tipo: "quando",
      usar: [
        "Notificação de eventos de terceiros com latência importante — pagamento, logística, mensageria.",
        "Substituir polling caro contra APIs com rate limit.",
        "Encadear sistemas seus via eventos HTTP quando uma fila compartilhada não é opção.",
      ],
      evitar: [
        "Receptores que não podem expor URL pública (apps móveis, desktop) — use push/polling.",
        "Fluxos que exigem garantia forte de entrega e ordem — fila com offset faz isso melhor.",
        "Como única fonte de estado financeiro — sem conciliação, cedo ou tarde diverge.",
      ],
    },
  ],
};
