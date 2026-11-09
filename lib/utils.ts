import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPlaytime(minutes: number): string {
  if (!minutes || minutes <= 0) return "0h";
  const hours = Math.round(minutes / 60);
  if (hours < 1) return `${minutes}m`;
  return `${hours}h`;
}

export function formatPrice(cents: number, currency = "USD"): string {
  if (cents === 0) return "Free";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
  }).format(cents / 100);
}
