import Link from "next/link";
import { ArrowRight, Layers, Map, LayoutGrid } from "lucide-react";
import { Button } from "@/shared/components/global/ui/button";
import { Card } from "@/shared/components/global/ui/card";
import { Badge } from "@/shared/components/global/ui/badge";
import { CATEGORIAS } from "@/shared/config/categorias";
import { listConceitos, listRoadmaps } from "@/shared/lib/content";

export default function HomePage() {
  const conceitos = listConceitos();
  const roadmaps = listRoadmaps();

  return (
    <div className="page-shell">
      <section className="mx-auto max-w-3xl py-8 text-center">
        <Badge className="bg-primary/12 text-primary">Estudo &amp; visualização</Badge>
        <h1 className="mt-4 text-4xl font-semibold tracking-tight sm:text-5xl">
          Entenda padrões e arquitetura <span className="text-primary">visualmente</span>
        </h1>
        <p className="page-header-subtitle mx-auto mt-4 max-w-xl">
          Roadmaps enxutos e verbetes com diagramas, camadas e código em várias
          linguagens. Sem cadastro, sem ruído — só o essencial para aprender.
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <Button asChild size="lg">
            <Link href="/roadmaps">
              Ver roadmaps <ArrowRight />
            </Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link href="/conceitos">Explorar conceitos</Link>
          </Button>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-3">
        {[
          { icon: Map, titulo: "Roadmaps navegáveis", desc: "Trilhas em grafo — do básico ao avançado, com dependências claras." },
          { icon: Layers, titulo: "Camadas & diagramas", desc: "Veja onde cada peça atua na arquitetura, não só a teoria." },
          { icon: LayoutGrid, titulo: "Código real", desc: "Exemplos em TypeScript, Python e Java, prontos para copiar." },
        ].map(({ icon: Icon, titulo, desc }) => (
          <Card key={titulo} className="p-5">
            <Icon className="size-6 text-primary" />
            <h2 className="mt-3 text-base font-medium">{titulo}</h2>
            <p className="mt-1 text-sm text-muted">{desc}</p>
          </Card>
        ))}
      </section>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Conceitos em destaque</h2>
          <Link href="/conceitos" className="text-sm text-primary hover:underline">
            Ver todos ({conceitos.length})
          </Link>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {conceitos.map((c) => {
            const cat = CATEGORIAS[c.categoria];
            return (
              <Link key={c.slug} href={`/conceitos/${c.slug}`}>
                <Card className="h-full p-5 transition-colors hover:border-primary/50">
                  <Badge className={cat.badge}>{cat.label}</Badge>
                  <h3 className="mt-3 font-medium">{c.titulo}</h3>
                  <p className="mt-1 line-clamp-3 text-sm text-muted">{c.resumo}</p>
                </Card>
              </Link>
            );
          })}
        </div>
      </section>

      <section className="text-sm text-muted">
        {roadmaps.length} roadmap(s) disponível(is) ·{" "}
        <Link href="/roadmaps" className="text-primary hover:underline">
          comece por aqui
        </Link>
      </section>
    </div>
  );
}
