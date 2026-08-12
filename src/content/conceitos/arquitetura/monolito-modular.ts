import type { Conceito } from "@/shared/types/conceito";

const EXEMPLOS = [
  {
    lang: "typescript" as const,
    code: `// Monolito modular: UM deploy, mas fronteiras internas REAIS.
// Cada modulo expoe uma API publica e esconde o resto.

// modulo/estoque/index.ts  <- a UNICA porta do modulo de estoque
export interface EstoqueAPI {
  baixar(itemId: string, qtd: number): Promise<void>;
  disponivel(itemId: string): Promise<number>;
}
// o schema, os repositorios, as entidades do estoque ficam PRIVADOS.

// modulo/pedidos/servico.ts
import type { EstoqueAPI } from "../estoque"; // depende da INTERFACE
// e NAO de "../estoque/db/estoque-repository" (as entranhas).

// A regra que faz o modular funcionar: um modulo so importa a API
// publica do outro. Importar as entranhas e o que apodrece o monolito
// ate virar a "bola de lama". Ferramentas de lint podem PROIBIR isso.

// A chamada entre modulos e LOCAL (sem rede): mantem a transacao ACID
// e o refactor barato. Trocar por rede depois e opcao, nao obrigacao.`,
  },
];

export const monolitoModular: Conceito = {
  slug: "monolito-modular",
  titulo: "Monólito modular",
  categoria: "arquitetura",
  resumo:
    "O meio-termo que a moda dos microsserviços fez esquecer: um único deploy, mas com módulos de fronteiras internas reais, cada um escondendo suas entranhas atrás de uma API pública. Dá a maior parte do benefício da modularização — responsabilidades separadas, mudanças isoladas — sem pagar a rede, a consistência eventual e o custo operacional de distribuir. Costuma ser o ponto de partida certo, e o destino final de muita gente.",
  tags: ["arquitetura", "modularidade", "monolito", "fronteiras", "simplicidade"],
  dificuldade: "intermediario",
  tempoLeitura: 8,
  nasceu: {
    quando: { rotulo: "anos 2010", ano: 2016, precisao: "aproximada" },
    fonte:
      "O 'monólito modular' foi nomeado e defendido por Simon Brown e outros em meados dos anos 2010, como reação ao hype dos microsserviços",
    precursor:
      "Módulos com fronteiras claras dentro de um processo são a boa e velha modularização; o nome só reafirmou que dá para tê-la sem distribuir.",
  },
  ondeAparece: [
    {
      onde: "o modular monolith do Shopify",
      explicacao:
        "Um exemplo de referência: um monólito enorme, mas organizado em módulos com fronteiras internas explícitas e vigiadas.",
    },
    {
      onde: "módulos com API pública interna",
      explicacao:
        "Módulos que só se falam por interfaces declaradas, sem acessar as entranhas uns dos outros, dentro de um processo só.",
    },
    {
      onde: "um deploy, muitas fronteiras",
      explicacao:
        "A combinação que define o estilo: a simplicidade de um deploy com as fronteiras de responsabilidade de vários serviços.",
    },
  ],
  emUmaLinha: {
    lang: "typescript",
    code: `// Módulos no mesmo processo; fronteira lógica.
import { estoque } from "@app/estoque"; // sem HTTP`,
  },
  custo: {
    indirecoes: 1,
    cobra: [
      "As fronteiras entre módulos são acordo de equipe, não impostas pela rede, então dependem de disciplina para não apodrecer",
      "Escalar exige subir o processo inteiro, não um módulo quente isolado",
    ],
    naoValeSe:
      "o sistema já precisa de escala ou deploy independentes por parte — aí a fronteira de processo dos microsserviços passa a valer o custo que cobra.",
  },
  relacionados: ["microsservicos", "hexagonal", "srp"],
  problema: [
    "A escolha é apresentada como monólito (a 'bola de lama' onde tudo acessa tudo) ou microsserviços (a complexidade distribuída). É uma falsa dicotomia: o problema do monólito clássico não é ser um só processo, é não ter fronteiras internas.",
    "Sem fronteiras, qualquer parte importa qualquer outra, o acoplamento cresce sem freio, e o sistema apodrece até ninguém conseguir mudar nada sem quebrar três coisas. Mas distribuir para resolver acoplamento é apagar incêndio com gasolina — os pedaços acoplados agora falam por rede.",
  ],
  solucao: [
    "Manter um único deploy, mas organizar o código em módulos com fronteiras reais: cada módulo expõe uma API pública e mantém suas entranhas (schema, repositórios, entidades) privadas. Um módulo só depende da API do outro, nunca de seus internos.",
    "Vigiar essas fronteiras com ferramentas (lint de dependência, testes de arquitetura), já que dentro de um processo nada impede fisicamente um import proibido. A disciplina é o que separa o monólito modular da bola de lama.",
  ],
  quandoUsar: [
    "Como ponto de partida da maioria dos sistemas, antes de qualquer distribuição.",
    "Quando você quer fronteiras claras e mudanças isoladas sem pagar o custo operacional de microsserviços.",
    "Como forma de descobrir e estabilizar as fronteiras de domínio antes de decidir se vale distribuir.",
  ],
  quandoEvitar: [
    "Quando partes do sistema precisam mesmo de deploy ou escala independentes.",
    "Quando times numerosos travam uns aos outros no mesmo deploy apesar das fronteiras.",
  ],
  exemplos: EXEMPLOS,
  blocos: [
    {
      tipo: "tldr",
      texto:
        "O monólito modular é um único deploy com fronteiras internas reais: cada módulo esconde suas entranhas atrás de uma API pública, e um módulo só depende da API do outro. Entrega a modularização — responsabilidades separadas, mudanças isoladas — sem pagar rede, consistência eventual nem custo operacional. O que ele exige é disciplina: dentro de um processo, nada impede fisicamente um import proibido, então as fronteiras precisam ser vigiadas por ferramentas.",
    },
    {
      tipo: "analogia",
      emoji: "🏢",
      titulo: "Um prédio com paredes × um galpão vazio",
      texto:
        "Um monólito sem fronteiras é um galpão enorme sem paredes: cabe tudo, mas cada coisa esbarra na outra, e mudar o layout de um canto derruba pilhas do canto oposto. Um monólito modular é o mesmo prédio, agora com paredes e portas: os departamentos continuam sob o mesmo teto (um endereço, um deploy), mas cada sala tem uma porta por onde se entra e paredes que escondem a bagunça de dentro. Você não precisou construir prédios separados (microsserviços) para ter privacidade entre as salas — bastou levantar paredes de verdade.",
    },
    {
      tipo: "secao",
      id: "fronteira-sem-rede",
      titulo: "Fronteira lógica, sem a rede",
      resumo: [
        "A ideia central é separar duas coisas que os microsserviços juntam: a fronteira **lógica** (módulos que escondem seus internos) e a fronteira **física** (processos separados por rede). O monólito modular fica com a primeira e dispensa a segunda.",
        "O ganho é enorme: as chamadas entre módulos continuam locais, então a transação segue ACID, o refactor de uma fronteira é barato (é mover código, não migrar um banco) e não há as 8 falácias da rede no meio. Você tem responsabilidades separadas com a simplicidade de um processo só.",
      ],
      extensao: [
        "A fraqueza do estilo é a mesma que é sua força: como a fronteira é lógica e não física, **nada impede fisicamente** um módulo de importar as entranhas do outro. Num microsserviço, a rede é a barreira — você simplesmente não tem acesso à tabela do outro serviço. Num monólito modular, o acesso proibido está a um import de distância, e basta um atalho sob pressão de prazo para a fronteira começar a apodrecer. Por isso os projetos sérios impõem as fronteiras por ferramenta: regras de lint de dependência, testes de arquitetura que falham o build se um módulo importar o interno de outro.",
        "O maior valor estratégico do monólito modular é ser o **caminho reversível**. Ele é o melhor lugar para descobrir onde as fronteiras de domínio realmente ficam, porque mover uma fronteira aqui é uma refatoração de uma tarde, não uma migração distribuída de semanas. Quando (e se) um módulo específico passar a exigir escala ou deploy independentes, ele já está isolado atrás de uma API — extraí-lo para um microsserviço vira uma promoção da fronteira lógica a física, não uma reescrita. Começar modular e distribuir sob demanda quase sempre bate começar distribuído.",
      ],
    },
    {
      tipo: "casos",
      titulo: "Como isso aparece na prática",
      casos: [
        {
          titulo: "A bola de lama que ganhou paredes",
          cenario:
            "Um monólito de anos tinha virado uma bola de lama: qualquer mudança quebrava partes distantes, porque tudo importava tudo. A ideia inicial foi partir para microsserviços, mas o time percebeu que os pedaços acoplados só ganhariam rede no meio.",
          aplicacao:
            "Em vez de distribuir, o código foi reorganizado em módulos com API pública e internos privados, com regras de lint proibindo imports de entranhas. As fronteiras viraram reais sem sair do processo único.",
          tradeoff:
            "Exigiu disciplina contínua e ferramenta vigiando as fronteiras, já que nada físico as impõe. Em troca, o acoplamento caiu drasticamente sem o custo operacional de dez serviços novos.",
        },
        {
          titulo: "O módulo que virou serviço quando precisou",
          cenario:
            "Num monólito modular, o módulo de processamento de imagens passou a consumir CPU muito acima do resto e precisava escalar sozinho — algo que o deploy único não permitia.",
          aplicacao:
            "Como o módulo já vivia atrás de uma API pública, ele foi extraído para um serviço próprio com relativa facilidade: a fronteira lógica que já existia virou fronteira física.",
          tradeoff:
            "Aquele módulo específico passou a arcar com a rede e a consistência eventual dos microsserviços. Foi uma decisão pontual e barata justamente porque a fronteira já estava pronta — não uma reescrita.",
        },
      ],
    },
    {
      tipo: "armadilhas",
      titulo: "Onde isto dá errado",
      itens: [
        {
          titulo: "Módulos que importam as entranhas uns dos outros",
          texto:
            "Sem vigilância, um módulo importa o repositório ou a entidade interna do outro 'só desta vez', e a fronteira começa a apodrecer. O que mantém o modular modular é a regra, imposta por ferramenta, de só depender da API pública.",
        },
        {
          titulo: "Confundir pastas com módulos",
          texto:
            "Separar o código em pastas não cria fronteira nenhuma se qualquer arquivo importa qualquer outro. Módulo de verdade tem uma porta pública explícita e internos privados — organização visual sem regra de dependência é só cosmética.",
        },
        {
          titulo: "Insistir no monólito quando a escala pede divisão",
          texto:
            "O estilo tem limite: se uma parte precisa mesmo de deploy ou escala independentes, ou se times demais travam no mesmo deploy, é hora de extrair esse módulo para um serviço — negar isso troca um custo por outro.",
        },
      ],
    },
    {
      tipo: "codigo",
      titulo: "API pública, entranhas privadas",
      exemplos: EXEMPLOS,
    },
    {
      tipo: "quando",
      usar: [
        "Como ponto de partida da maioria dos sistemas.",
        "Para fronteiras claras sem o custo operacional de microsserviços.",
        "Para descobrir e estabilizar as fronteiras antes de distribuir.",
      ],
      evitar: [
        "Quando uma parte precisa mesmo de deploy ou escala independentes.",
        "Quando times demais travam uns aos outros no mesmo deploy.",
      ],
    },
  ],
};
