import { expect, test } from "@playwright/test";
import {
  completePublicQuote,
  login,
  openRecordByTitle,
  requireAdminCreds,
  uniqueSuffix,
} from "./helpers";

/** Lines the item table already shows; they must not reach the client message. */
const GENERATED_LINES = [/^Inventario:/m, /^Cajas:/m, /^Cargos:/m, /Estimación auto/];

test("presupuesto: notas son un mensaje al cliente, no el resumen del cotizador", async ({
  page,
}) => {
  test.setTimeout(180_000);

  const admin = requireAdminCreds();
  const clientName = `E2E Notas ${uniqueSuffix()}`;

  await completePublicQuote(page, clientName);
  await login(page, admin.email, admin.password);

  await page.goto("/panel/presupuestos");
  await openRecordByTitle(page, `Cotización web — ${clientName}`);
  await expect(
    page.getByRole("heading", { name: "Ítems del presupuesto" }),
  ).toBeVisible({ timeout: 30_000 });

  // The client's wizard answers are kept, read-only, outside the message box.
  const details = page.getByRole("heading", { name: "Detalles del servicio" });
  await expect(details).toBeVisible();
  const detailsCard = page.locator("section", { has: details });
  await expect(detailsCard).toContainText("Origen");
  await expect(detailsCard).toContainText("Destino");
  await expect(detailsCard).toContainText("Ayudantes");

  // The message box starts empty instead of repeating the table.
  const message = page.getByLabel("Mensaje para el cliente");
  await expect(message).toBeVisible();
  for (const line of GENERATED_LINES) {
    expect(await message.inputValue()).not.toMatch(line);
  }

  // It round-trips as plain free text.
  const text = "Coordinamos el horario por WhatsApp.";
  await message.fill(text);
  await page.getByRole("button", { name: "Guardar datos" }).click();
  await expect(page.getByLabel("Mensaje para el cliente")).toHaveValue(text, {
    timeout: 30_000,
  });

  // Editing an item regenerates the volume snapshot but must not push the
  // generated lines back into the message.
  const caja = page.getByRole("row", { name: /Caja E2E/ });
  await caja.locator('input[name="quantity"]').fill("4");
  await caja.getByRole("button", { name: "Guardar" }).click();
  await expect(page.getByLabel("Mensaje para el cliente")).toHaveValue(text, {
    timeout: 30_000,
  });
  await expect(
    page.getByRole("heading", { name: "Detalles del servicio" }),
  ).toBeVisible();
});
