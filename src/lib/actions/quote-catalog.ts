"use server";

import { asc, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/db";
import {
  movingCatalogItems,
  movingCategories,
  quotePricingSettings,
} from "@/db/schema";
import { requireAdmin } from "@/lib/auth";

function slugify(input: string) {
  return input
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 140);
}

export async function updateQuotePricingSettings(formData: FormData) {
  await requireAdmin();
  const parsed = z
    .object({
      boxesPerM3: z.coerce.number().positive().max(20),
      minBoxes: z.coerce.number().int().min(0).max(200),
      boxVolumeM3: z.coerce.number().positive().max(2),
      pricePerM3: z.coerce.number().min(0),
      noElevatorPerFloor: z.coerce.number().min(0),
      operatorMarginPercent: z.coerce.number().min(0).max(90),
    })
    .parse({
      boxesPerM3: formData.get("boxesPerM3"),
      minBoxes: formData.get("minBoxes"),
      boxVolumeM3: formData.get("boxVolumeM3"),
      pricePerM3: formData.get("pricePerM3"),
      noElevatorPerFloor: formData.get("noElevatorPerFloor"),
      operatorMarginPercent: formData.get("operatorMarginPercent"),
    });

  const [existing] = await db.select().from(quotePricingSettings).limit(1);
  if (existing) {
    await db
      .update(quotePricingSettings)
      .set({
        boxesPerM3: String(parsed.boxesPerM3),
        minBoxes: parsed.minBoxes,
        boxVolumeM3: String(parsed.boxVolumeM3),
        pricePerM3: String(parsed.pricePerM3),
        noElevatorPerFloor: String(parsed.noElevatorPerFloor),
        operatorMarginPercent: String(parsed.operatorMarginPercent),
        updatedAt: new Date(),
      })
      .where(eq(quotePricingSettings.id, existing.id));
  } else {
    await db.insert(quotePricingSettings).values({
      boxesPerM3: String(parsed.boxesPerM3),
      minBoxes: parsed.minBoxes,
      boxVolumeM3: String(parsed.boxVolumeM3),
      pricePerM3: String(parsed.pricePerM3),
      noElevatorPerFloor: String(parsed.noElevatorPerFloor),
      operatorMarginPercent: String(parsed.operatorMarginPercent),
    });
  }

  revalidatePath("/panel/cotizador");
  revalidatePath("/cotizar");
  revalidatePath("/panel/mis-trabajos");
  revalidatePath("/panel/trabajos");
}

export async function createMovingCategory(formData: FormData) {
  await requireAdmin();
  const name = z.string().min(2).max(160).parse(formData.get("name"));
  const slug = slugify(name);
  const [last] = await db
    .select()
    .from(movingCategories)
    .orderBy(asc(movingCategories.sortOrder))
    .limit(1);

  await db.insert(movingCategories).values({
    name,
    slug: `${slug}-${Date.now().toString(36).slice(-4)}`,
    sortOrder: (last?.sortOrder ?? 0) + 10,
    active: true,
  });

  revalidatePath("/panel/cotizador");
  revalidatePath("/cotizar");
}

export async function createMovingCatalogItem(formData: FormData) {
  await requireAdmin();
  const parsed = z
    .object({
      categoryId: z.string().uuid(),
      name: z.string().min(2).max(200),
      volumeM3: z.coerce.number().positive().max(50),
    })
    .parse({
      categoryId: formData.get("categoryId"),
      name: formData.get("name"),
      volumeM3: formData.get("volumeM3"),
    });

  const slugBase = slugify(parsed.name) || "item";
  await db.insert(movingCatalogItems).values({
    categoryId: parsed.categoryId,
    name: parsed.name,
    slug: `${slugBase}-${Date.now().toString(36).slice(-5)}`,
    volumeM3: String(parsed.volumeM3),
    active: true,
  });

  revalidatePath("/panel/cotizador");
  revalidatePath("/cotizar");
}

export async function updateMovingCatalogItem(
  itemId: string,
  formData: FormData,
) {
  await requireAdmin();
  const parsed = z
    .object({
      name: z.string().min(2).max(200),
      volumeM3: z.coerce.number().positive().max(50),
      active: z.enum(["true", "false"]).optional(),
    })
    .parse({
      name: formData.get("name"),
      volumeM3: formData.get("volumeM3"),
      active: formData.get("active") || undefined,
    });

  await db
    .update(movingCatalogItems)
    .set({
      name: parsed.name,
      volumeM3: String(parsed.volumeM3),
      updatedAt: new Date(),
    })
    .where(eq(movingCatalogItems.id, itemId));

  revalidatePath("/panel/cotizador");
  revalidatePath("/cotizar");
}

export async function toggleMovingCatalogItem(itemId: string, active: boolean) {
  await requireAdmin();
  await db
    .update(movingCatalogItems)
    .set({ active, updatedAt: new Date() })
    .where(eq(movingCatalogItems.id, itemId));
  revalidatePath("/panel/cotizador");
  revalidatePath("/cotizar");
}
