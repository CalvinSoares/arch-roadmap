import type { Roadmap } from "@/shared/types/roadmap";

/**
 * Trilha de frontend: da plataforma web aos padrões de composição de
 * interface, com acessibilidade e desempenho como requisitos, não extras.
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
        { id: "fe-html", titulo: "HTML semântico", descricao: "O elemento certo resolve metade da acessibilidade de graça." },
        { id: "fe-css", titulo: "CSS: cascata, layout, especificidade" },
        { id: "fe-js", titulo: "JavaScript moderno" },
        { id: "fe-dom", titulo: "DOM e eventos" },
        { id: "fe-rede", titulo: "Rede: fetch, CORS, cache do navegador" },
        { id: "fe-ts", titulo: "TypeScript", opcional: true },
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
        { id: "fe-local", titulo: "Estado local × compartilhado" },
        { id: "fe-servidor", titulo: "Estado do servidor é cache", descricao: "Dado remoto não é estado da aplicação — é cópia com validade." },
        { id: "fe-formularios", titulo: "Formulários e validação" },
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
        { id: "fe-teclado", titulo: "Navegação por teclado e foco visível" },
        { id: "fe-aria", titulo: "ARIA: quando usar e quando não usar" },
        { id: "fe-contraste", titulo: "Contraste e tipografia legível" },
        { id: "fe-leitor", titulo: "Testar com leitor de tela" },
        { id: "fe-movimento", titulo: "Respeitar prefers-reduced-motion", opcional: true },
      ],
    },
    {
      id: "desempenho",
      titulo: "Desempenho",
      descricao: "Percebido pelo usuário, medido em números.",
      items: [
        { id: "fe-metricas", titulo: "Core Web Vitals" },
        { id: "fe-bundle", titulo: "Tamanho de bundle e code splitting" },
        { id: "fe-imagens", titulo: "Imagens e fontes" },
        { id: "fe-render", titulo: "Renderização: SSR, SSG, ilhas" },
        { id: "fe-proxy", titulo: "Lazy loading é Proxy", conceito: "proxy", opcional: true },
        { id: "fe-flyweight", titulo: "Listas enormes e Flyweight", conceito: "flyweight", opcional: true },
      ],
    },
    {
      id: "qualidade",
      titulo: "Qualidade e entrega",
      descricao: "O que mantém a interface funcionando depois do primeiro deploy.",
      items: [
        { id: "fe-testes", titulo: "Testes: unidade, componente, ponta a ponta" },
        { id: "fe-lint", titulo: "Lint, formatação e convenções" },
        { id: "fe-design-system", titulo: "Design system e tokens" },
        { id: "fe-erros", titulo: "Monitoramento de erros no cliente" },
        { id: "fe-i18n", titulo: "Internacionalização", opcional: true },
      ],
    },
  ],
};
