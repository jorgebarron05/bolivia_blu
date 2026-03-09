import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function fmt(n: number, decimals = 2) {
  return n.toLocaleString("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

export function fmtBOB(n: number) {
  return `Bs ${fmt(n)}`;
}

export function pct(a: number, b: number) {
  if (!b) return 0;
  return ((a - b) / b) * 100;
}
