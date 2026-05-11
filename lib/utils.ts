import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatNumber(n: number, decimals = 1): string {
  if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(decimals)}B`;
  if (n >= 1_000_000)     return `${(n / 1_000_000).toFixed(decimals)}M`;
  if (n >= 1_000)         return `${(n / 1_000).toFixed(decimals)}k`;
  return n.toFixed(decimals);
}

export function formatDelta(n: number): string {
  return n >= 0 ? `+${n.toFixed(1)}%` : `${n.toFixed(1)}%`;
}

export function riskColor(tier: string) {
  switch (tier) {
    case "CRITICAL": return "text-rose-DEFAULT";
    case "ELEVATED": return "text-gold-DEFAULT";
    default:         return "text-green-600";
  }
}

export function severityColor(s: string) {
  switch (s) {
    case "CRITICAL": return "#c4817a";
    case "HIGH":     return "#d4a574";
    case "MEDIUM":   return "#c8a96e";
    default:         return "#8a7a72";
  }
}

export function timeAgo(date: Date | string): string {
  const d   = new Date(date);
  const now = new Date();
  const sec = Math.floor((now.getTime() - d.getTime()) / 1000);
  if (sec < 60)   return `${sec}s ago`;
  if (sec < 3600) return `${Math.floor(sec / 60)}m ago`;
  if (sec < 86400)return `${Math.floor(sec / 3600)}h ago`;
  return `${Math.floor(sec / 86400)}d ago`;
}
