import type { Conceito } from "@/shared/types/conceito";

const MERMAID = `classDiagram
    class Conta {
      +depositar(valor) void
      +sacar(valor) void
      +saldo() number
      +extrato() Lancamento[]
    }
    note for Conta "Comandos retornam void e mutam.\\nQueries retornam dado e sao puras."`;

const CAMADAS = [
  { id: "chamador", titulo: "Chamador", descricao: "Decide entre observar ou agir" },
  {
    id: "metodo",
    titulo: "Método",
    descricao: "É comando OU query — onde o princípio atua",
    destaque: true,
  },
  { id: "comando", titulo: "Comando", descricao: "Muta estado, retorna void" },
  { id: "query", titulo: "Query", descricao: "Retorna dado, sem efeito colateral" },
];

const EXEMPLOS = [
  {
    lang: "typescript" as const,
    code: `class Conta {
  private _saldo = 0;

  // Comandos: mutam e retornam void
  depositar(valor: number): void { this._saldo += valor; }
  sacar(valor: number): void {
    if (valor > this._saldo) throw new Error("saldo insuficiente");
    this._saldo -= valor;
  }

  // Query: retorna dado, sem efeito colateral
  saldo(): number { return this._saldo; }
}

const c = new Conta();
c.depositar(100);      // comando
c.sacar(30);           // comando
console.log(c.saldo()); // query -> 70 (repetível e segura)`,
  },
  {
    lang: "python" as const,
    code: `class Conta:
    def __init__(self):
        self._saldo = 0

    # Comandos: mutam e retornam None
    def depositar(self, valor: int) -> None:
        self._saldo += valor

    def sacar(self, valor: int) -> None:
        if valor > self._saldo:
            raise ValueError("saldo insuficiente")
        self._saldo -= valor

    # Query: retorna dado, sem efeito colateral
    @property
    def saldo(self) -> int:
        return self._saldo

c = Conta()
c.depositar(100)   # comando
c.sacar(30)        # comando
print(c.saldo)     # query -> 70 (repetível e segura)`,
  },
];

export const cqs: Conceito = {
  slug: "cqs",
  titulo: "CQS (Command Query Separation)",
  categoria: "principio",
  resumo:
    "Todo método deve ser ou um comando que muda estado e não retorna dado, ou uma query que retorna dado sem efeito colateral — nunca os dois ao mesmo tempo.",
  tags: ["meyer", "efeito-colateral", "design-de-metodos", "clareza"],
  dificuldade: "iniciante",
  tempoLeitura: 5,
  relacionados: ["cqrs"],
  roadmapNodes: ["arq-cqrs"],
  problema: [
    "Métodos que ao mesmo tempo alteram estado e devolvem um valor escondem seus efeitos colaterais. Ler um valor deveria ser inofensivo, mas quando a leitura também muta algo, cada chamada carrega consequências difíceis de prever.",
    "Isso fragiliza o raciocínio sobre o código: você não pode repetir, reordenar ou cachear uma leitura sem medo, porque ela pode ter mudado o mundo no caminho. Bugs sutis surgem quando alguém chama o método só pelo retorno, sem notar o efeito embutido.",
  ],
  solucao: [
    "Formulado por Bertrand Meyer, o CQS é um princípio de nível de método/objeto: separe as duas responsabilidades. Comandos (command) executam uma ação, mudam o estado e retornam void; queries retornam um resultado e são livres de efeitos colaterais — chamá-las quantas vezes quiser não altera nada.",
    "Com essa disciplina, queries tornam-se referencialmente transparentes e seguras para compor, testar e cachear; comandos ficam explícitos sobre a intenção de mutar. O código comunica com clareza o que apenas observa e o que efetivamente muda o sistema.",
    "É um princípio, não uma lei: casos como `pop()` de uma pilha ou geradores de id atômicos misturam os dois papéis por boa razão. CQS orienta o design; exceções pragmáticas são aceitáveis quando conscientes.",
  ],
  quandoUsar: [
    "Ao projetar APIs e métodos de domínio, para deixar efeitos colaterais explícitos.",
    "Quando quer que leituras sejam seguras para repetir, reordenar e cachear.",
    "Para facilitar testes: queries puras não exigem verificar estado alterado.",
    "Como base conceitual antes de adotar CQRS no nível arquitetural.",
  ],
  quandoEvitar: [
    "Operações naturalmente atômicas onde ler-e-mutar junto é a semântica correta (pop, fila concorrente, contadores atômicos).",
    "Quando separar exigiria uma segunda ida ao recurso e o custo/condição de corrida não compensa.",
  ],
  mermaid: MERMAID,
  camadas: CAMADAS,
  exemplos: EXEMPLOS,
  blocos: [
    {
      tipo: "tldr",
      texto:
        "Um método ou pergunta ou manda — nunca os dois: queries retornam dado sem mudar nada (seguras para repetir e cachear), comandos mudam estado e retornam void. Formulado por Bertrand Meyer, é a semente do CQRS, mas vive no nível do método, não da arquitetura.",
    },
    {
      tipo: "analogia",
      emoji: "🕰️",
      titulo: "Perguntar as horas não deveria adiantar o relógio",
      texto:
        "Existem duas formas de falar com alguém: perguntar ('que horas são?') e mandar ('adiante o relógio em uma hora'). Uma pergunta não deveria mudar o mundo — você pode repeti-la dez vezes e esperar a mesma resposta, sem consequências. Uma ordem muda o mundo, e por isso você a dá com intenção, uma vez. O código quebra quando os dois se misturam: um 'que horas são?' que, de brinde, adianta o relógio, transforma cada leitura inocente em um efeito que ninguém pediu.",
    },
    {
      tipo: "secao",
      id: "problema",
      titulo: "O problema",
      resumo: [
        "Métodos que retornam um valor E mudam estado escondem seus efeitos colaterais atrás de uma cara de leitura inocente. Quem chama pelo retorno não percebe a mutação; quem chama pela mutação ignora o retorno — e os dois se surpreendem.",
        "Sem a garantia de que ler é inofensivo, você perde liberdades básicas: não pode repetir uma chamada, reordenar duas, nem cachear um resultado sem medo do que acontece no caminho.",
      ],
      extensao: [
        "A raiz do problema é a assinatura mentirosa: 'number getSaldo()' promete uma observação, mas nada no tipo denuncia que ela também grava, incrementa ou consome algo. O compilador não ajuda, o autocomplete não avisa — só o leitor do corpo do método descobre. CQS devolve a verdade à assinatura: retorna dado, é seguro; retorna void, muda o mundo.",
        "Importante não confundir com CQRS. CQS é um princípio de design de MÉTODO, proposto por Bertrand Meyer no contexto do Eiffel nos anos 80: cada rotina de um objeto é comando ou query. CQRS pega essa mesma ideia e a eleva à arquitetura — serviços, modelos e até bancos separados para escrita e leitura. CQS é gratuito e quase sempre saudável; CQRS é uma decisão arquitetural cara. Adotar CQS não te obriga a nada; é só disciplina de assinatura.",
        "O ganho profundo é raciocínio equacional: queries livres de efeito são referencialmente transparentes — chamá-las é como ler uma variável. Isso destrava otimizações (memoização, chamadas em paralelo, retry sem culpa) e simplifica testes: uma query se testa comparando retorno; um comando se testa observando o estado depois. Quando um método faz os dois, o teste precisa verificar retorno E estado E a interação entre eles a cada chamada.",
      ],
    },
    {
      tipo: "ilustracao",
      arquetipo: "fluxo",
      atores: [
        { id: "chamador", label: "Chamador" },
        { id: "comando", label: "Comando depositar()", destaque: true },
        { id: "estado", label: "Estado muda" },
        { id: "query", label: "Query saldo()", destaque: true },
        { id: "dado", label: "Dado (sem efeito)" },
      ],
      setas: [
        { label: "ordena (void)" },
        { label: "muta" },
        { label: "depois observa", tracejada: true },
        { label: "retorna" },
      ],
      legenda:
        "Mutação e observação em passos separados: o comando muda e não conta nada; a query conta e não muda nada.",
    },
    {
      tipo: "camadas-nav",
      titulo: "Como o princípio escala",
      camadas: [
        {
          id: "metodo",
          titulo: "Nível de método",
          curto: "cada assinatura declara: comando ou query",
          detalhe:
            "É o habitat original do CQS: um método muta e retorna void, ou retorna dado e não muta. A assinatura vira documentação confiável — o tipo de retorno denuncia a categoria sem abrir o corpo do método.",
          exemplo: "depositar(valor: number): void  // comando\nsaldo(): number                 // query",
          seViolar:
            "um 'sacar(): number' que muta e retorna cria chamadas com efeito invisível — repetir a linha num teste ou num retry debita duas vezes.",
        },
        {
          id: "classe",
          titulo: "Nível de classe",
          curto: "a API do objeto separa observar de agir",
          detalhe:
            "Aplicado a todos os métodos, o CQS particiona a interface pública da classe em dois grupos legíveis: o que inspeciona (saldo, extrato) e o que transforma (depositar, sacar). Invariantes ficam mais fáceis de proteger, porque só o grupo de comandos toca o estado.",
          exemplo: "// Observam:  saldo(), extrato()\n// Transformam: depositar(), sacar()",
          seViolar:
            "getters que fazem lazy-write ou contam acessos tornam qualquer inspeção arriscada — até o debugger, ao avaliar a propriedade, passa a alterar o objeto.",
        },
        {
          id: "modulo",
          titulo: "Nível de módulo / API",
          curto: "endpoints de leitura sem efeito, mutações explícitas",
          detalhe:
            "A mesma disciplina governa fronteiras maiores: GET não tem efeito colateral, POST/PUT/DELETE mudam estado — a semântica HTTP é CQS aplicado à web. Daqui é um passo conceitual para o CQRS, que separa modelos e serviços inteiros por responsabilidade.",
          exemplo: "GET  /contas/42/saldo   // query\nPOST /contas/42/saques  // comando",
          seViolar:
            "um GET que muta estado quebra cache de CDN, prefetch de navegador e retries automáticos — infraestrutura inteira assume que leituras são seguras de repetir.",
        },
      ],
    },
    {
      tipo: "diagrama",
      titulo: "Estrutura",
      mermaid: MERMAID,
    },
    {
      tipo: "codigo",
      titulo: "Código",
      exemplos: EXEMPLOS,
    },
    {
      tipo: "casos",
      casos: [
        {
          titulo: "API previsível: GET sem efeito",
          cenario:
            "Uma equipe descobre que o endpoint GET /relatorios/mensal também marcava o relatório como 'visualizado' — e o prefetch do navegador estava marcando relatórios que ninguém abriu.",
          aplicacao:
            "CQS na fronteira HTTP: o GET vira query pura e a marcação vira um comando explícito (POST /relatorios/mensal/visualizacoes). Caches, proxies e prefetch voltam a funcionar sem efeitos fantasma.",
          tradeoff:
            "O cliente agora faz duas chamadas onde fazia uma — o custo de uma ida extra à rede é o preço da leitura inofensiva.",
        },
        {
          titulo: "Debugging sem medo",
          cenario:
            "Durante um incidente, o desenvolvedor precisa inspecionar o estado de um pedido em produção: chamar consultas no console, avaliar propriedades no debugger, logar valores em pontos do fluxo.",
          aplicacao:
            "Se as queries seguem CQS, inspecionar é gratuito: nenhuma consulta altera o pedido, então investigar não contamina a cena do crime. Watch expressions e logs podem chamar qualquer query à vontade.",
          tradeoff:
            "A garantia só vale se TODAS as queries forem disciplinadas — uma única consulta com efeito escondido quebra a confiança no conjunto, e ninguém mais inspeciona tranquilo.",
        },
        {
          titulo: "Caching de queries puras",
          cenario:
            "Um dashboard chama calcularIndicadores() dezenas de vezes por render, e o cálculo é caro. O time quer memoizar, mas tem medo do que a função faz por dentro.",
          aplicacao:
            "Sendo query pura (CQS), memoizar é seguro por construção: mesmo input, mesmo output, zero efeitos. Dá para cachear por argumento, invalidar por evento de comando, e até paralelizar chamadas.",
          tradeoff:
            "Pureza é pré-condição, não mágica: a invalidação do cache continua sendo problema seu — comandos precisam sinalizar quando o dado subjacente mudou.",
        },
      ],
    },
    {
      tipo: "armadilhas",
      itens: [
        {
          titulo: "Aplicar como lei: o caso pop()",
          texto:
            "pop() de uma pilha remove E retorna o elemento — viola CQS de propósito. Separar em peek() + remove() cria uma janela de corrida em contexto concorrente: outro thread pode alterar a pilha entre as duas chamadas. O mesmo vale para fetchAndIncrement de contadores atômicos e take() de filas. São exceções pragmáticas: a atomicidade é a semântica correta ali. CQS orienta; não tiraniza.",
        },
        {
          titulo: "Query com efeito escondido",
          texto:
            "getUsuario() que atualiza 'ultimoAcesso', getter que dispara lazy-write, consulta que incrementa métrica de negócio: pareceram inofensivos no commit, mas quebram a garantia de repetibilidade. Nuance honesta: memoização e lazy-loading internos são aceitáveis, porque o estado OBSERVÁVEL não muda — o critério é se duas chamadas seguidas retornam o mesmo mundo.",
        },
        {
          titulo: "Comando que devolve dado 'por conveniência'",
          texto:
            "salvar() que retorna a entidade inteira, setters encadeáveis que retornam this, criar() que devolve o objeto completo. Alguns são compromissos razoáveis (retornar o id gerado por um INSERT evita uma segunda ida ao banco), mas cada um dilui a convenção: o leitor deixa de confiar que 'retorna algo = não muta nada'. Se fizer a exceção, faça-a explícita e documentada.",
        },
      ],
    },
    {
      tipo: "quando",
      usar: [
        "Ao projetar APIs e métodos de domínio, para deixar efeitos colaterais explícitos.",
        "Quando quer que leituras sejam seguras para repetir, reordenar e cachear.",
        "Para facilitar testes: queries puras não exigem verificar estado alterado.",
        "Como base conceitual antes de adotar CQRS no nível arquitetural.",
      ],
      evitar: [
        "Operações naturalmente atômicas onde ler-e-mutar junto é a semântica correta (pop, fila concorrente, contadores atômicos).",
        "Quando separar exigiria uma segunda ida ao recurso e o custo/condição de corrida não compensa.",
      ],
    },
  ],
};
