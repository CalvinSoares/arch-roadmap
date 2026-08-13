import { pageMetadata } from "@/shared/lib/seo";
import { listarUsuarios } from "@/server/admin/consultas";
import { AcoesUsuario } from "../_components/acoes-usuario";

export const metadata = pageMetadata({
  title: "Admin — Usuários",
  description: "Gerenciar usuários.",
  path: "/admin/usuarios",
  noIndex: true,
});

export const dynamic = "force-dynamic";

const fmt = new Intl.NumberFormat("pt-BR");

export default async function AdminUsuariosPage() {
  const usuarios = await listarUsuarios();

  return (
    <div className="space-y-4">
      <p className="text-[13px] text-muted">
        {usuarios.length} usuários (mais recentes primeiro).
      </p>
      <div className="overflow-x-auto rounded-xl border border-card-border bg-card">
        <table className="w-full min-w-[720px] text-sm">
          <thead>
            <tr className="border-b border-card-border text-left text-[13px] text-muted">
              <th className="px-4 py-3 font-medium">Usuário</th>
              <th className="px-4 py-3 font-medium">XP</th>
              <th className="px-4 py-3 font-medium">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-card-border">
            {usuarios.map((u) => (
              <tr key={u.id}>
                <td className="px-4 py-3">
                  <p className="font-medium text-foreground">
                    {u.handle ? `@${u.handle}` : (u.nome ?? "—")}
                  </p>
                  <p className="text-[12px] text-muted">{u.email}</p>
                </td>
                <td className="px-4 py-3 tabular-nums text-muted">
                  {fmt.format(u.xpTotal)}
                </td>
                <td className="px-4 py-3">
                  <AcoesUsuario usuario={u} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
