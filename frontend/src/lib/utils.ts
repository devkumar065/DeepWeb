import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatFileSize(bytes: number | null | undefined): string {
  if (!bytes) return "N/A";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1048576).toFixed(1)} MB`;
}

export function formatDomain(url: string): string {
  try {
    return new URL(url).hostname.replace("www.", "");
  } catch {
    return url;
  }
}

export function isValidUrl(url: string): boolean {
  try {
    const u = new URL(url);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

export function normalizeUrl(url: string): string {
  let u = url.trim();
  if (!u.startsWith("http://") && !u.startsWith("https://")) {
    u = "https://" + u;
  }
  return u;
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function truncate(str: string, max = 60): string {
  if (!str) return "";
  return str.length > max ? str.slice(0, max) + "…" : str;
}

export function toTitleCase(str: string): string {
  return str
    .replace(/_/g, " ")
    .replace(/\b\w/g, (l) => l.toUpperCase());
}

export function getPageTypeColor(type: string): string {
  // All monochrome — different shades of gray
  const map: Record<string, string> = {
    homepage: "text-white bg-neutral-700",
    about: "text-neutral-200 bg-neutral-800",
    services: "text-neutral-300 bg-neutral-800",
    pricing: "text-neutral-300 bg-neutral-800",
    blog: "text-neutral-400 bg-neutral-900",
    portfolio: "text-neutral-400 bg-neutral-900",
    contact: "text-neutral-300 bg-neutral-800",
    terms: "text-neutral-500 bg-neutral-900",
    privacy: "text-neutral-500 bg-neutral-900",
    careers: "text-neutral-400 bg-neutral-900",
    case_studies: "text-neutral-400 bg-neutral-900",
    custom: "text-neutral-500 bg-neutral-900",
  };
  return map[type] || map.custom;
}
