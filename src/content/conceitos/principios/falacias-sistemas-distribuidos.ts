import type { Conceito } from "@/shared/types/conceito";

const ANTI_EXEMPLO = `// Codigo escrito como se a rede fosse confiavel e a latencia, zero.
async function montarTela(userId: string) {
  const perfil = await api.getPerfil(userId);       // 1 chamada
  const pedidos = await api.getPedidos(userId);      // 2
  const enderecos = [];
  for (const p of pedidos) {                         // e agora o N+1:
    enderecos.push(await api.getEndereco(p.enderecoId)); // +N chamadas
  }
  return { perfil, pedidos, enderecos };
}

// No dev, com o servidor em localhost, isso responde em milissegundos.
// Em producao, cada await e uma travessia de rede de dezenas de ms.
// 1 + 1 + N chamadas SEQUENCIAIS viram segundos de espera.
// E nenhuma tem timeout: se uma trava, a tela inteira trava com ela.`;

const EXEMPLOS = [
  {
    lang: "typescript" as const,
    code: `// As 8 falacias sao suposicoes que todo mundo faz e que a rede
// desmente, uma a uma, sempre no pior momento:
//
//   1. A rede e confiavel.          -> pacotes se perdem; precisa de retry.
//   2. A latencia e zero.           -> cada hop custa; cuidado com N+1.
//   3. A banda e infinita.          -> payload gordo entope o link.
//   4. A rede e segura.             -> assuma hostil; autentique e cifre.
//   5. A topologia nao muda.        -> IPs e rotas mudam; nao fixe endereco.
//   6. Ha um administrador so.       -> varios donos; versione contratos.
//   7. O custo de transporte e zero. -> serializar/mover dado custa CPU e $.
//   8. A rede e homogenea.          -> protocolos e versoes divergem.

// O antidoto pratico: timeout + retry com backoff em TODA chamada remota,
// tratar erro de rede como caso esperado (nao excecao rara),
// e nunca desenhar um loop que faz uma chamada remota por item.`,
  },
];

export const falaciasSistemasDistribuidos: Conceito = {
  slug: "falacias-sistemas-distribuidos",
  titulo: "As 8 falácias dos sistemas distribuídos",
  categoria: "principio",
  resumo:
    "Oito suposições que quase todo desenvolvedor faz ao chamar código pela rede — a rede é confiável, a latência é zero, a banda é infinita — e que a realidade desmente uma a uma, sempre em produção. Reconhecê-las é o começo de todo sistema distribuído que não desmorona: cada falácia ignorada vira um incidente esperando o pior momento.",
  tags: ["principio", "distribuido", "rede", "latencia", "falhas"],
  dificuldade: "intermediario",
  tempoLeitura: 7,
  nasceu: {
    quando: { rotulo: "1994", ano: 1994, precisao: "aproximada" },
    fonte:
      "A lista foi consolidada por L. Peter Deutsch e colegas na Sun Microsystems por volta de 1994; James Gosling acrescentou a oitava falácia depois",
    precursor:
      "Bill Joy e Tom Lyon já haviam esboçado as primeiras quatro no início dos anos 1990, a partir das dores reais de construir sistemas em rede na Sun.",
  },
  ondeAparece: [
    {
      onde: "retry sem timeout",
      explicacao:
        "Assumir que 'a rede é confiável' produz o código que espera para sempre — a primeira falácia batendo na porta.",
    },
    {
      onde: "app rápido no dev, lento em produção",
      explicacao:
        "'A latência é zero' desmorona quando o servidor sai de localhost para o outro lado do país.",
    },
    {
      onde: "N+1 de chamadas remotas",
      explicacao:
        "Tratar chamada remota como chamada local ('o custo de transporte é zero') gera o loop que faz mil requisições.",
    },
  ],
  emUmaLinha: {
    lang: "typescript",
    code: `// A rede NÃO é confiável — declare timeout.
await fetch(url, { signal: AbortSignal.timeout(2000) });`,
  },
  custo: {
    indirecoes: 0,
    cobra: [
      "Levá-las a sério adiciona timeout, retry, tratamento de erro e observabilidade a cada chamada remota",
      "Cada falácia mitigada é mais código e mais casos de teste do que a versão ingênua que as ignora",
    ],
    naoValeSe:
      "tudo roda no mesmo processo, sem rede no meio — aí as falácias não se aplicam e proteger contra elas é peso morto.",
  },
  relacionados: ["timeout", "retry", "cap"],
  problema: [
    "Chamar um serviço pela rede se parece com chamar uma função local: mesma sintaxe, mesmo `await`. Essa semelhança é uma armadilha — ela convida a assumir que a rede se comporta como memória, e ela não se comporta.",
    "As suposições parecem tão óbvias que ninguém as declara: claro que a mensagem chega, claro que é rápido, claro que é seguro. Cada uma dessas 'obviedades' é uma falácia, e o sistema descobre isso no primeiro incidente de produção.",
  ],
  solucao: [
    "Tornar as oito suposições explícitas e negá-las por padrão: a rede falha, demora, tem limite, é hostil, muda, tem vários donos, custa e é heterogênea.",
    "Traduzir cada negação em prática: timeout e retry com backoff em toda chamada, tratamento de erro de rede como caso esperado, contratos versionados, e nunca um loop que faz uma chamada remota por item.",
  ],
  quandoUsar: [
    "Ao desenhar qualquer integração entre processos separados por rede.",
    "Em revisão de código que faz chamadas remotas, como checklist do que pode falhar.",
    "Ao diagnosticar por que algo rápido no desenvolvimento arrasta em produção.",
  ],
  quandoEvitar: [
    "Dentro de um processo único, onde não há rede entre as partes.",
    "Como pretexto para blindar contra falhas que o contexto real torna irrelevantes.",
  ],
  exemplos: EXEMPLOS,
  blocos: [
    {
      tipo: "tldr",
      texto:
        "São oito suposições que a semelhança entre chamada local e chamada remota convida a fazer — a rede é confiável, a latência é zero, a banda é infinita, a rede é segura, a topologia não muda, há um administrador só, o transporte é grátis, a rede é homogênea. Todas são falsas, e ignorá-las produz sistemas que funcionam no dev e desmoronam em produção. O antídoto é negá-las por padrão: timeout, retry, erro de rede como caso esperado, contratos versionados.",
    },
    {
      tipo: "analogia",
      emoji: "📮",
      titulo: "Mandar carta não é falar cara a cara",
      texto:
        "Conversar na mesma sala é como uma chamada local: instantâneo, garantido, você vê a cara do outro. Mandar uma carta é a rede: pode se perder no caminho, demora, pode ser aberta por estranhos, o endereço pode ter mudado, e você não sabe se chegou até receber resposta. Quem programa sistemas distribuídos como se ainda estivesse na mesma sala está mandando cartas e esperando a resposta imediata de uma conversa — e se frustra toda vez.",
    },
    {
      tipo: "secao",
      id: "as-oito",
      titulo: "As oito, e o que cada uma cobra",
      resumo: [
        "**1. A rede é confiável** — pacotes se perdem e conexões caem; sem retry, a operação some. **2. A latência é zero** — cada salto custa milissegundos, e o N+1 de chamadas remotas vira segundos. **3. A banda é infinita** — payloads gordos entopem o link e a conta. **4. A rede é segura** — assuma hostil: autentique e cifre.",
        "**5. A topologia não muda** — IPs e rotas mudam; não fixe endereço. **6. Há um administrador só** — vários donos com prioridades diferentes exigem contratos versionados. **7. O custo de transporte é zero** — serializar e mover dado gasta CPU e dinheiro. **8. A rede é homogênea** — protocolos e versões divergem entre as pontas.",
      ],
      extensao: [
        "As três primeiras são as que mais derrubam sistema, porque são invisíveis no desenvolvimento. Com o servidor em localhost, a rede *é* confiável, a latência *é* quase zero e a banda *é* praticamente infinita — então o código ingênuo passa em todo teste e só falha quando o tráfego cruza a internet de verdade. É a origem do clássico 'na minha máquina funciona'.",
        "A oitava falácia — 'a rede é homogênea' — foi a que Gosling acrescentou depois, e é a mais sutil: mesmo que tudo pareça HTTP e JSON, as pontas divergem em versões de protocolo, formatos de data, codificação, limites de tamanho. É o que torna 'contratos versionados' (a falácia 6) e 'validação na borda' não um luxo, e sim a única forma de duas partes que evoluem separadas continuarem se entendendo.",
        "O antídoto não é decorar a lista, é a postura: toda chamada remota é uma aposta que pode falhar, demorar ou voltar diferente. Daí vêm as práticas concretas do catálogo — **timeout** para não esperar para sempre, **retry** com backoff para as falhas transitórias, **idempotência** para o retry ser seguro, e o **CAP** para o que fazer quando a rede parte de vez.",
      ],
    },
    {
      tipo: "anti-exemplo",
      titulo: "Código que assume rede local",
      comoSeParece:
        "O código chama serviços remotos em sequência, um por item num laço, sem timeout e sem tratar falha de rede. Roda instantâneo no desenvolvimento, onde tudo é localhost, e passa em todos os testes — até ir para produção, onde cada chamada é uma travessia de rede e o laço vira segundos de espera que travam a tela inteira.",
      codigo: { lang: "typescript", code: ANTI_EXEMPLO },
      sintomas: [
        {
          quando: "Em produção",
          efeito:
            "As chamadas sequenciais somam a latência real da rede, e uma tela que abria na hora passa a levar segundos para carregar.",
        },
        {
          quando: "Com muitos itens",
          efeito:
            "O laço faz uma chamada remota por item (o N+1), então o tempo cresce linearmente com os dados e estoura sob volume.",
        },
        {
          quando: "Quando uma chamada trava",
          efeito:
            "Sem timeout, uma dependência lenta segura a requisição inteira, e o recurso fica preso esperando uma resposta que pode não vir.",
        },
      ],
      correcao:
        "Trate a rede como o que ela é: coloque timeout em toda chamada, agrupe as requisições (um endpoint que traz endereços em lote, ou paralelize com Promise.all em vez do laço sequencial) e trate erro de rede como caso esperado, com retry e um estado de falha na tela.",
    },
    {
      tipo: "casos",
      titulo: "Como isso aparece na prática",
      casos: [
        {
          titulo: "A tela que abria no dev e travava em produção",
          cenario:
            "Uma tela montava dados chamando três serviços em sequência e mais um por item de uma lista. No desenvolvimento, com tudo em localhost, abria instantânea; em produção levava oito segundos e às vezes estourava o timeout do navegador.",
          aplicacao:
            "As chamadas por item viraram uma única requisição em lote, o restante passou a rodar em paralelo com Promise.all, e cada chamada ganhou timeout com um estado de falha na interface.",
          tradeoff:
            "O backend ganhou um endpoint de lote a mais para manter. Em troca, a tela voltou a abrir em milissegundos e deixou de travar quando um serviço ficava lento.",
        },
        {
          titulo: "O contrato que quebrou sem ninguém mudar o código",
          cenario:
            "Uma integração com o serviço de outro time parou de funcionar de um dia para o outro. Ninguém do lado consumidor havia mexido em nada — o outro time subiu uma versão que mudou o formato de um campo de data.",
          aplicacao:
            "O contrato passou a ser versionado explicitamente e validado na borda: mudanças incompatíveis exigem uma versão nova, e o consumidor rejeita o que não bate com o schema esperado.",
          tradeoff:
            "Passou a haver o custo de manter versões de contrato e validar toda resposta. Em troca, uma mudança unilateral do outro lado deixou de derrubar a integração em silêncio.",
        },
      ],
    },
    {
      tipo: "armadilhas",
      titulo: "Onde isto dá errado",
      itens: [
        {
          titulo: "Validar só no localhost",
          texto:
            "No desenvolvimento a rede é confiável, rápida e larga, então o código ingênuo passa. As três primeiras falácias só aparecem quando o tráfego cruza a internet — e aí viram incidente, não bug de teste.",
        },
        {
          titulo: "Chamada remota dentro de um laço",
          texto:
            "Tratar chamada de rede como chamada local produz o N+1: uma requisição por item. O que era uma tela virou mil idas ao servidor, e a latência que era invisível vira o gargalo.",
        },
        {
          titulo: "Tratar erro de rede como exceção rara",
          texto:
            "Falha de rede não é o caso excepcional, é o caso esperado. Código que só tem o caminho feliz e deixa o erro estourar para o usuário está apostando contra a primeira falácia — e perde.",
        },
      ],
    },
    {
      tipo: "codigo",
      titulo: "As oito falácias e o antídoto",
      exemplos: EXEMPLOS,
    },
    {
      tipo: "quando",
      usar: [
        "Ao desenhar qualquer integração entre processos separados por rede.",
        "Como checklist em revisão de código que chama serviços remotos.",
        "Ao diagnosticar por que algo rápido no dev arrasta em produção.",
      ],
      evitar: [
        "Dentro de um processo único, sem rede entre as partes.",
        "Como pretexto para blindar contra falhas irrelevantes ao contexto.",
      ],
    },
  ],
};
