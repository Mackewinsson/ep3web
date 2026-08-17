import { expect, test, type Page } from "@playwright/test";
import {
  fillByName,
  login,
  logout,
  openRecordByTitle,
  requireAdminCreds,
  selectByName,
  uniqueSuffix,
} from "./helpers";

const WIZARD_STORAGE_KEY = "ep3-quote-wizard-v2";

async function fillAddressStep(page: Page, address: string) {
  await page.getByLabel("Tipo").selectOption("casa");
  await page.getByPlaceholder("Ej: Morandé 707, Santiago").fill(address);
  await page.getByRole("button", { name: "Siguiente" }).click();
}

async function completePublicQuote(page: Page, clientName: string) {
  await page.goto("/cotizar");
  await page.evaluate((key) => localStorage.removeItem(key), WIZARD_STORAGE_KEY);
  await page.reload();
  await expect(
    page.getByRole("heading", { name: /dirección de origen/i }),
  ).toBeVisible();

  await fillAddressStep(page, "Av Providencia 1200, Providencia");
  await expect(
    page.getByRole("heading", { name: /dirección de destino/i }),
  ).toBeVisible();
  await fillAddressStep(page, "Av Apoquindo 3000, Las Condes");

  await expect(page.getByRole("heading", { name: /Qué llevamos/i })).toBeVisible();
  await page
    .getByPlaceholder("Ej: piano vertical, pecera…")
    .fill("Caja E2E");
  await page.getByRole("button", { name: "Agregar", exact: true }).click();
  await expect(page.getByText("Caja E2E")).toBeVisible();
  await page.getByRole("button", { name: "Siguiente" }).click();

  await expect(page.getByRole("heading", { name: /delicado/i })).toBeVisible();
  await page.getByRole("button", { name: "No", exact: true }).click();
  await page.getByRole("button", { name: "Siguiente" }).click();

  const parkingNear = "Sí, a menos de 40 metros";
  await expect(page.getByRole("button", { name: parkingNear })).toBeVisible();
  await page.getByRole("button", { name: parkingNear }).click();
  await page.getByRole("button", { name: "Siguiente" }).click();
  await page.getByRole("button", { name: parkingNear }).click();
  await page.getByRole("button", { name: "Siguiente" }).click();

  await expect(
    page.getByRole("heading", { name: /Cómo te contactamos/i }),
  ).toBeVisible();
  await page
    .locator("label")
    .filter({ hasText: /^Nombre$/ })
    .locator("input")
    .fill(clientName);
  await page
    .locator("label")
    .filter({ hasText: /^Teléfono$/ })
    .locator("input")
    .fill("+56912345678");
  await page
    .locator("label")
    .filter({ hasText: /^Correo$/ })
    .locator("input")
    .fill(`cliente.${uniqueSuffix()}@example.com`);
  await page.getByRole("button", { name: "Enviar solicitud" }).click();

  await expect(page.getByRole("heading", { name: "¡Gracias!" })).toBeVisible({
    timeout: 60_000,
  });
}

test("cotización web → aprobar → operador → salvoconducto → En camino", async ({
  page,
}) => {
  test.setTimeout(240_000);

  const admin = requireAdminCreds();
  const suffix = uniqueSuffix();
  const operatorName = `E2E Operador ${suffix}`;
  const operatorEmail = `e2e.op.${suffix}@example.com`;
  const operatorPassword = "e2eop123456";
  const crewName = `E2E Chofer ${suffix}`;
  const crewEmail = `e2e.crew.${suffix}@example.com`;
  const plate = `E${suffix}`.slice(0, 12).toUpperCase();
  const truckLabel = `Camión E2E ${suffix}`;
  const clientName = `E2E Cliente ${suffix}`;
  const budgetTitle = `Cotización web — ${clientName}`;
  const folio = `SC-E2E-${suffix}`;

  // --- 0. Admin: flota (operador + chofer + camión) ---
  await login(page, admin.email, admin.password);

  await page.goto("/panel/conductores/nuevo");
  await selectByName(page, "kind", { label: "Operador (cuenta flota)" });
  await fillByName(page, "name", operatorName);
  await fillByName(page, "email", operatorEmail);
  await fillByName(page, "phone", "+56911111111");
  await page.locator('input[name="enableAppAccess"]').check();
  await fillByName(page, "appPassword", operatorPassword);
  await page.getByRole("button", { name: "Guardar" }).click();
  await page.waitForURL(/\/panel\/conductores$/, { timeout: 30_000 });
  await expect(
    page.getByRole("link", { name: `Abrir ${operatorName}` }),
  ).toBeVisible();

  await page.goto("/panel/conductores/nuevo");
  await selectByName(page, "kind", { label: "Conductor de flota" });
  await selectByName(page, "operatorId", { label: operatorName });
  await fillByName(page, "name", crewName);
  await fillByName(page, "email", crewEmail);
  await fillByName(page, "phone", "+56922222222");
  await page.getByRole("button", { name: "Guardar" }).click();
  await page.waitForURL(/\/panel\/conductores$/, { timeout: 30_000 });
  await expect(
    page.getByRole("link", { name: `Abrir ${crewName}` }),
  ).toBeVisible();

  await page.goto("/panel/camiones/nuevo");
  await fillByName(page, "plate", plate);
  await fillByName(page, "label", truckLabel);
  await selectByName(page, "operatorId", { label: operatorName });
  await page.getByRole("button", { name: "Guardar camión" }).click();
  await page.waitForURL(/\/panel\/camiones$/, { timeout: 30_000 });
  await expect(
    page.getByRole("link", { name: `Abrir ${plate}` }),
  ).toBeVisible();

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

  // --- 3. Operador: aceptar + salvo + En camino ---
  await login(page, operatorEmail, operatorPassword);
  await expect(page).toHaveURL(/\/panel\/mis-trabajos/);

  await openRecordByTitle(page, clientName);
  await page.waitForURL(/\/panel\/mis-trabajos\/[^/]+$/, { timeout: 30_000 });
  await expect(
    page.getByRole("button", { name: "Aceptar servicio" }),
  ).toBeVisible();

  await page.getByRole("button", { name: "Aceptar servicio" }).click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();

  await dialog.locator('select[name="truckId"]').selectOption({ index: 1 });
  await dialog.locator('select[name="crewDriverId"]').selectOption({ index: 1 });
  await dialog.locator('input[name="folio"]').fill(folio);
  await dialog.locator('input[name="issuedAt"]').fill("2026-08-16");
  await dialog.locator('input[name="originCommune"]').fill("Providencia");
  await dialog
    .locator('input[name="destinationCommune"]')
    .fill("Las Condes");
  await dialog.getByRole("button", { name: "Confirmar aceptación" }).click();

  await expect(page.getByText(folio)).toBeVisible({ timeout: 30_000 });
  await expect(page.getByRole("button", { name: "En camino" })).toBeVisible();

  await page.getByRole("button", { name: "En camino" }).click();
  await expect(page.getByRole("button", { name: "Finalizar" })).toBeVisible({
    timeout: 30_000,
  });
  await expect(
    page.getByText(/Aviso al cliente \(simulado\): se envió correo/),
  ).toBeVisible();
});
