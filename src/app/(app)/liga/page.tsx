import Link from "next/link";
import { Swords } from "lucide-react";
import { PageTemplate } from "@/shared/components/templates/page-template";
import { pageMetadata } from "@/shared/lib/seo";
import { requireUser } from "@/server/auth/dal";
import { rankingDaMinhaLiga } from "@/server/gamificacao/temporada";

export const metadata = pageMetadata({
  title: "Liga",
  description: "O ranking da sua liga nesta temporada.",
  path: "/liga",
  noIndex: true,
});

export const dynamic = "force-dynamic";

const fmt = new Intl.NumberFormat("pt-BR");

const ROTULO_NIVEL: Record<string, string> = {
  bronze: "Bronze",
  prata: "Prata",
  ouro: "Ouro",
  diamante: "Diamante",
  mestre: "Mestre",
};

export default async function LigaPage() {
  const u = await requireUser();
  const { nivel, linhas } = await rankingDaMinhaLiga(u.id);

  return (
    <PageTemplate
      icon={Swords}
      title="Liga"
      subtitle={
        nivel
          ? `Liga ${ROTULO_NIVEL[nivel] ?? nivel} — o placar reinicia toda semana. Top 5 sobem, os últimos 5 descem.`
          : "A temporada começa quando você ganha o primeiro XP da semana."
      }
      breadcrumb={[{ label: "Liga" }]}
    >
      {linhas.length === 0 ? (
        <p className="rounded-xl border border-dashed border-card-border bg-card/50 p-6 text-center text-[13px] text-muted">
          Nenhum XP nesta temporada ainda. Responda um quiz ou conclua um nó para
          entrar na disputa.
        </p>
      ) : (
        <ol className="divide-y divide-card-border overflow-hidden rounded-xl border border-card-border bg-card">
          {linhas.map((l, i) => {
            const zona =
              i < 5 ? "sobe" : i >= linhas.length - 5 && linhas.length > 5 ? "desce" : "";
            return (
              <li
                key={l.userId}
                className={`flex items-center gap-3 px-4 py-3 ${
                  l.ehVoce ? "bg-primary/5" : ""
                }`}
              >
                <span
                  className={`w-6 shrink-0 text-center text-sm font-semibold tabular-nums ${
                    zona === "sobe"
                      ? "text-primary"
                      : zona === "desce"
                        ? "text-cat-principio"
                        : "text-muted"
                  }`}
                >
                  {i + 1}
                </span>
                <span className="min-w-0 flex-1 truncate text-sm font-medium text-foreground">
                  {l.handle ? (
                    l.ehVoce ? (
                      <>@{l.handle} <span className="text-muted">(você)</span></>
                    ) : (
                      <Link
                        href={`/u/${l.handle}`}
                        className="hover:text-primary hover:underline"
                      >
                        @{l.handle}
                      </Link>
                    )
                  ) : (
                    <>{l.nome ?? "Anônimo"}{l.ehVoce && " (você)"}</>
                  )}
                </span>
                <span className="shrink-0 text-sm font-semibold text-primary">
                  {fmt.format(l.xpNaTemporada)} XP
                </span>
              </li>
            );
          })}
        </ol>
      )}
    </PageTemplate>
  );
}
