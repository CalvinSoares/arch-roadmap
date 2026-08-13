import type { Desafio } from "@/shared/types/desafio";
import { lacuna, mcq, vf } from "./_helpers";

/** Desafios curados — nós do roadmap `backend` sem conceito. */
export const CHECKPOINTS_BACKEND: Record<string, Desafio[]> = {
  "backend:be-linguagem": [
    vf(
      "backend:be-linguagem:vf1",
      "No dia a dia de backend, conhecer bem uma linguagem e seu ecossistema costuma render mais do que listar oito no currículo.",
      true,
      "Profundidade vira velocidade de diagnóstico, leitura de código alheio e escolha de biblioteca — colecionar nomes raramente."
    ),
    mcq(
      "backend:be-linguagem:mcq1",
      "Você precisa entregar e manter um serviço em produção. O que pesa mais na escolha da linguagem?",
      "eco",
      [
        {
          id: "eco",
          label: "Ecossistema, tooling e gente que já opera isso na empresa",
        },
        { id: "hype", label: "Estar na capa do Hacker News nesta semana" },
        {
          id: "todas",
          label: "Saber o mínimo de várias e trocar a cada feature",
        },
        {
          id: "syntax",
          label: "A sintaxe mais curta possível, mesmo sem libs maduras",
        },
      ],
      "Linguagem é decisão operacional: deploy, libs, contratação e plantão importam mais que moda."
    ),
  ],

  "backend:be-git": [
    vf(
      "backend:be-git:vf1",
      "Em Git, commit e push são a mesma operação: gravar local já publica no remoto.",
      false,
      "Commit é local; push (ou merge request) é o que compartilha. Misturar os dois atrapalha histórico e revisão."
    ),
    mcq(
      "backend:be-git:mcq1",
      "Dois colegas editaram o mesmo trecho em branches diferentes. No merge, o Git:",
      "conflito",
      [
        {
          id: "conflito",
          label: "Marca conflito e pede decisão humana nas linhas sobrepostas",
        },
        {
          id: "ultimo",
          label: "Mantém sempre o commit com data mais recente",
        },
        {
          id: "media",
          label: "Faz média das duas alterações automaticamente",
        },
        {
          id: "descarta",
          label: "Descarta a branch mais curta sem avisar",
        },
      ],
      "Conflito de conteúdo exige escolha; o Git não 'entende' a intenção do código."
    ),
  ],

  "backend:be-terminal": [
    vf(
      "backend:be-terminal:vf1",
      "Saber navegar no shell (pipes, redirecionamento, exit codes) ainda importa quando o deploy é container e CI.",
      true,
      "Logs, healthcheck, debug em pod e scripts de migrate passam pelo terminal — GUI não cobre o plantão."
    ),
    mcq(
      "backend:be-terminal:mcq1",
      "O comando `cmd1 | cmd2` faz o quê?",
      "pipe",
      [
        {
          id: "pipe",
          label: "Manda a saída padrão de cmd1 como entrada de cmd2",
        },
        {
          id: "seq",
          label: "Roda cmd2 só se cmd1 falhar",
        },
        {
          id: "paralelo",
          label: "Roda os dois em paralelo sem ligar um ao outro",
        },
        {
          id: "arquivo",
          label: "Salva a saída dos dois num arquivo com o mesmo nome",
        },
      ],
      "Pipe é composição de programas pelo fluxo de texto — base do Unix."
    ),
  ],

  "backend:be-estruturas": [
    vf(
      "backend:be-estruturas:vf1",
      "Escolher array vs hash map vs árvore muda o custo de busca e inserção — não é detalhe cosmética.",
      true,
      "Big-O do acesso é o que separa 'funciona no notebook' de 'morre com 1M de linhas'."
    ),
    mcq(
      "backend:be-estruturas:mcq1",
      "Preciso achar um valor pela chave com frequência. Em média, a estrutura mais adequada é:",
      "hash",
      [
        { id: "hash", label: "Tabela hash (map/dict)" },
        { id: "lista", label: "Lista ligada simples" },
        { id: "fila", label: "Fila FIFO" },
        { id: "pilha", label: "Pilha (LIFO)" },
      ],
      "Hash dá busca esperada O(1) por chave; lista exige varredura."
    ),
  ],

  "backend:be-testes": [
    vf(
      "backend:be-testes:vf1",
      "Um bom teste de unidade idealmente não depende de rede, disco nem banco reais.",
      true,
      "Dependência externa deixa o teste lento e flaky. Unidade isola a regra; integração cobre a borda."
    ),
    mcq(
      "backend:be-testes:mcq1",
      "Na pirâmide de testes, a camada que costuma ser a mais numerosa e barata é:",
      "unidade",
      [
        { id: "unidade", label: "Testes de unidade" },
        { id: "e2e", label: "Testes ponta a ponta pela UI" },
        { id: "manual", label: "Testes manuais exploratórios" },
        { id: "carga", label: "Testes de carga em produção" },
      ],
      "A base larga são unidades rápidas; E2E são poucos e caros — Fowler descreve isso na pirâmide."
    ),
  ],

  "backend:be-http": [
    vf(
      "backend:be-http:vf1",
      "GET e POST bastam para desenhar qualquer API HTTP bem feita; status codes e cabeçalhos de cache são opcionais.",
      false,
      "Idempotência, cache, redirecionamento e erros tipados vivem em método + status + headers — não só no body JSON."
    ),
    mcq(
      "backend:be-http:mcq1",
      "Um cliente pede um recurso que não existe. O status HTTP mais adequado é:",
      "404",
      [
        { id: "404", label: "404 Not Found" },
        { id: "500", label: "500 Internal Server Error" },
        { id: "200", label: "200 OK com body vazio" },
        { id: "201", label: "201 Created" },
      ],
      "404 comunica 'não achei esse recurso'. 500 é falha do servidor; 200 mentiria sucesso."
    ),
  ],

  "backend:be-rest": [
    vf(
      "backend:be-rest:vf1",
      "REST bem modelado trata URLs como recursos (substantivos) e usa o método HTTP para a ação, em vez de verbos na rota tipo /criarPedido.",
      true,
      "Recurso + método é o núcleo do estilo — o Richardson Maturity Model descreve os degraus."
    ),
    mcq(
      "backend:be-rest:mcq1",
      "Qual desenho fica mais alinhado a REST?",
      "recurso",
      [
        {
          id: "recurso",
          label: "POST /pedidos  e  GET /pedidos/42",
        },
        {
          id: "rpc",
          label: "POST /criarPedido  e  POST /buscarPedido",
        },
        {
          id: "getcria",
          label: "GET /criarPedido?nome=x (cria no acesso)",
        },
        {
          id: "tudo-post",
          label: "Só POST /api com a ação no JSON",
        },
      ],
      "Recursos nomeados + verbos HTTP. RPC-estilo /criarX abandona o modelo de recurso."
    ),
  ],

  "backend:be-versionamento": [
    vf(
      "backend:be-versionamento:vf1",
      "Mudar o significado de um campo na API sem avisar clientes é compatível, desde que o JSON continue parseando.",
      false,
      "Compatibilidade é contrato semântico. Parsear ≠ entender. Versionar ou evoluir com campos opcionais novos."
    ),
    mcq(
      "backend:be-versionamento:mcq1",
      "Você precisa quebrar um contrato público já usado por apps. O caminho menos traumatizante é:",
      "paralelo",
      [
        {
          id: "paralelo",
          label: "Nova versão em paralelo + prazo de deprecação da antiga",
        },
        {
          id: "sexta",
          label: "Trocar sexta à noite e torcer para ninguém notar",
        },
        {
          id: "silent",
          label: "Mudar o campo e manter o mesmo path/versão para sempre",
        },
        {
          id: "email",
          label: "Só mandar e-mail, sem manter a versão antiga um tempo",
        },
      ],
      "Versão paralela + janela de migração é o padrão de APIs públicas."
    ),
  ],

  "backend:be-graphql": [
    vf(
      "backend:be-graphql:vf1",
      "GraphQL elimina a necessidade de pensar em autorização e custo de query — o cliente pede o que quiser.",
      false,
      "Sem limite de profundidade/complexidade e sem auth por campo, GraphQL vira DoS e vazamento. O poder do cliente exige guarda no servidor."
    ),
    mcq(
      "backend:be-graphql:mcq1",
      "Um problema clássico de GraphQL mal limitado no servidor é:",
      "dos",
      [
        {
          id: "dos",
          label: "Queries aninhadas caras que derrubam o banco",
        },
        {
          id: "css",
          label: "Impossibilidade de estilizar a resposta",
        },
        {
          id: "tcp",
          label: "Só funcionar sobre UDP",
        },
        {
          id: "json",
          label: "Não conseguir devolver JSON",
        },
      ],
      "Cliente escolhe o shape — o servidor precisa limitar custo. Sem isso, um SELECT N+1 gigante."
    ),
  ],

  "backend:be-grpc": [
    vf(
      "backend:be-grpc:vf1",
      "gRPC brilha em comunicação serviço-a-serviço com contratos tipados (protobuf), não como substituto universal do REST público para browsers.",
      true,
      "Browser/HTTP público ainda é território REST/JSON na maioria dos casos; gRPC é forte no interior da malha."
    ),
    mcq(
      "backend:be-grpc:mcq1",
      "O contrato de API no gRPC costuma ser descrito com:",
      "proto",
      [
        { id: "proto", label: "Protobuf (.proto) gerando stubs tipados" },
        { id: "html", label: "HTML estático por endpoint" },
        { id: "css", label: "Folhas CSS compartilhadas" },
        { id: "env", label: "Variáveis de ambiente no cliente" },
      ],
      "IDL protobuf define mensagens e serviços; o codegen gera clientes/servidores."
    ),
  ],

  "backend:be-sql": [
    vf(
      "backend:be-sql:vf1",
      "Modelar bem tabelas, chaves e índices importa tanto quanto escrever a query 'bonita' depois.",
      true,
      "Schema ruim não se resolve com ORM esperto. Relacionamento e índice nascem no desenho."
    ),
    mcq(
      "backend:be-sql:mcq1",
      "Buscas frequentes por `email` numa tabela grande sem índice tendem a:",
      "scan",
      [
        {
          id: "scan",
          label: "Varrer muitas linhas (seq scan) e ficar caras",
        },
        {
          id: "gratis",
          label: "Continuar O(1) porque SQL é mágico",
        },
        {
          id: "cache",
          label: "Usar só o cache do navegador",
        },
        {
          id: "ignore",
          label: "Ignorar a cláusula WHERE automaticamente",
        },
      ],
      "Sem índice adequado, o planejador cai em varredura. Por isso modelagem + índice andam juntos."
    ),
  ],

  "backend:be-nosql": [
    vf(
      "backend:be-nosql:vf1",
      "NoSQL é sempre mais rápido e substitui SQL em qualquer domínio.",
      false,
      "NoSQL troca modelo e garantias. Brilha em certos acessos/escala; piora joins e consistência forte se você forçar o caso errado."
    ),
    mcq(
      "backend:be-nosql:mcq1",
      "Quando NoSQL costuma fazer mais sentido?",
      "acesso",
      [
        {
          id: "acesso",
          label: "Acesso conhecido, escala horizontal e schema flexível no documento",
        },
        {
          id: "contabil",
          label: "Ledger financeiro com joins complexos e forte consistência",
        },
        {
          id: "sempre",
          label: "Sempre — SQL está obsoleto",
        },
        {
          id: "css",
          label: "Quando a UI precisa de CSS-in-JS",
        },
      ],
      "Escolha pelo padrão de acesso e pelas garantias — não por moda."
    ),
  ],

  "backend:be-logs": [
    vf(
      "backend:be-logs:vf1",
      "Log estruturado (JSON com campos) facilita buscar por requestId e nível — melhor que prosa solta sem campos.",
      true,
      "Campos indexáveis viram filtro no agregador. String única 'deu erro' não escala no plantão."
    ),
    lacuna(
      "backend:be-logs:lac1",
      "Para correlacionar logs de um mesmo pedido em vários serviços, o campo que mais ajuda é um ",
      " estável propagado na chamada.",
      "requestId",
      ["requestId", "password", "fontSize", "favicon"],
      "Correlation id / request id amarra a trilha do pedido entre serviços."
    ),
  ],

  "backend:be-metricas": [
    vf(
      "backend:be-metricas:vf1",
      "Alerta só em CPU a 100% basta: se a latência p95 explode com CPU baixa, não é problema seu.",
      false,
      "Métrica de sintoma (latência, erro) importa mais que só saturação de host. Alerte o que o usuário sente."
    ),
    mcq(
      "backend:be-metricas:mcq1",
      "Qual conjunto descreve melhor os 'quatro sinais de ouro' de monitoramento?",
      "golden",
      [
        {
          id: "golden",
          label: "Latência, tráfego, erros e saturação",
        },
        {
          id: "git",
          label: "Commits, PRs, reviews e deploys",
        },
        {
          id: "ui",
          label: "Cores, fontes, ícones e animações",
        },
        {
          id: "hr",
          label: "Férias, salário, cargo e benefícios",
        },
      ],
      "SRE popularizou latency / traffic / errors / saturation como base."
    ),
  ],

  "backend:be-tracing": [
    vf(
      "backend:be-tracing:vf1",
      "Tracing distribuído mostra a cadeia de spans entre serviços — útil quando o log de um só processo não explica a latência total.",
      true,
      "O tempo 'some' entre hops. Trace liga o caminho do pedido."
    ),
    mcq(
      "backend:be-tracing:mcq1",
      "OpenTelemetry, no ecossistema moderno, serve principalmente para:",
      "padrao",
      [
        {
          id: "padrao",
          label: "Padronizar telemetria (traces, metrics, logs) entre vendors",
        },
        {
          id: "css",
          label: "Compilar CSS no servidor",
        },
        {
          id: "orm",
          label: "Substituir o ORM",
        },
        {
          id: "dns",
          label: "Resolver DNS mais rápido",
        },
      ],
      "OTel é o padrão de instrumentação — o backend de storage você escolhe."
    ),
  ],

  "backend:be-ci": [
    vf(
      "backend:be-ci:vf1",
      "Blue-green e canário existem para reduzir o blast radius do deploy — não para 'parecer moderno'.",
      true,
      "Você troca tráfego com controle e tem caminho de rollback. Deploy all-at-once é o oposto."
    ),
    mcq(
      "backend:be-ci:mcq1",
      "Canary release significa, em essência:",
      "fatia",
      [
        {
          id: "fatia",
          label: "Mandar a nova versão para uma fatia pequena do tráfego antes do resto",
        },
        {
          id: "noite",
          label: "Só fazer deploy à meia-noite",
        },
        {
          id: "sem-teste",
          label: "Pular testes porque o nome é de pássaro",
        },
        {
          id: "db",
          label: "Apagar o banco e recriar a cada release",
        },
      ],
      "Canário = exposição gradual + observação antes do 100%."
    ),
  ],

  "backend:be-seguranca-owasp": [
    vf(
      "backend:be-seguranca-owasp:vf1",
      "O OWASP Top Ten lista riscos comuns em aplicações web — injection, auth quebrada, componentes vulneráveis, etc.",
      true,
      "É o mapa de atenção mínima. Dependências desatualizadas entram aí também."
    ),
    mcq(
      "backend:be-seguranca-owasp:mcq1",
      "Deixar a aplicação aceitar SQL montada com string do usuário sem bind/parameter é, clássicamente:",
      "sqli",
      [
        { id: "sqli", label: "SQL injection" },
        { id: "xss", label: "Apenas um problema de CSS" },
        { id: "ok", label: "Prática recomendada para performance" },
        { id: "cdn", label: "Necessário para CDN funcionar" },
      ],
      "Injection está no topo do OWASP por décadas — parameterized queries são o antídoto básico."
    ),
  ],
};
