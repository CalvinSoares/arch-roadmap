import type { MetadataRoute } from "next";
import {
  listConceitos,
  listRoadmaps,
  listComparacoes,
} from "@/shared/lib/content";
import { POSTMORTEMS } from "@/content/postmortems/registro";
import { ultimaNovidade } from "@/shared/lib/novidades";
import { absoluteUrl } from "@/shared/config/site";

type Freq = MetadataRoute.Sitemap[number]["changeFrequency"];

function entrada(
  path: string,
  opts: { changeFrequency: Freq; priority: number; lastModified: Date }
): MetadataRoute.Sitemap[number] {
  return {
    url: absoluteUrl(path),
    lastModified: opts.lastModified,
    changeFrequency: opts.changeFrequency,
    priority: opts.priority,
  };
}

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date(ultimaNovidade()?.data ?? "2026-08-10");

  const estaticas: { path: string; changeFrequency: Freq; priority: number }[] =
    [
      { path: "/", changeFrequency: "weekly", priority: 1 },
      { path: "/roadmaps", changeFrequency: "weekly", priority: 0.95 },
      { path: "/conceitos", changeFrequency: "weekly", priority: 0.9 },
      { path: "/comparar", changeFrequency: "weekly", priority: 0.75 },
      { path: "/clinica", changeFrequency: "weekly", priority: 0.7 },
      { path: "/postmortems", changeFrequency: "monthly", priority: 0.7 },
      { path: "/construtor", changeFrequency: "monthly", priority: 0.65 },
      { path: "/construtor/desafios", changeFrequency: "monthly", priority: 0.55 },
      { path: "/construtor/escala", changeFrequency: "monthly", priority: 0.5 },
      { path: "/construtor/comparar", changeFrequency: "monthly", priority: 0.55 },
      { path: "/construtor/entrevista", changeFrequency: "monthly", priority: 0.55 },
      { path: "/quiz", changeFrequency: "weekly", priority: 0.6 },
      { path: "/novidades", changeFrequency: "weekly", priority: 0.55 },
    ];

  return [
    ...estaticas.map((e) =>
      entrada(e.path, {
        changeFrequency: e.changeFrequency,
        priority: e.priority,
        lastModified,
      })
    ),
    ...listRoadmaps().map((r) =>
      entrada(`/roadmaps/${r.slug}`, {
        changeFrequency: "monthly",
        priority: 0.9,
        lastModified,
      })
    ),
    ...listConceitos().map((c) =>
      entrada(`/conceitos/${c.slug}`, {
        changeFrequency: "monthly",
        priority: 0.8,
        lastModified,
      })
    ),
    ...listComparacoes().map((c) =>
      entrada(`/comparar/${c.slug}`, {
        changeFrequency: "monthly",
        priority: 0.7,
        lastModified,
      })
    ),
    ...POSTMORTEMS.map((p) =>
      entrada(`/postmortems/${p.slug}`, {
        changeFrequency: "yearly",
        priority: 0.65,
        lastModified,
      })
    ),
  ];
}
