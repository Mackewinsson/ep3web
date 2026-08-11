import {
  formatM3,
  suggestBoxes,
  sumInventory,
  type PricingConfig,
  type VolumeItem,
} from "@/lib/quote-pricing";
import type { MovingCatalogDto } from "@/lib/moving-catalog-db";

export const SUGGESTED_PACKING_BOX_ITEM_ID = "caja-60-40-40";

export type CatalogItem = {
  id: string;
  name: string;
  volumeM3: number;
};

export type CatalogCategory = {
  id: string;
  name: string;
  items: CatalogItem[];
};

export type MovingCatalog = {
  categories: CatalogCategory[];
  packingBox: CatalogItem;
};

export function catalogDtoToMovingCatalog(
  dto: MovingCatalogDto,
): MovingCatalog {
  return {
    packingBox: dto.packingBox,
    categories: dto.categories.map((c) => ({
      id: c.id,
      name: c.name,
      items: c.items.map((i) => ({
        id: i.id,
        name: i.name,
        volumeM3: i.volumeM3,
      })),
    })),
  };
}

export function flattenCatalogItems(catalog: MovingCatalog): VolumeItem[] {
  return catalog.categories.flatMap((c) => c.items);
}

export function sumQuantities(
  quantities: Record<string, number>,
  catalog: MovingCatalog,
): { totalItems: number; totalM3: number } {
  const { totalItems, furnitureM3 } = sumInventory(
    quantities,
    flattenCatalogItems(catalog),
  );
  return { totalItems, totalM3: furnitureM3 };
}

export function suggestBoxesForCatalog(
  furnitureM3: number,
  pricing: PricingConfig,
): number {
  return suggestBoxes(furnitureM3, pricing);
}

export { formatM3, suggestBoxes };
