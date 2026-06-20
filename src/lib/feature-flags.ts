function parseEnvFlag(value: string | undefined, defaultValue: boolean): boolean {
  if (value === undefined || value.trim() === "") return defaultValue;
  const normalized = value.trim().toLowerCase();
  return normalized === "true" || normalized === "1" || normalized === "yes";
}

export function isPhotoGalleryEnabled(): boolean {
  return parseEnvFlag(process.env.NEXT_PUBLIC_ENABLE_PHOTO_GALLERY, true);
}
