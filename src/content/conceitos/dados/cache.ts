import type { Conceito } from "@/shared/types/conceito";

const ANTI_EXEMPLO = `// Cache-aside "certo" na leitura — e errado na escrita:
async function buscarProduto(id: string) {
  const hit = await redis.get(\`produto:\${id}\`);
  if (hit) return JSON.parse(hit);

  const row = await db.produto.findUnique({ where: { id } });
  await redis.set(\`produto:\${id}\`, JSON.stringify(row), "EX", 3600);
  return row;
}

async function atualizarPreco(id: string, preco: number) {
  await db.produto.update({ where: { id }, data: { preco } });
  // Esqueceu de invalidar. O cache serve o preco velho por ate 1h.
  // Em pico de trafego, milhares de leituras veem o valor antigo —
  // e o TTL "resolve" so quando o dano ja foi feito.
}`;

const EXEMPLOS = [
  {
    lang: "typescript" as const,
    code: `// Cache-aside: a aplicacao manda. Leitura tenta o cache;
// miss vai ao banco e preenche. Escrita atualiza o banco
// E invalida (ou atualiza) a chave — sem isso, o cache mente.

async function getUser(id: string) {
  const key = \`user:\${id}\`;
  const cached = await redis.get(key);
  if (cached) return JSON.parse(cached);

  const user = await db.user.findUniqueOrThrow({ where: { id } });
  await redis.set(key, JSON.stringify(user), "EX", 300); // TTL de seguranca
  return user;
}

async function renameUser(id: string, name: string) {
  const user = await db.user.update({ where: { id }, data: { name } });
  await redis.del(\`user:\${id}\`); // invalida — proxima leitura reconstitui
  return user;
}

// Stampede: mil misses simultaneos no mesmo key viram mil queries.
// Mitigacao tipica: um lock curto ("singleflight") antes do fill.`,
  },
];

export const cache: Conceito = {
  slug: "cache",
  titulo: "Cache e invalidação",
  categoria: "dados",
  resumo:
    "Uma cópia rápida de um dado caro de obter. Acelera leitura e alivia o banco — em troca de uma pergunta permanente: como a cópia para de mentir quando a fonte muda? TTL, invalidação e stampede são o conteúdo; a ferramenta (Redis, Memcached, CDN) é só o endereço.",
  tags: ["performance", "dados", "redis", "ttl", "invalidacao"],
  dificuldade: "intermediario",
  tempoLeitura: 8,
  nasceu: {
    quando: { rotulo: "anos 1960", ano: 1965, precisao: "aproximada" },
    fonte:
      "Cache de CPU e de página em sistemas operacionais antecede o cache de aplicação — a metáfora (guardar o que acabou de custar) é a mesma desde o início da computação",
    precursor:
      "Bibliotecas, catálogos e mesas de referência: qualquer sistema que evita refazer um trabalho caro mantendo uma cópia local.",
  },
  ondeAparece: [
    {
      onde: "Redis / Memcached",
      explicacao:
        "O cache de aplicação clássico: chave-valor em memória, TTL nativo, e a aplicação decide o que guardar e quando apagar.",
    },
    {
      onde: "Cache-Control / ETag",
      explicacao:
        "O cache HTTP: navegador e CDN guardam a resposta e perguntam ao servidor se ainda vale — invalidação pelo protocolo.",
    },
    {
      onde: "React Query / SWR",
      explicacao:
        "Cache de dados no cliente com stale-while-revalidate: mostra o velho na hora e revalida em segundo plano.",
    },
  ],
  emUmaLinha: {
    lang: "typescript",
    code: `// Miss → fonte; hit → cópia. Escrita invalida a chave.
const v = (await redis.get(k)) ?? (await fillAndSet(k));`,
  },
  custo: {
    indirecoes: 1,
    cobra: [
      "Toda escrita precisa de uma política de invalidação — sem ela o cache serve mentira até o TTL",
      "Mais uma peça para operar, monitorar hit ratio e planejar o que acontece quando o cache cai",
      "Stampede no miss: mil clientes batem no banco juntos quando a chave expira",
    ],
    naoValeSe:
      "a leitura já é barata, o dado muda a cada request ou você não tem disciplina para invalidar — aí o cache só adiciona bugs de consistência.",
  },
  relacionados: [
    "replica-de-leitura",
    "indice",
    "cqrs",
    "flyweight",
    "consistencia-eventual",
  ],
  problema: [
    "A mesma consulta quente bate no banco milhares de vezes por segundo, devolvendo o mesmo resultado. O banco paga CPU e I/O; o usuário paga latência.",
    "A solução ingênua — guardar o resultado em memória — cria um segundo problema: a cópia envelhece. Sem regra de expiração ou invalidação, o sistema fica rápido e errado.",
  ],
  solucao: [
    "Manter, perto de quem lê, uma cópia do dado caro com uma política explícita de validade: TTL como rede de segurança, invalidação na escrita como verdade, ou ambos.",
    "Tratar o cache como otimização com falha esperada: se ele sumir, o sistema continua correto (só mais lento) — nunca o contrário.",
  ],
  quandoUsar: [
    "Leituras repetidas do mesmo dado, com escrita bem menos frequente.",
    "Resultados caros (JOIN pesado, agregação, chamada a serviço externo) cujo valor muda pouco.",
    "Na borda (CDN) para estáticos e páginas que toleram atraso de publicação.",
  ],
  quandoEvitar: [
    "Dados que mudam a cada escrita e precisam ser lidos imediatamente corretos sem caminho de invalidação.",
    "Como substituto de índice ou de modelo de leitura (CQRS): cache esconde sintoma; não redesenha a consulta.",
  ],
  exemplos: EXEMPLOS,
  blocos: [
    {
      tipo: "tldr",
      texto:
        "Cache é uma cópia rápida de um dado caro. O ganho é latência e alívio na fonte; o preço é consistência. Sem invalidação (ou TTL consciente), o sistema fica rápido e mente. O padrão de aplicação mais comum é cache-aside: a app lê o cache, no miss vai à fonte e preenche; na escrita, atualiza a fonte e apaga a chave.",
    },
    {
      tipo: "analogia",
      emoji: "🧾",
      titulo: "O post-it na geladeira",
      texto:
        "Você anota o PIN do Wi-Fi num post-it para não abrir o roteador toda vez. Funciona — até trocar a senha e esquecer de rasgar o post-it. Os convidados continuam digitando a senha velha. O post-it é o cache; rasgar (ou datar e trocar) é a invalidação.",
    },
    {
      tipo: "secao",
      id: "aside",
      titulo: "Cache-aside: a aplicação manda",
      resumo: [
        "No cache-aside (lazy loading), o cache não sabe da fonte: a aplicação pergunta ao cache, e só no miss vai ao banco e grava a cópia. É o modelo do Redis na maioria dos serviços.",
        "A simetria que falta na leitura aparece na escrita: depois de mudar a fonte, a chave precisa morrer (ou ser atualizada). Senão o próximo hit serve o passado.",
      ],
      extensao: [
        "Há variantes: write-through grava cache e fonte juntos; write-behind atrasa a fonte. Em API de produto, cache-aside domina porque o banco continua sendo a verdade e o cache pode sumir sem corrupção.",
        "TTL sozinho não é estratégia — é cinto de segurança. Com TTL de uma hora e sem `DEL` na escrita, você aceita até uma hora de mentira. Em catálogo de preço, isso é incidente; em contagem de views, talvez não.",
      ],
    },
    {
      tipo: "ilustracao",
      arquetipo: "fluxo",
      atores: [
        { id: "app", label: "App" },
        { id: "cache", label: "Cache", destaque: true },
        { id: "db", label: "Banco" },
      ],
      setas: [
        { label: "1. get key" },
        { label: "2. miss → query", tracejada: true },
      ],
      legenda:
        "Hit devolve no passo 1. Miss paga a fonte, a app preenche o cache com TTL, e a próxima leitura economiza.",
    },
    {
      tipo: "secao",
      id: "stampede",
      titulo: "Stampede e a chave que expira junto",
      resumo: [
        "Quando uma chave popular expira, N requisições descobrem o miss ao mesmo tempo e N queries batem no banco. O cache que deveria proteger vira amplificador.",
        "Mitigações: lock curto / singleflight (só um preenche), TTL com jitter (não expirar tudo no mesmo segundo), stale-while-revalidate (servir velho enquanto um revalida).",
      ],
    },
    {
      tipo: "demo",
      titulo: "E se o Redis cair?",
      demo: "falha-cache",
    },
    {
      tipo: "anti-exemplo",
      comoSeParece:
        "Cache que só sabe ler: a escrita atualiza o banco e esquece de invalidar a chave — o hit passa a mentir até o TTL",
      codigo: {
        lang: "typescript",
        code: ANTI_EXEMPLO,
      },
      sintomas: [
        {
          quando: "o preço muda no banco",
          efeito: "a API continua devolvendo o valor cacheado até o TTL",
        },
        {
          quando: "suporte e cliente divergem",
          efeito: "um bate no primário, o outro no hit — ninguém desconfia do Redis",
        },
      ],
      correcao:
        "Toda escrita que altera o valor cacheado apaga (ou atualiza) a chave no mesmo fluxo — e o TTL fica como rede de segurança, não como única política.",
    },
    {
      tipo: "secao",
      id: "camadas",
      titulo: "Não é tudo a mesma coisa",
      resumo: [
        "CDN cacheia HTTP na borda; Redis cacheia o que a aplicação decide; réplica de leitura escala SELECT no banco; índice acelera achar a linha. Confundir os quatro gera a peça errada no canvas.",
        "Flyweight também 'reusa' — mas dentro do processo, compartilhando estado imutável entre objetos. Cache de aplicação vive fora, com TTL e rede.",
      ],
    },
    {
      tipo: "casos",
      titulo: "Como isso aparece na prática",
      casos: [
        {
          titulo: "O preço que o cliente ainda via velho",
          cenario:
            "A página de produto era servida de um cache Redis com TTL de uma hora. O time de pricing atualizava o banco e abria chamado: 'o site não refletiu o desconto'.",
          aplicacao:
            "A escrita do admin passou a fazer `DEL` da chave no mesmo request. O TTL ficou só como rede de segurança para chaves órfãs.",
          tradeoff:
            "A primeira leitura após o publish paga o miss — irrelevante frente a milhares de hits corretos por minuto.",
        },
        {
          titulo: "Sessão e rate limit no Redis",
          cenario:
            "Precisava de store compartilhado entre instâncias para sessão e contador de rate limit, sem persistir no Postgres a cada request.",
          aplicacao:
            "Redis como store volátil: queda do cache desloga ou afrouxa o limite — trade-off consciente, documentado no runbook.",
          tradeoff:
            "Disponibilidade do Redis vira parte do caminho crítico. Mitigado com fail-open no rate limit e re-login barato na sessão.",
        },
        {
          titulo: "Asset versionado na CDN",
          cenario:
            "JS/CSS mudavam a cada deploy e purgar a CDN chave a chave era lento e falhava em PoPs.",
          aplicacao:
            "`app.[hash].js` com cache imutável longo: a invalidação é trocar o nome no HTML do deploy.",
          tradeoff:
            "Build e pipeline precisam emitir o hash; em troca, zero purge manual e hit ratio alto na borda.",
        },
      ],
    },
    {
      tipo: "armadilhas",
      titulo: "Onde isto dá errado",
      itens: [
        {
          titulo: "TTL como única invalidação",
          texto:
            "Funciona até o dia em que 'no máximo N minutos de atraso' vira bug de negócio. Invalidação na escrita é o padrão; TTL é backup.",
        },
        {
          titulo: "Cache sem plano de miss total",
          texto:
            "Se o Redis cai e a app não aguenta o thundering herd no banco, o cache virou single point of failure disfarçado de otimização.",
        },
        {
          titulo: "Chave sem namespace / sem versão",
          texto:
            "Um deploy muda o shape do JSON e o hit serve o formato antigo. Versionar a chave (`user:v2:id`) ou invalidar em massa no release.",
        },
      ],
    },
  ],
};
