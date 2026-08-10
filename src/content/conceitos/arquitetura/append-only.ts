import type { Conceito } from "@/shared/types/conceito";

const EXEMPLOS = [
  {
    lang: "typescript" as const,
    code: `// Um log append-only: a única operação de escrita é "acrescentar no fim".
interface Registro {
  seq: number;            // posição no log — nunca reaproveitada
  tipo: string;
  dados: Record<string, unknown>;
  em: string;             // timestamp ISO
}

const log: Registro[] = [];

function anexar(tipo: string, dados: Record<string, unknown>): Registro {
  const r = { seq: log.length + 1, tipo, dados, em: new Date().toISOString() };
  log.push(r); // sem splice, sem sobrescrever: o passado é intocável
  return r;
}

// Correção não edita o registro errado — SUPERA com um registro novo:
anexar("email-alterado", { usuario: "ana", email: "ana@exemplo.com" });
anexar("email-alterado", { usuario: "ana", email: "ana@empresa.com" }); // vale o mais recente

// O estado atual é uma PROJEÇÃO derivada do log, não a fonte da verdade:
function emailAtual(usuario: string): string | undefined {
  let email: string | undefined;
  for (const r of log) {
    if (r.tipo === "email-alterado" && r.dados.usuario === usuario) {
      email = r.dados.email as string;
    }
  }
  return email; // e o log inteiro responde "quando mudou, de quê, para quê"
}

console.log(emailAtual("ana")); // ana@empresa.com — com a história preservada`,
  },
];

export const appendOnly: Conceito = {
  slug: "append-only",
  titulo: "Append-only",
  categoria: "arquitetura",
  resumo:
    "Uma estrutura onde a única escrita permitida é acrescentar no fim: nada se edita, nada se apaga. Corrigir é gravar um registro novo que supera o anterior — e é assim que funcionam o WAL do seu banco, o Kafka, o git e o seu extrato.",
  tags: ["log", "imutabilidade", "auditoria", "wal", "event-log"],
  dificuldade: "intermediario",
  tempoLeitura: 6,
  relacionados: ["ledger", "event-sourcing", "webhooks"],
  problema: [
    "UPDATE in place destrói a versão anterior no exato momento em que grava a nova. Com ela vão embora o debug ('o que estava aqui ontem?'), a auditoria ('quem mudou?') e a replicação barata ('o que mudou desde a posição X?').",
  ],
  solucao: [
    "Escreva só no fim. O passado vira registro imutável; o presente é uma projeção derivada; correção é um registro novo que supera o antigo. Concorrência fica trivial — escritores disputam apenas a posição final — e qualquer consumidor consegue reconstruir tudo lendo do início.",
  ],
  quandoUsar: [
    "Trilhas de auditoria e histórico que precisam ter valor de prova.",
    "Integração entre sistemas via log de eventos (cada um lê no seu ritmo).",
    "Dados em que 'quando e por que mudou' importa tanto quanto o valor atual.",
  ],
  quandoEvitar: [
    "Estado quente sem valor histórico, com alto volume de reescrita.",
    "Dados pessoais sob direito de esquecimento sem estratégia para isso.",
  ],
  exemplos: EXEMPLOS,
  blocos: [
    {
      tipo: "tldr",
      texto:
        "Só se escreve no fim: nada é editado, nada é apagado. Correção é um novo registro que supera o anterior, o estado atual é uma projeção derivada, e o log vira ao mesmo tempo história, prova e mecanismo de sincronização.",
    },
    {
      tipo: "analogia",
      emoji: "✒️",
      titulo: "O livro de registros do cartório",
      texto:
        "Em cartório, ninguém apaga um assento errado — faz-se uma averbação: um registro novo, datado e assinado, dizendo 'o anterior fica retificado assim'. O erro continua visível, a correção também, e qualquer um pode reconstituir a história folheando em ordem. Rasura em cartório não corrige: incrimina.",
    },
    {
      tipo: "secao",
      id: "problema",
      titulo: "O problema: o UPDATE é um destruidor de evidências",
      resumo: [
        "Toda vez que uma linha é sobrescrita, uma versão do mundo deixa de existir. No dia em que o suporte pergunta 'o endereço de entrega mudou antes ou depois do despacho?', a resposta já foi destruída pela própria operação que causou a dúvida.",
        "E o custo não é só forense: sistemas que precisam reagir a mudanças (réplicas, caches, buscas, times vizinhos) não têm o que consumir — sobra CDC ou gambiarras de polling comparando snapshots.",
      ],
      extensao: [
        "Você já depende de append-only mesmo sem saber: todo banco relacional grava primeiro num WAL (write-ahead log) e só depois aplica nas páginas — é o que torna crash recovery e replicação possíveis. Kafka é um log distribuído com retenção. O git nunca edita um commit: 'amend' cria outro objeto e move o ponteiro. A ideia sustenta a infraestrutura inteira; o padrão é trazê-la para o seu modelo de dados quando a história importa.",
        "A diferença para Event Sourcing: append-only é a propriedade da estrutura (só anexa); Event Sourcing é uma decisão de arquitetura que usa essa estrutura como fonte única da verdade do domínio. Dá para ter uma tabela de auditoria append-only ao lado de um CRUD normal — sem adotar Event Sourcing.",
      ],
    },
    {
      tipo: "ilustracao",
      arquetipo: "estrutura",
      blocos: [
        {
          id: "log",
          label: "Log (append-only)",
          filhos: [
            { id: "r1", label: "registro 1" },
            { id: "r2", label: "registro 2" },
            { id: "r3", label: "registro 3 ← única posição de escrita", destaque: true },
          ],
        },
        {
          id: "projecoes",
          label: "Projeções derivadas",
          filhos: [
            { id: "estado", label: "estado atual" },
            { id: "busca", label: "índice de busca" },
          ],
        },
      ],
      legenda:
        "A escrita só acontece no fim do log; tudo que é 'estado atual' é derivado dele — descartável e reconstruível a qualquer momento.",
    },
    {
      tipo: "camadas-nav",
      titulo: "As três responsabilidades",
      camadas: [
        {
          id: "escrita",
          titulo: "Escrita",
          curto: "anexar no fim — e mais nada",
          detalhe:
            "Um único ponto de contenção (a posição final), o que torna a escrita sequencial e rápida. A imutabilidade merece ser imposta no armazenamento: REVOKE de UPDATE/DELETE, tabela particionada por tempo, ou um broker de log como Kafka.",
          seViolar:
            "um único registro editado 'por emergência' invalida o valor probatório do log inteiro — se um pôde mudar, todos podem ter mudado.",
        },
        {
          id: "retencao",
          titulo: "Compactação e retenção",
          curto: "o passado arquiva-se; não se edita",
          detalhe:
            "Log sem política de retenção é disco crescendo para sempre. As saídas honestas: retenção por tempo (expira segmentos antigos), compactação por chave (mantém o último registro de cada chave, como o Kafka faz) ou snapshot + poda (guarda um resumo e descarta o detalhe antigo).",
          seViolar:
            "sem retenção planejada, a primeira crise de disco pressiona a 'limpar na mão' — e a limpeza improvisada é exatamente a edição que o modelo proíbe.",
        },
        {
          id: "leitura",
          titulo: "Leitura (projeções)",
          curto: "estado atual é cache derivado do log",
          detalhe:
            "Consultar 'o valor de agora' varrendo o log inteiro não escala: materialize projeções (tabela de estado, índice de busca) atualizadas conforme o log avança. Cada consumidor guarda sua posição e lê no próprio ritmo.",
          seViolar:
            "ler o log inteiro a cada consulta transforma a elegância do modelo em O(n) por request — a projeção não é opcional em produção.",
        },
      ],
    },
    { tipo: "codigo", exemplos: EXEMPLOS },
    {
      tipo: "casos",
      casos: [
        {
          titulo: "Trilha de auditoria de um sistema financeiro",
          cenario:
            "Compliance exige responder 'quem alterou o limite deste cliente, quando e de quanto para quanto' por cinco anos — e provar que o registro não foi adulterado depois.",
          aplicacao:
            "Toda mutação relevante grava um registro append-only (ator, antes, depois, timestamp) numa tabela sem UPDATE/DELETE, com hash encadeado opcional para evidenciar adulteração. O CRUD continua normal; a auditoria é um subproduto barato de cada transação.",
          tradeoff:
            "Escrita dupla em toda operação auditada e um volume de dados que cresce sem teto — retenção e arquivamento em storage frio viram tarefa de rotina.",
        },
        {
          titulo: "Log de eventos entre times",
          cenario:
            "O time de pedidos precisa avisar estoque, nota fiscal e recomendação a cada venda — sem acoplar seu deploy ao ritmo dos três consumidores.",
          aplicacao:
            "Pedidos publica eventos num tópico com retenção de dias; cada consumidor mantém seu offset e processa no próprio ritmo. Um consumidor novo (ou um reprocessamento após bug) simplesmente lê o log desde o início — o passado está todo lá.",
          tradeoff:
            "Consumidores atrasados leem um mundo defasado (consistência eventual), e o schema dos eventos vira contrato público: evoluí-lo sem quebrar leitores antigos exige disciplina de versionamento.",
        },
      ],
    },
    {
      tipo: "armadilhas",
      itens: [
        {
          titulo: "O UPDATE 'só desta vez'",
          texto:
            "Produção pegando fogo, alguém edita um registro direto no banco para 'corrigir rápido'. A partir daí o log não prova mais nada — auditoria que aceita exceção não é auditoria. Corrija como o modelo manda: um registro novo de retificação, com motivo.",
        },
        {
          titulo: "Imutabilidade × LGPD sem plano",
          texto:
            "Direito de esquecimento e log imutável colidem de frente. Quem guarda dado pessoal em log precisa decidir no design: criptografar por titular e descartar a chave (crypto-shredding), registrar tombstones, ou manter o pessoal fora do log. Descobrir isso no primeiro pedido de exclusão é tarde.",
        },
        {
          titulo: "Crescimento infinito 'para depois'",
          texto:
            "Sem política de retenção, o log cobra em disco, em backup e em tempo de replay. Compactação, snapshot e arquivamento não são otimização prematura — são parte do modelo, decididas junto com ele.",
        },
      ],
    },
    {
      tipo: "quando",
      usar: [
        "Histórico com valor de prova: auditoria, financeiro, saúde, jurídico.",
        "Integração via eventos onde consumidores leem em ritmos diferentes.",
        "Debug e replicação — reconstruir qualquer estado passado lendo o log.",
      ],
      evitar: [
        "Estado quente reescrito milhares de vezes sem ninguém ler a história.",
        "Dados pessoais sob exclusão obrigatória, sem crypto-shredding planejado.",
        "Times sem apetite para operar retenção e projeções — um CRUD com tabela de auditoria pode bastar.",
      ],
    },
  ],
};
