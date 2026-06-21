import { unstable_noStore as noStore } from "next/cache";

function parseEnvFlag(value: string | undefined, defaultValue: boolean): boolean {
  if (value === undefined || value.trim() === "") return defaultValue;
  const normalized = value.trim().toLowerCase();
  if (normalized === "false" || normalized === "0" || normalized === "no") return false;
  return normalized === "true" || normalized === "1" || normalized === "yes";
}

export function isPhotoGalleryEnabled(): boolean {
  noStore();
  const value =
    process.env.ENABLE_PHOTO_GALLERY ??
    process.env.NEXT_PUBLIC_ENABLE_PHOTO_GALLERY;
  return parseEnvFlag(value, true);
}
