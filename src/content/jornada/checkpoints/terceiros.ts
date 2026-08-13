import type { Desafio } from "@/shared/types/desafio";
import { lacuna, mcq, vf } from "./_helpers";

/** Desafios extras curados — um por chave dos checkpoints existentes. */
export const CHECKPOINT_TERCEIROS: Record<string, Desafio> = {
  // ——— Backend ———
  "backend:be-linguagem": mcq(
    "backend:be-linguagem:extra",
    "O time já opera Java em produção. Você quer introduzir Rust só porque 'é mais rápida'. Qual risco real pesa mais?",
    "ops",
    [
      {
        id: "ops",
        label: "Hiring, review, tooling e plantão sem gente fluente na linguagem",
      },
      {
        id: "syntax",
        label: "A sintaxe de Rust ser mais longa que Java",
      },
      {
        id: "cpu",
        label: "A CPU do notebook do estagiário ficar quente",
      },
      {
        id: "npm",
        label: "O npm deixar de funcionar no monorepo",
      },
    ],
    "Linguagem nova sem ecossistema operacional vira dívida de gente — não só de código."
  ),

  "backend:be-git": vf(
    "backend:be-git:extra",
    "Reescrever histórico público com force-push numa branch que outros já puxaram costuma quebrar clones e reviews.",
    true,
    "Histórico compartilhado é contrato. Force-push em main/shared é o clássico 'sumiu meu commit'."
  ),

  "backend:be-terminal": mcq(
    "backend:be-terminal:extra",
    "Um script de migrate rodou e o shell mostrou exit code 1. Isso significa, em geral:",
    "falha",
    [
      {
        id: "falha",
        label: "O processo anterior falhou (convenção: ≠ 0 = erro)",
      },
      {
        id: "ok",
        label: "Sucesso garantido — 1 é o código de 'tudo certo'",
      },
      {
        id: "reboot",
        label: "O kernel reiniciou a máquina",
      },
      {
        id: "pipe",
        label: "Só que o pipe está ativo, sem relação com erro",
      },
    ],
    "Exit code 0 = ok; diferente de zero = falha. CI e healthcheck dependem disso."
  ),

  "backend:be-estruturas": mcq(
    "backend:be-estruturas:extra",
    "Preciso processar tarefas na ordem em que chegaram (primeiro a entrar, primeiro a sair). A estrutura clássica é:",
    "fila",
    [
      { id: "fila", label: "Fila (FIFO)" },
      { id: "pilha", label: "Pilha (LIFO)" },
      { id: "hash", label: "Tabela hash sem ordem" },
      { id: "heap-max", label: "Só max-heap sem política de chegada" },
    ],
    "FIFO = fila. LIFO = pilha. Hash não preserva ordem de chegada."
  ),

  "backend:be-testes": vf(
    "backend:be-testes:extra",
    "Teste que às vezes passa e às vezes falha sem mudança de código (flaky) destrói confiança no CI tanto quanto um bug real.",
    true,
    "Time começa a ignorar vermelho. Flaky é dívida operacional — isole, fixe ou delete."
  ),

  "backend:be-http": mcq(
    "backend:be-http:extra",
    "Cliente criou um recurso com sucesso. O status HTTP mais adequado costuma ser:",
    "201",
    [
      { id: "201", label: "201 Created" },
      { id: "404", label: "404 Not Found" },
      { id: "500", label: "500 Internal Server Error" },
      { id: "204-err", label: "204 com body de erro detalhado" },
    ],
    "201 comunica criação. 200 às vezes aparece, mas 201 é o sinal explícito de 'nasceu'."
  ),

  "backend:be-rest": vf(
    "backend:be-rest:extra",
    "Usar GET para apagar ou criar recursos quebra a expectativa de segurança/idempotência que caches e proxies assumem.",
    true,
    "GET deve ser seguro (sem efeito colateral). Mutação via GET é armadilha clássica."
  ),

  "backend:be-versionamento": mcq(
    "backend:be-versionamento:extra",
    "Adicionar um campo opcional novo num JSON de resposta, sem remover nem redefinir os antigos:",
    "compativel",
    [
      {
        id: "compativel",
        label: "Costuma ser mudança compatível para clientes que ignoram o desconhecido",
      },
      {
        id: "quebra",
        label: "Sempre exige major version no mesmo dia",
      },
      {
        id: "silent",
        label: "É ilegal em HTTP — JSON não pode crescer",
      },
      {
        id: "db",
        label: "Obriga a dropar a tabela no banco",
      },
    ],
    "Evolução tipicamente additive. Quebra é mudar significado ou tornar obrigatório o que era opcional."
  ),

  "backend:be-graphql": vf(
    "backend:be-graphql:extra",
    "DataLoader (ou batching equivalente) existe para colapsar N+1 de resolvers em poucas idas ao banco — não é enfeite de DX.",
    true,
    "Cada campo pode disparar I/O. Sem batch, a query 'bonita' vira tempestade de SELECTs."
  ),

  "backend:be-grpc": mcq(
    "backend:be-grpc:extra",
    "Em comparação típica com JSON sobre HTTP/1 para serviços internos, protobuf + gRPC costuma ganhar em:",
    "contrato",
    [
      {
        id: "contrato",
        label: "Contrato tipado, codegen e payload binário eficiente",
      },
      {
        id: "html",
        label: "Renderizar HTML no browser sem nenhum gateway",
      },
      {
        id: "css",
        label: "Substituir CSS do frontend",
      },
      {
        id: "seo",
        label: "Melhorar SEO de landing pages",
      },
    ],
    "IDL + stubs + binário: o ponto forte no interior da malha."
  ),

  "backend:be-sql": vf(
    "backend:be-sql:extra",
    "Índice em toda coluna 'por precaução' também custa: writes mais lentos e espaço — indexe o que a query realmente filtra/ordena.",
    true,
    "Índice não é grátis. EXPLAIN e padrão de acesso mandam mais que 'coloca em tudo'."
  ),

  "backend:be-nosql": mcq(
    "backend:be-nosql:extra",
    "Você precisa de joins multi-tabela, transações ACID fortes e relatórios ad-hoc. O ponto de partida mais honesto costuma ser:",
    "sql",
    [
      {
        id: "sql",
        label: "Banco relacional (SQL)",
      },
      {
        id: "doc",
        label: "Documento NoSQL forçando join na aplicação sempre",
      },
      {
        id: "kv",
        label: "Só key-value sem modelo de relação",
      },
      {
        id: "csv",
        label: "Planilha CSV no S3 como fonte da verdade",
      },
    ],
    "Relacional brilha em relação + consistência. NoSQL não apaga a necessidade de join — empurra para o app."
  ),

  "backend:be-logs": mcq(
    "backend:be-logs:extra",
    "Em produção, logar senha, token ou número de cartão em texto claro:",
    "vazamento",
    [
      {
        id: "vazamento",
        label: "É vazamento — redija/mascara dados sensíveis",
      },
      {
        id: "debug",
        label: "É ok se o nível for DEBUG",
      },
      {
        id: "json",
        label: "JSON estruturado torna seguro automaticamente",
      },
      {
        id: "obrigatorio",
        label: "PCI e LGPD exigem logar o segredo completo",
      },
    ],
    "Agregador de log é superfície de ataque. Segredo no log = incidente esperando."
  ),

  "backend:be-metricas": vf(
    "backend:be-metricas:extra",
    "Percentil (p95/p99) de latência revela cauda que a média esconde — média sozinha mente em fila e GC.",
    true,
    "Usuário sente a cauda. Alerte p95/p99, não só average."
  ),

  "backend:be-tracing": lacuna(
    "backend:be-tracing:extra",
    "No tracing distribuído, cada pedaço de trabalho cronometrado na cadeia é um ",
    ".",
    "span",
    ["span", "commit", "favicon", "stylesheet"],
    "Trace = árvore/caminho; span = unidade de tempo com pai/filho."
  ),

  "backend:be-ci": vf(
    "backend:be-ci:extra",
    "Pipeline verde que não roda os testes que protegem o caminho crítico é teatro de CI — não segurança de release.",
    true,
    "CI vale pelo sinal. Cobertura no lugar errado + skip eterno = falso conforto."
  ),

  "backend:be-seguranca-owasp": mcq(
    "backend:be-seguranca-owasp:extra",
    "Guardar senha em texto claro no banco, mesmo 'só para debug interno':",
    "hash",
    [
      {
        id: "hash",
        label: "É falha grave — use hash lento + salt (Argon2/bcrypt)",
      },
      {
        id: "ok",
        label: "É aceitável se a tabela tiver nome 'debug'",
      },
      {
        id: "base64",
        label: "Base64 conta como criptografia forte",
      },
      {
        id: "owasp-ok",
        label: "O OWASP recomenda texto claro para auditoria",
      },
    ],
    "Credenciais em claro estão no mapa OWASP. Hash + salt é o mínimo."
  ),

  // ——— Frontend ———
  "frontend:fe-html": mcq(
    "frontend:fe-html:extra",
    "Para o conteúdo principal da página, o elemento semântico mais adequado é:",
    "main",
    [
      { id: "main", label: "<main>" },
      { id: "div", label: "<div class='content'>" },
      { id: "blink", label: "<blink>" },
      { id: "font", label: "<font>" },
    ],
    "main marca o miolo; leitores e landmarks dependem disso."
  ),

  "frontend:fe-css": vf(
    "frontend:fe-css:extra",
    "Flexbox resolve bem distribuição em um eixo; Grid brilha quando você precisa de linhas e colunas ao mesmo tempo.",
    true,
    "Uma dimensão → Flex. Duas → Grid. Misturar os dois é normal; trocar os papéis dói."
  ),

  "frontend:fe-js": mcq(
    "frontend:fe-js:extra",
    "`==` com coerção vs `===` estrito. Em código novo, a escolha mais segura costuma ser:",
    "estrito",
    [
      {
        id: "estrito",
        label: "=== (sem surpresa de coerção de tipo)",
      },
      {
        id: "solto",
        label: "== sempre — o engine 'adivinha' certo",
      },
      {
        id: "css",
        label: "Comparar só com CSS :equal",
      },
      {
        id: "json",
        label: "JSON.stringify nos dois lados e torcer",
      },
    ],
    "Coerção de == é pedreira clássica ('' == 0). Prefira ===."
  ),

  "frontend:fe-dom": vf(
    "frontend:fe-dom:extra",
    "Manipular o DOM em loop apertado (reflow forçado a cada iteração) é receita clássica de jank — leia layout em lote, escreva em lote.",
    true,
    "Thrashing de layout mata frame. Separe measure e mutate."
  ),

  "frontend:fe-rede": mcq(
    "frontend:fe-rede:extra",
    "Fetch para outra origem sem os headers CORS certos no servidor. Quem bloqueia a leitura da resposta no JS?",
    "browser",
    [
      {
        id: "browser",
        label: "O browser (same-origin policy / CORS)",
      },
      {
        id: "dns",
        label: "O DNS root server",
      },
      {
        id: "prettier",
        label: "O Prettier no CI",
      },
      {
        id: "gpu",
        label: "A GPU do usuário",
      },
    ],
    "CORS é política do browser. curl na CLI não prova o que a página pode ler."
  ),

  "frontend:fe-ts": vf(
    "frontend:fe-ts:extra",
    "`unknown` força narrowing antes do uso; `any` desliga o typechecker naquele valor — por isso unknown é o escape hatch honesto.",
    true,
    "Chegou JSON externo? unknown + guard. any é desistir do contrato."
  ),

  "frontend:fe-local": mcq(
    "frontend:fe-local:extra",
    "Dois irmãos distantes na árvore precisam da mesma seleção de tema. O padrão limpo costuma ser:",
    "subir",
    [
      {
        id: "subir",
        label: "Subir o estado ao ancestral comum (ou contexto dedicado)",
      },
      {
        id: "dup",
        label: "Duplicar useState em cada um e rezar para coincidir",
      },
      {
        id: "cookie-theme",
        label: "Gravar o tema só em httpOnly sem estado de UI",
      },
      {
        id: "dns",
        label: "Publicar o tema no DNS TXT",
      },
    ],
    "Estado compartilhado sobe até quem une os consumidores — ou Context/store."
  ),

  "frontend:fe-servidor": vf(
    "frontend:fe-servidor:extra",
    "Mostrar dado de GET antigo depois de um DELETE bem-sucedido, sem invalidar a query, é UI mentirosa — o cache client ficou stale.",
    true,
    "Mutação sem invalidação = lista zumbi. SWR/React Query existem para isso."
  ),

  "frontend:fe-formularios": mcq(
    "frontend:fe-formularios:extra",
    "Validação no client e no server. Qual papel cada uma cumpre melhor?",
    "papeis",
    [
      {
        id: "papeis",
        label: "Client = UX rápida; server = verdade e segurança",
      },
      {
        id: "so-client",
        label: "Só client — o server pode confiar",
      },
      {
        id: "so-server",
        label: "Só server — feedback instantâneo não importa",
      },
      {
        id: "css",
        label: "Validar com CSS :valid basta para fraudadores",
      },
    ],
    "Client ajuda; server decide. Nunca confie no browser."
  ),

  "frontend:fe-teclado": vf(
    "frontend:fe-teclado:extra",
    "Armadilha de foco (focus trap) em modal é feature: Tab cicla dentro do diálogo até Esc/fechar — não um bug.",
    true,
    "Sem trap, Tab vaza para o fundo e o modal perde sentido no teclado."
  ),

  "frontend:fe-aria": mcq(
    "frontend:fe-aria:extra",
    "aria-live='polite' num status de formulário serve para:",
    "anunciar",
    [
      {
        id: "anunciar",
        label: "Anunciar mudança ao leitor sem roubar o foco na hora",
      },
      {
        id: "css",
        label: "Animar a cor do texto",
      },
      {
        id: "seo",
        label: "Subir no ranking do Google",
      },
      {
        id: "cache",
        label: "Ativar cache do Service Worker",
      },
    ],
    "Live region = feedback audível. polite espera uma pausa; assertive interrompe."
  ),

  "frontend:fe-contraste": vf(
    "frontend:fe-contraste:extra",
    "Ícone sem texto que comunica ação precisa de nome acessível (aria-label/title visível) — cor e desenho sozinhos não bastam para todo mundo.",
    true,
    "Contraste e nome vão juntos. Botão só-ícone sem label falha leitor e às vezes WCAG."
  ),

  "frontend:fe-leitor": mcq(
    "frontend:fe-leitor:extra",
    "Ordem de tabulação estranha (pula campos, vai pro footer no meio) geralmente aponta para:",
    "ordem",
    [
      {
        id: "ordem",
        label: "DOM/ordem visual desalinhados ou tabindex positivos abusados",
      },
      {
        id: "ram",
        label: "Pouca RAM no servidor de CI",
      },
      {
        id: "gzip",
        label: "Gzip desligado no CDN",
      },
      {
        id: "svg",
        label: "SVG inline ser colorido",
      },
    ],
    "Leitor e Tab seguem o DOM. tabindex>0 e CSS que reordena visualmente criam caos."
  ),

  "frontend:fe-movimento": vf(
    "frontend:fe-movimento:extra",
    "Autoplay de vídeo com movimento forte sem controle do usuário conflita com preferências de menos animação e pode causar mal-estar.",
    true,
    "Dê pause/stop e respeite prefers-reduced-motion. Movimento não é neutro."
  ),

  "frontend:fe-metricas": mcq(
    "frontend:fe-metricas:extra",
    "INP (Interaction to Next Paint) alto costuma indicar:",
    "main",
    [
      {
        id: "main",
        label: "Main thread ocupada demais para responder ao input",
      },
      {
        id: "dns-only",
        label: "Só problema de DNS, nunca de JS",
      },
      {
        id: "git",
        label: "Muitos branches no Git",
      },
      {
        id: "favicon",
        label: "Favicon grande demais",
      },
    ],
    "INP mede responsividade. JS longo e handlers pesados matam a métrica."
  ),

  "frontend:fe-bundle": vf(
    "frontend:fe-bundle:extra",
    "Tree-shaking só elimina o que o bundler prova não ser usado — side effects e import estilo 'puxa tudo' sabotam o ganho.",
    true,
    "Importe o símbolo certo; evite barrel que reexporta o mundo com efeitos colaterais."
  ),

  "frontend:fe-imagens": mcq(
    "frontend:fe-imagens:extra",
    "Para LCP de hero image, o que mais ajuda na prática?",
    "prioridade",
    [
      {
        id: "prioridade",
        label: "Tamanho certo + prioridade de fetch (priority/preload) + formato moderno",
      },
      {
        id: "lazy-hero",
        label: "lazy-load na hero above-the-fold",
      },
      {
        id: "base64-huge",
        label: "Inline base64 de 4MB no HTML",
      },
      {
        id: "display-none",
        label: "display:none até o onLoad do React",
      },
    ],
    "Hero não deve ser lazy. Reserve espaço, sirva no tamanho certo, priorize o download."
  ),

  "frontend:fe-render": vf(
    "frontend:fe-render:extra",
    "CSR puro em página que precisa de SEO e first paint rápido costuma perder para HTML já pronto (SSG/SSR) no primeiro carregamento.",
    true,
    "Spinner + JS enorme atrasa conteúdo indexável. Escolha o modo pelo produto."
  ),

  "frontend:fe-testes": mcq(
    "frontend:fe-testes:extra",
    "No Testing Library, a query preferida para achar um botão costuma ser:",
    "role",
    [
      {
        id: "role",
        label: "getByRole('button', { name: ... })",
      },
      {
        id: "testid-only",
        label: "Só data-testid em absolutamente tudo, inclusive texto visível",
      },
      {
        id: "css-sel",
        label: "document.querySelector('.css-module-hash')",
      },
      {
        id: "snapshot-dom",
        label: "Snapshot do HTML inteiro a cada keystroke",
      },
    ],
    "Role/nome = o que acessibilidade e usuário veem. testid é reserva, não padrão."
  ),

  "frontend:fe-lint": vf(
    "frontend:fe-lint:extra",
    "Desligar regra de lint no arquivo inteiro com eslint-disable no topo, sem justificativa, vira buraco permanente no CI.",
    true,
    "Disable pontual + comentário. Disable global é tapete sob o qual o bug mora."
  ),

  "frontend:fe-design-system": mcq(
    "frontend:fe-design-system:extra",
    "Time copia o Button do sistema e altera padding 'só dessa tela'. Com o tempo isso vira:",
    "drift",
    [
      {
        id: "drift",
        label: "Drift visual — o sistema deixa de ser sistema",
      },
      {
        id: "melhor",
        label: "Melhoria automática de acessibilidade",
      },
      {
        id: "seo",
        label: "Boost de SEO",
      },
      {
        id: "obrigatorio",
        label: "Prática recomendada em todo design system maduro",
      },
    ],
    "Variante no sistema > fork local. Senão cada tela inventa um botão."
  ),

  "frontend:fe-erros": vf(
    "frontend:fe-erros:extra",
    "Error Boundary no React captura erros de render em filhos — não substitui try/catch em async de event handler.",
    true,
    "Boundary ≠ magia total. Promessas rejeitadas e handlers precisam de tratamento próprio."
  ),

  "frontend:fe-i18n": lacuna(
    "frontend:fe-i18n:extra",
    "Para pluralização e placeholders corretos entre idiomas, o formato de mensagem mais usado no ecossistema web é ",
    ".",
    "ICU",
    ["ICU", "BASE64", "MD5", "FTP"],
    "ICU MessageFormat lida com plural, select e ordem de argumentos."
  ),

  // ——— Arquitetura ———
  "arquitetura:ar-linguagem": vf(
    "arquitetura:ar-linguagem:extra",
    "Dois bounded contexts podem usar a palavra 'Pedido' com regras diferentes — forçar um único modelo global costuma gerar acoplamento tóxico.",
    true,
    "DDD aceita tradução na borda. Um mega-modelo 'empresarial' raramente sobrevive."
  ),

  "arquitetura:ar-resiliencia": mcq(
    "arquitetura:ar-resiliencia:extra",
    "Dependência oscilando. Depois de N falhas seguidas, o padrão que 'abre' e falha rápido um tempo é:",
    "breaker",
    [
      {
        id: "breaker",
        label: "Circuit breaker",
      },
      {
        id: "cache-css",
        label: "Só limpar cache de CSS",
      },
      {
        id: "infinite",
        label: "Retry infinito sem teto",
      },
      {
        id: "drop-db",
        label: "DROP DATABASE",
      },
    ],
    "Breaker protege você e a dependência: para de martelar enquanto está doente."
  ),

  "arquitetura:ar-tradeoffs": vf(
    "arquitetura:ar-tradeoffs:extra",
    "Cache na frente do banco reduz latência e carga — ao preço de invalidação, stale reads e mais uma caixa no diagrama.",
    true,
    "Ganho e dor vêm juntos. Sem estratégia de invalidação, cache é mentira cronometrada."
  ),

  "arquitetura:ar-adr": mcq(
    "arquitetura:ar-adr:extra",
    "Decisão arquitetural importante tomada só no Zoom, sem registro. Seis meses depois o risco maior é:",
    "amnesia",
    [
      {
        id: "amnesia",
        label: "Ninguém lembrar o porquê — e repetir o debate ou reverter às cegas",
      },
      {
        id: "cpu",
        label: "A CPU esquecer assembly",
      },
      {
        id: "dns",
        label: "O DNS expirar automaticamente",
      },
      {
        id: "prettier",
        label: "O Prettier formatar o ADR inexistente",
      },
    ],
    "ADR é memória institucional. Oral some com o turnover."
  ),

  "arquitetura:ar-evolucao": vf(
    "arquitetura:ar-evolucao:extra",
    "Arquitetura evolutiva assume que o desenho vai mudar — por isso você investe em seams e testes de propriedade, não em big design up front eterno.",
    true,
    "Mudança é o default. Fitness functions e módulos trocáveis pagam essa aposta."
  ),

  "arquitetura:ar-observabilidade": mcq(
    "arquitetura:ar-observabilidade:extra",
    "Alerta disparou por taxa de erro. Para ver a mensagem exata e o userId do caso, o sinal que completa o quadro costuma ser:",
    "log",
    [
      {
        id: "log",
        label: "Log estruturado correlacionado (request id)",
      },
      {
        id: "slide",
        label: "O slide de arquitetura no Drive",
      },
      {
        id: "favicon",
        label: "O favicon do status page",
      },
      {
        id: "css",
        label: "Aumentar o font-size do dashboard",
      },
    ],
    "Métrica acorda; log detalha. Trace amarra o caminho entre os dois."
  ),

  "arquitetura:ar-slo": vf(
    "arquitetura:ar-slo:extra",
    "Estourar o orçamento de erro é sinal para priorizar estabilidade (freeze de feature arriscada) em vez de acelerar mudança.",
    true,
    "Error budget esgotado = freio explícito. Senão SLO vira slide decorativo."
  ),

  "arquitetura:ar-postmortem": mcq(
    "arquitetura:ar-postmortem:extra",
    "Post-mortem que só lista 'falha humana' sem mudar processo/alerta/teste:",
    "incompleto",
    [
      {
        id: "incompleto",
        label: "É incompleto — causa sistêmica e ação ficaram de fora",
      },
      {
        id: "ideal",
        label: "É o formato ideal segundo SRE",
      },
      {
        id: "legal",
        label: "Substitui qualquer ação técnica",
      },
      {
        id: "metric",
        label: "Melhora o p99 automaticamente",
      },
    ],
    "Pessoas erram; sistemas devem absorver. Sem ação, o incidente volta."
  ),

  // ——— Resiliência ———
  "resiliencia:res-orcamento": vf(
    "resiliencia:res-orcamento:extra",
    "Propagar o deadline do pedido (ex.: header/grpc deadline) para dependências evita que cada hop use um timeout 'cheio' e some além do prazo do usuário.",
    true,
    "Orçamento é global. Timeout local cego estoura o SLA mesmo 'com timeout em tudo'."
  ),

  "resiliencia:res-degradar": mcq(
    "resiliencia:res-degradar:extra",
    "Serviço de fotos de perfil fora do ar. A home deve:",
    "placeholder",
    [
      {
        id: "placeholder",
        label: "Mostrar placeholder/avatar default e seguir o feed",
      },
      {
        id: "500",
        label: "500 na página inteira",
      },
      {
        id: "block",
        label: "Bloquear login até a CDN de foto voltar",
      },
      {
        id: "drop",
        label: "Apagar a conta do usuário",
      },
    ],
    "Foto é aprimoramento. Não derrube o essencial por um nice-to-have."
  ),

  "resiliencia:res-atomico": vf(
    "resiliencia:res-atomico:extra",
    "Dois workers leem saldo 100 e ambos somam +10 sem versão/condição: um update sobrescreve o outro e some 10 — lost update clássico.",
    true,
    "Sem atomicidade na escrita (versão/WHERE/lock), a última gravação ganha e o meio some."
  ),

  "resiliencia:res-fila": mcq(
    "resiliencia:res-fila:extra",
    "Worker cai no meio do processamento e a mensagem volta. O consumidor precisa ser:",
    "idempotente",
    [
      {
        id: "idempotente",
        label: "Idempotente — processar de novo não duplica efeito",
      },
      {
        id: "once-only",
        label: "Assumir exactly-once mágico da fila sem dedupe",
      },
      {
        id: "ignore",
        label: "Ignorar a mensagem sempre na segunda entrega",
      },
      {
        id: "drop-queue",
        label: "Apagar a fila a cada erro",
      },
    ],
    "Filas reais são at-least-once na prática. Idempotência + dedupe fecham o ciclo."
  ),
};
