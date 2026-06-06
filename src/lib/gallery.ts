import galleryData from "@/data/gallery.json";

export type GalleryItemSize = "large" | "medium" | "small";

export interface GalleryItem {
  id: string;
  src: string;
  alt: string;
  caption: string;
  category: string;
  size: GalleryItemSize;
}

export interface GalleryData {
  headline: string;
  subheadline: string;
  items: GalleryItem[];
}

export function getGalleryData(): GalleryData | null {
  const data = galleryData as GalleryData;
  if (!data.items?.length) return null;
  return data;
}
