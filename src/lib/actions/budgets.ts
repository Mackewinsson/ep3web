"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/db";
import { budgetItems, budgets, jobs, quoteRequests } from "@/db/schema";
import { requireAdmin } from "@/lib/auth";

const budgetMetaSchema = z.object({
  title: z.string().min(1).max(200),
  validUntil: z.string().optional(),
  notes: z.string().optional(),
});

const itemSchema = z.object({
  description: z.string().min(1),
  quantity: z.coerce.number().positive(),
  unitPrice: z.coerce.number().min(0),
  pricingUnit: z.enum(["fixed", "m3", "unit"]).default("unit"),
});

function calcTotal(
  items: { quantity: number; unitPrice: number }[],
): string {
  const total = items.reduce(
    (sum, item) => sum + item.quantity * item.unitPrice,
    0,
  );
  return total.toFixed(2);
}

export async function createBudget(formData: FormData) {
  await requireAdmin();
  const clientId = z.string().uuid().parse(formData.get("clientId"));
  const meta = budgetMetaSchema.parse({
    title: formData.get("title"),
    validUntil: formData.get("validUntil") || undefined,
    notes: formData.get("notes") || undefined,
  });

  const [budget] = await db
    .insert(budgets)
    .values({
      clientId,
      title: meta.title,
      validUntil: meta.validUntil || null,
      notes: meta.notes,
      status: "draft",
    })
    .returning();

  revalidatePath("/panel/presupuestos");
  revalidatePath("/panel");
  redirect(`/panel/presupuestos/${budget.id}`);
}

export async function updateBudgetMeta(budgetId: string, formData: FormData) {
  await requireAdmin();
  const meta = budgetMetaSchema.parse({
    title: formData.get("title"),
    validUntil: formData.get("validUntil") || undefined,
    notes: formData.get("notes") || undefined,
  });

  await db
    .update(budgets)
    .set({
      title: meta.title,
      validUntil: meta.validUntil || null,
      notes: meta.notes,
      updatedAt: new Date(),
    })
    .where(eq(budgets.id, budgetId));

  revalidatePath(`/panel/presupuestos/${budgetId}`);
  redirect(`/panel/presupuestos/${budgetId}`);
}

async function recalcBudgetTotal(budgetId: string) {
  const items = await db
    .select()
    .from(budgetItems)
    .where(eq(budgetItems.budgetId, budgetId));

  await db
    .update(budgets)
    .set({
      totalAmount: calcTotal(
        items.map((i) => ({
          quantity: Number(i.quantity),
          unitPrice: Number(i.unitPrice),
        })),
      ),
      updatedAt: new Date(),
    })
    .where(eq(budgets.id, budgetId));
}

export async function addBudgetItem(budgetId: string, formData: FormData) {
  await requireAdmin();
  const item = itemSchema.parse({
    description: formData.get("description"),
    quantity: formData.get("quantity"),
    unitPrice: formData.get("unitPrice"),
    pricingUnit: formData.get("pricingUnit") || "unit",
  });

  const quantity = item.pricingUnit === "fixed" ? 1 : item.quantity;

  await db.insert(budgetItems).values({
    budgetId,
    description: item.description,
    pricingUnit: item.pricingUnit,
    quantity: String(quantity),
    unitPrice: String(item.unitPrice),
  });

  await recalcBudgetTotal(budgetId);

  revalidatePath(`/panel/presupuestos/${budgetId}`);
  redirect(`/panel/presupuestos/${budgetId}`);
}

export async function updateBudgetItem(itemId: string, formData: FormData) {
  await requireAdmin();
  const item = itemSchema.parse({
    description: formData.get("description"),
    quantity: formData.get("quantity"),
    unitPrice: formData.get("unitPrice"),
    pricingUnit: formData.get("pricingUnit") || "unit",
  });

  const [existing] = await db
    .select()
    .from(budgetItems)
    .where(eq(budgetItems.id, itemId))
    .limit(1);

  if (!existing) {
    throw new Error("Ítem no encontrado");
  }

  const quantity = item.pricingUnit === "fixed" ? 1 : item.quantity;

  await db
    .update(budgetItems)
    .set({
      description: item.description,
      pricingUnit: item.pricingUnit,
      quantity: String(quantity),
      unitPrice: String(item.unitPrice),
    })
    .where(eq(budgetItems.id, itemId));

  await recalcBudgetTotal(existing.budgetId);

  revalidatePath(`/panel/presupuestos/${existing.budgetId}`);
  redirect(`/panel/presupuestos/${existing.budgetId}`);
}

export async function deleteBudgetItem(itemId: string) {
  await requireAdmin();

  const [existing] = await db
    .select()
    .from(budgetItems)
    .where(eq(budgetItems.id, itemId))
    .limit(1);

  if (!existing) {
    throw new Error("Ítem no encontrado");
  }

  await db.delete(budgetItems).where(eq(budgetItems.id, itemId));
  await recalcBudgetTotal(existing.budgetId);

  revalidatePath(`/panel/presupuestos/${existing.budgetId}`);
  redirect(`/panel/presupuestos/${existing.budgetId}`);
}

export async function setBudgetStatus(
  budgetId: string,
  status: "draft" | "sent" | "approved" | "rejected" | "expired",
) {
  await requireAdmin();

  const [budget] = await db
    .select()
    .from(budgets)
    .where(eq(budgets.id, budgetId))
    .limit(1);

  if (!budget) {
    throw new Error("Presupuesto no encontrado");
  }

  await db
    .update(budgets)
    .set({ status, updatedAt: new Date() })
    .where(eq(budgets.id, budgetId));

  if (status === "approved") {
    let origin = "Por definir";
    let destination = "Por definir";
    let scheduledDate: string | null = null;

    if (budget.quoteRequestId) {
      const [quote] = await db
        .select()
        .from(quoteRequests)
        .where(eq(quoteRequests.id, budget.quoteRequestId))
        .limit(1);
      if (quote) {
        origin = quote.originAddress;
        destination = quote.destinationAddress;
        scheduledDate = quote.preferredDate;
      }
    }

    const existing = await db
      .select()
      .from(jobs)
      .where(eq(jobs.budgetId, budgetId))
      .limit(1);

    if (existing.length === 0) {
      const [job] = await db
        .insert(jobs)
        .values({
          clientId: budget.clientId,
          budgetId: budget.id,
          originAddress: origin,
          destinationAddress: destination,
          scheduledDate,
          status: "pending_assignment",
          notes: budget.notes,
        })
        .returning();

      revalidatePath("/panel/trabajos");
      revalidatePath("/panel");
      redirect(`/panel/trabajos/${job.id}`);
    }
  }

  revalidatePath(`/panel/presupuestos/${budgetId}`);
  revalidatePath("/panel/presupuestos");
  revalidatePath("/panel");
  redirect(`/panel/presupuestos/${budgetId}`);
}
