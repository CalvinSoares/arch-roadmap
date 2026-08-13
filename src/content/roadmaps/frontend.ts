import type { Roadmap } from "@/shared/types/roadmap";

/**
 * Trilha de frontend: da plataforma web aos padrões de composição de
 * interface, com acessibilidade e desempenho como requisitos, não extras. Os
 * itens com `conceito` abrem o catálogo; os de plataforma (HTML, CSS, a11y)
 * trazem recursos externos curados, no espírito do roadmap.sh.
 */
export const roadmapFrontend: Roadmap = {
  slug: "frontend",
  titulo: "Frontend",
  descricao:
    "O caminho de quem constrói interfaces: a plataforma web por baixo, os padrões de composição por cima, e acessibilidade e desempenho como parte do trabalho.",
  sections: [
    {
      id: "plataforma",
      titulo: "A plataforma",
      descricao: "O que existe antes de qualquer framework — e continua existindo depois.",
      items: [
        {
          id: "fe-html",
          titulo: "HTML semântico",
          descricao: "O elemento certo resolve metade da acessibilidade de graça.",
          recursos: [
            { titulo: "HTML — MDN", href: "https://developer.mozilla.org/en-US/docs/Web/HTML", tipo: "doc", fonte: "MDN" },
            { titulo: "Learn HTML", href: "https://web.dev/learn/html/", tipo: "curso", fonte: "web.dev" },
          ],
        },
        {
          id: "fe-css",
          titulo: "CSS: cascata, layout, especificidade",
          descricao: "Cascata, box model e layout — o que o framework só embrulha.",
          recursos: [
            { titulo: "Learn CSS", href: "https://web.dev/learn/css/", tipo: "curso", fonte: "web.dev" },
            { titulo: "A Guide to Flexbox", href: "https://css-tricks.com/snippets/css/a-guide-to-flexbox/", tipo: "artigo", fonte: "CSS-Tricks" },
          ],
        },
        {
          id: "fe-js",
          titulo: "JavaScript moderno",
          descricao: "Linguagem do navegador: tipos, async e o runtime real.",
          recursos: [
            { titulo: "The Modern JavaScript Tutorial", href: "https://javascript.info/", tipo: "curso", fonte: "javascript.info" },
            { titulo: "JavaScript — MDN", href: "https://developer.mozilla.org/en-US/docs/Web/JavaScript", tipo: "doc", fonte: "MDN" },
          ],
        },
        {
          id: "fe-dom",
          titulo: "DOM e eventos",
          descricao: "Árvore, eventos e o que acontece depois do clique.",
          recursos: [
            { titulo: "DOM — MDN", href: "https://developer.mozilla.org/en-US/docs/Web/API/Document_Object_Model", tipo: "doc", fonte: "MDN" },
            { titulo: "Introdução a eventos", href: "https://developer.mozilla.org/en-US/docs/Learn/JavaScript/Building_blocks/Events", tipo: "doc", fonte: "MDN" },
          ],
        },
        {
          id: "fe-rede",
          titulo: "Rede: fetch, CORS, cache do navegador",
          descricao:
            "CORS é allowlist de origens; cookie httpOnly não é lido pelo JS da página.",
          recursos: [
            { titulo: "Fetch API", href: "https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API", tipo: "doc", fonte: "MDN" },
            { titulo: "CORS", href: "https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS", tipo: "doc", fonte: "MDN" },
            {
              titulo: "Using HTTP cookies",
              href: "https://developer.mozilla.org/en-US/docs/Web/HTTP/Cookies",
              tipo: "doc",
              fonte: "MDN",
            },
          ],
        },
        {
          id: "fe-auth-cookie",
          titulo: "Sessão no browser: cookie httpOnly",
          conceito: "autenticacao",
          prerequisitos: ["fe-rede"],
        },
        {
          id: "fe-allowlist-cors",
          titulo: "Allowlist de origens (CORS)",
          conceito: "allowlist",
          opcional: true,
          prerequisitos: ["fe-rede"],
        },
        {
          id: "fe-ts",
          titulo: "TypeScript",
          descricao: "Tipos que pegam erro antes do usuário.",
          opcional: true,
          recursos: [
            { titulo: "TypeScript Handbook", href: "https://www.typescriptlang.org/docs/handbook/intro.html", tipo: "doc", fonte: "TypeScript" },
          ],
        },
      ],
    },
    {
      id: "componentes",
      titulo: "Componentes e composição",
      descricao: "Onde os padrões clássicos reaparecem com outros nomes.",
      items: [
        { id: "fe-composite", titulo: "Árvore de componentes é Composite", conceito: "composite" },
        { id: "fe-observer", titulo: "Reatividade é Observer", conceito: "observer" },
        { id: "fe-decorator", titulo: "HOC e wrappers são Decorator", conceito: "decorator", opcional: true },
        { id: "fe-strategy", titulo: "Comportamento injetado é Strategy", conceito: "strategy", opcional: true },
        { id: "fe-template", titulo: "Ciclo de vida é Template Method", conceito: "template-method", opcional: true },
        { id: "fe-isp", titulo: "Props enxutas: ISP na prática", conceito: "isp", opcional: true },
      ],
    },
    {
      id: "estado",
      titulo: "Estado",
      descricao: "A parte mais difícil de qualquer interface não trivial.",
      items: [
        {
          id: "fe-local",
          titulo: "Estado local × compartilhado",
          descricao: "O que fica no componente e o que sobe para o pai.",
          recursos: [
            { titulo: "Application State Management (Kent C. Dodds)", href: "https://kentcdodds.com/blog/application-state-management-with-react", tipo: "artigo", fonte: "kentcdodds" },
          ],
        },
        {
          id: "fe-servidor",
          titulo: "Estado do servidor é cache",
          descricao: "Dado remoto não é estado da aplicação — é cópia com validade.",
          recursos: [
            { titulo: "TanStack Query — overview", href: "https://tanstack.com/query/latest/docs/framework/react/overview", tipo: "doc", fonte: "TanStack" },
          ],
        },
        {
          id: "fe-formularios",
          titulo: "Formulários e validação",
          descricao: "Validar cedo, feedback claro, submit previsível.",
          recursos: [
            { titulo: "Learn Forms", href: "https://web.dev/learn/forms/", tipo: "curso", fonte: "web.dev" },
          ],
        },
        { id: "fe-memento", titulo: "Desfazer com Memento", conceito: "memento", opcional: true },
        { id: "fe-command", titulo: "Ações como Command", conceito: "command", opcional: true },
        { id: "fe-mediator", titulo: "Coordenação com Mediator", conceito: "mediator", opcional: true },
      ],
    },
    {
      id: "acessibilidade",
      titulo: "Acessibilidade",
      descricao: "Requisito, não etapa final — e o que mais melhora a qualidade geral.",
      items: [
        {
          id: "fe-teclado",
          titulo: "Navegação por teclado e foco visível",
          descricao: "Tab, foco e atalhos — se não dá sem mouse, quebra.",
          recursos: [
            { titulo: "Keyboard Accessibility (WebAIM)", href: "https://webaim.org/techniques/keyboard/", tipo: "artigo", fonte: "WebAIM" },
          ],
        },
        {
          id: "fe-aria",
          titulo: "ARIA: quando usar e quando não usar",
          descricao: "HTML primeiro; ARIA só quando o semântico não chega.",
          recursos: [
            { titulo: "ARIA Authoring Practices (APG)", href: "https://www.w3.org/WAI/ARIA/apg/", tipo: "doc", fonte: "W3C" },
            { titulo: "ARIA — MDN", href: "https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA", tipo: "doc", fonte: "MDN" },
          ],
        },
        {
          id: "fe-contraste",
          titulo: "Contraste e tipografia legível",
          descricao: "Texto legível em qualquer tela e condição de luz.",
          recursos: [
            { titulo: "WCAG 2.1 Quick Reference", href: "https://www.w3.org/WAI/WCAG21/quickref/", tipo: "doc", fonte: "W3C" },
            { titulo: "Contrast Checker", href: "https://webaim.org/resources/contrastchecker/", tipo: "ferramenta", fonte: "WebAIM" },
          ],
        },
        {
          id: "fe-leitor",
          titulo: "Testar com leitor de tela",
          descricao: "Ouvir a interface como quem não vê a tela.",
          recursos: [
            { titulo: "Screen Reader Testing", href: "https://webaim.org/articles/screenreader_testing/", tipo: "artigo", fonte: "WebAIM" },
          ],
        },
        {
          id: "fe-movimento",
          titulo: "Respeitar prefers-reduced-motion",
          descricao: "Animação não pode ser obrigatória para entender.",
          opcional: true,
          recursos: [
            { titulo: "prefers-reduced-motion", href: "https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-reduced-motion", tipo: "doc", fonte: "MDN" },
          ],
        },
      ],
    },
    {
      id: "desempenho",
      titulo: "Desempenho",
      descricao: "Percebido pelo usuário, medido em números.",
      items: [
        {
          id: "fe-metricas",
          titulo: "Core Web Vitals",
          descricao: "LCP, INP, CLS — o que o usuário realmente sente.",
          recursos: [
            { titulo: "Web Vitals", href: "https://web.dev/articles/vitals", tipo: "artigo", fonte: "web.dev" },
            { titulo: "PageSpeed Insights", href: "https://pagespeed.web.dev/", tipo: "ferramenta", fonte: "Google" },
          ],
        },
        {
          id: "fe-bundle",
          titulo: "Tamanho de bundle e code splitting",
          descricao: "Menos JS no primeiro paint; o resto sob demanda.",
          recursos: [
            { titulo: "Reduce JS payloads with code-splitting", href: "https://web.dev/articles/reduce-javascript-payloads-with-code-splitting", tipo: "artigo", fonte: "web.dev" },
          ],
        },
        {
          id: "fe-imagens",
          titulo: "Imagens e fontes",
          descricao: "Formato, tamanho e lazy load antes de otimizar JS.",
          recursos: [
            { titulo: "Learn Images", href: "https://web.dev/learn/images/", tipo: "curso", fonte: "web.dev" },
          ],
        },
        {
          id: "fe-render",
          titulo: "Renderização: SSR, SSG, ilhas",
          descricao: "Onde o HTML nasce: servidor, build ou no cliente.",
          recursos: [
            { titulo: "Rendering on the Web", href: "https://web.dev/articles/rendering-on-the-web", tipo: "artigo", fonte: "web.dev" },
            { titulo: "Rendering Patterns", href: "https://www.patterns.dev/vanilla/rendering-patterns/", tipo: "artigo", fonte: "patterns.dev" },
          ],
        },
        { id: "fe-proxy", titulo: "Lazy loading é Proxy", conceito: "proxy", opcional: true },
        { id: "fe-flyweight", titulo: "Listas enormes e Flyweight", conceito: "flyweight", opcional: true },
      ],
    },
    {
      id: "qualidade",
      titulo: "Qualidade e entrega",
      descricao: "O que mantém a interface funcionando depois do primeiro deploy.",
      items: [
        {
          id: "fe-testes",
          titulo: "Testes: unidade, componente, ponta a ponta",
          descricao: "Confiança para refatorar sem medo de regressão.",
          recursos: [
            { titulo: "Testing Library", href: "https://testing-library.com/docs/", tipo: "doc", fonte: "Testing Library" },
            { titulo: "Playwright (E2E)", href: "https://playwright.dev/docs/intro", tipo: "doc", fonte: "Playwright" },
          ],
        },
        {
          id: "fe-lint",
          titulo: "Lint, formatação e convenções",
          descricao: "Regras compartilhadas que o editor aplica sozinho.",
          recursos: [
            { titulo: "ESLint — Getting Started", href: "https://eslint.org/docs/latest/use/getting-started", tipo: "doc", fonte: "ESLint" },
            { titulo: "Prettier", href: "https://prettier.io/docs/", tipo: "doc", fonte: "Prettier" },
          ],
        },
        {
          id: "fe-design-system",
          titulo: "Design system e tokens",
          descricao: "Tokens e componentes que mantêm a UI consistente.",
          recursos: [
            { titulo: "Design Tokens (W3C CG)", href: "https://www.designtokens.org/", tipo: "doc", fonte: "Design Tokens" },
            { titulo: "Storybook", href: "https://storybook.js.org/docs", tipo: "doc", fonte: "Storybook" },
          ],
        },
        {
          id: "fe-erros",
          titulo: "Monitoramento de erros no cliente",
          descricao: "Capturar falha no cliente antes de virar ticket.",
          recursos: [
            { titulo: "error event — MDN", href: "https://developer.mozilla.org/en-US/docs/Web/API/Window/error_event", tipo: "doc", fonte: "MDN" },
          ],
        },
        {
          id: "fe-i18n",
          titulo: "Internacionalização",
          descricao: "Textos, datas e números que mudam com o locale.",
          opcional: true,
          recursos: [
            { titulo: "Intl — MDN", href: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl", tipo: "doc", fonte: "MDN" },
            { titulo: "FormatJS", href: "https://formatjs.io/docs/getting-started/installation/", tipo: "doc", fonte: "FormatJS" },
          ],
        },
      ],
    },
  ],
};
