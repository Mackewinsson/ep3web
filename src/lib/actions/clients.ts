"use server";

import { desc, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/db";
import { budgets, clients, notifications, quoteRequests } from "@/db/schema";
import { requireAdmin } from "@/lib/auth";
import { formatClpPlusIva } from "@/lib/format";
import { sendFollowUpEmail } from "@/lib/email/follow-up";

const clientSchema = z.object({
  name: z.string().min(1).max(200),
  phone: z.string().max(40).optional(),
  email: z.string().email().optional().or(z.literal("")),
  notes: z.string().optional(),
});

export async function createClient(formData: FormData) {
  await requireAdmin();
  const parsed = clientSchema.parse({
    name: formData.get("name"),
    phone: formData.get("phone") || undefined,
    email: formData.get("email") || "",
    notes: formData.get("notes") || undefined,
  });

  const [created] = await db
    .insert(clients)
    .values({
      name: parsed.name,
      phone: parsed.phone,
      email: parsed.email || null,
      notes: parsed.notes,
    })
    .returning();

  revalidatePath("/panel/clientes");
  redirect(`/panel/clientes/${created.id}`);
}

export async function updateClient(id: string, formData: FormData) {
  await requireAdmin();
  const parsed = clientSchema.parse({
    name: formData.get("name"),
    phone: formData.get("phone") || undefined,
    email: formData.get("email") || "",
    notes: formData.get("notes") || undefined,
  });

  await db
    .update(clients)
    .set({
      name: parsed.name,
      phone: parsed.phone,
      email: parsed.email || null,
      notes: parsed.notes,
      updatedAt: new Date(),
    })
    .where(eq(clients.id, id));

  revalidatePath("/panel/clientes");
  revalidatePath(`/panel/clientes/${id}`);
  redirect(`/panel/clientes/${id}`);
}

export async function sendClientFollowUpEmailAction(clientId: string) {
  const staff = await requireAdmin();
  const [client] = await db
    .select()
    .from(clients)
    .where(eq(clients.id, clientId))
    .limit(1);

  if (!client || !client.email) {
    throw new Error("El cliente no tiene un correo válido registrado.");
  }

  const [latestQuote] = await db
    .select({
      originAddress: quoteRequests.originAddress,
      destinationAddress: quoteRequests.destinationAddress,
      budgetId: budgets.id,
      budgetTotal: budgets.totalAmount,
    })
    .from(quoteRequests)
    .leftJoin(budgets, eq(budgets.quoteRequestId, quoteRequests.id))
    .where(eq(quoteRequests.clientId, clientId))
    .orderBy(desc(quoteRequests.createdAt))
    .limit(1);

  const routeSummary = latestQuote
    ? `${latestQuote.originAddress} → ${latestQuote.destinationAddress}`
    : undefined;
  const estimatedAmount = latestQuote?.budgetTotal
    ? formatClpPlusIva(latestQuote.budgetTotal)
    : undefined;

  const result = await sendFollowUpEmail({
    clientName: client.name,
    clientEmail: client.email,
    routeSummary,
    estimatedAmount,
  });

  if (result.failed) {
    throw new Error(result.error ?? "No se pudo enviar el correo de seguimiento");
  }

  await db.insert(notifications).values({
    staffUserId: staff.sub,
    type: "client_follow_up_email",
    title: `Correo de seguimiento enviado a ${client.name}`,
    body: `Enviado a ${client.email}`,
    href: `/panel/clientes/${clientId}`,
  });

  revalidatePath("/panel/clientes");
  revalidatePath(`/panel/clientes/${clientId}`);
  return { ok: true };
}
