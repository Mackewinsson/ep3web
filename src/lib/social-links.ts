export interface SocialLink {
  platform: "instagram" | "tiktok";
  label: string;
  href: string;
  description: string;
}

function normalizeUrl(value: string | undefined): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

export function getSocialLinks(): SocialLink[] {
  const links: SocialLink[] = [];

  const instagram = normalizeUrl(process.env.NEXT_PUBLIC_INSTAGRAM_URL);
  if (instagram) {
    links.push({
      platform: "instagram",
      label: "Instagram",
      href: instagram,
      description: "Fotos y videos de nuestras operaciones en tiempo real.",
    });
  }

  const tiktok = normalizeUrl(process.env.NEXT_PUBLIC_TIKTOK_URL);
  if (tiktok) {
    links.push({
      platform: "tiktok",
      label: "TikTok",
      href: tiktok,
      description: "Contenido detrás de cámara de mudanzas, fletes y entregas.",
    });
  }

  return links;
}
