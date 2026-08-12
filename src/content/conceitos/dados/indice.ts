import type { Conceito } from "@/shared/types/conceito";

const ANTI_EXEMPLO = `// Existe indice em "email" — a busca deveria ser instantanea:
//   CREATE INDEX idx_usuarios_email ON usuarios (email);

// Mas a consulta envolve a coluna numa funcao:
const sql = "SELECT * FROM usuarios WHERE LOWER(email) = $1";
//                                        ^^^^^^^^^^^^
// O indice e sobre "email", nao sobre "LOWER(email)".
// O banco nao consegue usa-lo: cai em Seq Scan e varre a tabela.
//
// O mesmo vale para outras transformacoes na coluna:
//   WHERE email LIKE '%@x.com'       (curinga a esquerda)
//   WHERE data::text = '2026-08-11'  (cast na coluna)
//   WHERE valor + 10 > 100           (aritmetica na coluna)
//
// O indice existe, aparece no \\d da tabela e da a sensacao de
// que a query esta coberta — e nao esta. So o EXPLAIN revela.`;

const EXEMPLOS = [
  {
    lang: "typescript" as const,
    code: `// Um indice e uma copia ORDENADA de uma coluna (uma B-tree),
// mantida em paralelo a tabela. Ordenada = da para achar por
// busca binaria em vez de varrer linha a linha.

// SEM indice: achar 1 email em 10 milhoes = ler 10 milhoes (Seq Scan).
// COM indice: achar 1 email em 10 milhoes = ~23 passos (log2 de 10M).

// Diagnostico: o EXPLAIN diz se a query USOU o indice.
//   Index Scan using idx_usuarios_email   -> usou (bom)
//   Seq Scan on usuarios                   -> nao usou (varreu tudo)

// A regra da coluna: o indice serve o filtro so se a coluna
// aparece "crua" na condicao — sem funcao, sem cast, sem curinga
// a esquerda. Por isso guarda-se o dado ja normalizado:
await db.insert("usuarios", { email: email.toLowerCase() });
// e a busca fica: WHERE email = $1  -> usa o indice, direto.

// Indice composto (a, b) serve filtros por "a" e por "a AND b",
// mas NAO por "b" sozinho: a ordem das colunas e a ordem do catalogo.`,
  },
];

export const indice: Conceito = {
  slug: "indice",
  titulo: "Índice de banco",
  categoria: "dados",
  resumo:
    "A diferença entre achar uma linha em milhões e varrer todas elas. Um índice é uma cópia ordenada de uma coluna que troca busca linear por busca binária — a estrutura que faz a query voar. O preço vem em cada escrita, que agora precisa manter o índice também, e na sutileza de que o índice só serve quando a consulta o consulta do jeito certo.",
  tags: ["banco", "performance", "b-tree", "consulta", "dados"],
  dificuldade: "intermediario",
  tempoLeitura: 8,
  nasceu: {
    quando: { rotulo: "1970", ano: 1970, precisao: "aproximada" },
    fonte:
      "Rudolf Bayer & Edward McCreight, 'Organization and Maintenance of Large Ordered Indexes', 1970/1972 — a B-tree, estrutura por trás da maioria dos índices",
    precursor:
      "Índices ordenados para busca rápida já existiam nos sistemas de arquivos indexados (o ISAM da IBM, anos 1960), antes de a B-tree lhes dar a forma balanceada que escala.",
  },
  ondeAparece: [
    {
      onde: "CREATE INDEX",
      explicacao:
        "O comando que constrói a estrutura ordenada da coluna para a busca deixar de varrer a tabela inteira.",
    },
    {
      onde: "Index Scan × Seq Scan no EXPLAIN",
      explicacao:
        "O plano de execução mostra se a query usou o índice ou desistiu dele e varreu tudo — o diagnóstico do desempenho.",
    },
    {
      onde: "a PRIMARY KEY",
      explicacao:
        "Toda chave primária cria um índice único automaticamente; é o índice que quase todo mundo usa sem perceber que criou.",
    },
  ],
  emUmaLinha: {
    lang: "typescript",
    code: `// Cópia ordenada de uma coluna: acha por busca binária.
CREATE INDEX idx_pedidos_cliente ON pedidos (cliente_id);`,
  },
  custo: {
    indirecoes: 0,
    cobra: [
      "Cada INSERT, UPDATE e DELETE passa a manter também o índice — escrita fica mais lenta a cada índice na tabela",
      "Ocupa espaço em disco proporcional aos dados indexados, e um índice grande pode não caber na memória",
      "Dá falsa sensação de cobertura: o índice existe, mas a query com função ou curinga à esquerda não o usa",
    ],
    naoValeSe:
      "a coluna tem pouquíssimos valores distintos ou a tabela é pequena. Varrer mil linhas é mais rápido que pular por um índice que quase não filtra.",
  },
  relacionados: ["sharding", "niveis-de-isolamento", "lock-otimista-pessimista"],
  problema: [
    "Encontrar as linhas que batem com um filtro (`WHERE email = ...`) sem ajuda obriga o banco a ler a tabela inteira e comparar linha por linha — o Seq Scan. Em mil linhas ninguém nota; em dez milhões, cada consulta é um desastre.",
    "A tabela é guardada na ordem em que os dados chegam, não na ordem de nenhuma coluna. Sem uma estrutura auxiliar, não há como pular direto para a linha certa: só varrendo.",
  ],
  solucao: [
    "Manter, ao lado da tabela, uma cópia ordenada da coluna — tipicamente uma B-tree. Como está ordenada, o banco acha o valor por busca binária: dezenas de passos em vez de milhões.",
    "Criar índices guiado pelas consultas reais: indexar as colunas que aparecem nos filtros e nas ordenações quentes, verificar com o EXPLAIN que o índice está sendo usado, e não indexar por reflexo o que a escrita vai pagar sem retorno.",
  ],
  quandoUsar: [
    "Colunas usadas com frequência em filtros (WHERE), junções (JOIN) e ordenações (ORDER BY).",
    "Tabelas grandes onde a diferença entre Index Scan e Seq Scan é a diferença entre milissegundos e segundos.",
    "Para impor unicidade: um índice único é a forma correta de garantir que não há e-mail repetido.",
  ],
  quandoEvitar: [
    "Colunas de baixa cardinalidade (um booleano, um status com três valores): o índice quase não filtra e não compensa.",
    "Tabelas pequenas ou de escrita muito intensa, onde o custo de manter o índice supera o ganho de leitura.",
  ],
  exemplos: EXEMPLOS,
  blocos: [
    {
      tipo: "tldr",
      texto:
        "Um índice é uma cópia ordenada de uma coluna (uma B-tree) que troca varrer a tabela inteira por uma busca binária — a diferença entre segundos e milissegundos numa tabela grande. Não é grátis: cada escrita agora mantém o índice, ele ocupa disco, e — a pegadinha — ele só é usado se a query filtra pela coluna crua. Envolver a coluna numa função, num cast ou num LIKE com curinga à esquerda faz o banco ignorar o índice e varrer tudo, mesmo com o índice ali.",
    },
    {
      tipo: "analogia",
      emoji: "📖",
      titulo: "O índice remissivo do livro",
      texto:
        "Procurar todas as menções a 'idempotência' num livro de 800 páginas folheando página por página levaria a tarde inteira. O índice remissivo no fim do livro — ordenado alfabeticamente — resolve em segundos: você acha a palavra e ela te dá as páginas. Um índice de banco é literalmente isso. E note o custo: cada vez que o livro ganha uma edição nova, o índice remissivo precisa ser refeito. É o que a escrita paga por ter a leitura rápida.",
    },
    {
      tipo: "secao",
      id: "quando-nao-usa",
      titulo: "O índice que existe e não é usado",
      resumo: [
        "O erro mais comum não é esquecer de criar o índice — é criá-lo e ele não ser usado. O índice é sobre a coluna crua; assim que a consulta envolve essa coluna em algo (`LOWER(email)`, `data::text`, `valor + 10`), o banco não reconhece mais o índice e volta ao Seq Scan.",
        "O mesmo vale para `LIKE '%texto'` (curinga à esquerda impede a busca binária) e para o índice composto usado pela coluna errada. O índice aparece na estrutura da tabela, dá a sensação de que a query está coberta — e só o EXPLAIN revela que ela varreu tudo mesmo assim.",
      ],
      extensao: [
        "A regra do **índice composto** derruba muita gente: um índice em `(cliente_id, data)` serve filtros por `cliente_id` e por `cliente_id AND data`, mas **não** por `data` sozinha. Pense na lista telefônica ordenada por sobrenome e depois por nome: achar todos os 'Silva' é fácil, achar todos os 'João' de qualquer sobrenome exige varrer tudo. A ordem das colunas no índice é a ordem do catálogo, e ela decide quais consultas ele acelera.",
        "**Cardinalidade** define se vale a pena. Índice brilha em colunas com muitos valores distintos (e-mail, CPF, id), onde o filtro elimina quase tudo. Numa coluna com três valores possíveis (um status), o índice aponta para um terço da tabela — e pular por ele, salto a salto, sai mais caro que uma varredura sequencial que o disco lê em blocos. Por isso o planejador às vezes ignora um índice de propósito: ele calculou que varrer é mais rápido, e geralmente está certo.",
        "Do outro lado da conta está a **escrita**. Cada índice numa tabela é uma estrutura a mais para manter: todo INSERT, UPDATE ou DELETE precisa atualizar a tabela **e** cada índice dela. Cinco índices numa tabela quente significam cinco estruturas reordenadas a cada escrita. Índice não é decoração que se acumula 'por garantia' — é uma aposta de que a leitura daquela coluna vale o imposto cobrado em toda escrita.",
      ],
    },
    {
      tipo: "ilustracao",
      arquetipo: "antes-depois",
      antes: {
        titulo: "Sem índice (Seq Scan)",
        itens: [
          "O banco lê a tabela inteira, linha por linha",
          "Custo cresce linear com o número de linhas",
          "10 milhões de linhas = 10 milhões de comparações",
          "Escrita é rápida: só a tabela para manter",
        ],
        nota: "Leitura barata só enquanto a tabela é pequena — e insuportável quando ela cresce.",
      },
      depois: {
        titulo: "Com índice (Index Scan)",
        itens: [
          "O banco desce a B-tree ordenada por busca binária",
          "Custo cresce com o logaritmo do número de linhas",
          "10 milhões de linhas = ~23 passos",
          "Cada escrita agora mantém a tabela e o índice",
        ],
        nota: "Leitura rápida em qualquer tamanho — paga com espaço e com escrita um pouco mais lenta.",
      },
      legenda:
        "O índice não deixa a leitura 'um pouco melhor': muda a curva de custo de linear para logarítmica. É por isso que ele decide entre milissegundos e segundos numa tabela grande.",
    },
    {
      tipo: "casos",
      titulo: "Como isso aparece na prática",
      casos: [
        {
          titulo: "O login que ficava lento à noite",
          cenario:
            "A tela de login buscava o usuário por e-mail. Com a base pequena, era instantâneo; ao passar de alguns milhões de usuários, o login começou a demorar segundos nos horários de pico.",
          aplicacao:
            "Um índice em `email` transformou o Seq Scan da tabela inteira em um Index Scan de poucos passos, e o e-mail passou a ser guardado já em minúsculas para a busca casar com o índice sem função.",
          tradeoff:
            "Cada cadastro e atualização de e-mail passou a manter o índice também. Numa tabela de leitura muito mais intensa que a de escrita, foi um troco irrisório pelo login instantâneo.",
        },
        {
          titulo: "A tabela com dez índices que engasgava na escrita",
          cenario:
            "Uma tabela de eventos, escrita a milhares de linhas por segundo, tinha acumulado dez índices ao longo do tempo — cada um criado para acelerar 'aquela consulta específica'. As inserções começaram a formar fila.",
          aplicacao:
            "O EXPLAIN e as estatísticas de uso mostraram que metade dos índices quase nunca era usada. Eles foram removidos, e a latência de escrita caiu pela metade sem impacto perceptível nas leituras.",
          tradeoff:
            "Duas consultas raras voltaram a ser mais lentas. Aceitável: elas rodavam uma vez por dia, enquanto a escrita acontecia o tempo todo e era o gargalo real.",
        },
      ],
    },
    {
      tipo: "anti-exemplo",
      titulo: "A função que anula o índice",
      comoSeParece:
        "O índice foi criado, aparece na estrutura da tabela e todo mundo assume que a consulta está coberta. Só que a query envolve a coluna numa função — LOWER, um cast, uma aritmética — e o banco, que só reconhece o índice sobre a coluna crua, silenciosamente volta a varrer a tabela inteira. Rápido em desenvolvimento com poucos dados, lento em produção com milhões.",
      codigo: { lang: "typescript", code: ANTI_EXEMPLO },
      sintomas: [
        {
          quando: "Em produção",
          efeito:
            "A consulta que parecia indexada vira Seq Scan sobre milhões de linhas, e a latência dispara sem nenhuma mudança de código aparente.",
        },
        {
          quando: "Com base pequena",
          efeito:
            "Some: com poucos dados o Seq Scan é rápido, então o problema não aparece em desenvolvimento nem nos testes.",
        },
        {
          quando: "Ao olhar só a tabela",
          efeito:
            "O índice está lá no `\\d` da tabela, o que engana o diagnóstico — só o EXPLAIN mostra que ele não foi usado.",
        },
      ],
      correcao:
        "Filtre pela coluna crua: guarde o dado já normalizado (o e-mail em minúsculas) e escreva `WHERE email = $1`. Quando a transformação for inevitável, crie um índice de expressão sobre exatamente ela (`CREATE INDEX ... ON usuarios (LOWER(email))`). E confirme no EXPLAIN que o plano virou Index Scan.",
    },
    {
      tipo: "armadilhas",
      titulo: "Onde isto dá errado",
      itens: [
        {
          titulo: "Envolver a coluna indexada numa função",
          texto:
            "`WHERE LOWER(email) = ...`, um cast ou `LIKE '%x'` fazem o banco ignorar o índice da coluna crua e cair em Seq Scan. O índice existe, mas não para essa consulta — só o EXPLAIN denuncia.",
        },
        {
          titulo: "Indexar coluna de baixa cardinalidade",
          texto:
            "Um índice sobre um booleano ou um status de três valores aponta para uma fração enorme da tabela. Pular por ele sai mais caro que varrer em blocos, e o planejador acaba ignorando o índice que você pagou para manter.",
        },
        {
          titulo: "Acumular índices 'por garantia'",
          texto:
            "Cada índice é pago em toda escrita. Numa tabela quente, uma dúzia de índices — metade nunca usada — transforma inserção em gargalo. Índice se cria pela consulta real e se remove quando o EXPLAIN mostra que ninguém o usa.",
        },
        {
          titulo: "Errar a ordem do índice composto",
          texto:
            "Um índice `(a, b)` serve filtros por `a` e por `a AND b`, mas não por `b` sozinho. Criar o composto na ordem errada é criar um índice que a consulta que você queria acelerar não consegue usar.",
        },
      ],
    },
    {
      tipo: "codigo",
      titulo: "A B-tree, o EXPLAIN e a regra da coluna",
      exemplos: EXEMPLOS,
    },
    {
      tipo: "quando",
      usar: [
        "Colunas frequentes em WHERE, JOIN e ORDER BY.",
        "Tabelas grandes onde Seq Scan vira segundos.",
        "Para impor unicidade com um índice único.",
      ],
      evitar: [
        "Colunas de baixa cardinalidade.",
        "Tabelas pequenas ou de escrita muito intensa.",
      ],
    },
  ],
};
