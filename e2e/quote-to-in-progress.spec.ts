import { expect, test } from "@playwright/test";
import {
  buildTestFleet,
  createOperatorFleet,
  createOperatorWithAccess,
  completePublicQuote,
  login,
  logout,
  openRecordByTitle,
  requireAdminCreds,
  selectByName,
  uniqueSuffix,
} from "./helpers";

test("cotización web → aprobar → operador → aceptar → En camino", async ({
  page,
}) => {
  test.setTimeout(360_000);

  const admin = requireAdminCreds();
  const suffix = uniqueSuffix();
  const operatorName = `E2E Operador ${suffix}`;
  const operatorEmail = `e2e.op.${suffix}@example.com`;
  const operatorPassword = "e2eop123456";
  const fleet = buildTestFleet(suffix, 5);
  const pickTruck = fleet[2];
  const pickCrew = fleet[1];
  const clientName = `E2E Cliente ${suffix}`;
  const budgetTitle = `Cotización web — ${clientName}`;
  const crewRut = `13.456.789-K`;

  // --- 0. Admin: operador + 5 choferes + 5 camiones ---
  await login(page, admin.email, admin.password);
  await createOperatorWithAccess(page, {
    name: operatorName,
    email: operatorEmail,
    password: operatorPassword,
  });
  await createOperatorFleet(page, operatorName, fleet);
  await logout(page);

  // --- 1. Cliente: /cotizar ---
  await completePublicQuote(page, clientName);

  // --- 2. Admin: aprobar y asignar ---
  await login(page, admin.email, admin.password);
  await page.goto("/panel/presupuestos");
  await openRecordByTitle(page, budgetTitle);
  await expect(page.getByRole("heading", { name: budgetTitle })).toBeVisible();

  await page.getByRole("button", { name: "Aprobar y crear trabajo" }).click();
  await page.waitForURL(/\/panel\/trabajos\/[^/]+$/, { timeout: 30_000 });

  await selectByName(page, "driverId", { label: new RegExp(operatorName) });
  await page.getByRole("button", { name: "Asignar operador" }).click();
  await page.waitForURL(/\/panel\/trabajos\/[^/]+$/, { timeout: 30_000 });
  await expect(
    page.getByText(new RegExp(`Operador:\\s*${operatorName}`)),
  ).toBeVisible({ timeout: 30_000 });

  await logout(page);

  // --- 3. Operador: aceptar (chofer, RUT, patente) + En camino ---
  await login(page, operatorEmail, operatorPassword);
  await expect(page).toHaveURL(/\/panel\/mis-trabajos/);

  await openRecordByTitle(page, clientName);
  await page.waitForURL(/\/panel\/mis-trabajos\/[^/]+$/, { timeout: 30_000 });
  await expect(
    page.getByRole("button", { name: "Aceptar servicio" }),
  ).toBeVisible();
  await expect(page.getByText("Tu pago por este servicio")).toBeVisible();
  await expect(page.getByText(/Monto neto para tu flota/)).toBeVisible();
  await expect(page.getByRole("button", { name: "Rechazar trabajo" })).toBeVisible();

  await page.getByRole("button", { name: "Aceptar servicio" }).click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  await expect(dialog.getByText(/Indica chofer, RUT y patente/)).toBeVisible();
  await expect(dialog.locator('input[name="folio"]')).toHaveCount(0);
  await expect(dialog.locator('input[name="crewDriverRut"]')).toBeVisible();

  const truckOptions = dialog.locator('select[name="truckId"] option:not([disabled])');
  const crewOptions = dialog.locator(
    'select[name="crewDriverId"] option:not([disabled])',
  );
  await expect(truckOptions).toHaveCount(5);
  await expect(crewOptions).toHaveCount(5);
  for (const member of fleet) {
    await expect(truckOptions.filter({ hasText: member.plate })).toHaveCount(1);
    await expect(crewOptions.filter({ hasText: member.crewName })).toHaveCount(1);
  }

  const truckOptionLabel = `${pickTruck.plate} — ${pickTruck.truckLabel}`;
  await dialog.locator('select[name="crewDriverId"]').selectOption({
    label: pickCrew.crewName,
  });
  await dialog.locator('input[name="crewDriverRut"]').fill(crewRut);
  await dialog.locator('select[name="truckId"]').selectOption({
    label: truckOptionLabel,
  });
  await dialog.getByRole("button", { name: "Confirmar aceptación" }).click();

  await expect(page.getByText(crewRut)).toBeVisible({ timeout: 30_000 });
  await expect(page.getByText(pickTruck.plate)).toBeVisible();
  await expect(page.getByText(pickCrew.crewName)).toBeVisible();
  await expect(page.getByRole("button", { name: "En camino" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Rechazar trabajo" })).toHaveCount(0);
  await expect(page.getByText("Tu pago por este servicio")).toBeVisible();

  await page.getByRole("button", { name: "En camino" }).click();
  await expect(page.getByRole("button", { name: "Finalizar" })).toBeVisible({
    timeout: 30_000,
  });
  await expect(
    page.getByText(/Aviso al cliente \(simulado\): se envió correo/),
  ).toBeVisible();
});
