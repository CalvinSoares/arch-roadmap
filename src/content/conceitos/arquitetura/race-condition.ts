import type { Conceito } from "@/shared/types/conceito";

const EXEMPLOS = [
  {
    lang: "typescript" as const,
    code: `// BUGADO: ler -> decidir -> gravar em três passos separados.
// Entre o SELECT e o UPDATE existe uma janela — e produção mora nela.
async function sacarBugado(db: Db, conta: string, valor: number) {
  const { saldo } = await db.one("SELECT saldo FROM contas WHERE id = $1", [conta]);
  if (saldo < valor) throw new Error("saldo insuficiente");   // os dois passam aqui
  await db.none("UPDATE contas SET saldo = saldo - $1 WHERE id = $2", [valor, conta]);
  // dois saques simultâneos de 100 numa conta com 100: ambos leem 100,
  // ambos passam na checagem, ambos gravam. Saldo final: -100.
}

// CORRETO: a decisão acontece DENTRO da escrita, onde o banco é atômico.
async function sacar(db: Db, conta: string, valor: number) {
  const alteradas = await db.result(
    \`UPDATE contas
        SET saldo = saldo - $1
      WHERE id = $2
        AND saldo >= $1\`,        // checagem e escrita na mesma operação
    [valor, conta]
  );
  if (alteradas.rowCount === 0) throw new Error("saldo insuficiente");
  // o segundo saque concorrente encontra saldo < valor e altera 0 linhas.
}

// Alternativa quando o conflito é raro: lock otimista por versão.
// UPDATE ... SET saldo = $novo, versao = versao + 1
//  WHERE id = $conta AND versao = $versaoLida
// -> 0 linhas alteradas = alguém mexeu antes; releia e tente de novo.
interface Db {
  one(sql: string, p: unknown[]): Promise<{ saldo: number }>;
  none(sql: string, p: unknown[]): Promise<void>;
  result(sql: string, p: unknown[]): Promise<{ rowCount: number }>;
}`,
  },
];

export const raceCondition: Conceito = {
  slug: "race-condition",
  titulo: "Race condition",
  categoria: "arquitetura",
  resumo:
    "Duas execuções leem o mesmo estado, decidem com base nele e gravam — e o resultado passa a depender de quem chega primeiro. É o bug que nunca aparece no teste e vende o mesmo ingresso duas vezes na sexta à noite.",
  tags: ["concorrencia", "atomicidade", "locks", "transacoes", "double-spend"],
  dificuldade: "intermediario",
  tempoLeitura: 7,
  nasceu: {
    quando: { rotulo: "anos 1950", ano: 1954, precisao: "aproximada" },
    fonte:
      "O termo vem da eletrônica digital dos anos 1950 — dois sinais 'correndo' por caminhos de atraso diferente até uma porta lógica; migrou para software concorrente depois",
    precursor:
      "Em circuitos, a corrida é física: dois sinais disputam qual chega primeiro. No software, a disputa é entre threads ou requisições pela mesma memória ou linha.",
  },
  ondeAparece: [
    {
      onde: "useEffect sem cleanup",
      explicacao:
        "Duas requisições em voo e a resposta antiga chega por último, sobrescrevendo a nova na tela — a corrida clássica do React sem função de limpeza.",
    },
    {
      onde: "duplo clique em Pagar",
      explicacao:
        "Dois cliques rápidos disparam duas cobranças antes de a primeira marcar o pedido como pago — a janela entre checar e agir.",
    },
    {
      onde: "if (!existe) cria() concorrente",
      explicacao:
        "Dois processos checam que o registro não existe ao mesmo tempo e ambos o criam: o check-then-act sem lock nem restrição de unicidade.",
    },
  ],
  emUmaLinha: {
    lang: "typescript",
    code: `// Duas escritas; a última ganha sem erro.
// Use versão/lock: UPDATE ... WHERE version = $v`,
  },
  custo: {
    indirecoes: 0,
    cobra: [
      "Proteger a seção crítica com lock, versão ou escrita atômica adiciona código e pontos de contenção",
      "Bugs de corrida são intermitentes e difíceis de reproduzir, o que encarece o diagnóstico",
    ],
    naoValeSe:
      "as execuções nunca tocam o mesmo estado ao mesmo tempo — sem dado disputado, não há corrida a proteger.",
  },
  relacionados: ["idempotencia", "ledger", "maquina-de-estados"],
  problema: [
    "Ler, decidir e gravar são três passos — e entre eles o mundo muda. Com uma requisição por vez tudo funciona; com duas simultâneas, ambas leem o mesmo saldo, ambas passam na checagem, ambas gravam. O teste unitário nunca vê, porque o teste roda sozinho.",
  ],
  solucao: [
    "Feche a janela: mova a decisão para dentro da operação atômica (UPDATE condicional, constraint UNIQUE, transação com lock) ou elimine a concorrência serializando por chave (uma fila por conta). A checagem que mora fora da escrita é decorativa.",
  ],
  quandoUsar: [
    "Todo recurso finito disputado: saldo, estoque, vagas, cupons.",
    "Qualquer código com o formato ler-checar-gravar sob concorrência.",
  ],
  quandoEvitar: [
    "Não é um padrão a aplicar, é um defeito a prevenir — o 'evitar' é não pagar o custo de lock onde não há disputa real.",
  ],
  exemplos: EXEMPLOS,
  blocos: [
    {
      tipo: "tldr",
      texto:
        "Quando duas execuções leem o mesmo estado e decidem juntas, o resultado depende da ordem de chegada — e a checagem 'if saldo >= valor' vira decoração. A cura nunca é checar com mais cuidado: é tornar checagem e escrita uma única operação atômica.",
    },
    {
      tipo: "analogia",
      emoji: "🎬",
      titulo: "A última poltrona do cinema",
      texto:
        "Duas pessoas abrem o app ao mesmo tempo e veem a poltrona F7 livre. As duas tocam em 'comprar'. Cada uma consultou um mundo que era verdade no momento da consulta — mas a decisão foi tomada depois, quando o mundo já podia ter mudado. Se o sistema não fizer 'verificar e reservar' num gesto só, alguém vai assistir ao filme no colo de um estranho.",
    },
    {
      tipo: "secao",
      id: "problema",
      titulo: "O problema: a janela entre ler e gravar",
      resumo: [
        "O formato é sempre o mesmo: SELECT para ler, if para decidir, UPDATE para gravar. Parece sequencial no seu código, mas o servidor atende dezenas de requisições ao mesmo tempo — e duas delas podem cruzar a mesma janela com a mesma leitura desatualizada.",
        "É o bug mais traiçoeiro de produção porque é probabilístico: passa no teste, passa no staging, passa meses em produção — e explode exatamente no pico, quando a concorrência é máxima e o estrago é maior.",
      ],
      extensao: [
        "O nome técnico do estrago mais comum é lost update: a segunda escrita sobrescreve a primeira sem nunca tê-la visto. Em bancos, o nível de isolamento padrão (read committed) não protege contra isso — transação aberta não é sinônimo de segurança. As armas reais: UPDATE condicional (a decisão vai no WHERE), SELECT ... FOR UPDATE (lock pessimista), coluna de versão (lock otimista) e UNIQUE constraint (o banco arbitra quem chegou primeiro).",
        "Quando o conflito é raro, lock otimista ganha: ninguém espera, e o perdedor ocasional apenas relê e repete. Quando a disputa é intensa (drop de ingressos, saldo de conta quente), lock pessimista ou serialização por fila evita a tempestade de retries. E note a relação com idempotência: retry sem chave é você criando uma corrida contra si mesmo.",
      ],
    },
    {
      tipo: "ilustracao",
      arquetipo: "antes-depois",
      antes: {
        titulo: "Checar fora da escrita",
        itens: [
          "1. SELECT saldo (os dois leem 100)",
          "2. if (saldo >= 100) — os dois passam",
          "3. UPDATE saldo = saldo − 100 (duas vezes)",
        ],
        nota: "Entre o passo 1 e o 3 existe uma janela em que outra execução faz tudo de novo — a checagem valida um mundo que já não existe.",
      },
      depois: {
        titulo: "Decidir dentro da escrita",
        itens: [
          "UPDATE ... SET saldo = saldo − 100",
          "WHERE id = conta AND saldo >= 100",
          "0 linhas alteradas → saldo insuficiente",
        ],
        nota: "Checagem e escrita viram uma operação só, arbitrada pelo banco: o segundo concorrente encontra a condição falsa e não grava nada.",
      },
      legenda:
        "A correção não é checar melhor — é eliminar a distância entre a checagem e a escrita, movendo a decisão para onde a atomicidade existe.",
    },
    {
      tipo: "camadas-nav",
      titulo: "Onde a corrida nasce — e onde morre",
      camadas: [
        {
          id: "aplicacao",
          titulo: "Aplicação",
          curto: "onde a janela é aberta",
          detalhe:
            "É no código de aplicação que o ler-decidir-gravar se espalha em três chamadas. Réplicas pioram: um lock em memória (mutex, Map de 'em processamento') só protege dentro de um processo — com duas instâncias atrás do load balancer, cada uma tem o seu.",
          seViolar:
            "confiar em lock de memória num serviço com mais de uma réplica é não ter lock — a corrida só muda de endereço.",
        },
        {
          id: "banco",
          titulo: "Banco de dados",
          curto: "onde a atomicidade de verdade mora",
          detalhe:
            "UPDATE condicional, UNIQUE constraint, SELECT FOR UPDATE, coluna de versão: o banco é o único árbitro que todas as réplicas compartilham. É aqui que a decisão deve acontecer — o WHERE é a checagem que não mente.",
          exemplo:
            "UPDATE ingressos SET dono = $1\n WHERE id = $2 AND dono IS NULL\n-- rowCount 0 = alguém levou antes",
          seViolar:
            "transação sem o isolamento ou lock certo dá falsa sensação de segurança: read committed permite lost update alegremente.",
        },
        {
          id: "fila",
          titulo: "Serialização por chave",
          curto: "eliminar a concorrência em vez de arbitrá-la",
          detalhe:
            "Quando a lógica é complexa demais para caber num UPDATE, enfileire: todas as operações da conta X passam por uma única fila (partição por chave no Kafka, lock distribuído). Um consumidor por chave = zero corrida por construção.",
          seViolar:
            "serializar tudo numa fila global em vez de por chave troca o bug por um gargalo: a conta X não deveria esperar a conta Y.",
        },
      ],
    },
    { tipo: "codigo", exemplos: EXEMPLOS },
    {
      tipo: "casos",
      casos: [
        {
          titulo: "Double spend em carteira digital",
          cenario:
            "Um cliente com R$ 100 de saldo dispara dois saques de R$ 100 no mesmo segundo — às vezes por má fé, às vezes porque o app fez retry sozinho após um timeout.",
          aplicacao:
            "O saque vira UPDATE condicional com saldo >= valor no WHERE, dentro da mesma transação que registra o lançamento no ledger. O segundo saque altera zero linhas e recebe 'saldo insuficiente' — não importa quantas réplicas do serviço existam.",
          tradeoff:
            "Contas muito quentes (a mesma linha disputada por centenas de operações/s) viram ponto de contenção no banco — aí a serialização por fila ou o particionamento de saldo entram na conversa.",
        },
        {
          titulo: "Overselling de vagas em evento",
          cenario:
            "Um curso com 50 vagas abre inscrições às 10h. Às 10h00m03s, 300 pessoas submetem o formulário; o código checava COUNT(*) < 50 antes de inserir.",
          aplicacao:
            "A contagem sai do código e vira estrutura: 50 linhas de 'vaga' pré-criadas, e inscrever-se é UPDATE vagas SET dono = $1 WHERE dono IS NULL LIMIT 1 — ou uma UNIQUE em (evento, posicao). O banco arbitra; a 51ª pessoa recebe 'esgotado' em vez de um assento fantasma.",
          tradeoff:
            "Modelar o recurso como linhas disputáveis exige repensar o schema — e o pico de contenção nos primeiros segundos continua exigindo atenção (fila de espera é o passo seguinte).",
        },
      ],
    },
    {
      tipo: "armadilhas",
      itens: [
        {
          titulo: "Resolver checando 'com mais cuidado'",
          texto:
            "Checar duas vezes, adicionar um sleep, revalidar antes do UPDATE: nada disso fecha a janela — só a encurta. Janela menor é bug mais raro e mais difícil de reproduzir, o que é pior. A única correção é atomicidade: decisão e escrita na mesma operação.",
        },
        {
          titulo: "Lock em memória com múltiplas réplicas",
          texto:
            "O mutex protege um processo; produção tem três. Cada réplica segura o próprio lock e a corrida continua entre elas. Coordenação entre processos exige um árbitro compartilhado: o banco, um lock distribuído, ou uma fila particionada por chave.",
        },
        {
          titulo: "Confiar que 'transação' resolve sozinha",
          texto:
            "BEGIN/COMMIT não impede lost update no isolamento padrão: duas transações read committed leem o mesmo saldo e gravam em cima uma da outra sem erro algum. Transação protege atomicidade do seu conjunto de escritas — não a validade da sua leitura. Para isso: FOR UPDATE, versão ou WHERE condicional.",
        },
        {
          titulo: "Criar corrida contra si mesmo com retry",
          texto:
            "Timeout + retry automático = duas execuções da mesma operação disputando o mesmo recurso. Sem chave de idempotência, o seu próprio cliente é o concorrente — e a dupla cobrança não precisa de dois usuários para acontecer.",
        },
      ],
    },
    {
      tipo: "quando",
      usar: [
        "Proteja com atomicidade todo recurso finito disputado: saldo, estoque, vagas, cupom de uso único.",
        "Prefira lock otimista quando o conflito é raro; pessimista ou fila quando a disputa é intensa.",
        "Trate retry como concorrência: chave de idempotência anda junto.",
      ],
      evitar: [
        "Lock pesado onde não há disputa real — contenção gratuita é lentidão gratuita.",
        "Serialização global quando dava para serializar por chave.",
        "Isolamento SERIALIZABLE no banco inteiro como 'garantia' — o custo aparece antes do benefício.",
      ],
    },
  ],
};
