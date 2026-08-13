import Link from "next/link";
import { Users, Flame } from "lucide-react";
import { PageTemplate } from "@/shared/components/templates/page-template";
import { pageMetadata } from "@/shared/lib/seo";
import { requireUser } from "@/server/auth/dal";
import { rankingAmigos, convitesPendentes } from "@/server/social/consultas";
import { GerenciarAmigos } from "./_components/gerenciar-amigos";

export const metadata = pageMetadata({
  title: "Amigos",
  description: "Seus amigos e o ranking de XP entre vocês.",
  path: "/amigos",
  noIndex: true,
});

export const dynamic = "force-dynamic";

const fmt = new Intl.NumberFormat("pt-BR");

export default async function AmigosPage() {
  const u = await requireUser();
  const [ranking, pendentes] = await Promise.all([
    rankingAmigos(u.id),
    convitesPendentes(u.id),
  ]);

  return (
    <PageTemplate
      icon={Users}
      title="Amigos"
      subtitle="Compare seu XP com o de quem estuda junto. Perfil e ranking são entre amigos aceitos."
      breadcrumb={[{ label: "Amigos" }]}
    >
      <div className="space-y-6">
        <GerenciarAmigos pendentes={pendentes} />

        <section>
          <h2 className="mb-3 text-sm font-semibold text-foreground">
            Ranking entre amigos
          </h2>
          <ol className="divide-y divide-card-border overflow-hidden rounded-xl border border-card-border bg-card">
            {ranking.map((r, i) => (
              <li
                key={r.userId}
                className={`flex items-center gap-3 px-4 py-3 ${
                  r.ehVoce ? "bg-primary/5" : ""
                }`}
              >
                <span className="w-6 shrink-0 text-center text-sm font-semibold text-muted tabular-nums">
                  {i + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-foreground">
                    {r.handle ? (
                      r.ehVoce ? (
                        <>@{r.handle} <span className="text-muted">(você)</span></>
                      ) : (
                        <Link
                          href={`/u/${r.handle}`}
                          className="hover:text-primary hover:underline"
                        >
                          @{r.handle}
                        </Link>
                      )
                    ) : (
                      <>{r.nome ?? "Anônimo"}{r.ehVoce && " (você)"}</>
                    )}
                  </p>
                  <p className="flex items-center gap-2 text-[13px] text-muted">
                    <span>Nível {r.nivel}</span>
                    <span className="inline-flex items-center gap-1">
                      <Flame className="size-3.5 text-cat-principio" />
                      {r.streakDias}
                    </span>
                  </p>
                </div>
                <span className="shrink-0 text-sm font-semibold text-primary">
                  {fmt.format(r.xpTotal)} XP
                </span>
              </li>
            ))}
          </ol>
          {ranking.length <= 1 && (
            <p className="mt-3 text-center text-[13px] text-muted">
              Adicione amigos pelo @handle para montar seu ranking.
            </p>
          )}
        </section>
      </div>
    </PageTemplate>
  );
}
