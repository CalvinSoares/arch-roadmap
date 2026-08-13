import Link from "next/link";
import { ShieldCheck } from "lucide-react";
import { requireAdmin } from "@/server/auth/dal";

/**
 * Portão do `/admin`: `requireAdmin` protege **todas** as rotas filhas de uma
 * vez (verificação perto do dado, não no middleware). Quem não for admin é
 * redirecionado antes de qualquer página filha renderizar.
 */
export default async function AdminLayout({
  children,
}: LayoutProps<"/admin">) {
  await requireAdmin();

  const link =
    "rounded-lg px-3 py-1.5 text-sm text-muted transition-colors hover:bg-foreground/5 hover:text-foreground";

  return (
    <div className="page-shell">
      <div className="mb-5 flex flex-wrap items-center gap-2 border-b border-card-border pb-4">
        <span className="mr-2 flex items-center gap-2 font-semibold text-foreground">
          <ShieldCheck className="size-5 text-primary" />
          Admin
        </span>
        <Link href="/admin" className={link}>
          Dashboard
        </Link>
        <Link href="/admin/usuarios" className={link}>
          Usuários
        </Link>
        <Link href="/admin/denuncias" className={link}>
          Denúncias
        </Link>
      </div>
      {children}
    </div>
  );
}
