import { pageMetadata } from "@/shared/lib/seo";
import { denunciasAbertas } from "@/server/admin/consultas";
import { AcoesDenuncia } from "../_components/acoes-denuncia";

export const metadata = pageMetadata({
  title: "Admin — Denúncias",
  description: "Fila de moderação.",
  path: "/admin/denuncias",
  noIndex: true,
});

export const dynamic = "force-dynamic";

export default async function AdminDenunciasPage() {
  const denuncias = await denunciasAbertas();

  if (denuncias.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-card-border bg-card/50 p-6 text-center text-[13px] text-muted">
        Nenhuma denúncia aberta. 🎉
      </p>
    );
  }

  return (
    <ul className="space-y-3">
      {denuncias.map((d) => (
        <li
          key={d.id}
          className="flex flex-col gap-3 rounded-xl border border-card-border bg-card p-4 sm:flex-row sm:items-center sm:justify-between"
        >
          <div className="min-w-0">
            <p className="text-sm text-foreground">
              <span className="font-medium">
                {d.alvoHandle ? `@${d.alvoHandle}` : d.alvoId}
              </span>{" "}
              <span className="text-muted">
                denunciado por{" "}
                {d.autorHandle ? `@${d.autorHandle}` : d.autorId}
              </span>
            </p>
            <p className="mt-1 text-[13px] text-muted">{d.motivo}</p>
          </div>
          <AcoesDenuncia id={d.id} />
        </li>
      ))}
    </ul>
  );
}
