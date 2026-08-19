import { notFound } from "next/navigation";
import { Trophy, Flame, Medal } from "lucide-react";
import { PageTemplate } from "@/shared/components/templates/page-template";
import { pageMetadata } from "@/shared/lib/seo";
import { normalizarHandle } from "@/shared/lib/handle";
import { perfilPublicoPorHandle } from "@/server/gamificacao/consultas";

/** Perfil de outra conta: depende de dado, nunca estático. */
export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: PageProps<"/u/[handle]">) {
  const { handle } = await params;
  const h = normalizarHandle(handle);
  const perfil = await perfilPublicoPorHandle(h);
  if (!perfil) {
    return pageMetadata({
      title: "Perfil não encontrado",
      description: "Este perfil não existe ou é privado.",
      path: `/u/${h}`,
      noIndex: true,
    });
  }
  return pageMetadata({
    title: `@${perfil.handle}`,
    description: `Perfil público de @${perfil.handle}: nível ${perfil.nivel}, ${perfil.xpTotal} XP.`,
    path: `/u/${perfil.handle}`,
  });
}

const fmt = new Intl.NumberFormat("pt-BR");

export default async function PerfilPublicoPage({
  params,
}: PageProps<"/u/[handle]">) {
  const { handle } = await params;
  const perfil = await perfilPublicoPorHandle(normalizarHandle(handle));
  if (!perfil) notFound();

  return (
    <PageTemplate
      icon={Trophy}
      title={`@${perfil.handle}`}
      subtitle={perfil.nome ?? undefined}
      breadcrumb={[{ label: `@${perfil.handle}` }]}
    >
      <div className="space-y-6">
        <section className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <Cartao rotulo="Nível" valor={String(perfil.nivel)} />
          <Cartao rotulo="XP total" valor={fmt.format(perfil.xpTotal)} />
          <Cartao
            rotulo="Streak"
            valor={`${perfil.streakDias}`}
            icone={<Flame className="size-4 text-cat-principio" />}
          />
          <Cartao rotulo="Maior streak" valor={`${perfil.maiorStreak}`} />
        </section>

        <section>
          <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground">
            <Medal className="size-4 text-primary" />
            Conquistas
          </h2>
          {perfil.conquistas.length === 0 ? (
            <p className="rounded-xl border border-dashed border-card-border bg-card/50 p-6 text-center text-[13px] text-muted">
              Nenhuma conquista ainda.
            </p>
          ) : (
            <ul className="grid gap-3 sm:grid-cols-2">
              {perfil.conquistas.map((c) => (
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
          )}
        </section>
      </div>
    </PageTemplate>
  );
}

function Cartao({
  rotulo,
  valor,
  icone,
}: {
  rotulo: string;
  valor: string;
  icone?: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-card-border bg-card p-4">
      <div className="flex items-center gap-2 text-[13px] font-medium text-muted">
        {icone}
        {rotulo}
      </div>
      <p className="mt-1 text-lg font-semibold text-foreground">{valor}</p>
    </div>
  );
}
