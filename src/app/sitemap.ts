import type { MetadataRoute } from "next";
import {
  listConceitos,
  listRoadmaps,
  listComparacoes,
} from "@/shared/lib/content";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://devatlas.vercel.app";

export default function sitemap(): MetadataRoute.Sitemap {
  const estaticas = [
    "",
    "/conceitos",
    "/roadmaps",
    "/construtor",
    "/comparar",
    "/estudar",
    "/quiz",
    "/novidades",
  ].map((p) => ({
    url: `${SITE_URL}${p}`,
    changeFrequency: "weekly" as const,
    priority: p === "" ? 1 : 0.8,
  }));

  const conceitos = listConceitos().map((c) => ({
    url: `${SITE_URL}/conceitos/${c.slug}`,
    changeFrequency: "monthly" as const,
    priority: 0.7,
  }));

  const roadmaps = listRoadmaps().map((r) => ({
    url: `${SITE_URL}/roadmaps/${r.slug}`,
    changeFrequency: "monthly" as const,
    priority: 0.9,
  }));

  const comparacoes = listComparacoes().map((c) => ({
    url: `${SITE_URL}/comparar/${c.slug}`,
    changeFrequency: "monthly" as const,
    priority: 0.6,
  }));

  return [...estaticas, ...roadmaps, ...conceitos, ...comparacoes];
}
