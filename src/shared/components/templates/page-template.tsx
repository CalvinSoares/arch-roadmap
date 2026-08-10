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
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          {breadcrumb && breadcrumb.length > 0 && (
            <nav
              aria-label="Trilha de navegação"
              className="mb-2 flex flex-wrap items-center gap-1 text-[13px] text-muted"
            >
              {breadcrumb.map((c, i) => (
                <span key={`${c.label}-${i}`} className="flex items-center gap-1">
                  {c.href ? (
                    <Link href={c.href} className="hover:text-foreground">
                      {c.label}
                    </Link>
                  ) : (
                    <span>{c.label}</span>
                  )}
                  {i < breadcrumb.length - 1 && (
                    <ChevronRight className="size-3.5 opacity-60" />
                  )}
                </span>
              ))}
            </nav>
          )}
          <div className="flex items-center gap-2.5">
            {Icon && (
              <Icon
                size={26}
                strokeWidth={1.5}
                className="shrink-0 text-section-icon"
              />
            )}
            {typeof title === "string" ? (
              <h1 className="page-header-title truncate">{title}</h1>
            ) : (
              title
            )}
          </div>
          {subtitle &&
            (typeof subtitle === "string" ? (
              <p className="page-header-subtitle mt-1">{subtitle}</p>
            ) : (
              subtitle
            ))}
        </div>
        {actions && <div className="shrink-0">{actions}</div>}
      </header>
      {children}
    </div>
  );
}
