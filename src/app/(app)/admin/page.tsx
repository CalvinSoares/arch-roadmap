import { AlertTriangle } from "lucide-react";
import { pageMetadata } from "@/shared/lib/seo";
import { metricasAdmin, anomaliaXp } from "@/server/admin/consultas";
import { ForcarVirada } from "./_components/forcar-virada";

export const metadata = pageMetadata({
  title: "Admin",
  description: "Painel administrativo.",
  path: "/admin",
  noIndex: true,
});

export const dynamic = "force-dynamic";

const fmt = new Intl.NumberFormat("pt-BR");

export default async function AdminDashboard() {
  const [m, anomalias] = await Promise.all([metricasAdmin(), anomaliaXp()]);

  const cards = [
    { rotulo: "Usuários", valor: m.totalUsuarios },
    { rotulo: "Ativos hoje", valor: m.ativosHoje },
    { rotulo: "Banidos", valor: m.banidos },
    { rotulo: "Eventos de XP", valor: m.eventosXp },
    { rotulo: "Denúncias abertas", valor: m.denunciasAbertas },
  ];

  return (
    <div className="space-y-6">
      <section className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        {cards.map((c) => (
          <div
            key={c.rotulo}
            className="rounded-xl border border-card-border bg-card p-4"
          >
            <p className="text-[13px] font-medium text-muted">{c.rotulo}</p>
            <p className="mt-1 text-2xl font-bold text-foreground">
              {fmt.format(c.valor)}
            </p>
          </div>
        ))}
      </section>

      <section className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-card-border bg-card p-4">
        <div>
          <p className="text-sm font-medium text-foreground">Temporada</p>
          <p className="text-[13px] text-muted">
            {m.temporadaAtiva
              ? "Uma temporada está ativa."
              : "Nenhuma temporada ativa."}
          </p>
        </div>
        <ForcarVirada />
      </section>

      <section>
        <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground">
          <AlertTriangle className="size-4 text-cat-principio" />
          Anomalia de XP (última hora)
        </h2>
        {anomalias.length === 0 ? (
          <p className="rounded-xl border border-dashed border-card-border bg-card/50 p-6 text-center text-[13px] text-muted">
            Nada suspeito. O ledger idempotente já barra a maioria dos abusos.
          </p>
        ) : (
          <ul className="divide-y divide-card-border overflow-hidden rounded-xl border border-card-border bg-card">
            {anomalias.map((a) => (
              <li
                key={a.userId}
                className="flex items-center justify-between gap-3 px-4 py-3"
              >
                <span className="truncate text-sm text-foreground">
                  {a.handle ? `@${a.handle}` : a.email}
                </span>
                <span className="shrink-0 text-[13px] font-semibold text-cat-principio">
                  {a.eventosUltimaHora} eventos/h
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
