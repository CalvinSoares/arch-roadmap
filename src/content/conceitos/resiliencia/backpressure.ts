import type { Conceito } from "@/shared/types/conceito";

const EXEMPLOS = [
  {
    lang: "typescript" as const,
    code: `// Sem backpressure: o produtor despeja no ritmo dele, o consumidor
// nao acompanha, e o que sobra vai para um buffer que so cresce.
for (const item of fonteRapida) {
  fila.push(item);        // fila cresce sem limite -> memoria estoura
  processarLento(item);   // nao vaza no ritmo da entrada
}

// Com backpressure: o consumidor DITA o ritmo. Ele pede o que
// aguenta, e o produtor so manda quando ha demanda.
async function consumir(stream: Readable) {
  for await (const item of stream) {   // for await respeita o fluxo:
    await processarLento(item);         // enquanto processa, o stream
  }                                     // PAUSA a leitura da fonte.
}

// O sinal "va mais devagar" sobe a cadeia inteira, ate a origem.
// Quando o buffer enche, as opcoes sao: PAUSAR o produtor,
// DESCARTAR o excesso (drop/sample), ou RECUSAR (rejeitar novos).`,
  },
];

export const backpressure: Conceito = {
  slug: "backpressure",
  titulo: "Backpressure",
  categoria: "resiliencia",
  resumo:
    "Quando o produtor é mais rápido que o consumidor, alguém tem que ceder. Backpressure é o sinal de 'vá mais devagar' subindo a cadeia: o consumidor dita o ritmo, o produtor respeita, e o buffer entre eles não cresce até estourar a memória. Sem ele, a diferença de velocidade não some — ela vira um buffer infinito, latência crescente e, no fim, um out-of-memory.",
  tags: ["mensageria", "fluxo", "streams", "reactive", "capacidade"],
  dificuldade: "intermediario",
  tempoLeitura: 7,
  nasceu: {
    quando: { rotulo: "anos 2010", ano: 2013, precisao: "aproximada" },
    fonte:
      "Backpressure ganhou nome e API com o Reactive Streams e o RxJava por volta de 2013-2015; a ideia vem do controle de fluxo de redes",
    precursor:
      "É o controle de fluxo do TCP (a janela deslizante, de 1981) generalizado: o receptor dita o ritmo para o emissor não o afogar de pacotes.",
  },
  ondeAparece: [
    {
      onde: "request(n) do Reactive Streams",
      explicacao:
        "A API em que o consumidor pede exatamente quantos itens aguenta, impedindo o produtor de despejar mais do que ele processa.",
    },
    {
      onde: "highWaterMark dos streams do Node",
      explicacao:
        "O limite do buffer que faz o stream pausar a leitura da fonte quando o consumidor não vaza rápido o bastante.",
    },
    {
      onde: "a fila que enche e recusa",
      explicacao:
        "Quando o buffer lota e o sistema passa a recusar ou bloquear novas mensagens, é backpressure pedindo à origem para desacelerar.",
    },
  ],
  emUmaLinha: {
    lang: "typescript",
    code: `// Produtor para quando o consumidor não aguenta.
if (fila.length > LIMITE) await esperarDrenar(fila);`,
  },
  custo: {
    indirecoes: 1,
    cobra: [
      "O produtor precisa saber lidar com 'vá mais devagar' — pausar, bufferizar ou descartar, cada opção com seu custo",
      "Propagar o sinal por toda a cadeia exige que cada elo o respeite, senão ele para no primeiro que o ignora",
    ],
    naoValeSe:
      "o consumidor sempre acompanha o produtor com folga — sem risco de afogamento, controlar o fluxo é cerimônia sem retorno.",
  },
  relacionados: ["rate-limiting", "bulkhead", "fila-vs-pubsub"],
  problema: [
    "Produtor e consumidor quase nunca têm a mesma velocidade. Quando o produtor é mais rápido — uma API que recebe eventos mais rápido do que grava no banco —, a diferença precisa ir para algum lugar, e esse lugar costuma ser um buffer.",
    "Um buffer sem limite parece resolver, mas só adia: ele cresce enquanto a diferença existir, a latência sobe junto (a mensagem espera cada vez mais na fila) e, no fim, a memória acaba e o processo morre — de uma vez, e não graciosamente.",
  ],
  solucao: [
    "Inverter quem manda no ritmo: em vez de o produtor empurrar (push), o consumidor puxa o que aguenta (pull), sinalizando demanda. O produtor só envia quando há capacidade.",
    "Quando o buffer ainda assim enche, escolher conscientemente o que fazer: pausar o produtor, descartar o excesso (amostragem, drop do mais antigo) ou recusar novas entradas — cada um adequado a um tipo de dado.",
  ],
  quandoUsar: [
    "Pipelines de streaming onde a fonte pode ser mais rápida que o destino.",
    "Ingestão de eventos que grava em um sistema mais lento (banco, índice, terceiro).",
    "Sempre que um buffer entre produtor e consumidor puder crescer sem limite.",
  ],
  quandoEvitar: [
    "Quando o consumidor sempre acompanha o produtor com folga garantida.",
    "Em lotes pequenos e limitados, onde o volume total nunca ameaça a memória.",
  ],
  exemplos: EXEMPLOS,
  blocos: [
    {
      tipo: "tldr",
      texto:
        "Quando o produtor é mais rápido que o consumidor, a diferença de velocidade não desaparece — ela vira buffer. Backpressure é o consumidor dizendo 'vá mais devagar' e o produtor obedecendo: em vez de empurrar, o produtor só envia o que o consumidor pediu. Sem isso, o buffer cresce sem limite, a latência sobe e o processo morre de out-of-memory. Quando o buffer enche mesmo assim, as opções são pausar, descartar ou recusar.",
    },
    {
      tipo: "analogia",
      emoji: "🚰",
      titulo: "A pia que transborda",
      texto:
        "Se a torneira despeja água mais rápido do que o ralo escoa, a pia começa a encher. Você pode aumentar a pia (um buffer maior) — mas se a torneira continuar mais rápida que o ralo, mais cedo ou mais tarde transborda no chão. A única solução real é a torneira sentir que a pia está cheia e diminuir o fluxo. Backpressure é exatamente esse aviso subindo o cano até a torneira: o ralo dita o ritmo, não a torneira.",
    },
    {
      tipo: "secao",
      id: "push-vs-pull",
      titulo: "Quem dita o ritmo",
      resumo: [
        "A raiz do problema é o modelo **push**: o produtor empurra no ritmo dele e assume que o consumidor dá conta. Quando não dá, o excesso vai para um buffer, e o buffer é uma bomba-relógio — cresce silenciosamente até a memória acabar.",
        "Backpressure inverte para **pull**: o consumidor sinaliza quanto aguenta e o produtor só envia isso. O ritmo passa a ser ditado por quem processa, não por quem gera, e o buffer para de crescer porque a fonte desacelera junto.",
      ],
      extensao: [
        "Quando o buffer enche mesmo com o sinal, existe uma decisão de negócio a tomar, e ela depende do dado. **Pausar/bloquear** o produtor preserva tudo, mas propaga a lentidão para trás (bom para dados que não podem ser perdidos, como pagamentos). **Descartar** — dropar o mais antigo, ou amostrar — mantém o ritmo às custas de perder itens (aceitável para métricas, telemetria, posições de mouse). **Recusar** novas entradas com um erro claro empurra a decisão para o cliente (o território do rate limiting). Não existe opção universal: existe a que combina com o valor do dado.",
        "O sinal precisa atravessar a **cadeia inteira** para funcionar. Se um pipeline tem fonte → transformação → gravação, e a gravação está lenta, o backpressure só ajuda se a transformação e a fonte respeitarem o pedido de desacelerar. Um único elo que ignora o sinal — que bufferiza sem limite 'para não travar' — quebra a corrente: o buffer volta a crescer nele, e o out-of-memory apenas mudou de lugar. É por isso que APIs como o Reactive Streams padronizam o `request(n)` de ponta a ponta, em vez de deixar cada elo inventar o seu.",
      ],
    },
    {
      tipo: "casos",
      titulo: "Como isso aparece na prática",
      casos: [
        {
          titulo: "A ingestão que derrubava o serviço à noite",
          cenario:
            "Um serviço recebia eventos por webhook e os gravava num banco. Em picos noturnos, os eventos chegavam mais rápido do que o banco gravava; o buffer em memória crescia até o processo morrer por falta de memória.",
          aplicacao:
            "A ingestão passou a ler do stream com backpressure: enquanto o banco não confirmava a gravação, a leitura de novos eventos pausava, e o webhook passava a responder mais devagar sob pressão em vez de acumular tudo.",
          tradeoff:
            "Sob pico, o produtor (o emissor do webhook) passou a ver respostas mais lentas e a precisar de retry. Em troca, o serviço parou de morrer — degradou o ritmo em vez de cair inteiro.",
        },
        {
          titulo: "A telemetria que preferiu descartar",
          cenario:
            "Um pipeline de métricas de UI enviava cada movimento e clique. Sob carga, o buffer enchia, e pausar o produtor travava a interface do usuário — inaceitável para dado que é só telemetria.",
          aplicacao:
            "Em vez de pausar, o pipeline passou a amostrar: sob pressão, descartava parte dos eventos de baixo valor e mantinha os importantes, preservando a fluidez da interface.",
          tradeoff:
            "As métricas ficaram amostradas, não completas, sob carga. Foi a escolha certa para o tipo de dado: perder alguns pontos de telemetria é aceitável; travar a interface do usuário para não perdê-los, não.",
        },
      ],
    },
    {
      tipo: "armadilhas",
      titulo: "Onde isto dá errado",
      itens: [
        {
          titulo: "Resolver com um buffer maior",
          texto:
            "Aumentar o buffer não elimina a diferença de velocidade, só adia o estouro e piora a latência no caminho. Enquanto o produtor for mais rápido, qualquer buffer finito enche — a solução é desacelerar a fonte, não guardar mais.",
        },
        {
          titulo: "Um elo da cadeia que ignora o sinal",
          texto:
            "Backpressure só funciona se toda a cadeia respeita o 'vá mais devagar'. Um único estágio que bufferiza sem limite para 'não travar' quebra a corrente, e o out-of-memory apenas se muda para dentro dele.",
        },
        {
          titulo: "Pausar dado que não podia esperar, ou descartar o que não podia sumir",
          texto:
            "A resposta ao buffer cheio depende do dado: pausar um pagamento é seguro, pausar a interface do usuário não; descartar telemetria é aceitável, descartar uma transação não. Escolher a estratégia errada para o tipo de dado troca um problema por outro.",
        },
      ],
    },
    {
      tipo: "codigo",
      titulo: "Do push sem limite ao pull com ritmo",
      exemplos: EXEMPLOS,
    },
    {
      tipo: "quando",
      usar: [
        "Pipelines de streaming onde a fonte pode superar o destino.",
        "Ingestão que grava em um sistema mais lento.",
        "Sempre que um buffer entre produtor e consumidor puder crescer sem limite.",
      ],
      evitar: [
        "Quando o consumidor sempre acompanha o produtor com folga.",
        "Em lotes pequenos e limitados, sem ameaça à memória.",
      ],
    },
  ],
};
