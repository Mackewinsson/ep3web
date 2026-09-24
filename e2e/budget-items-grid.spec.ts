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

  // The blank row is ready for the next item.
  await expect(
    page.locator('input[form="add-budget-item"][name="description"]'),
  ).toHaveValue("");

  // Inline edit: quantity 2 → 3 updates the line volume and subtotal.
  await row.locator('input[name="quantity"]').fill("3");
  await row.getByRole("button", { name: "Guardar" }).click();
  const edited = page.getByRole("row", { name: /Piano E2E/ });
  await expect(edited).toContainText("$30.000", { timeout: 30_000 });
  await expect(edited).toContainText("1.5");

  // The billed m³ line follows the inventory, and its editable cells must show
  // the stored values — not stale DOM state left over from the last render.
  const billed = page.getByRole("row", { name: /Mudanza estimada/ });
  const billedAfterEdit = Number(
    await billed.locator('input[name="quantity"]').inputValue(),
  );
  await expect(billed.locator('input[name="description"]')).toHaveValue(
    `Mudanza estimada (${billedAfterEdit} m³)`,
  );

  await edited.getByRole("button", { name: /Quitar/ }).click();
  await expect(page.getByRole("row", { name: /Piano E2E/ })).toHaveCount(0, {
    timeout: 30_000,
  });

  // Removing 1.5 m³ of inventory must be reflected in the inputs too.
  const billedAfterDelete = Number((billedAfterEdit - 1.5).toFixed(2));
  await expect(billed.locator('input[name="quantity"]')).toHaveValue(
    String(billedAfterDelete),
  );
  await expect(billed.locator('input[name="description"]')).toHaveValue(
    `Mudanza estimada (${billedAfterDelete} m³)`,
  );
});
