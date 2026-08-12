import type { Conceito } from "@/shared/types/conceito";

const ANTI_EXEMPLO = `// Lock pessimista segurando trabalho externo dentro dele.
await db.transacao(async (tx) => {
  const pedido = await tx.query(
    "SELECT * FROM pedidos WHERE id = $1 FOR UPDATE", [id]
  );

  // A linha esta travada. E agora esperamos a rede.
  const cobranca = await gateway.cobrar(pedido.total);  // ate 30s
  const nota = await fiscal.emitir(pedido);             // ate 60s

  await tx.atualizar(id, { status: "PAGO", cobranca, nota });
});

// Enquanto isso, TODA requisicao que tocar este pedido espera.
// E se o gateway travar, a linha fica presa ate o timeout da transacao —
// segurando conexao, bloqueando o VACUUM e enfileirando quem chegar.
//
// O lock deveria durar microssegundos. Aqui ele dura minutos,
// porque alguem colocou uma chamada de rede dentro dele.`;

const EXEMPLOS = [
  {
    lang: "typescript" as const,
    code: `// PESSIMISTA: assume conflito. Trava antes, todo mundo espera.
await db.transacao(async (tx) => {
  const conta = await tx.query(
    "SELECT saldo FROM contas WHERE id = $1 FOR UPDATE", [id]
  );
  // ninguem mais le esta linha ate o commit
  await tx.query("UPDATE contas SET saldo = $1 WHERE id = $2",
    [conta.saldo - valor, id]);
});

// OTIMISTA: assume que nao vai dar conflito. Nao trava nada.
// A versao entra no WHERE — se mudou, a escrita nao acha a linha.
const r = await db.query(
  \`UPDATE pedidos SET status = $1, versao = versao + 1
   WHERE id = $2 AND versao = $3\`,
  [novoStatus, id, versaoQueEuLi],
);

if (r.rowCount === 0) {
  // alguem escreveu entre a minha leitura e a minha escrita
  throw new ConflitoDeVersao();  // recarregar e tentar de novo
}`,
  },
  {
    lang: "python" as const,
    code: `# A escolha e sobre PROBABILIDADE de conflito, nao sobre gosto.
#
#   conflito raro  -> otimista  (nada espera; poucos refazem)
#   conflito comum -> pessimista (todos esperam um pouco;
#                                 ninguem refaz trabalho)
#
# Com conflito comum e lock otimista, o sistema entra em
# "livelock": todo mundo tenta, quase todo mundo falha, todo mundo
# tenta de novo — e a vazao util despenca sob carga.

def reservar_assento(db, voo_id, assento, versao_lida):
    linhas = db.execute(
        "UPDATE assentos SET ocupado = true, versao = versao + 1 "
        "WHERE voo_id = %s AND numero = %s AND versao = %s AND NOT ocupado",
        (voo_id, assento, versao_lida),
    ).rowcount

    if linhas == 0:
        raise ConflitoDeVersao("o assento mudou desde que voce viu a tela")

# Nota: o 'NOT ocupado' nao e redundancia — ele protege mesmo se
# alguem esquecer de incrementar a versao em algum caminho.`,
  },
];

export const lockOtimistaPessimista: Conceito = {
  slug: "lock-otimista-pessimista",
  titulo: "Lock otimista × pessimista",
  categoria: "dados",
  resumo:
    "Duas formas de impedir que duas escritas concorrentes se apaguem. O pessimista trava antes e faz todo mundo esperar; o otimista não trava nada e descobre o conflito na hora de gravar. A escolha é sobre a probabilidade de conflito, não sobre preferência.",
  tags: ["concorrencia", "lock", "versao", "conflito", "banco"],
  dificuldade: "intermediario",
  tempoLeitura: 8,
  nasceu: {
    quando: { rotulo: "1981", ano: 1981, precisao: "aproximada" },
    fonte:
      "H. T. Kung & John Robinson, 'On Optimistic Methods for Concurrency Control', ACM TODS, 1981 — o artigo que nomeou o controle otimista",
    precursor:
      "O controle pessimista (travar antes de mexer) já era a norma nos bancos dos anos 1970; Kung e Robinson propuseram o oposto — agir e validar no fim — para cargas de pouca disputa.",
  },
  ondeAparece: [
    {
      onde: "SELECT ... FOR UPDATE",
      explicacao:
        "O pessimista na forma mais direta: a linha fica travada até o fim da transação.",
    },
    {
      onde: "O @Version do JPA/Hibernate",
      explicacao:
        "Otimista embutido no ORM: ele acrescenta a versão ao `WHERE` e lança exceção quando nenhuma linha é afetada.",
    },
    {
      onde: "O ETag e o If-Match do HTTP",
      explicacao:
        "É lock otimista sobre a rede: você manda a versão que leu, e o servidor recusa com `412` se ela mudou.",
    },
  ],
  emUmaLinha: {
    lang: "typescript",
    code: `// Otimista: a versao entra no WHERE. Zero linhas = conflito.
UPDATE pedidos SET status=$1, versao=versao+1 WHERE id=$2 AND versao=$3`,
  },
  custo: {
    indirecoes: 0,
    cobra: [
      "Otimista: quem chama precisa saber recarregar e refazer o trabalho",
      "Pessimista: a linha fica indisponível, e transação longa vira fila",
      "Otimista guarda uma coluna de versão a mais em toda tabela que o usa",
    ],
    naoValeSe:
      "a operação cabe num `UPDATE` condicional sobre o próprio valor. `saldo = saldo - 30 WHERE saldo >= 30` não precisa de versão nem de trava.",
  },
  relacionados: ["niveis-de-isolamento", "race-condition", "idempotencia"],
  problema: [
    "Duas requisições leem o mesmo registro, cada uma altera um campo e as duas gravam. A segunda gravação apaga a primeira — sem erro, sem conflito visível, sem ninguém saber.",
    "É o *lost update*, e ele não some sozinho: o intervalo entre ler e escrever é justamente onde a outra requisição cabe.",
  ],
  solucao: [
    "**Pessimista**: travar a linha na leitura, de modo que ninguém mais a leia até o commit. Ninguém refaz trabalho, mas todos esperam.",
    "**Otimista**: não travar nada e carregar a versão lida até a escrita, recusando-a se a versão mudou. Ninguém espera, mas quem perdeu refaz.",
  ],
  quandoUsar: [
    "Otimista: quando o conflito é raro — telas de edição, formulários longos, dados que poucas pessoas tocam ao mesmo tempo.",
    "Pessimista: quando o conflito é comum e refazer é caro — estoque de item concorrido, assento de voo, fila de atendimento.",
    "Quando a operação não pode ser expressa como uma única escrita condicional.",
  ],
  quandoEvitar: [
    "Quando um `UPDATE` condicional resolve. Ele é mais barato que qualquer um dos dois.",
    "Pessimista com trabalho externo dentro da transação — a linha fica presa pelo tempo da rede.",
    "Otimista sob alta contenção: quase todo mundo falha e refaz, e a vazão útil despenca.",
  ],
  exemplos: EXEMPLOS,
  blocos: [
    {
      tipo: "tldr",
      texto:
        "Pessimista trava antes e faz esperar; otimista não trava e falha no commit se alguém passou na frente. Conflito raro pede otimista (ninguém espera à toa); conflito comum pede pessimista (senão todo mundo refaz trabalho). E se a operação couber num `UPDATE` condicional, nenhum dos dois é necessário.",
    },
    {
      tipo: "analogia",
      emoji: "🅿️",
      titulo: "A vaga do estacionamento",
      texto:
        "Pessimista é pôr um cone na vaga antes de manobrar: ninguém toma o seu lugar, mas a vaga fica bloqueada mesmo enquanto você ainda está chegando. Otimista é manobrar direto e descobrir na hora se alguém chegou antes — mais rápido quando o estacionamento está vazio, e uma sucessão de manobras perdidas quando está cheio.",
    },
    {
      tipo: "secao",
      id: "escolher",
      titulo: "A escolha é uma aposta sobre a taxa de conflito",
      resumo: [
        "Os dois resolvem o mesmo problema e trocam o custo de lugar. O pessimista paga **espera**, sempre, mesmo quando não haveria conflito. O otimista paga **retrabalho**, mas só quando o conflito acontece de verdade.",
        "Então a pergunta é uma só: com que frequência duas escritas disputam o mesmo registro?",
      ],
      extensao: [
        "Com conflito raro — o caso comum em telas de edição —, o otimista é claramente melhor: nenhuma requisição espera, e o punhado que colide recarrega e tenta de novo. Colocar lock pessimista aí é fazer 99% das requisições pagarem pelo 1%.",
        "Com conflito comum, o otimista degrada de um jeito perverso. Se dez requisições disputam o mesmo assento, uma vence e nove falham; se todas repetirem, o padrão se repete. O sistema fica ocupado fazendo trabalho que será jogado fora, e a vazão **cai** conforme a carga sobe. É o oposto do que se espera de um sistema sem travas.",
        "Existe uma terceira via que costuma ser esquecida e que dispensa os dois: **a escrita condicional atômica**. `UPDATE contas SET saldo = saldo - 30 WHERE id = 1 AND saldo >= 30` não tem janela entre ler e escrever, então não há o que travar nem o que versionar. Sempre que a operação puder ser escrita assim, ela deve ser.",
        "E há a versão distribuída do otimista: o `ETag` do HTTP. O cliente recebe a versão do recurso, manda de volta em `If-Match`, e o servidor recusa com `412 Precondition Failed` se ela mudou. É exatamente o mesmo mecanismo, atravessando a rede em vez do banco.",
      ],
    },
    {
      tipo: "ilustracao",
      arquetipo: "antes-depois",
      antes: {
        titulo: "Pessimista",
        itens: [
          "Trava a linha na leitura",
          "Quem chegar depois espera até o commit",
          "Ninguém refaz trabalho",
          "Transação longa vira fila para todo mundo",
        ],
        nota: "Paga espera sempre — inclusive nas requisições que nunca teriam conflito com ninguém.",
      },
      depois: {
        titulo: "Otimista",
        itens: [
          "Não trava nada; carrega a versão lida",
          "A escrita recusa se a versão mudou",
          "Ninguém espera",
          "Quem perdeu recarrega e refaz",
        ],
        nota: "Paga retrabalho só quando há conflito — e paga muito caro se o conflito for a regra.",
      },
      legenda:
        "Não há vencedor: há uma aposta sobre a frequência de conflito. Errar a aposta transforma a solução no gargalo.",
    },
    {
      tipo: "casos",
      titulo: "Como isso aparece na prática",
      casos: [
        {
          titulo: "A tela de edição de produto",
          cenario:
            "Dois operadores abrem o mesmo produto, um altera o preço e outro a descrição. Quem salva por último desfaz a alteração do outro, e ninguém percebe até o cliente reclamar do preço errado.",
          aplicacao:
            "Coluna de versão no produto, enviada junto no formulário. Se a versão mudou, a tela avisa 'este produto foi alterado enquanto você editava' e mostra o que mudou.",
          tradeoff:
            "O operador perde o trabalho de digitação quando há conflito — a menos que a interface saiba mesclar campos diferentes, o que é bem mais caro de construir.",
        },
        {
          titulo: "O assento do voo",
          cenario:
            "Nos últimos assentos de um voo cheio, dezenas de pessoas tentam reservar o mesmo lugar em segundos. Com lock otimista, quase todas falham, repetem, e a taxa de sucesso cai conforme o interesse aumenta.",
          aplicacao:
            "Lock pessimista na linha do assento durante a reserva, que dura milissegundos e é puramente local ao banco.",
          tradeoff:
            "As requisições passam a se enfileirar, e a latência sobe sob disputa. Em compensação, quem espera consegue — em vez de todos falharem juntos.",
        },
      ],
    },
    {
      tipo: "anti-exemplo",
      titulo: "Lock pessimista segurando a rede",
      comoSeParece:
        "A linha é travada com `FOR UPDATE` e, ainda dentro da transação, o código chama o gateway de pagamento e o emissor de nota. O lock, que deveria durar microssegundos, passa a durar o tempo da rede alheia.",
      codigo: { lang: "typescript", code: ANTI_EXEMPLO },
      sintomas: [
        {
          quando: "Se a API externa lentificar",
          efeito:
            "A linha fica travada por minutos, e toda requisição que a tocar entra na fila atrás dela.",
        },
        {
          quando: "Sob carga",
          efeito:
            "Conexões ficam presas em transações abertas e o pool esgota — um problema de rede vira indisponibilidade do banco.",
        },
        {
          quando: "No Postgres",
          efeito:
            "Transações longas atrasam o `VACUUM`, e a tabela incha com versões antigas que não podem ser recolhidas.",
        },
      ],
      correcao:
        "Lock e chamada externa não convivem. Trave, decida, grave e feche a transação — e faça a chamada externa **fora** dela, com idempotência para poder repetir. Se a ordem importar, o caminho é registrar a intenção (Outbox) e processar depois.",
    },
    {
      tipo: "armadilhas",
      titulo: "Onde isto dá errado",
      itens: [
        {
          titulo: "Chamada de rede dentro do lock",
          texto:
            "Um lock que dura o tempo de uma API externa não é mais um lock de banco — é um gargalo com prazo indeterminado. Transações que travam linha precisam ser curtas e puramente locais.",
        },
        {
          titulo: "Otimista sob alta contenção",
          texto:
            "Quando quase todo mundo colide, quase todo mundo refaz. O sistema fica ocupado produzindo trabalho descartado, e a vazão útil cai justamente quando a carga sobe.",
        },
        {
          titulo: "Esquecer de incrementar a versão em algum caminho",
          texto:
            "Basta uma rota que atualiza sem mexer na versão para o mecanismo inteiro passar a mentir: as outras escritas vão achar que nada mudou. A versão precisa ser responsabilidade do banco (trigger) ou de uma camada única.",
        },
        {
          titulo: "Locks adquiridos em ordens diferentes",
          texto:
            "Duas transações que travam A depois B e B depois A se bloqueiam mutuamente. O banco detecta e mata uma, mas o erro chega como falha aleatória. Ordem de aquisição de lock precisa ser consistente.",
        },
        {
          titulo: "Tratar conflito de versão como erro do sistema",
          texto:
            "Conflito otimista não é bug: é o mecanismo funcionando. Se ele chega ao usuário como 'erro inesperado' em vez de 'isto mudou enquanto você editava', a informação útil se perdeu.",
        },
        {
          titulo: "Usar qualquer um dos dois quando um `UPDATE` resolve",
          texto:
            "Se a nova valor depende só do antigo, uma escrita condicional atômica elimina a janela inteira — sem coluna de versão, sem trava e sem retrabalho.",
        },
      ],
    },
    {
      tipo: "codigo",
      titulo: "Os dois, lado a lado",
      exemplos: EXEMPLOS,
    },
    {
      tipo: "quando",
      usar: [
        "Otimista quando o conflito é raro: telas de edição, formulários longos.",
        "Pessimista quando o conflito é comum e refazer é caro.",
        "Quando a operação não cabe numa única escrita condicional.",
      ],
      evitar: [
        "Qualquer um dos dois se um `UPDATE` condicional resolve.",
        "Pessimista com chamada externa dentro da transação.",
        "Otimista sob alta contenção.",
      ],
    },
  ],
};
