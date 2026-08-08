"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/db";
import { budgets, quoteRequests } from "@/db/schema";
import { requireStaff } from "@/lib/auth";

const quoteSchema = z.object({
  clientId: z.string().uuid(),
  originAddress: z.string().min(1),
  destinationAddress: z.string().min(1),
  preferredDate: z.string().optional(),
  volumeNotes: z.string().optional(),
});

export async function createQuoteRequest(formData: FormData) {
  await requireStaff();
  const parsed = quoteSchema.parse({
    clientId: formData.get("clientId"),
    originAddress: formData.get("originAddress"),
    destinationAddress: formData.get("destinationAddress"),
    preferredDate: formData.get("preferredDate") || undefined,
    volumeNotes: formData.get("volumeNotes") || undefined,
  });

  await db.insert(quoteRequests).values({
    clientId: parsed.clientId,
    originAddress: parsed.originAddress,
    destinationAddress: parsed.destinationAddress,
    preferredDate: parsed.preferredDate || null,
    volumeNotes: parsed.volumeNotes,
  });

  revalidatePath("/panel/cotizaciones");
  revalidatePath("/panel");
  redirect("/panel/cotizaciones");
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

  await db
    .update(quoteRequests)
    .set({ status: "converted", updatedAt: new Date() })
    .where(eq(quoteRequests.id, quoteId));

  revalidatePath("/panel/cotizaciones");
  revalidatePath("/panel/presupuestos");
  revalidatePath("/panel");
  redirect(`/panel/presupuestos/${budget.id}`);
}
