/**
 * Identidade pública do DevMappa: URL, textos e keywords usados em
 * metadata, robots, sitemap, manifest e JSON-LD.
 */
export const SITE = {
  name: "DevMappa",
  shortName: "DevMappa",
  title: "DevMappa — estude padrões e arquitetura visualmente",
  description:
    "Roadmaps enxutos e um catálogo visual de design patterns, princípios e arquitetura, com diagramas, camadas navegáveis e demos interativas.",
  url: (process.env.NEXT_PUBLIC_SITE_URL ?? "https://devmappa.vercel.app").replace(
    /\/$/,
    ""
  ),
  locale: "pt_BR",
  language: "pt-BR",
  themeColor: "#b4482a",
  backgroundColor: "#100d0b",
  keywords: [
    "design patterns",
    "padrões de projeto",
    "arquitetura de software",
    "SOLID",
    "roadmaps",
    "GoF",
    "TypeScript",
    "backend",
    "frontend",
    "DevMappa",
  ],
} as const;

export function absoluteUrl(path = "/"): string {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${SITE.url}${normalized === "/" ? "" : normalized}`;
}
