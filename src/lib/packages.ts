import { unstable_cache } from "next/cache";
import { and, asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { servicePackages } from "@/db/schema";

export type HomePackage = {
  id: string;
  name: string;
  slug: string;
  shortDescription: string | null;
  description: string | null;
  pricingType: "fixed" | "m3" | "unit";
  basePrice: string;
  includedM3: string | null;
  includedUnits: number | null;
  highlights: string | null;
};

export const getHomePackages = unstable_cache(
  async (): Promise<HomePackage[]> => {
    return db
      .select({
        id: servicePackages.id,
        name: servicePackages.name,
        slug: servicePackages.slug,
        shortDescription: servicePackages.shortDescription,
        description: servicePackages.description,
        pricingType: servicePackages.pricingType,
        basePrice: servicePackages.basePrice,
        includedM3: servicePackages.includedM3,
        includedUnits: servicePackages.includedUnits,
        highlights: servicePackages.highlights,
      })
      .from(servicePackages)
      .where(
        and(
          eq(servicePackages.active, true),
          eq(servicePackages.showOnHome, true),
        ),
      )
      .orderBy(asc(servicePackages.sortOrder), asc(servicePackages.name));
  },
  ["home-packages"],
  { revalidate: 60, tags: ["packages"] },
);

export const getActivePackagesForSelect = unstable_cache(
  async () => {
    return db
      .select({
        id: servicePackages.id,
        name: servicePackages.name,
        slug: servicePackages.slug,
        pricingType: servicePackages.pricingType,
        basePrice: servicePackages.basePrice,
      })
      .from(servicePackages)
      .where(eq(servicePackages.active, true))
      .orderBy(asc(servicePackages.sortOrder), asc(servicePackages.name));
  },
  ["active-packages-select"],
  { revalidate: 60, tags: ["packages"] },
);
