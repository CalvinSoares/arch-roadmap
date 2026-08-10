import * as React from "react";
import { cn } from "@/shared/utils/cn";

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Aplica hover de card clicável (levanta + borda de acento). */
  interativo?: boolean;
}

export function Card({ className, interativo, ...props }: CardProps) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-card-border bg-card shadow-[var(--shadow-sm)]",
        "transition-[transform,box-shadow,border-color,background-color] duration-300 ease-out",
        interativo &&
          "hover:-translate-y-1 hover:border-primary/45 hover:shadow-[var(--shadow-lg)]",
        className
      )}
      {...props}
    />
  );
}

export function CardHeader({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("p-5 pb-3", className)} {...props} />;
}

export function CardBody({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("p-5 pt-0", className)} {...props} />;
}
