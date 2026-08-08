"use server";

import { eq } from "drizzle-orm";
import { revalidatePath, revalidateTag } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/db";
import { servicePackages } from "@/db/schema";
import { requireAdmin } from "@/lib/auth";
import { slugify } from "@/lib/format";

const packageSchema = z.object({
  name: z.string().min(1).max(160),
  slug: z.string().max(160).optional(),
  shortDescription: z.string().max(280).optional(),
  description: z.string().optional(),
  pricingType: z.enum(["fixed", "m3", "unit"]),
  basePrice: z.coerce.number().min(0),
  includedM3: z.coerce.number().positive().optional().or(z.literal("")),
  includedUnits: z.coerce.number().int().positive().optional().or(z.literal("")),
  highlights: z.string().optional(),
  active: z.boolean(),
  showOnHome: z.boolean(),
  sortOrder: z.coerce.number().int(),
});

function parsePackageForm(formData: FormData) {
  return packageSchema.parse({
    name: formData.get("name"),
    slug: formData.get("slug") || undefined,
    shortDescription: formData.get("shortDescription") || undefined,
    description: formData.get("description") || undefined,
    pricingType: formData.get("pricingType") || "fixed",
    basePrice: formData.get("basePrice"),
    includedM3: formData.get("includedM3") || "",
    includedUnits: formData.get("includedUnits") || "",
    highlights: formData.get("highlights") || undefined,
    active: formData.get("active") === "on" || formData.get("active") === "true",
    showOnHome:
      formData.get("showOnHome") === "on" ||
      formData.get("showOnHome") === "true",
    sortOrder: formData.get("sortOrder") || 0,
  });
}

function toRow(parsed: z.infer<typeof packageSchema>) {
  const slug = parsed.slug?.trim() ? slugify(parsed.slug) : slugify(parsed.name);
  return {
    name: parsed.name,
    slug,
    shortDescription: parsed.shortDescription || null,
    description: parsed.description || null,
    pricingType: parsed.pricingType,
    basePrice: String(parsed.basePrice),
    includedM3:
      parsed.includedM3 === "" || parsed.includedM3 == null
        ? null
        : String(parsed.includedM3),
    includedUnits:
      parsed.includedUnits === "" || parsed.includedUnits == null
        ? null
        : Number(parsed.includedUnits),
    highlights: parsed.highlights || null,
    active: parsed.active,
    showOnHome: parsed.showOnHome,
    sortOrder: parsed.sortOrder,
  };
}

function revalidatePackages() {
  revalidatePath("/panel/paquetes");
  revalidatePath("/");
  revalidateTag("packages", "max");
}

export async function createPackage(formData: FormData) {
  await requireAdmin();
  const row = toRow(parsePackageForm(formData));
  await db.insert(servicePackages).values(row);
  revalidatePackages();
  redirect("/panel/paquetes");
}

export async function updatePackage(id: string, formData: FormData) {
  await requireAdmin();
  const row = toRow(parsePackageForm(formData));
  await db
    .update(servicePackages)
    .set({ ...row, updatedAt: new Date() })
    .where(eq(servicePackages.id, id));
  revalidatePackages();
  redirect(`/panel/paquetes/${id}`);
}

export async function togglePackageActive(id: string) {
  await requireAdmin();
  const [pkg] = await db
    .select({ id: servicePackages.id, active: servicePackages.active })
    .from(servicePackages)
    .where(eq(servicePackages.id, id))
    .limit(1);

  if (!pkg) {
    throw new Error("Paquete no encontrado");
  }

  await db
    .update(servicePackages)
    .set({ active: !pkg.active, updatedAt: new Date() })
    .where(eq(servicePackages.id, id));

  revalidatePackages();
  redirect("/panel/paquetes");
}
