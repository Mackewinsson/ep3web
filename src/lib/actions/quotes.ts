"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/db";
import {
  budgetItems,
  budgets,
  quoteRequests,
  servicePackages,
} from "@/db/schema";
import { requireStaff } from "@/lib/auth";
import { upsertClientByContact } from "@/lib/clients";

const quoteFieldsSchema = z.object({
  clientId: z.string().uuid().optional().or(z.literal("")),
  clientName: z.string().optional(),
  clientPhone: z.string().optional(),
  packageId: z.string().uuid().optional().or(z.literal("")),
  originAddress: z.string().min(1),
  destinationAddress: z.string().min(1),
  preferredDate: z.string().optional(),
  volumeNotes: z.string().optional(),
  estimatedM3: z.coerce.number().positive().optional().or(z.literal("")),
  estimatedItems: z.coerce.number().int().positive().optional().or(z.literal("")),
});

function parseQuoteFields(formData: FormData) {
  return quoteFieldsSchema.parse({
    clientId: formData.get("clientId") || "",
    clientName: formData.get("clientName") || undefined,
    clientPhone: formData.get("clientPhone") || undefined,
    packageId: formData.get("packageId") || "",
    originAddress: formData.get("originAddress"),
    destinationAddress: formData.get("destinationAddress"),
    preferredDate: formData.get("preferredDate") || undefined,
    volumeNotes: formData.get("volumeNotes") || undefined,
    estimatedM3: formData.get("estimatedM3") || "",
    estimatedItems: formData.get("estimatedItems") || "",
  });
}

async function resolveClientId(parsed: z.infer<typeof quoteFieldsSchema>) {
  if (parsed.clientId) return parsed.clientId;

  const name = parsed.clientName?.trim();
  const phone = parsed.clientPhone?.trim();
  if (!name || !phone) {
    throw new Error("Selecciona un cliente o ingresa nombre y teléfono.");
  }

  return upsertClientByContact({
    name,
    phone,
    notes: "Creado desde nueva cotización",
  });
}

function volumeFields(parsed: z.infer<typeof quoteFieldsSchema>) {
  return {
    estimatedM3:
      parsed.estimatedM3 === "" || parsed.estimatedM3 == null
        ? null
        : String(parsed.estimatedM3),
    estimatedItems:
      parsed.estimatedItems === "" || parsed.estimatedItems == null
        ? null
        : Number(parsed.estimatedItems),
  };
}

export async function createQuoteRequest(formData: FormData) {
  await requireStaff();
  const parsed = parseQuoteFields(formData);
  const clientId = await resolveClientId(parsed);

  await db.insert(quoteRequests).values({
    clientId,
    packageId: parsed.packageId || null,
    originAddress: parsed.originAddress,
    destinationAddress: parsed.destinationAddress,
    preferredDate: parsed.preferredDate || null,
    volumeNotes: parsed.volumeNotes,
    ...volumeFields(parsed),
    source: "panel",
  });

  revalidatePath("/panel/cotizaciones");
  revalidatePath("/panel/clientes");
  revalidatePath("/panel");
  redirect("/panel/cotizaciones");
}

export async function updateQuoteRequest(quoteId: string, formData: FormData) {
  await requireStaff();
  const parsed = parseQuoteFields(formData);
  const clientId = parsed.clientId
    ? parsed.clientId
    : await resolveClientId(parsed);

  await db
    .update(quoteRequests)
    .set({
      clientId,
      packageId: parsed.packageId || null,
      originAddress: parsed.originAddress,
      destinationAddress: parsed.destinationAddress,
      preferredDate: parsed.preferredDate || null,
      volumeNotes: parsed.volumeNotes,
      ...volumeFields(parsed),
      updatedAt: new Date(),
    })
    .where(eq(quoteRequests.id, quoteId));

  revalidatePath(`/panel/cotizaciones/${quoteId}`);
  revalidatePath("/panel/cotizaciones");
  revalidatePath("/panel");
  redirect(`/panel/cotizaciones/${quoteId}`);
}

export async function setQuoteStatus(
  quoteId: string,
  status: "new" | "in_progress" | "closed",
) {
  await requireStaff();

  await db
    .update(quoteRequests)
    .set({ status, updatedAt: new Date() })
    .where(eq(quoteRequests.id, quoteId));

  revalidatePath(`/panel/cotizaciones/${quoteId}`);
  revalidatePath("/panel/cotizaciones");
  revalidatePath("/panel");
  redirect(`/panel/cotizaciones/${quoteId}`);
}

export async function convertQuoteToBudget(quoteId: string) {
  await requireStaff();

  const [quote] = await db
    .select()
    .from(quoteRequests)
    .where(eq(quoteRequests.id, quoteId))
    .limit(1);

  if (!quote) {
    throw new Error("Cotización no encontrada");
  }

  const [budget] = await db
    .insert(budgets)
    .values({
      clientId: quote.clientId,
      quoteRequestId: quote.id,
      title: `Presupuesto — ${quote.originAddress.slice(0, 40)}`,
      status: "draft",
      notes: quote.volumeNotes,
    })
    .returning();

  if (quote.packageId) {
    const [pkg] = await db
      .select()
      .from(servicePackages)
      .where(eq(servicePackages.id, quote.packageId))
      .limit(1);

    if (pkg) {
      let quantity = 1;
      if (pkg.pricingType === "m3") {
        quantity = Number(quote.estimatedM3 ?? pkg.includedM3 ?? 1);
      } else if (pkg.pricingType === "unit") {
        quantity = Number(quote.estimatedItems ?? pkg.includedUnits ?? 1);
      }

      await db.insert(budgetItems).values({
        budgetId: budget.id,
        packageId: pkg.id,
        description: pkg.name,
        pricingUnit: pkg.pricingType,
        quantity: String(quantity),
        unitPrice: pkg.basePrice,
        sortOrder: 0,
      });

      const total = (quantity * Number(pkg.basePrice)).toFixed(2);
      await db
        .update(budgets)
        .set({ totalAmount: total, updatedAt: new Date() })
        .where(eq(budgets.id, budget.id));
    }
  }

  await db
    .update(quoteRequests)
    .set({ status: "converted", updatedAt: new Date() })
    .where(eq(quoteRequests.id, quoteId));

  revalidatePath("/panel/cotizaciones");
  revalidatePath("/panel/presupuestos");
  revalidatePath("/panel");
  redirect(`/panel/presupuestos/${budget.id}`);
}
