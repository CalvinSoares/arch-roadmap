import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/** Merge de classes Tailwind com resolução de conflito. */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
