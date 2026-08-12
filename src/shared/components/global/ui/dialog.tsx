"use client";

import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { cn } from "@/shared/utils/cn";

export const Dialog = DialogPrimitive.Root;
export const DialogTrigger = DialogPrimitive.Trigger;
export const DialogTitle = DialogPrimitive.Title;
export const DialogDescription = DialogPrimitive.Description;

const SIZES = {
  sm: "max-w-[400px]",
  md: "max-w-[600px]",
  lg: "max-w-[800px]",
  xl: "max-w-[1000px]",
  full: "max-w-[min(100%,72rem)]",
} as const;

export type DialogSize = keyof typeof SIZES;

export function DialogContent({
  className,
  children,
  size = "md",
  showClose = true,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Content> & {
  size?: DialogSize;
  showClose?: boolean;
}) {
  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm data-[state=open]:animate-in data-[state=open]:fade-in" />
      <DialogPrimitive.Content
        className={cn(
          // 100% (não 100vw) evita 1px de overflow horizontal com scrollbar
          "fixed left-1/2 top-1/2 z-50 w-[calc(100%-1.5rem)] -translate-x-1/2 -translate-y-1/2",
          "max-h-[min(90dvh,calc(100dvh-1.5rem-env(safe-area-inset-top)-env(safe-area-inset-bottom)))]",
          "overflow-y-auto overscroll-contain rounded-2xl border border-card-border bg-card shadow-xl outline-none",
          "pt-[max(0px,env(safe-area-inset-top))] pb-[max(0px,env(safe-area-inset-bottom))]",
          SIZES[size],
          className
        )}
        {...props}
      >
        {children}
        {showClose && (
          <DialogPrimitive.Close
            className={cn(
              "absolute right-2 z-20 flex size-10 items-center justify-center rounded-xl",
              "top-[max(0.5rem,env(safe-area-inset-top))]",
              "text-muted transition-colors hover:bg-muted/10 hover:text-foreground",
              "focus-visible:ring-2 focus-visible:ring-ring"
            )}
          >
            <X className="size-5" />
            <span className="sr-only">Fechar</span>
          </DialogPrimitive.Close>
        )}
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  );
}
