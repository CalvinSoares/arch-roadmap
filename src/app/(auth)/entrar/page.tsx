import { pageMetadata } from "@/shared/lib/seo";
import { FormEntrar } from "./_components/form-entrar";

export const metadata = pageMetadata({
  title: "Entrar",
  description: "Entre na sua conta para guardar progresso, XP e streak.",
  path: "/entrar",
  noIndex: true,
});

export default async function EntrarPage({
  searchParams,
}: PageProps<"/entrar">) {
  const sp = await searchParams;
  const callbackUrl =
    typeof sp.callbackUrl === "string" && sp.callbackUrl.startsWith("/")
      ? sp.callbackUrl
      : "/";
  const jaRegistrado = sp.registrado === "1";

  // Só oferece o que está provisionado — sem botão que quebra.
  const githubAtivo = Boolean(process.env.AUTH_GITHUB_ID);
  const magicLinkAtivo = Boolean(process.env.RESEND_API_KEY);

  return (
    <section className="rounded-2xl border border-card-border bg-card/80 p-6 shadow-[var(--shadow-md)] backdrop-blur-xl sm:p-8">
      <div className="mb-6 text-center">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Bem-vindo de volta
        </h1>
        <p className="mt-1.5 text-sm text-muted">
          Entre para guardar seu progresso, XP e streak entre dispositivos.
        </p>
      </div>

      <FormEntrar
        callbackUrl={callbackUrl}
        githubAtivo={githubAtivo}
        magicLinkAtivo={magicLinkAtivo}
        jaRegistrado={jaRegistrado}
      />
    </section>
  );
}
