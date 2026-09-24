export type ClientContact = {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
};

export function normalizePersonName(name: string) {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

/**
 * Existing client to reuse for an incoming contact: same phone or email
 * AND same name. A shared phone/email with a different name is a different
 * person (or a typo) and must not rename the existing client.
 */
export function findReusableClient<T extends ClientContact>(
  candidates: T[],
  input: { name: string; phone: string; email: string | null },
): T | null {
  const name = normalizePersonName(input.name);
  const email = input.email?.toLowerCase() ?? null;
  return (
    candidates.find((c) => {
      if (normalizePersonName(c.name) !== name) return false;
      const samePhone = Boolean(input.phone) && c.phone === input.phone;
      const sameEmail = Boolean(email) && c.email?.toLowerCase() === email;
      return samePhone || sameEmail;
    }) ?? null
  );
}

/** Only fills contact fields the existing client is missing; never overwrites. */
export function missingContactFields(
  existing: Pick<ClientContact, "phone" | "email">,
  input: { phone: string; email: string | null },
): { phone?: string; email?: string } {
  const patch: { phone?: string; email?: string } = {};
  if (!existing.phone && input.phone) patch.phone = input.phone;
  if (!existing.email && input.email) patch.email = input.email;
  return patch;
}
