import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/shared/utils/cn";

const buttonVariants = cva(
  [
    "group/btn relative inline-flex items-center justify-center gap-2 rounded-xl text-sm font-medium",
    "outline-none transition-all duration-300 ease-out",
    "focus-visible:ring-2 focus-visible:ring-ring",
    "active:scale-[0.97] disabled:pointer-events-none disabled:opacity-50",
    "[&_svg]:size-4 [&_svg]:shrink-0 [&_svg]:transition-transform [&_svg]:duration-300",
  ],
  {
    variants: {
      variant: {
        primary:
          "brilho-varredura bg-gradient-to-br from-primary to-[color-mix(in_srgb,var(--primary)_78%,var(--glow-c))] text-primary-foreground shadow-[var(--shadow-md)] hover:-translate-y-0.5 hover:shadow-[var(--shadow-lg)]",
        accent:
          "brilho-varredura bg-accent text-accent-foreground shadow-[var(--shadow-md)] hover:-translate-y-0.5 hover:shadow-[var(--shadow-lg)]",
        outline:
          "border border-card-border bg-card/70 text-foreground hover:-translate-y-0.5 hover:border-primary/45 hover:bg-card hover:shadow-[var(--shadow-md)]",
        ghost: "text-muted hover:bg-foreground/5 hover:text-foreground",
        subtle:
          "bg-foreground/[0.06] text-foreground hover:bg-foreground/10 hover:-translate-y-0.5",
      },
      size: {
        sm: "h-10 min-h-10 rounded-lg px-3.5",
        md: "h-11 min-h-11 px-4",
        lg: "h-12 min-h-12 px-5 text-[15px]",
        icon: "size-11 min-h-11 rounded-lg",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        ref={ref}
        className={cn(buttonVariants({ variant, size }), className)}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { buttonVariants };
