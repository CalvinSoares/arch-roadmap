import { cn } from "@/shared/utils/cn";

/**
 * Fundo decorativo do hero: três manchas de cor desfocadas e estáticas
 * (`.aurora` em globals.css). Puramente ornamental.
 */
export function Aurora({ className }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={cn("pointer-events-none absolute inset-0 overflow-hidden", className)}
    >
      <span
        className="aurora left-[8%] top-[-18%] size-[26rem]"
        style={{ background: "var(--glow-a)" }}
      />
      <span
        className="aurora right-[4%] top-[6%] size-[22rem]"
        style={{ background: "var(--glow-b)" }}
      />
      <span
        className="aurora left-[38%] top-[42%] size-[18rem]"
        style={{ background: "var(--glow-c)" }}
      />
    </div>
  );
}
