import Link from "next/link";
import { Map, ArrowRight } from "lucide-react";
import { PageTemplate } from "@/shared/components/templates/page-template";
import { Card } from "@/shared/components/global/ui/card";
import { listRoadmaps } from "@/shared/lib/content";

export const metadata = { title: "Roadmaps" };

export default function RoadmapsPage() {
  const roadmaps = listRoadmaps();

  return (
    <PageTemplate
      icon={Map}
      title="Roadmaps"
      subtitle="Trilhas de aprendizado navegáveis. Escolha por onde começar."
      breadcrumb={[{ label: "Roadmaps" }]}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        {roadmaps.map((r) => (
          <Link key={r.slug} href={`/roadmaps/${r.slug}`}>
            <Card className="flex h-full items-start justify-between gap-4 p-5 transition-colors hover:border-primary/50">
              <div>
                <h3 className="font-medium">{r.titulo}</h3>
                <p className="mt-1 text-sm text-muted">{r.descricao}</p>
                <p className="mt-2 text-xs text-muted">
                  {r.sections.length} seções ·{" "}
                  {r.sections.reduce((a, s) => a + s.items.length, 0)} tópicos
                </p>
              </div>
              <ArrowRight className="mt-1 size-5 shrink-0 text-primary" />
            </Card>
          </Link>
        ))}
      </div>
    </PageTemplate>
  );
}
