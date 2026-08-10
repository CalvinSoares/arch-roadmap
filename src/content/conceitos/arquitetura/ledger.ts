import type { Conceito } from "@/shared/types/conceito";

const EXEMPLOS = [
  {
    lang: "typescript" as const,
    code: `// Saldo não é uma coluna: é a soma de lançamentos imutáveis.
// Partidas dobradas: todo valor SAI de uma conta e ENTRA em outra.
interface Lancamento {
  id: string;
  debito: string;   // conta de onde sai
  credito: string;  // conta onde entra
  centavos: number; // dinheiro em inteiro — nunca float
  motivo: string;
}

const livro: Lancamento[] = []; // append-only: sem UPDATE, sem DELETE

function lancar(l: Omit<Lancamento, "id">): Lancamento {
  if (l.centavos <= 0) throw new Error("valor deve ser positivo");
  if (l.debito === l.credito) throw new Error("contas distintas");
  const registro = { id: crypto.randomUUID(), ...l };
  livro.push(registro); // a única escrita permitida
  return registro;
}

// O saldo é DERIVADO — recontável, auditável, à prova de "de onde veio isso?"
function saldo(conta: string): number {
  return livro.reduce(
    (s, l) => s + (l.credito === conta ? l.centavos : 0) - (l.debito === conta ? l.centavos : 0),
    0
  );
}

// A invariante que dedura bugs: a soma do sistema inteiro é sempre zero.
function somaDoSistema(): number {
  return livro.reduce((s, l) => s + l.centavos - l.centavos, 0);
}

lancar({ debito: "banco:externo", credito: "cliente:ana", centavos: 10_000, motivo: "pix_in" });
lancar({ debito: "cliente:ana", credito: "cliente:bia", centavos: 2_500, motivo: "transferencia" });
// estorno NÃO apaga nada — é um lançamento no sentido contrário:
lancar({ debito: "cliente:bia", credito: "cliente:ana", centavos: 2_500, motivo: "estorno" });

console.log(saldo("cliente:ana")); // 10000
console.log(somaDoSistema());      // 0 — sempre`,
  },
];

export const ledger: Conceito = {
  slug: "ledger",
  titulo: "Ledger (livro-razão)",
  categoria: "arquitetura",
  resumo:
    "Em vez de um saldo que muda, um histórico imutável de lançamentos — e o saldo é a soma. Com partidas dobradas, todo valor sai de uma conta e entra em outra, e a soma do sistema é sempre zero: dinheiro não aparece nem some sem rastro.",
  tags: ["pagamentos", "partidas-dobradas", "auditoria", "saldo", "contabilidade"],
  dificuldade: "intermediario",
  tempoLeitura: 8,
  relacionados: ["append-only", "event-sourcing", "race-condition"],
  problema: [
    "UPDATE saldo = saldo - 100 destrói a história: depois de mil operações, ninguém explica de onde veio o número que está lá. Quando um bug, um estorno mal feito ou uma corrida deixa o saldo errado, não há trilha para achar o momento em que divergiu.",
  ],
  solucao: [
    "Trate o dinheiro como os contadores tratam há seis séculos: lançamentos imutáveis em partidas dobradas. Cada movimento debita uma conta e credita outra; o saldo é derivado da soma; correção é um novo lançamento, nunca uma edição.",
  ],
  quandoUsar: [
    "Qualquer sistema que guarda dinheiro ou valor de terceiros.",
    "Créditos, pontos e cotas que precisam de extrato e conciliação.",
    "Onde auditoria interna ou regulatória vai perguntar 'de onde veio esse número?'.",
  ],
  quandoEvitar: [
    "Contadores sem valor auditável (curtidas, visualizações).",
    "Estados que não são acumulação de movimentos (perfil, preferências).",
  ],
  exemplos: EXEMPLOS,
  blocos: [
    {
      tipo: "tldr",
      texto:
        "Saldo não é uma coluna que muda — é a soma de lançamentos imutáveis. Cada lançamento debita uma conta e credita outra (partidas dobradas), então a soma do sistema é sempre zero e qualquer bug que 'cria' ou 'some' dinheiro é detectado na hora.",
    },
    {
      tipo: "analogia",
      emoji: "📒",
      titulo: "O caderno da mercearia",
      texto:
        "O dono da mercearia não apaga a linha de ontem quando você paga a conta — escreve uma linha nova: 'pagou 50'. Se ele rasurasse o caderno, uma discussão sobre o total não teria como ser resolvida. O caderno inteiro é a prova; o total é só a soma das linhas. Bancos funcionam assim desde Veneza no século XV — e o seu extrato é exatamente isso.",
    },
    {
      tipo: "secao",
      id: "problema",
      titulo: "O problema: o saldo que não sabe se explicar",
      resumo: [
        "Um saldo guardado como coluna é um número sem memória. Funciona até o dia em que o financeiro pergunta por que a conta da Ana tem R$ 37,50 a mais — e a resposta honesta é 'não sabemos, o UPDATE sobrescreveu o passado'.",
        "Pior: a coluna mutável convida a corrida. Dois saques simultâneos leem o mesmo saldo, ambos passam na checagem, ambos gravam — e o dinheiro nasce do nada, sem deixar pista de quando.",
      ],
      extensao: [
        "Partidas dobradas resolvem o segundo problema estrutural: com uma perna só ('creditei 100 pra Ana'), um bug que esquece a contrapartida cria dinheiro silenciosamente. Com duas pernas obrigatórias, o dinheiro sempre vem de algum lugar — nem que seja de uma conta explícita 'mundo externo' — e a invariante soma-zero vira um alarme barato que roda em qualquer conciliação.",
        "O saldo derivado não precisa ser lento: materialize-o como projeção (uma linha por conta, atualizada na mesma transação do lançamento) e reconcilie periodicamente contra a soma real. O ledger continua sendo a fonte da verdade; a projeção é só cache com auditoria.",
      ],
    },
    {
      tipo: "ilustracao",
      arquetipo: "antes-depois",
      antes: {
        titulo: "Coluna de saldo",
        itens: [
          "UPDATE contas SET saldo = saldo - 100",
          "A história é sobrescrita a cada operação",
          "Divergiu? Não há como saber quando nem por quê",
        ],
        nota: "O número presente é tudo que existe — o passado foi destruído pelo próprio mecanismo de escrita.",
      },
      depois: {
        titulo: "Ledger de lançamentos",
        itens: [
          "INSERT lançamento (débito A, crédito B, 100)",
          "Saldo = SUM(créditos) − SUM(débitos)",
          "Estorno é um lançamento inverso — nada se apaga",
        ],
        nota: "Todo número tem extrato: dá para recontar, auditar e provar. A soma do sistema fecha em zero ou há um bug — e você fica sabendo.",
      },
      legenda:
        "A mesma operação de negócio, com e sem memória: o ledger troca 'confie no número' por 'reconte quando quiser'.",
    },
    {
      tipo: "camadas-nav",
      titulo: "Anatomia de um ledger",
      camadas: [
        {
          id: "lancamentos",
          titulo: "Lançamentos",
          curto: "a fonte da verdade — append-only, partidas dobradas",
          detalhe:
            "Uma tabela imutável: id, conta de débito, conta de crédito, valor em centavos inteiros, motivo, timestamp. Sem UPDATE nem DELETE — o banco pode até revogar esses privilégios do usuário da aplicação. Estorno, ajuste e correção são lançamentos novos.",
          exemplo:
            "REVOKE UPDATE, DELETE ON lancamentos FROM app;\n-- corrigir = lançar no sentido contrário",
          seViolar:
            "um único UPDATE 'só desta vez' quebra a confiança do livro inteiro: se uma linha pôde mudar, nenhuma soma prova mais nada.",
        },
        {
          id: "contas",
          titulo: "Contas e projeções",
          curto: "saldos materializados para leitura rápida",
          detalhe:
            "Recalcular SUM sobre milhões de linhas a cada consulta não escala. A projeção mantém o saldo corrente por conta, atualizado na mesma transação do lançamento — e um job de conciliação reconta a soma real e compara, alertando em qualquer divergência.",
          seViolar:
            "projeção atualizada fora da transação do lançamento abre janela para saldo e extrato discordarem — exatamente a dupla fonte de verdade que o ledger existe para eliminar.",
        },
        {
          id: "invariantes",
          titulo: "Invariantes",
          curto: "as regras que transformam dados em prova",
          detalhe:
            "Soma do sistema = 0 (partidas dobradas garantem por construção). Saldo de cliente nunca negativo — checado na transação de lançamento, onde a atomicidade do banco elimina a corrida. Toda movimentação com o mundo externo passa por contas explícitas de entrada/saída.",
          seViolar:
            "sem a checagem de saldo dentro da transação, dois saques simultâneos passam juntos — o ledger registra fielmente a história de um bug de corrida.",
        },
      ],
    },
    { tipo: "codigo", exemplos: EXEMPLOS },
    {
      tipo: "casos",
      casos: [
        {
          titulo: "Carteira digital num PaaS de pagamentos",
          cenario:
            "Clientes têm saldo, recebem PIX, transferem entre si e sacam. O BACEN e a auditoria interna exigem provar cada centavo, e a conciliação com o extrato do banco liquidante roda todo dia.",
          aplicacao:
            "Cada pix_in debita 'banco:liquidante' e credita a carteira; cada saque faz o inverso. O saldo exibido é projeção; a conciliação soma o ledger e bate com o extrato externo. Estorno de PIX é lançamento inverso referenciando o original — o histórico do cliente mostra os dois.",
          tradeoff:
            "Escrever duas pernas e atualizar projeção na mesma transação custa mais por operação do que um UPDATE — e o time precisa aprender a pensar em contas e contrapartidas, o que não é intuitivo no primeiro contato.",
        },
        {
          titulo: "Créditos de uso de uma API",
          cenario:
            "Uma plataforma vende pacotes de créditos consumidos por chamada. Clientes contestam cobranças ('não usei isso tudo') e o comercial dá cortesias que precisam de rastro.",
          aplicacao:
            "Compra credita a conta do cliente contra 'receita'; cada chamada debita 1 crédito contra 'consumo'; cortesia vem de uma conta própria 'marketing'. A resposta para toda contestação é o extrato — linha a linha, com timestamp e motivo.",
          tradeoff:
            "Volume alto de débitos minúsculos infla a tabela rápido; agregação em lote (um lançamento por minuto de uso) alivia, ao custo de granularidade no extrato.",
        },
      ],
    },
    {
      tipo: "armadilhas",
      itens: [
        {
          titulo: "Ledger com UPDATE liberado",
          texto:
            "Se a tabela de lançamentos aceita UPDATE ou DELETE, você não tem um ledger — tem uma tabela com nome pomposo. A imutabilidade é o que dá valor de prova; imponha no banco (REVOKE, triggers), não só no combinado do time.",
        },
        {
          titulo: "Uma perna só (single-entry)",
          texto:
            "Registrar 'creditei 100 na Ana' sem a contrapartida deixa a pergunta 'de onde veio?' sem resposta — e um bug que credita sem debitar cria dinheiro invisível. A segunda perna é o que faz a soma-zero funcionar como alarme.",
        },
        {
          titulo: "Float para dinheiro",
          texto:
            "0.1 + 0.2 !== 0.3 em ponto flutuante, e num ledger cada erro de arredondamento é uma divergência de conciliação. Centavos em inteiro (ou tipo decimal do banco) — sempre.",
        },
        {
          titulo: "Saldo recalculado do zero a cada consulta",
          texto:
            "SUM sobre o histórico inteiro funciona no protótipo e morre com um milhão de linhas. Materialize o saldo por conta e use snapshots periódicos como ponto de partida da recontagem — o ledger é fonte de verdade, não índice de leitura.",
        },
      ],
    },
    {
      tipo: "quando",
      usar: [
        "Dinheiro ou valor de terceiros sob sua guarda — carteira, saldo, cotas.",
        "Créditos e pontos que geram contestação e precisam de extrato.",
        "Sistemas sujeitos a auditoria ou regulação financeira.",
      ],
      evitar: [
        "Contadores descartáveis sem valor probatório (likes, views).",
        "Estado que não é soma de movimentos — perfil, configuração, catálogo.",
        "Protótipos em que a modelagem contábil atrasaria a validação da ideia.",
      ],
    },
  ],
};
