import { asc, eq } from "drizzle-orm";
import { db } from "@/db";
import {
  movingCatalogItems,
  movingCategories,
  quotePricingSettings,
} from "@/db/schema";
import {
  DEFAULT_PRICING_CONFIG,
  type PricingConfig,
} from "@/lib/quote-pricing";
import staticCatalog from "@/data/moving-items.json";

export type CatalogCategoryDto = {
  id: string;
  slug: string;
  name: string;
  items: {
    id: string;
    slug: string;
    name: string;
    volumeM3: number;
  }[];
};

export type MovingCatalogDto = {
  categories: CatalogCategoryDto[];
  packingBox: { id: string; name: string; volumeM3: number };
};

export async function getPricingConfig(): Promise<PricingConfig> {
  const [row] = await db.select().from(quotePricingSettings).limit(1);
  if (!row) return DEFAULT_PRICING_CONFIG;
  return {
    boxesPerM3: Number(row.boxesPerM3),
    minBoxes: row.minBoxes,
    boxVolumeM3: Number(row.boxVolumeM3),
    pricePerM3: Number(row.pricePerM3),
    noElevatorPerFloor: Number(row.noElevatorPerFloor),
    currency: "CLP",
  };
}

export async function getMovingCatalogFromDb(): Promise<MovingCatalogDto | null> {
  const categories = await db
    .select()
    .from(movingCategories)
    .where(eq(movingCategories.active, true))
    .orderBy(asc(movingCategories.sortOrder), asc(movingCategories.name));

  if (!categories.length) return null;

  const items = await db
    .select()
    .from(movingCatalogItems)
    .where(eq(movingCatalogItems.active, true))
    .orderBy(asc(movingCatalogItems.sortOrder), asc(movingCatalogItems.name));

  const pricing = await getPricingConfig();

  return {
    packingBox: {
      id: "caja-de-mudanza",
      name: "Caja de mudanza",
      volumeM3: pricing.boxVolumeM3,
    },
    categories: categories.map((c) => ({
      id: c.id,
      slug: c.slug,
      name: c.name,
      items: items
        .filter((i) => i.categoryId === c.id)
        .map((i) => ({
          id: i.slug,
          slug: i.slug,
          name: i.name,
          volumeM3: Number(i.volumeM3),
        })),
    })),
  };
}

/** DB catalog if seeded, otherwise static JSON fallback. */
export async function getMovingCatalogForWizard(): Promise<{
  catalog: MovingCatalogDto;
  pricing: PricingConfig;
}> {
  const pricing = await getPricingConfig();
  const fromDb = await getMovingCatalogFromDb();
  if (fromDb) {
    return {
      catalog: {
        ...fromDb,
        packingBox: {
          ...fromDb.packingBox,
          volumeM3: pricing.boxVolumeM3,
        },
      },
      pricing,
    };
  }

  const fallback = staticCatalog as {
    categories: {
      id: string;
      name: string;
      items: { id: string; name: string; volumeM3: number }[];
    }[];
    packingBox: { id: string; name: string; volumeM3: number };
  };

  return {
    pricing,
    catalog: {
      packingBox: {
        ...fallback.packingBox,
        volumeM3: pricing.boxVolumeM3,
      },
      categories: fallback.categories.map((c) => ({
        id: c.id,
        slug: c.id,
        name: c.name,
        items: c.items.map((i) => ({
          id: i.id,
          slug: i.id,
          name: i.name,
          volumeM3: i.volumeM3,
        })),
      })),
    },
  };
}
