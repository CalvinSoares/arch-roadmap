import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { ChevronRight } from "lucide-react";
import { cn } from "@/shared/utils/cn";

interface Crumb {
  label: string;
  href?: string;
}

interface PageTemplateProps {
  icon?: LucideIcon;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  breadcrumb?: Crumb[];
  actions?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

/**
 * Layout canônico de página: breadcrumb + ícone + título + subtítulo.
 * `page.tsx` deve apenas compor com este template (sem lógica).
 */
export function PageTemplate({
  icon: Icon,
  title,
  subtitle,
  breadcrumb,
  actions,
  children,
  className,
}: PageTemplateProps) {
  return (
    <div className={cn("page-shell", className)}>
      <header className="entra-subindo relative flex flex-col gap-3 pb-5 sm:flex-row sm:items-end sm:justify-between">
        {/* filete de encerramento do cabeçalho */}
        <span
          aria-hidden
          className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-primary/40 via-card-border to-transparent"
        />

        <div className="min-w-0">
          {breadcrumb && breadcrumb.length > 0 && (
            <nav
              aria-label="Trilha de navegação"
              className="mb-2.5 flex flex-wrap items-center gap-1 text-[13px] text-muted"
            >
              <Link href="/" className="transition-colors hover:text-primary">
                Início
              </Link>
              <ChevronRight className="size-3.5 opacity-50" />
              {breadcrumb.map((c, i) => (
                <span key={`${c.label}-${i}`} className="flex items-center gap-1">
                  {c.href ? (
                    <Link href={c.href} className="transition-colors hover:text-primary">
                      {c.label}
                    </Link>
                  ) : (
                    <span className="font-medium text-foreground">{c.label}</span>
                  )}
                  {i < breadcrumb.length - 1 && (
                    <ChevronRight className="size-3.5 opacity-50" />
                  )}
                </span>
              ))}
            </nav>
          )}

          <div className="flex items-center gap-3">
            {Icon && (
              <span className="grid size-11 shrink-0 place-items-center rounded-xl border border-card-border bg-gradient-to-br from-primary/12 to-accent/10 text-section-icon shadow-[var(--shadow-sm)]">
                <Icon size={22} strokeWidth={1.6} />
              </span>
            )}
            {typeof title === "string" ? (
              <h1 className="page-header-title truncate">{title}</h1>
            ) : (
              title
            )}
          </div>

          {subtitle &&
            (typeof subtitle === "string" ? (
              <p className="page-header-subtitle mt-2">{subtitle}</p>
            ) : (
              subtitle
            ))}
        </div>

        {actions && (
          <div className="shrink-0 self-start sm:self-auto">{actions}</div>
        )}
      </header>
      {children}
    </div>
  );
}
