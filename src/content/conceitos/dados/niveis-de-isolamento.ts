import type { Conceito } from "@/shared/types/conceito";

const ANTI_EXEMPLO = `// "Colocamos SERIALIZABLE, agora esta seguro."
await db.transacao({ isolamento: "SERIALIZABLE" }, async (tx) => {
  const saldo = await tx.saldo(contaId);
  await tx.debitar(contaId, valor);
});

// O que ninguem contou: em SERIALIZABLE o banco NAO faz voce esperar.
// Ele deixa as duas transacoes correrem e ABORTA uma no commit,
// com erro de serializacao (Postgres: 40001).
//
// Sem retry, esse erro chega ao usuario como "erro inesperado".
// E o codigo acima nao tem retry — entao o nivel mais forte
// deixou o sistema MENOS confiavel do que estava.`;

const EXEMPLOS = [
  {
    lang: "typescript" as const,
    code: `// As quatro anomalias, e o nivel minimo que impede cada uma:
//
//   dirty read        (le o que nao commitou)     -> READ COMMITTED
//   non-repeatable    (le duas vezes, valor muda) -> REPEATABLE READ
//   phantom           (le duas vezes, LINHAS mudam) -> REPEATABLE READ*
//   lost update       (dois updates, um some)     -> REPEATABLE READ
//   write skew        (dois validos, juntos invalidos) -> SERIALIZABLE
//
// * no Postgres. No padrao SQL, phantom so cai em SERIALIZABLE.

// LOST UPDATE — o classico, e o mais caro:
// T1: le saldo (100) ... calcula 100-30 ... escreve 70
// T2:       le saldo (100) ... calcula 100-50 ... escreve 50
// Resultado: 50. O debito de 30 evaporou.

// A correcao nao e "subir o nivel": e nao ler para depois escrever.
await tx.query(
  "UPDATE contas SET saldo = saldo - $1 WHERE id = $2 AND saldo >= $1",
  [valor, contaId],
);
// O banco resolve a leitura e a escrita numa operacao so.
// Nenhuma janela entre uma coisa e outra — nenhuma anomalia possivel.`,
  },
  {
    lang: "python" as const,
    code: `# SERIALIZABLE nao bloqueia: ele ABORTA. Entao exige retry.
from psycopg import errors

def transferir(db, de, para, valor, tentativas=3):
    for _ in range(tentativas):
        try:
            with db.transacao(isolamento="SERIALIZABLE") as tx:
                tx.debitar(de, valor)
                tx.creditar(para, valor)
            return
        except errors.SerializationFailure:
            # 40001: o banco desistiu desta para preservar a outra.
            # Tentar de novo e o comportamento correto — nao e bug.
            continue
    raise RuntimeError("nao foi possivel serializar apos 3 tentativas")

# WRITE SKEW: o unico que SERIALIZABLE pega e REPEATABLE READ nao.
# Regra: sempre 1 medico de plantao.
#   T1 le "2 de plantao", conclui que pode sair, sai.
#   T2 le "2 de plantao", conclui que pode sair, sai.
# Cada transacao viu um estado valido. Juntas, deixaram 0 de plantao.`,
  },
];

export const niveisDeIsolamento: Conceito = {
  slug: "niveis-de-isolamento",
  titulo: "Níveis de isolamento",
  categoria: "dados",
  resumo:
    "Transações concorrentes se atrapalham de formas específicas e nomeadas. O nível de isolamento é a escolha de quais dessas anomalias o banco vai impedir — e cada degrau a mais custa concorrência, ou custa transações abortadas.",
  tags: ["transacao", "concorrencia", "acid", "anomalia", "banco"],
  dificuldade: "avancado",
  tempoLeitura: 10,
  nasceu: {
    quando: { rotulo: "1992", ano: 1992, precisao: "aproximada" },
    fonte:
      "Os quatro níveis foram padronizados no ANSI SQL-92 (1992); a base teórica é de Jim Gray et al., 'Granularity of Locks and Degrees of Consistency', 1976",
    precursor:
      "Gray já descrevia 'graus de consistência' em 1976; o SQL-92 os batizou pelas anomalias que proíbem — e cada banco depois implementou o nome à sua maneira.",
  },
  ondeAparece: [
    {
      onde: "O padrão do seu banco",
      explicacao:
        "Postgres e Oracle vêm em READ COMMITTED; MySQL/InnoDB vem em REPEATABLE READ. Quase ninguém verifica qual é.",
    },
    {
      onde: "O erro 40001 do Postgres",
      explicacao:
        "`serialization_failure` é o banco dizendo que abortou a sua transação para preservar outra — e que você deveria repetir.",
    },
    {
      onde: "SELECT ... FOR UPDATE",
      explicacao:
        "É como se pede bloqueio explícito quando o nível escolhido não garante o que a operação precisa.",
    },
  ],
  emUmaLinha: {
    lang: "typescript",
    code: `// Nao leia para depois escrever: peca ao banco fazer os dois.
UPDATE contas SET saldo = saldo - $1 WHERE id = $2 AND saldo >= $1`,
  },
  custo: {
    indirecoes: 0,
    cobra: [
      "Cada degrau a mais reduz concorrência ou aumenta transações abortadas",
      "SERIALIZABLE obriga o código a saber repetir — sem retry, ele piora a confiabilidade",
      "O comportamento real varia entre bancos com o mesmo nome de nível",
    ],
    naoValeSe:
      "a operação pode ser expressa como uma escrita atômica só. Um `UPDATE` condicional resolve mais barato que qualquer nível.",
  },
  relacionados: ["race-condition", "idempotencia", "lock-otimista-pessimista"],
  problema: [
    "Duas transações que rodam ao mesmo tempo podem se atrapalhar de formas que nenhuma delas percebe: uma lê um valor que a outra ainda vai desfazer, ou as duas leem o mesmo saldo e uma sobrescreve o débito da outra.",
    "O banco não impede isso por padrão. Ele oferece níveis de garantia, e o nível padrão da maioria das instalações permite anomalias que o código raramente considera.",
  ],
  solucao: [
    "Conhecer as anomalias pelo nome — dirty read, non-repeatable read, phantom, lost update, write skew — e qual nível impede cada uma.",
    "Escolher o nível pela invariante que a operação precisa preservar, e não pela sensação de segurança que o nome transmite.",
  ],
  quandoUsar: [
    "Sempre que duas requisições podem tocar a mesma linha ao mesmo tempo.",
    "Em qualquer operação que leia um valor, calcule algo com ele e escreva de volta.",
    "Ao decidir entre subir o nível, usar bloqueio explícito ou reescrever como operação atômica.",
  ],
  quandoEvitar: [
    "Subir o nível como amuleto, sem saber qual anomalia se está impedindo.",
    "SERIALIZABLE sem retry — ele aborta transações, e sem repetição isso vira erro para o usuário.",
  ],
  exemplos: EXEMPLOS,
  blocos: [
    {
      tipo: "tldr",
      texto:
        "O banco não isola transações totalmente por padrão — ele oferece níveis, e cada um impede um conjunto nomeado de anomalias. Subir o nível não é grátis: ou reduz concorrência, ou passa a abortar transações, o que exige retry. E várias anomalias somem sozinhas se você parar de ler-para-depois-escrever.",
    },
    {
      tipo: "analogia",
      emoji: "📋",
      titulo: "Duas pessoas editando a mesma planilha impressa",
      texto:
        "Cada uma tira uma cópia, escreve suas alterações e devolve. Quem devolve por último apaga o trabalho de quem devolveu antes — e ninguém percebe, porque a folha final está coerente. Nível de isolamento é o combinado sobre isso: da cópia livre (rápida, perde trabalho) até a caneta única passada de mão em mão (lenta, não perde nada).",
    },
    {
      tipo: "secao",
      id: "anomalias",
      titulo: "As anomalias, uma a uma",
      resumo: [
        "**Dirty read**: você lê um valor que outra transação escreveu e ainda vai desfazer. **Non-repeatable read**: você lê a mesma linha duas vezes e o valor mudou no meio. **Phantom**: você roda a mesma consulta duas vezes e apareceram linhas novas.",
        "**Lost update**: duas transações leem o mesmo valor, cada uma calcula em cima dele, e a segunda escrita apaga a primeira. **Write skew**: cada transação vê um estado válido, mas o efeito conjunto delas viola a regra.",
      ],
      extensao: [
        "As duas últimas são as caras. **Lost update** é o clássico do saldo: T1 lê 100 e vai debitar 30; T2 lê 100 e vai debitar 50. As duas escrevem, e o resultado é 50 — o débito de 30 sumiu sem erro, sem log, sem nada. Se isso for dinheiro, alguém pagou a conta.",
        "**Write skew** é o mais sutil e o único que exige SERIALIZABLE. A regra é 'sempre pelo menos um médico de plantão'. Duas transações leem que há dois de plantão, cada uma conclui que pode liberar o seu, e as duas liberam. Nenhuma leu nada desatualizado; nenhuma escreveu na linha da outra. Mesmo assim, a regra foi violada — porque a invariante é sobre o **conjunto**, e nenhuma das duas o observou inteiro.",
        "Vale um aviso sobre nomenclatura: o padrão SQL define quatro níveis pelas anomalias que eles proíbem, mas cada banco implementa à sua maneira. O REPEATABLE READ do Postgres impede phantoms (porque usa *snapshot isolation*), enquanto o padrão só exige isso em SERIALIZABLE. O SERIALIZABLE do Postgres é *serializable snapshot isolation*, que aborta em vez de bloquear. **O nome do nível não define o comportamento — a implementação define.**",
      ],
    },
    {
      tipo: "ilustracao",
      arquetipo: "fluxo",
      atores: [
        { id: "t1le", label: "T1 lê saldo = 100" },
        { id: "t2le", label: "T2 lê saldo = 100", destaque: true },
        { id: "t1esc", label: "T1 escreve 70" },
        { id: "t2esc", label: "T2 escreve 50", destaque: true },
        { id: "fim", label: "Saldo final: 50" },
      ],
      setas: [
        { label: "as duas leem antes de qualquer escrita" },
        { label: "T1 debita 30" },
        { label: "T2 debita 50 sobre o valor velho" },
        { label: "o débito de 30 desapareceu", tracejada: true },
      ],
      legenda:
        "Lost update: nenhuma das duas transações fez nada de errado isoladamente, e nenhuma recebeu erro. O dinheiro simplesmente sumiu entre a leitura e a escrita.",
    },
    {
      tipo: "secao",
      id: "escolher",
      titulo: "A saída raramente é subir o nível",
      resumo: [
        "Diante de uma anomalia, o reflexo é escolher um nível mais forte. Quase sempre há uma saída melhor: eliminar a janela entre ler e escrever.",
        "`UPDATE contas SET saldo = saldo - 30 WHERE id = 1 AND saldo >= 30` não tem janela — o banco resolve a leitura e a escrita numa operação só, e nenhum nível de isolamento precisa entrar na conversa.",
      ],
      extensao: [
        "Quando a operação não cabe numa escrita só, as opções em ordem de custo são: **bloqueio explícito** (`SELECT ... FOR UPDATE`), que é pessimista e serializa só as linhas em disputa; **versão otimista** (`WHERE versao = $atual`), que não bloqueia nada e falha na hora do commit; e por fim **SERIALIZABLE**, que delega ao banco a detecção e o aborto.",
        "SERIALIZABLE tem uma pegadinha que derruba sistemas: ele **não faz esperar, ele aborta**. O Postgres devolve `40001` e espera que você repita. Código que trata isso como erro genérico transforma o nível mais forte de isolamento numa fonte nova de erro 500 — o oposto do que se queria.",
        "E há o custo de concorrência. Cada degrau reduz o quanto o banco pode executar em paralelo, e sob carga isso aparece como fila e latência. Não existe nível 'seguro por padrão': existe a invariante que você precisa preservar, e o mecanismo mais barato que a preserva.",
      ],
    },
    {
      tipo: "casos",
      titulo: "Como isso aparece na prática",
      casos: [
        {
          titulo: "O cupom de uso único usado três vezes",
          cenario:
            "Um cupom promocional tem limite de mil resgates. O código lê a contagem, compara com o limite e insere o resgate. Numa promoção com tráfego alto, o cupom foi resgatado 1.043 vezes.",
          aplicacao:
            "A verificação e a inserção passaram a acontecer numa operação só, com restrição no banco garantindo o limite — em vez de um `SELECT` seguido de `INSERT`.",
          tradeoff:
            "A regra migra do código da aplicação para uma restrição no schema, o que a torna menos visível para quem lê só o serviço. Em troca, ela passa a ser impossível de violar por concorrência.",
        },
        {
          titulo: "O SERIALIZABLE que virou erro 500",
          cenario:
            "Depois de um incidente de saldo inconsistente, um time subiu todas as transações críticas para SERIALIZABLE. A inconsistência sumiu — e a taxa de erro 500 subiu em horário de pico.",
          aplicacao:
            "As transações passaram a repetir automaticamente em caso de `40001`, com backoff e jitter, e apenas as operações com invariante de conjunto ficaram no nível mais alto.",
          tradeoff:
            "A latência do p99 piorou nas operações que agora repetem, e o código ficou mais complexo. É o preço de uma garantia que antes não existia.",
        },
      ],
    },
    {
      tipo: "anti-exemplo",
      titulo: "SERIALIZABLE sem retry",
      comoSeParece:
        "O nível mais forte foi escolhido para acabar com as inconsistências. Ninguém avisou que ele não bloqueia — ele aborta —, e o código não sabe repetir. O resultado é que a garantia mais cara do banco virou uma fonte nova de erro para o usuário.",
      codigo: { lang: "typescript", code: ANTI_EXEMPLO },
      sintomas: [
        {
          quando: "Sob concorrência",
          efeito:
            "O banco devolve `40001` e a transação é abortada; sem repetição, isso chega ao usuário como erro inesperado.",
        },
        {
          quando: "Em horário de pico",
          efeito:
            "Quanto mais tráfego, mais conflitos de serialização — a taxa de erro cresce exatamente quando o sistema é mais usado.",
        },
        {
          quando: "No diagnóstico",
          efeito:
            "O erro aponta para o banco, e não para a decisão de isolamento, o que faz o time procurar no lugar errado.",
        },
      ],
      correcao:
        "SERIALIZABLE é um contrato de duas partes: o banco detecta o conflito, e você repete. Trate `40001` como falha transitória, com backoff e jitter. E antes disso, verifique se a operação não caberia num `UPDATE` condicional — que não precisa de nível nenhum.",
    },
    {
      tipo: "armadilhas",
      titulo: "Onde isto dá errado",
      itens: [
        {
          titulo: "Assumir que o nível padrão é seguro",
          texto:
            "Postgres e Oracle vêm em READ COMMITTED, que permite lost update tranquilamente. A maioria dos sistemas roda no padrão sem que ninguém tenha decidido isso — o padrão é uma escolha de quem instalou, não uma garantia.",
        },
        {
          titulo: "Confiar no nome do nível entre bancos diferentes",
          texto:
            "REPEATABLE READ do Postgres impede phantoms; o do padrão SQL não. SERIALIZABLE do Postgres aborta; o de outros bancos bloqueia. Portar código entre bancos mantendo o nome do nível não mantém o comportamento.",
        },
        {
          titulo: "Ler, calcular e escrever dentro da transação",
          texto:
            "Esse é o formato que produz lost update. Quase sempre há um `UPDATE` condicional equivalente que elimina a janela — e ele é mais barato que qualquer nível de isolamento.",
        },
        {
          titulo: "Achar que a transação protege o que está fora do banco",
          texto:
            "Chamar uma API dentro da transação não desfaz a chamada no rollback. O isolamento cobre o banco, e só ele; efeito externo precisa de idempotência e compensação.",
        },
        {
          titulo: "Transação longa como jeito de garantir consistência",
          texto:
            "Segurar a transação aberta enquanto se faz outro trabalho aumenta a janela de conflito, prende conexão e, em Postgres, atrasa o `VACUUM`. Transação é para ser curta.",
        },
        {
          titulo: "Ignorar write skew porque 'ninguém escreve na mesma linha'",
          texto:
            "Write skew acontece justamente sem escrita concorrente na mesma linha: as transações escrevem em linhas diferentes e ainda assim violam uma regra sobre o conjunto. É o único caso que exige SERIALIZABLE de verdade.",
        },
      ],
    },
    {
      tipo: "demo",
      titulo: "Veja a anomalia acontecer",
      demo: "isolamento",
    },
    {
      tipo: "codigo",
      titulo: "As anomalias e a saída atômica",
      exemplos: EXEMPLOS,
    },
    {
      tipo: "quando",
      usar: [
        "Sempre que duas requisições podem tocar a mesma linha ao mesmo tempo.",
        "Em toda operação que lê, calcula e escreve de volta.",
        "Ao escolher entre nível, bloqueio explícito e escrita atômica.",
      ],
      evitar: [
        "Subir o nível sem saber qual anomalia se quer impedir.",
        "SERIALIZABLE sem tratamento de `40001`.",
        "Transações longas seguradas por trabalho externo.",
      ],
    },
  ],
};
