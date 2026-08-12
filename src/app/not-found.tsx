import Link from "next/link";
import type { Metadata } from "next";
import { Compass } from "lucide-react";
import { Button } from "@/shared/components/global/ui/button";

export const metadata: Metadata = {
  title: "Página não encontrada",
  description: "Este caminho não existe no DevMappa.",
  robots: { index: false, follow: true },
};

export default function NotFound() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-4 bg-canvas px-6 text-center">
      <Compass className="size-10 text-primary" />
      <h1 className="text-3xl font-semibold">Página não encontrada</h1>
      <p className="max-w-sm text-muted">
        O caminho que você seguiu não existe no mapa. Volte ao início ou explore
        os conceitos.
      </p>
      <div className="flex gap-3">
        <Button asChild>
          <Link href="/">Voltar ao início</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/conceitos">Ver conceitos</Link>
        </Button>
      </div>
    </div>
  );
}
