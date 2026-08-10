import type { Novidade } from "@/shared/types/novidade";

/**
 * Histórico de entregas, da mais recente para a mais antiga.
 *
 * Ao publicar um conceito ou roadmap novo, adicione o slug em `conceitos` /
 * `roadmaps` da entrada mais recente: o badge "novo" no catálogo aparece
 * sozinho e some quando a entrega envelhece.
 */
export const NOVIDADES: Novidade[] = [
  {
    versao: "0.2.0",
    data: "2026-08-10",
    titulo: "Os primeiros 15 conceitos e o Construtor",
    resumo:
      "Saiu a primeira leva de conteúdo de verdade. São 15 conceitos escritos do zero, o roadmap de padrões e uma ferramenta pra montar arquitetura arrastando bloco.",
    lancamentoInicial: true,
    mudancas: [
      {
        tipo: "conteudo",
        texto:
          "15 conceitos no ar, entre padrões criacionais, estruturais, comportamentais, princípios e arquitetura.",
      },
      {
        tipo: "conteudo",
        texto:
          "Roadmap de Padrões de Projeto. Dá pra marcar o que já estudou; fica salvo no navegador.",
      },
      {
        tipo: "novo",
        texto:
          "Construtor de Projeto: você arrasta os blocos, liga as camadas e vê o caminho que uma requisição faria.",
      },
      {
        tipo: "novo",
        texto:
          "Demos que dá pra mexer em Observer, Strategy, Adapter e CQRS.",
      },
      { tipo: "novo", texto: "Busca global com Ctrl + K." },
    ],
  },
  {
    versao: "0.1.0",
    data: "2026-08-09",
    titulo: "Primeira versão no ar",
    resumo:
      "Só o esqueleto: as rotas, o tema claro e escuro, e a estrutura pra receber o conteúdo.",
    mudancas: [
      { tipo: "novo", texto: "Rotas, layout e alternância de tema claro/escuro." },
    ],
  },
];
