import type { Metadata } from "next";
import { SITE, absoluteUrl } from "@/shared/config/site";

type PageSeoInput = {
  title: string;
  description: string;
  /** Caminho canônico, ex.: `/conceitos/adapter`. */
  path: string;
  /** Tipo Open Graph. Conteúdo editorial → `article`. */
  type?: "website" | "article";
  /** Marca a página como não indexável (404s, estados vazios). */
  noIndex?: boolean;
};

/**
 * Metadata completa para páginas do App Router: title, description,
 * canonical, Open Graph e Twitter alinhados.
 */
export function pageMetadata({
  title,
  description,
  path,
  type = "website",
  noIndex = false,
}: PageSeoInput): Metadata {
  const url = absoluteUrl(path);
  const fullTitle = path === "/" ? SITE.title : title;

  return {
    title: path === "/" ? { absolute: SITE.title } : title,
    description,
    alternates: { canonical: path },
    openGraph: {
      type,
      locale: SITE.locale,
      url,
      siteName: SITE.name,
      title: fullTitle,
      description,
    },
    twitter: {
      card: "summary_large_image",
      title: fullTitle,
      description,
    },
    robots: noIndex
      ? { index: false, follow: false }
      : {
          index: true,
          follow: true,
          googleBot: {
            index: true,
            follow: true,
            "max-image-preview": "large",
            "max-snippet": -1,
            "max-video-preview": -1,
          },
        },
  };
}

export function websiteJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE.name,
    url: SITE.url,
    description: SITE.description,
    inLanguage: SITE.language,
    publisher: { "@type": "Organization", name: SITE.name, url: SITE.url },
  };
}

export function organizationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: SITE.name,
    url: SITE.url,
    logo: absoluteUrl("/icon"),
    description: SITE.description,
  };
}

export function breadcrumbJsonLd(
  items: { name: string; path?: string }[]
) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      ...(item.path ? { item: absoluteUrl(item.path) } : {}),
    })),
  };
}

export function learningResourceJsonLd(input: {
  title: string;
  description: string;
  path: string;
  keywords?: string[];
  timeRequiredMinutes?: number;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "LearningResource",
    name: input.title,
    description: input.description,
    url: absoluteUrl(input.path),
    inLanguage: SITE.language,
    isAccessibleForFree: true,
    learningResourceType: "tutorial",
    provider: { "@type": "Organization", name: SITE.name, url: SITE.url },
    ...(input.keywords?.length ? { keywords: input.keywords.join(", ") } : {}),
    ...(input.timeRequiredMinutes
      ? { timeRequired: `PT${input.timeRequiredMinutes}M` }
      : {}),
  };
}

export function courseJsonLd(input: {
  title: string;
  description: string;
  path: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Course",
    name: input.title,
    description: input.description,
    url: absoluteUrl(input.path),
    inLanguage: SITE.language,
    isAccessibleForFree: true,
    provider: { "@type": "Organization", name: SITE.name, url: SITE.url },
  };
}

export function articleJsonLd(input: {
  title: string;
  description: string;
  path: string;
  datePublished?: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: input.title,
    description: input.description,
    url: absoluteUrl(input.path),
    inLanguage: SITE.language,
    isAccessibleForFree: true,
    publisher: { "@type": "Organization", name: SITE.name, url: SITE.url },
    ...(input.datePublished ? { datePublished: input.datePublished } : {}),
  };
}
