import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function currentPeriod(date: Date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

export function currentQuarter(date: Date = new Date()): string {
  const y = date.getFullYear();
  const q = Math.floor(date.getMonth() / 3) + 1;
  return `${y}-Q${q}`;
}

export function currentYear(date: Date = new Date()): string {
  return String(date.getFullYear());
}

export function currentHalf(date: Date = new Date()): string {
  const y = date.getFullYear();
  const h = date.getMonth() < 6 ? "H1" : "H2";
  return `${y}-${h}`;
}

export function periodLabel(period: string): string {
  if (period.includes("Q")) return period;
  const [y, m] = period.split("-");
  return new Date(Number(y), Number(m) - 1, 1).toLocaleString("en-PH", { month: "short", year: "numeric" });
}
