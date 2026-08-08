"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/db";
import { quoteRequests, servicePackages } from "@/db/schema";
import { upsertClientByContact } from "@/lib/clients";

const publicQuoteSchema = z.object({
  name: z.string().min(2).max(200),
  phone: z.string().min(8).max(40),
  email: z.string().email().optional().or(z.literal("")),
  originAddress: z.string().min(3),
  destinationAddress: z.string().min(3),
  preferredDate: z.string().optional(),
  estimatedM3: z.coerce.number().positive().optional().or(z.literal("")),
  estimatedItems: z.coerce.number().int().positive().optional().or(z.literal("")),
  packageId: z.string().uuid().optional().or(z.literal("")),
  volumeNotes: z.string().optional(),
});

export type PublicQuoteState = {
  ok?: boolean;
  error?: string;
};

export async function submitPublicQuote(
  _prev: PublicQuoteState,
  formData: FormData,
): Promise<PublicQuoteState> {
  const parsed = publicQuoteSchema.safeParse({
    name: formData.get("name"),
    phone: formData.get("phone"),
    email: formData.get("email") || "",
    originAddress: formData.get("originAddress"),
    destinationAddress: formData.get("destinationAddress"),
    preferredDate: formData.get("preferredDate") || undefined,
    estimatedM3: formData.get("estimatedM3") || "",
    estimatedItems: formData.get("estimatedItems") || "",
    packageId: formData.get("packageId") || "",
    volumeNotes: formData.get("volumeNotes") || undefined,
  });

  if (!parsed.success) {
    return { error: "Revisa los datos del formulario e inténtalo de nuevo." };
  }

  const data = parsed.data;

  if (data.packageId) {
    const [pkg] = await db
      .select({ id: servicePackages.id })
      .from(servicePackages)
      .where(eq(servicePackages.id, data.packageId))
      .limit(1);
    if (!pkg) {
      return { error: "El paquete seleccionado ya no está disponible." };
    }
  }

  const clientId = await upsertClientByContact({
    name: data.name,
    phone: data.phone,
    email: data.email || null,
    notes: "Lead desde sitio web",
  });

  await db.insert(quoteRequests).values({
    clientId,
    packageId: data.packageId || null,
    originAddress: data.originAddress,
    destinationAddress: data.destinationAddress,
    preferredDate: data.preferredDate || null,
    volumeNotes: data.volumeNotes,
    estimatedM3:
      data.estimatedM3 === "" || data.estimatedM3 == null
        ? null
        : String(data.estimatedM3),
    estimatedItems:
      data.estimatedItems === "" || data.estimatedItems == null
        ? null
        : Number(data.estimatedItems),
    source: "website",
    status: "new",
  });

  revalidatePath("/panel/cotizaciones");
  revalidatePath("/panel");
  revalidatePath("/panel/clientes");

  return { ok: true };
}
