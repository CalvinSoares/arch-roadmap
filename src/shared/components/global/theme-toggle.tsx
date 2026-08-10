"use client";

import { useRef, useSyncExternalStore } from "react";
import { flushSync } from "react-dom";
import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";
import { Button } from "@/shared/components/global/ui/button";
import { cn } from "@/shared/utils/cn";

/**
 * Alterna tema com reveal circular fluido (View Transitions API), partindo
 * do próprio botão e cobrindo a tela toda. Faz fallback para troca direta
 * quando a API não existe ou o usuário prefere menos movimento.
 */
/** `false` no servidor, `true` no cliente — evita mismatch de hidratação. */
const semInscricao = () => () => {};
function useMontado() {
  return useSyncExternalStore(
    semInscricao,
    () => true,
    () => false
  );
}

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const montado = useMontado();
  const btnRef = useRef<HTMLButtonElement>(null);
  const emTransicao = useRef(false);

  const isDark = montado && resolvedTheme === "dark";

  const alternar = async () => {
    if (emTransicao.current) return; // evita sobrepor transições
    const proximo = isDark ? "light" : "dark";
    const btn = btnRef.current;
    const startVT = document.startViewTransition?.bind(document);
    const reduzirMovimento = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    if (!btn || !startVT || reduzirMovimento) {
      setTheme(proximo);
      return;
    }

    const { left, top, width, height } = btn.getBoundingClientRect();
    const x = left + width / 2;
    const y = top + height / 2;
    const raioFinal = Math.hypot(
      Math.max(x, window.innerWidth - x),
      Math.max(y, window.innerHeight - y)
    );

    emTransicao.current = true;
    const transition = startVT(() => {
      flushSync(() => setTheme(proximo));
    });

    try {
      await transition.ready;
      document.documentElement.animate(
        {
          clipPath: [
            `circle(0px at ${x}px ${y}px)`,
            `circle(${raioFinal}px at ${x}px ${y}px)`,
          ],
        },
        {
          duration: 480,
          easing: "ease-in-out",
          pseudoElement: "::view-transition-new(root)",
        }
      );
      await transition.finished;
    } catch {
      /* transição abortada — ignora */
    } finally {
      emTransicao.current = false;
    }
  };

  return (
    <Button
      ref={btnRef}
      variant="ghost"
      size="icon"
      aria-label={isDark ? "Ativar tema claro" : "Ativar tema escuro"}
      onClick={alternar}
      className="overflow-hidden hover:text-primary"
    >
      {/* Sol e lua coexistem e giram na troca — evita "pulo" de layout. */}
      <span className="relative grid size-[18px] place-items-center">
        <Sun
          className={cn(
            "absolute transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]",
            isDark
              ? "rotate-0 scale-100 opacity-100"
              : "-rotate-90 scale-50 opacity-0"
          )}
        />
        <Moon
          className={cn(
            "absolute transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]",
            isDark
              ? "rotate-90 scale-50 opacity-0"
              : "rotate-0 scale-100 opacity-100"
          )}
        />
      </span>
    </Button>
  );
}
