import { pageMetadata } from "@/shared/lib/seo";
import { FormRegistro } from "./_components/form-registro";

export const metadata = pageMetadata({
  title: "Criar conta",
  description:
    "Crie sua conta para guardar seu progresso, ganhar XP e manter seu streak.",
  path: "/registrar",
  noIndex: true,
});

export default function RegistrarPage() {
  return (
    <section className="rounded-2xl border border-card-border bg-card/80 p-6 shadow-[var(--shadow-md)] backdrop-blur-xl sm:p-8">
      <div className="mb-6 text-center">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Criar sua conta
        </h1>
        <p className="mt-1.5 text-sm text-muted">
          Guarde o progresso, o XP e o streak entre dispositivos. Leva 10 segundos.
        </p>
      </div>

      <FormRegistro />
    </section>
  );
}
