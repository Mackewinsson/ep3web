import "dotenv/config";
import { config } from "dotenv";
import { neon } from "@neondatabase/serverless";
import { count } from "drizzle-orm";
import { drizzle } from "drizzle-orm/neon-http";
import catalog from "../src/data/moving-items.json";
import {
  movingCatalogItems,
  movingCategories,
  quotePricingSettings,
} from "../src/db/schema";
import { DEFAULT_PRICING_CONFIG } from "../src/lib/quote-pricing";

config({ path: ".env.local" });

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL missing");

  const sql = neon(url);
  const db = drizzle(sql);

  const [settingsCount] = await db.select({ n: count() }).from(quotePricingSettings);
  if (!settingsCount.n) {
    await db.insert(quotePricingSettings).values({
      boxesPerM3: String(DEFAULT_PRICING_CONFIG.boxesPerM3),
      minBoxes: DEFAULT_PRICING_CONFIG.minBoxes,
      boxVolumeM3: String(DEFAULT_PRICING_CONFIG.boxVolumeM3),
      pricePerM3: String(DEFAULT_PRICING_CONFIG.pricePerM3),
      noElevatorPerFloor: String(DEFAULT_PRICING_CONFIG.noElevatorPerFloor),
      operatorMarginPercent: String(DEFAULT_PRICING_CONFIG.operatorMarginPercent),
    });
    console.log("Seeded quote_pricing_settings");
  } else {
    console.log("quote_pricing_settings already present");
  }

  const [catCount] = await db.select({ n: count() }).from(movingCategories);
  if (catCount.n > 0) {
    console.log("moving_categories already seeded — skip catalog");
    return;
  }

  let catOrder = 0;
  for (const category of catalog.categories) {
    const [created] = await db
      .insert(movingCategories)
      .values({
        slug: category.id,
        name: category.name,
        sortOrder: catOrder++,
        active: true,
      })
      .returning();

    let itemOrder = 0;
    for (const item of category.items) {
      await db.insert(movingCatalogItems).values({
        categoryId: created.id,
        slug: item.id,
        name: item.name,
        volumeM3: String(item.volumeM3),
        sortOrder: itemOrder++,
        active: true,
      });
    }
  }

  console.log(
    `Seeded ${catalog.categories.length} categories / catalog items`,
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
