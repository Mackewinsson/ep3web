import { config } from "dotenv";
import { eq } from "drizzle-orm";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { servicePackages } from "../src/db/schema";

config({ path: ".env.local" });

async function main() {
  const db = drizzle(neon(process.env.DATABASE_URL!));
  const existing = await db.select().from(servicePackages).limit(1);
  if (existing.length) {
    console.log("packages already exist:", existing[0].slug);
    return;
  }

  await db.insert(servicePackages).values([
    {
      name: "Mudanza 1 dormitorio",
      slug: "mudanza-1-dormitorio",
      shortDescription: "Ideal para departamentos pequeños",
      description: "Incluye camión y 2 ayudantes",
      pricingType: "fixed",
      basePrice: "180000",
      highlights: "2 ayudantes\nCamión mediano\nEmbalaje básico",
      active: true,
      showOnHome: true,
      sortOrder: 1,
    },
    {
      name: "Flete por m³",
      slug: "flete-por-m3",
      shortDescription: "Paga según el volumen real",
      pricingType: "m3",
      basePrice: "25000",
      includedM3: "1",
      highlights: "Precio por metro cúbico\nRutas RM",
      active: true,
      showOnHome: true,
      sortOrder: 2,
    },
  ]);
  console.log("seeded 2 packages");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
