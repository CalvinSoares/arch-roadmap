import { Trophy, Flame, Snowflake, Target, Sparkles, Medal } from "lucide-react";
import { PageTemplate } from "@/shared/components/templates/page-template";
import { pageMetadata } from "@/shared/lib/seo";
import { requireUser } from "@/server/auth/dal";
import { resumoDoUsuario } from "@/server/gamificacao/consultas";
import { acharMissao } from "@/shared/lib/gamificacao/missoes";
import { ConfigPerfil } from "./_components/config-perfil";

export const metadata = pageMetadata({
  title: "Seu perfil",
  description: "Seu XP, nível, streak e missões do dia.",
  path: "/perfil",
  // Perfil é privado; não deve ser indexado.
  noIndex: true,
});

/** A página lê a projeção a cada requisição (dado de conta, nunca estático). */
export const dynamic = "force-dynamic";

/** Rótulo humano para um evento do ledger. */
function rotuloEvento(tipo: string): string {
  if (tipo.startsWith("missao:")) {
    const m = acharMissao(tipo.slice("missao:".length));
    return m ? `Missão: ${m.titulo}` : "Missão concluída";
  }
  const mapa: Record<string, string> = {
    quizAcerto: "Acerto no quiz",
    noConcluido: "Nó concluído",
    desafioResolvido: "Desafio resolvido",
    bonusPrimeiraDoDia: "Bônus do dia",
    bau: "Baú de recompensas",
  };
  return mapa[tipo] ?? tipo;
}

const fmt = new Intl.NumberFormat("pt-BR");

export default async function PerfilPage() {
  const u = await requireUser();
  const resumo = await resumoDoUsuario(u.id);
  const { progresso: prog } = resumo;

  return (
    <PageTemplate
      icon={Trophy}
      title="Seu perfil"
      subtitle="Progresso da sua conta: XP, nível, streak e as missões de hoje."
      breadcrumb={[{ label: "Perfil" }]}
    >
      <div className="space-y-6">
        {/* Hero: medalhão de nível + barra de XP + streak */}
        <section className="overflow-hidden rounded-2xl border border-card-border bg-gradient-to-br from-card to-primary/5 p-5 sm:p-6">
          <div className="flex items-center gap-4 sm:gap-5">
            <div className="grid size-16 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-primary to-[var(--glow-c)] text-primary-foreground shadow-[var(--shadow-md)] sm:size-20">
              <span className="text-[10px] font-semibold uppercase tracking-wide opacity-80">
                Nível
              </span>
              <span className="-mt-0.5 text-3xl font-black leading-none sm:text-4xl">
                {resumo.nivel}
              </span>
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm font-semibold text-foreground">
                  {fmt.format(resumo.xpTotal)} XP
                </span>
                {resumo.streakDias > 0 && (
                  <span className="flex items-center gap-1 text-sm font-semibold text-cat-principio">
                    <Flame className="size-4" />
                    {resumo.streakDias} {resumo.streakDias === 1 ? "dia" : "dias"}
                  </span>
                )}
              </div>

              <div
                className="mt-2.5 h-2.5 w-full overflow-hidden rounded-full bg-foreground/10"
                role="progressbar"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={Math.round(prog.pct * 100)}
              >
                <div
                  className="h-full rounded-full bg-gradient-to-r from-primary to-[var(--glow-c)] transition-[width] duration-500"
                  style={{ width: `${Math.round(prog.pct * 100)}%` }}
                />
              </div>
              <p className="mt-1.5 text-[13px] text-muted">
                {prog.xpDoNivel > 0 ? (
                  <>
                    faltam {fmt.format(prog.falta)} XP para o nível{" "}
                    {resumo.nivel + 1}
                  </>
                ) : (
                  <>Nível máximo da curva atual</>
                )}
              </p>
            </div>
          </div>
        </section>

        {/* Métricas rápidas */}
        <section className="grid grid-cols-3 gap-4">
          <Metrica
            icone={<Flame className="size-5 text-cat-principio" />}
            rotulo="Streak"
            valor={`${resumo.streakDias}`}
          />
          <Metrica
            icone={<Sparkles className="size-5 text-primary" />}
            rotulo="Maior streak"
            valor={`${resumo.maiorStreak}`}
          />
          <Metrica
            icone={<Snowflake className="size-5 text-accent" />}
            rotulo="Freezes"
            valor={String(resumo.freezes)}
          />
        </section>

        {/* Missões do dia */}
        <section>
          <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground">
            <Target className="size-4 text-primary" />
            Missões de hoje
          </h2>
          <div className="space-y-3">
            {resumo.missoes.map((m) => {
              const pct = Math.min(100, Math.round((m.progresso / m.meta) * 100));
              return (
                <div
                  key={m.id}
                  className="rounded-xl border border-card-border bg-card p-4"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-foreground">
                        {m.titulo}
                        {m.concluida && (
                          <span className="ml-2 rounded-full bg-primary/15 px-2 py-0.5 text-[11px] font-semibold text-primary">
                            concluída
                          </span>
                        )}
                      </p>
                      <p className="truncate text-[13px] text-muted">
                        {m.descricao}
                      </p>
                    </div>
                    <span className="shrink-0 text-[13px] font-semibold text-muted">
                      +{m.xpRecompensa} XP
                    </span>
                  </div>
                  <div className="mt-3 flex items-center gap-3">
                    <div className="h-2 flex-1 overflow-hidden rounded-full bg-foreground/10">
                      <div
                        className="h-full rounded-full bg-primary transition-[width] duration-500"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="shrink-0 text-[12px] tabular-nums text-muted">
                      {Math.min(m.progresso, m.meta)}/{m.meta}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Conquistas */}
        {resumo.conquistas.length > 0 && (
          <section>
            <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground">
              <Medal className="size-4 text-primary" />
              Conquistas
            </h2>
            <ul className="grid gap-3 sm:grid-cols-2">
              {resumo.conquistas.map((c) => (
                <li
                  key={c.chave}
                  className="flex items-center gap-3 rounded-xl border border-card-border bg-card p-4"
                >
                  <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-primary/15 text-primary">
                    <Medal className="size-5" />
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-foreground">
                      {c.titulo}
                    </p>
                    <p className="truncate text-[13px] text-muted">
                      {c.descricao}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Histórico do ledger */}
        <section>
          <h2 className="mb-3 text-sm font-semibold text-foreground">
            Atividade recente
          </h2>
          {resumo.historico.length === 0 ? (
            <p className="rounded-xl border border-dashed border-card-border bg-card/50 p-6 text-center text-[13px] text-muted">
              Nada por aqui ainda. Responda um quiz ou conclua um nó de roadmap
              para começar a ganhar XP.
            </p>
          ) : (
            <ul className="divide-y divide-card-border overflow-hidden rounded-xl border border-card-border bg-card">
              {resumo.historico.map((e, i) => (
                <li
                  key={`${e.origemRef}-${i}`}
                  className="flex items-center justify-between gap-3 px-4 py-3"
                >
                  <span className="truncate text-sm text-foreground">
                    {rotuloEvento(e.tipo)}
                  </span>
                  <span className="shrink-0 text-[13px] font-semibold text-primary">
                    +{e.quantia} XP
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <ConfigPerfil
          handleInicial={resumo.handle}
          publicoInicial={resumo.perfilPublico}
          lembretesInicial={resumo.lembretesEmail}
        />
      </div>
    </PageTemplate>
  );
}

function Metrica({
  icone,
  rotulo,
  valor,
}: {
  icone: React.ReactNode;
  rotulo: string;
  valor: string;
}) {
  return (
    <div className="rounded-xl border border-card-border bg-card p-4">
      <div className="flex items-center gap-2">
        {icone}
        <p className="text-[13px] font-medium text-muted">{rotulo}</p>
      </div>
      <p className="mt-1 text-lg font-semibold text-foreground">{valor}</p>
    </div>
  );
}
