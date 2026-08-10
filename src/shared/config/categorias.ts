import type { Categoria, Dificuldade } from "@/shared/types/conceito";

interface CategoriaMeta {
  label: string;
  /** classe de cor de texto (token Tailwind) */
  text: string;
  /** classe de fundo suave para badges */
  badge: string;
  /** cor sólida (para nós de diagrama, bordas) — CSS var */
  cssVar: string;
}

export const CATEGORIAS: Record<Categoria, CategoriaMeta> = {
  criacional: {
    label: "Criacional",
    text: "text-cat-criacional",
    badge: "bg-cat-criacional/12 text-cat-criacional",
    cssVar: "var(--cat-criacional)",
  },
  estrutural: {
    label: "Estrutural",
    text: "text-cat-estrutural",
    badge: "bg-cat-estrutural/12 text-cat-estrutural",
    cssVar: "var(--cat-estrutural)",
  },
  comportamental: {
    label: "Comportamental",
    text: "text-cat-comportamental",
    badge: "bg-cat-comportamental/12 text-cat-comportamental",
    cssVar: "var(--cat-comportamental)",
  },
  principio: {
    label: "Princípio",
    text: "text-cat-principio",
    badge: "bg-cat-principio/12 text-cat-principio",
    cssVar: "var(--cat-principio)",
  },
  arquitetura: {
    label: "Arquitetura",
    text: "text-cat-arquitetura",
    badge: "bg-cat-arquitetura/12 text-cat-arquitetura",
    cssVar: "var(--cat-arquitetura)",
  },
};

export const DIFICULDADES: Record<Dificuldade, string> = {
  iniciante: "Iniciante",
  intermediario: "Intermediário",
  avancado: "Avançado",
};

export const LINGUAGENS: Record<string, string> = {
  typescript: "TypeScript",
  python: "Python",
  java: "Java",
};
