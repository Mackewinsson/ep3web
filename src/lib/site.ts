/** Canonical public origin. Keep in sync with the www host Google should index. */
export const SITE_NAME = "Transportes EP3";

export const DEFAULT_SITE_URL = "https://www.transportesep3.cl";

export function getSiteUrl(): string {
  const raw = process.env.NEXT_PUBLIC_SITE_URL ?? DEFAULT_SITE_URL;
  return raw.replace(/\/$/, "");
}

export function absoluteUrl(path = "/"): string {
  const base = getSiteUrl();
  if (!path || path === "/") return base;
  return `${base}${path.startsWith("/") ? path : `/${path}`}`;
}
