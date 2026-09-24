import { expect, test } from "@playwright/test";
import {
  completePublicQuote,
  login,
  openRecordByTitle,
  requireAdminCreds,
  uniqueSuffix,
} from "./helpers";

test("presupuesto: agregar, editar y quitar ítems en la tabla", async ({
  page,
}) => {
  test.setTimeout(180_000);

  const admin = requireAdminCreds();
  const clientName = `E2E Grid ${uniqueSuffix()}`;

  await completePublicQuote(page, clientName);
  await login(page, admin.email, admin.password);

  await page.goto("/panel/presupuestos");
  await openRecordByTitle(page, `Cotización web — ${clientName}`);
  await expect(
    page.getByRole("heading", { name: "Ítems del presupuesto" }),
  ).toBeVisible({ timeout: 30_000 });

  // Add a line from the blank row at the bottom of the table.
  await page
    .locator('input[form="add-budget-item"][name="description"]')
    .fill("Piano E2E");
  await page
    .locator('input[form="add-budget-item"][name="quantity"]')
    .fill("2");
  await page
    .locator('input[form="add-budget-item"][name="unitVolumeM3"]')
    .fill("0.5");
  await page
    .locator('input[form="add-budget-item"][name="unitPrice"]')
    .fill("10000");
  await page.getByRole("button", { name: "Agregar" }).click();

  const row = page.getByRole("row", { name: /Piano E2E/ });
  await expect(row).toBeVisible({ timeout: 30_000 });
  await expect(row).toContainText("$20.000");
  await expect(row.locator('input[name="unitVolumeM3"]')).toHaveValue("0.5");

  // Inline edit: quantity 2 → 3 updates the line volume and subtotal.
  await row.locator('input[name="quantity"]').fill("3");
  await row.getByRole("button", { name: "Guardar" }).click();
  const edited = page.getByRole("row", { name: /Piano E2E/ });
  await expect(edited).toContainText("$30.000", { timeout: 30_000 });
  await expect(edited).toContainText("1.5");

  // The m³ line and the client total follow the inventory.
  await expect(page.getByText("m³ cobrados", { exact: false })).toBeVisible();

  await edited.getByRole("button", { name: /Quitar/ }).click();
  await expect(page.getByRole("row", { name: /Piano E2E/ })).toHaveCount(0, {
    timeout: 30_000,
  });
});
