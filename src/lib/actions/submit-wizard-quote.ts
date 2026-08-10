"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/db";
import { budgetItems, budgets, quoteRequests } from "@/db/schema";
import { upsertClientByContact } from "@/lib/clients";
import { getMovingCatalogForWizard } from "@/lib/moving-catalog-db";
import {
  buildQuoteEstimate,
  formatM3,
  type PricingConfig,
} from "@/lib/quote-pricing";
import {
  PARKING_LABELS,
  PROPERTY_TYPE_LABELS,
  type ParkingOption,
  type PropertyType,
} from "@/lib/quote-wizard-types";

const addressSchema = z.object({
  propertyType: z.enum(["casa", "departamento", "oficina"]),
  address: z.string().min(5),
  floor: z.string(),
  hasElevator: z.boolean().nullable(),
});

const wizardSchema = z.object({
  origin: addressSchema,
  destination: addressSchema,
  quantities: z.record(z.string(), z.number().int().positive()),
  packingBoxes: z.number().int().min(0),
  hasFragile: z.boolean(),
  fragileNotes: z.string(),
  parkingOrigin: z.enum(["near", "far", "underground"]),
  parkingDestination: z.enum(["near", "far", "underground"]),
  contact: z.object({
    name: z.string().min(2).max(200),
    phone: z.string().min(8).max(40),
    email: z.string().email().optional().or(z.literal("")),
    preferredDate: z.string().optional(),
    notes: z.string().optional(),
  }),
});

export type SubmitWizardState = {
  ok?: boolean;
  error?: string;
  budgetId?: string;
  quoteId?: string;
};

function formatSide(
  label: string,
  side: z.infer<typeof addressSchema>,
  parking: ParkingOption,
) {
  const typeLabel = PROPERTY_TYPE_LABELS[side.propertyType as PropertyType];
  const parts = [`${label}: ${typeLabel} — ${side.address}`];
  if (side.propertyType === "departamento") {
    parts.push(
      `piso ${side.floor || "?"}`,
      side.hasElevator === true
        ? "con ascensor"
        : side.hasElevator === false
          ? "sin ascensor"
          : "ascensor ?",
    );
  }
  parts.push(`estacionamiento: ${PARKING_LABELS[parking]}`);
  return parts.join(" · ");
}

export async function submitWizardQuote(
  payload: unknown,
): Promise<SubmitWizardState> {
  const parsed = wizardSchema.safeParse(payload);
  if (!parsed.success) {
    return { error: "Revisa los datos del formulario e inténtalo de nuevo." };
  }

  const data = parsed.data;
  if (data.origin.propertyType === "departamento") {
    if (!/^\d+$/.test(data.origin.floor) || data.origin.hasElevator === null) {
      return { error: "Completa piso y ascensor en el origen." };
    }
  }
  if (data.destination.propertyType === "departamento") {
    if (
      !/^\d+$/.test(data.destination.floor) ||
      data.destination.hasElevator === null
    ) {
      return { error: "Completa piso y ascensor en el destino." };
    }
  }

  const { catalog, pricing } = await getMovingCatalogForWizard();
  const volumeItems = catalog.categories.flatMap((c) =>
    c.items.map((i) => ({
      id: i.id,
      name: i.name,
      volumeM3: i.volumeM3,
    })),
  );

  const estimate = buildQuoteEstimate({
    quantities: data.quantities,
    items: volumeItems,
    packingBoxes: data.packingBoxes,
    config: pricing satisfies PricingConfig,
    origin: data.origin,
    destination: data.destination,
  });

  if (estimate.furnitureM3 <= 0 && estimate.packingBoxes <= 0) {
    return { error: "Agrega al menos un ítem al inventario." };
  }

  const inventorySummary = estimate.inventoryLines
    .map((l) => `${l.quantity}× ${l.name}`)
    .join(", ");

  const volumeNotes = [
    formatSide("Origen", data.origin, data.parkingOrigin),
    formatSide("Destino", data.destination, data.parkingDestination),
    `Delicados: ${data.hasFragile ? `Sí${data.fragileNotes ? ` — ${data.fragileNotes}` : ""}` : "No"}`,
    `Inventario: ${inventorySummary || "—"}`,
    data.packingBoxes > 0 ? `Cajas: ${data.packingBoxes}` : null,
    data.contact.notes ? `Notas cliente: ${data.contact.notes}` : null,
    `Estimación auto: ${formatM3(estimate.totalM3)} m³ · $${Math.round(estimate.totalAmount).toLocaleString("es-CL")} CLP`,
  ]
    .filter(Boolean)
    .join("\n");

  const clientId = await upsertClientByContact({
    name: data.contact.name,
    phone: data.contact.phone,
    email: data.contact.email || null,
    notes: "Lead desde cotizador web /cotizar",
  });

  const [quote] = await db
    .insert(quoteRequests)
    .values({
      clientId,
      originAddress: data.origin.address,
      destinationAddress: data.destination.address,
      preferredDate: data.contact.preferredDate || null,
      volumeNotes,
      estimatedM3: formatM3(estimate.totalM3),
      estimatedItems: estimate.totalItems,
      source: "website",
      status: "new",
    })
    .returning();

  const [budget] = await db
    .insert(budgets)
    .values({
      clientId,
      quoteRequestId: quote.id,
      title: `Cotización web — ${data.contact.name}`,
      currency: "CLP",
      totalAmount: estimate.totalAmount.toFixed(2),
      status: "sent",
      notes: volumeNotes,
    })
    .returning();

  if (estimate.budgetLines.length) {
    await db.insert(budgetItems).values(
      estimate.budgetLines.map((line, index) => ({
        budgetId: budget.id,
        description: line.description,
        pricingUnit: line.pricingUnit,
        quantity: String(line.pricingUnit === "fixed" ? 1 : line.quantity),
        unitPrice: String(line.unitPrice),
        sortOrder: index,
      })),
    );
  }

  revalidatePath("/panel/cotizaciones");
  revalidatePath("/panel/presupuestos");
  revalidatePath("/panel");
  revalidatePath("/panel/clientes");

  const { notifyAdmins } = await import("@/lib/notifications");
  await notifyAdmins({
    type: "new_quote",
    title: "Nueva cotización web",
    body: `${data.contact.name} · ${formatM3(estimate.totalM3)} m³ · estimado $${Math.round(estimate.totalAmount).toLocaleString("es-CL")}`,
    href: `/panel/presupuestos/${budget.id}`,
  });

  return { ok: true, budgetId: budget.id, quoteId: quote.id };
}
