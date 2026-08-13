import type { Desafio } from "@/shared/types/desafio";
import { lacuna, mcq, vf } from "./_helpers";

export const CHECKPOINTS_FRONTEND: Record<string, Desafio[]> = {
  "frontend:fe-html": [
    vf(
      "frontend:fe-html:vf1",
      "Usar `<div>` para tudo e remendar com ARIA depois costuma ser pior para acessibilidade do que escolher o elemento semântico certo desde o início.",
      true,
      "Button, nav, main, label já carregam semântica e teclado. Div genérico começa do zero."
    ),
    mcq(
      "frontend:fe-html:mcq1",
      "Para um controle que dispara ação, o elemento mais adequado é:",
      "button",
      [
        { id: "button", label: "<button>" },
        { id: "div", label: "<div onclick>" },
        { id: "span", label: "<span role='presentation'>" },
        { id: "br", label: "<br>" },
      ],
      "Button já tem foco, Enter/Espaço e semântica de ação."
    ),
  ],

  "frontend:fe-css": [
    vf(
      "frontend:fe-css:vf1",
      "Especificidade e ordem na cascata explicam por que um estilo 'não aplica' mesmo com a classe certa no HTML.",
      true,
      "CSS não é 'última regra mágica' sem contexto — especificidade vence."
    ),
    mcq(
      "frontend:fe-css:mcq1",
      "Em layout moderno, a ferramenta mais adequada para grade bidimensional costuma ser:",
      "grid",
      [
        { id: "grid", label: "CSS Grid" },
        { id: "blink", label: "tag <blink>" },
        { id: "float", label: "Só float: left em tudo" },
        { id: "table", label: "Tabelas HTML para o layout da página inteira" },
      ],
      "Grid resolve duas dimensões; Flex brilha em uma. Float/table são legado de layout."
    ),
  ],

  "frontend:fe-js": [
    vf(
      "frontend:fe-js:vf1",
      "const e let têm escopo de bloco; var tem escopo de função e sofre hoisting mais confuso.",
      true,
      "JS moderno prefere const/let. var ainda aparece em código velho — e em bugs."
    ),
    mcq(
      "frontend:fe-js:mcq1",
      "Promessas e async/await existem principalmente para:",
      "async",
      [
        {
          id: "async",
          label: "Compor trabalho assíncrono sem callback hell",
        },
        {
          id: "css",
          label: "Aplicar CSS mais rápido",
        },
        {
          id: "sql",
          label: "Substituir o banco de dados",
        },
        {
          id: "sync",
          label: "Tornar todo I/O síncrono e bloqueante de propósito",
        },
      ],
      "Assincronia é o modelo do browser/Node — Promise é a unidade de composição."
    ),
  ],

  "frontend:fe-dom": [
    vf(
      "frontend:fe-dom:vf1",
      "addEventListener permite vários handlers no mesmo evento; onclick='' no HTML sobrescreve e mistura comportamento com marcação.",
      true,
      "Listener é o caminho moderno — e combina com remoção no cleanup."
    ),
    mcq(
      "frontend:fe-dom:mcq1",
      "Delegação de eventos (listener no pai) ajuda principalmente quando:",
      "lista",
      [
        {
          id: "lista",
          label: "Itens da lista nascem e morrem o tempo todo",
        },
        {
          id: "um",
          label: "Só existe um botão estático na vida da página",
        },
        {
          id: "css",
          label: "Você quer evitar escrever CSS",
        },
        {
          id: "seo",
          label: "O Google exige isso para indexar",
        },
      ],
      "Um listener no pai cobre filhos futuros — clássico em listas dinâmicas."
    ),
  ],

  "frontend:fe-rede": [
    vf(
      "frontend:fe-rede:vf1",
      "CORS é o browser pedindo permissão ao servidor para ler a resposta cross-origin — não é firewall de rede genérico.",
      true,
      "Servidor lista origens (allowlist). Outra origem sem header adequado = browser bloqueia o JS de ler."
    ),
    mcq(
      "frontend:fe-rede:mcq1",
      "Cookie de sessão com flag httpOnly significa que:",
      "httpOnly",
      [
        {
          id: "httpOnly",
          label: "JavaScript da página não consegue ler o cookie",
        },
        {
          id: "sumiu",
          label: "O cookie nunca é enviado ao servidor",
        },
        {
          id: "css",
          label: "O cookie só vale para arquivos .css",
        },
        {
          id: "local",
          label: "É a mesma coisa que localStorage",
        },
      ],
      "httpOnly mitiga XSS roubando o token via document.cookie."
    ),
  ],

  "frontend:fe-ts": [
    vf(
      "frontend:fe-ts:vf1",
      "TypeScript apaga os tipos em runtime: o que roda no browser/Node ainda é JavaScript.",
      true,
      "Tipos são contrato de compilação. Validação runtime (Zod etc.) é outra camada."
    ),
    mcq(
      "frontend:fe-ts:mcq1",
      "Usar `any` em todo lugar no TypeScript:",
      "desliga",
      [
        {
          id: "desliga",
          label: "Desliga a proteção que motivou adotar TS",
        },
        {
          id: "rapido",
          label: "É a forma recomendada pelo handbook oficial",
        },
        {
          id: "runtime",
          label: "Garante checks em runtime automaticamente",
        },
        {
          id: "menor",
          label: "Gera bundle menor que `unknown`",
        },
      ],
      "any é escape hatch. unknown + narrowing é o caminho honesto quando o tipo é incerto."
    ),
  ],

  "frontend:fe-local": [
    vf(
      "frontend:fe-local:vf1",
      "Estado local do componente basta para UI efêmera; estado global compartilhado só quando vários distantes precisam da mesma verdade.",
      true,
      "Global cedo demais vira acoplamento. Comece local — suba quando a dor aparecer."
    ),
    mcq(
      "frontend:fe-local:mcq1",
      "Abrir/fechar um modal usado só num formulário costuma viver melhor como:",
      "local",
      [
        { id: "local", label: "Estado local desse formulário/componente" },
        {
          id: "redux",
          label: "Slice Redux global desde o dia 1",
        },
        {
          id: "cookie",
          label: "Cookie httpOnly",
        },
        {
          id: "dns",
          label: "Registro DNS",
        },
      ],
      "Escopo mínimo. Global é para verdade compartilhada de verdade."
    ),
  ],

  "frontend:fe-servidor": [
    vf(
      "frontend:fe-servidor:vf1",
      "Dado remoto no client é cópia com validade — tratar como 'estado da aplicação' eterno gera cache velho e inconsistência.",
      true,
      "React Query/SWR modelam isso: stale, revalidate, invalidação. Não é useState eterno."
    ),
    mcq(
      "frontend:fe-servidor:mcq1",
      "Depois de um POST que cria um item, o que costuma fazer sentido no cache do client?",
      "invalida",
      [
        {
          id: "invalida",
          label: "Invalidar/refetch a lista que ficou obsoleta",
        },
        {
          id: "nada",
          label: "Nunca mais buscar essa lista",
        },
        {
          id: "delete-all",
          label: "Apagar todo o localStorage do usuário",
        },
        {
          id: "css",
          label: "Recompilar o CSS",
        },
      ],
      "Mutação invalida leituras relacionadas — senão a UI mente."
    ),
  ],

  "frontend:fe-formularios": [
    vf(
      "frontend:fe-formularios:vf1",
      "Validar só no client basta: o servidor pode confiar no que o browser mandou.",
      false,
      "Client melhora UX. Servidor é a fronteira de verdade — sempre revalida."
    ),
    mcq(
      "frontend:fe-formularios:mcq1",
      "Label associado ao input (htmlFor/id) importa porque:",
      "a11y",
      [
        {
          id: "a11y",
          label: "Amplia a área de clique e anuncia o campo ao leitor de tela",
        },
        {
          id: "cor",
          label: "Muda a cor do placeholder automaticamente",
        },
        {
          id: "sql",
          label: "Gera o schema SQL",
        },
        {
          id: "cache",
          label: "Ativa cache HTTP",
        },
      ],
      "Label correto é acessibilidade básica de formulário."
    ),
  ],

  "frontend:fe-teclado": [
    vf(
      "frontend:fe-teclado:vf1",
      "Foco visível pode ser removido com outline: none sem substituto — usuários de teclado se viram.",
      false,
      "Sem foco visível, navegação por Tab fica às cegas. Se remover outline, ofereça outro indicador."
    ),
    mcq(
      "frontend:fe-teclado:mcq1",
      "Um menu dropdown acessível por teclado precisa, no mínimo:",
      "teclas",
      [
        {
          id: "teclas",
          label: "Foco gerenciado e teclas (Esc/setas/Enter) além do mouse",
        },
        {
          id: "hover",
          label: "Só :hover — teclado não é requisito",
        },
        {
          id: "flash",
          label: "Animação em Flash",
        },
        {
          id: "pdf",
          label: "Exportar o menu em PDF",
        },
      ],
      "Teclado é requisito WCAG — não 'extra'."
    ),
  ],

  "frontend:fe-aria": [
    vf(
      "frontend:fe-aria:vf1",
      "A primeira regra de ARIA: não use ARIA se um elemento HTML nativo já resolve.",
      true,
      "ARIA é remendo quando a semântica nativa não basta — não substituto de button/input."
    ),
    mcq(
      "frontend:fe-aria:mcq1",
      "role='button' num div sem tratar teclado e foco:",
      "incompleto",
      [
        {
          id: "incompleto",
          label: "É acessibilidade incompleta — falta o comportamento do button",
        },
        {
          id: "ok",
          label: "É suficiente e preferível a <button>",
        },
        {
          id: "seo",
          label: "Melhora SEO automaticamente",
        },
        {
          id: "perf",
          label: "É mais performático que button nativo",
        },
      ],
      "Role sem comportamento engana o leitor de tela."
    ),
  ],

  "frontend:fe-contraste": [
    vf(
      "frontend:fe-contraste:vf1",
      "Texto cinza claro em fundo branco pode falhar contraste WCAG mesmo 'parecendo moderno'.",
      true,
      "Contraste é mensurável. Estética não absolve ilegibilidade."
    ),
    mcq(
      "frontend:fe-contraste:mcq1",
      "Tipografia legível em UI densa costuma evitar:",
      "miudo",
      [
        {
          id: "miudo",
          label: "Corpo 9px com line-height apertado em texto longo",
        },
        {
          id: "hierarquia",
          label: "Hierarquia clara entre título e corpo",
        },
        {
          id: "alt",
          label: "Alt text em imagens",
        },
        {
          id: "focus",
          label: "Indicador de foco",
        },
      ],
      "Tamanho e espaçamento são parte da legibilidade — não só a cor."
    ),
  ],

  "frontend:fe-leitor": [
    vf(
      "frontend:fe-leitor:vf1",
      "Testar com leitor de tela (NVDA, VoiceOver) pega problemas que o olho no layout não vê.",
      true,
      "Ordem de foco, nomes acessíveis e live regions só aparecem na prática."
    ),
    mcq(
      "frontend:fe-leitor:mcq1",
      "Uma imagem decorativa (só visual, sem informação) deve:",
      "altvazio",
      [
        {
          id: "altvazio",
          label: "Ter alt vazio (alt='') para o leitor ignorar",
        },
        {
          id: "altlonga",
          label: "Ter um ensaio de três parágrafos no alt",
        },
        {
          id: "semimg",
          label: "Ser sempre um <div> com background",
        },
        {
          id: "title",
          label: "Usar só title= e nunca alt",
        },
      ],
      "Decorativa = alt vazio. Informativa = alt que descreve o propósito."
    ),
  ],

  "frontend:fe-movimento": [
    vf(
      "frontend:fe-movimento:vf1",
      "prefers-reduced-motion pede para reduzir animação — usuários com vestibulopatia não são edge case desprezível.",
      true,
      "Respeitar a media query é cortesia e conformidade. Corte parallax/autoplay agressivo."
    ),
    lacuna(
      "frontend:fe-movimento:lac1",
      "Em CSS, a media query que detecta pedido de menos animação é ",
      ".",
      "prefers-reduced-motion",
      [
        "prefers-reduced-motion",
        "prefers-color-scheme",
        "max-width",
        "print",
      ],
      "Com ela você encurta ou desliga transitions/animations."
    ),
  ],

  "frontend:fe-metricas": [
    vf(
      "frontend:fe-metricas:vf1",
      "LCP, INP e CLS medem o que o usuário sente ao carregar e interagir — não só o tempo de build.",
      true,
      "Core Web Vitals ligam performance a experiência real."
    ),
    mcq(
      "frontend:fe-metricas:mcq1",
      "CLS alto geralmente indica:",
      "layout",
      [
        {
          id: "layout",
          label: "Elementos pulando de lugar durante o carregamento",
        },
        {
          id: "dns",
          label: "DNS lento demais",
        },
        {
          id: "tls",
          label: "Certificado TLS expirado",
        },
        {
          id: "git",
          label: "Muitos commits no repositório",
        },
      ],
      "Cumulative Layout Shift = instabilidade visual. Reserve espaço para imagens/ads."
    ),
  ],

  "frontend:fe-bundle": [
    vf(
      "frontend:fe-bundle:vf1",
      "Code splitting e imports dinâmicos atrasam baixar código que a rota atual não precisa.",
      true,
      "Menos JS inicial = TTI melhor. Rotas pesadas carregam sob demanda."
    ),
    mcq(
      "frontend:fe-bundle:mcq1",
      "Uma lib enorme usada numa única tela admin deveria:",
      "lazy",
      [
        {
          id: "lazy",
          label: "Entrar no chunk dessa rota (lazy), não no bundle inicial",
        },
        {
          id: "global",
          label: "Ir no bundle principal de todas as páginas",
        },
        {
          id: "cdn-force",
          label: "Ser copiada inline em todo HTML",
        },
        {
          id: "ban",
          label: "Ser banida mesmo se for essencial na admin",
        },
      ],
      "Pague o custo onde o valor existe."
    ),
  ],

  "frontend:fe-imagens": [
    vf(
      "frontend:fe-imagens:vf1",
      "Servir imagem no tamanho certo (srcset/width) evita baixar 4000px para um thumb de 200px.",
      true,
      "Peso de imagem ainda é o vilão clássico de LCP."
    ),
    mcq(
      "frontend:fe-imagens:mcq1",
      "Fontes web sem font-display adequado costumam causar:",
      "flash",
      [
        {
          id: "flash",
          label: "Texto invisível ou flash de fonte sem estilo (FOIT/FOUT)",
        },
        {
          id: "sql",
          label: "Deadlock no Postgres",
        },
        {
          id: "cors",
          label: "CORS em toda request de API",
        },
        {
          id: "404",
          label: "404 em todos os JS",
        },
      ],
      "font-display: swap (ou similar) controla o comportamento de fallback."
    ),
  ],

  "frontend:fe-render": [
    vf(
      "frontend:fe-render:vf1",
      "SSR/SSG/ilhas são trade-offs de TTFB, SEO, interatividade e custo de infra — não existe um modo certo para todo produto.",
      true,
      "Escolha pelo conteúdo e pelo time. Marketing estático ≠ dashboard autenticado."
    ),
    mcq(
      "frontend:fe-render:mcq1",
      "Página de marketing quase estática, SEO crítico, costuma combinar bem com:",
      "ssg",
      [
        {
          id: "ssg",
          label: "SSG / pré-render no build",
        },
        {
          id: "csr-only",
          label: "CSR puro com spinner eterno",
        },
        {
          id: "ws",
          label: "Só WebSocket, sem HTML",
        },
        {
          id: "ftp",
          label: "FTP manual a cada visita do usuário",
        },
      ],
      "HTML pronto no edge/CDN é ótimo para conteúdo estável."
    ),
  ],

  "frontend:fe-testes": [
    vf(
      "frontend:fe-testes:vf1",
      "Teste de componente com Testing Library prioriza o que o usuário vê/faz — não os detalhes privados de state.",
      true,
      "getByRole/text > inspecionar this.state. Menos frágil a refactor."
    ),
    mcq(
      "frontend:fe-testes:mcq1",
      "E2E (Playwright/Cypress) deve cobrir:",
      "criticos",
      [
        {
          id: "criticos",
          label: "Poucos fluxos críticos de ponta a ponta",
        },
        {
          id: "todos",
          label: "Cada branch de cada função utilitária",
        },
        {
          id: "zero",
          label: "Nada — unidade basta sempre",
        },
        {
          id: "prod",
          label: "Só rodar em produção com usuário real sem staging",
        },
      ],
      "E2E é caro. Reserve para o caminho que paga o salário."
    ),
  ],

  "frontend:fe-lint": [
    vf(
      "frontend:fe-lint:vf1",
      "Lint e formatador no CI evitam bike-shedding de estilo em code review.",
      true,
      "Máquina formata; humano discute desenho e risco."
    ),
    mcq(
      "frontend:fe-lint:mcq1",
      "Prettier + ESLint no projeto servem, juntos, para:",
      "duo",
      [
        {
          id: "duo",
          label: "Formatação consistente + regras de qualidade/bugs",
        },
        {
          id: "deploy",
          label: "Fazer deploy na Vercel",
        },
        {
          id: "db",
          label: "Migrar o banco",
        },
        {
          id: "dns",
          label: "Configurar DNS",
        },
      ],
      "Um cuida de estilo mecânico; o outro de smells e erros."
    ),
  ],

  "frontend:fe-design-system": [
    vf(
      "frontend:fe-design-system:vf1",
      "Tokens (cor, espaço, tipo) permitem mudar tema sem caçar magic numbers espalhados.",
      true,
      "Uma fonte de verdade visual — o oposto de #3b82f6 copiado em 40 arquivos."
    ),
    mcq(
      "frontend:fe-design-system:mcq1",
      "Um Button do design system existe para:",
      "consistencia",
      [
        {
          id: "consistencia",
          label: "Consistência visual/comportamental e menos reinventar acessibilidade",
        },
        {
          id: "job",
          label: "Criar emprego para quem só faz botão",
        },
        {
          id: "ban-html",
          label: "Proibir HTML nativo para sempre",
        },
        {
          id: "seo",
          label: "Melhorar PageRank",
        },
      ],
      "Sistema = reúso com qualidade — foco, teclado, variantes."
    ),
  ],

  "frontend:fe-erros": [
    vf(
      "frontend:fe-erros:vf1",
      "Erro só no console do dev não avisa o time em produção — precisa de monitoramento (Sentry etc.).",
      true,
      "Cliente real quebra em rede/browsers que você não tem. Telemetria fecha o ciclo."
    ),
    mcq(
      "frontend:fe-erros:mcq1",
      "window.onerror / Error Boundary ajudam a:",
      "capturar",
      [
        {
          id: "capturar",
          label: "Capturar falhas não tratadas e reportar/mostrar fallback",
        },
        {
          id: "evitar",
          label: "Impedir que qualquer bug exista",
        },
        {
          id: "css",
          label: "Corrigir CSS quebrado",
        },
        {
          id: "seo",
          label: "Indexar erros no Google",
        },
      ],
      "Você não elimina bugs; você detecta e degrada com elegância."
    ),
  ],

  "frontend:fe-i18n": [
    vf(
      "frontend:fe-i18n:vf1",
      "Concatenar frases traduzidas com variáveis no meio ('Olá ' + nome) quebra idiomas com ordem diferente.",
      true,
      "Use ICU/mensagem com placeholders. Tradução não é split de string."
    ),
    mcq(
      "frontend:fe-i18n:mcq1",
      "Datas e números na UI internacional devem:",
      "locale",
      [
        {
          id: "locale",
          label: "Respeitar locale (Intl) — 1.000,00 vs 1,000.00",
        },
        {
          id: "fixo",
          label: "Sempre usar formato dos EUA",
        },
        {
          id: "raw",
          label: "Mostrar timestamp Unix cru para todos",
        },
        {
          id: "img",
          label: "Virar imagem para não traduzir",
        },
      ],
      "Intl.DateTimeFormat / NumberFormat existem para isso."
    ),
  ],
};
