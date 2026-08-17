import { expect, test, type Page } from "@playwright/test";
import {
  approveBudgetCreateJob,
  assignOperatorOnJob,
  buildTestFleet,
  completePublicQuote,
  createOperatorFleet,
  createOperatorWithAccess,
  fillAcceptSalvo,
  login,
  logout,
  openRecordByTitle,
  requireAdminCreds,
  uniqueSuffix,
} from "./helpers";

async function seedOperator(
  page: Page,
  suffix: string,
  label: string,
) {
  const name = `E2E ${label} ${suffix}`;
  const email = `e2e.${label.toLowerCase()}.${suffix}@example.com`;
  const password = "e2eop123456";
  const fleet = buildTestFleet(`${label}${suffix}`, 1);
  await createOperatorWithAccess(page, { name, email, password });
  await createOperatorFleet(page, name, fleet);
  return { name, email, password, fleet };
}

test.describe("job edge cases", () => {
  test.describe.configure({ timeout: 360_000 });

  test("rechazar presupuesto draft no crea trabajo", async ({ page }) => {
    const admin = requireAdminCreds();
    const clientName = `E2E Rechazo ${uniqueSuffix()}`;
    const budgetTitle = `Cotización web — ${clientName}`;

    await completePublicQuote(page, clientName);
    await login(page, admin.email, admin.password);
    await page.goto("/panel/presupuestos");
    await openRecordByTitle(page, budgetTitle);
    await page.getByRole("button", { name: "Rechazar" }).click();
    await expect(page.getByText("Rechazado")).toBeVisible({ timeout: 30_000 });
    await expect(
      page.getByRole("button", { name: "Aprobar y crear trabajo" }),
    ).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Rechazar" })).toHaveCount(0);
  });

  test("sin salvo no hay En camino; cancelar asignado cierra el trabajo", async ({
    page,
  }) => {
    const admin = requireAdminCreds();
    const suffix = uniqueSuffix();
    const clientName = `E2E Cancel ${suffix}`;

    await login(page, admin.email, admin.password);
    const operator = await seedOperator(page, suffix, "OpA");
    await logout(page);

    await completePublicQuote(page, clientName);
    await login(page, admin.email, admin.password);
    await approveBudgetCreateJob(page, clientName);
    await assignOperatorOnJob(page, operator.name);
    const jobUrl = page.url();

    await expect(page.getByRole("button", { name: "Marcar en camino" })).toHaveCount(
      0,
    );
    await expect(
      page.getByText(/aún no registró camión, conductor y salvoconducto/),
    ).toBeVisible();
    await logout(page);

    await login(page, operator.email, operator.password);
    await openRecordByTitle(page, clientName);
    await expect(page.getByRole("button", { name: "Aceptar servicio" })).toBeVisible();
    await expect(page.getByRole("button", { name: "En camino" })).toHaveCount(0);
    await logout(page);

    await login(page, admin.email, admin.password);
    await page.goto(jobUrl);
    await page.getByRole("button", { name: "Cancelar" }).click();
    await page.getByRole("button", { name: "Confirmar cancelación" }).click();
    await expect(page.getByText("Cancelado", { exact: true })).toBeVisible({
      timeout: 30_000,
    });
    await expect(page.getByRole("button", { name: "Asignar operador" })).toHaveCount(
      0,
    );
    await expect(
      page.getByRole("button", { name: "Guardar programación" }),
    ).toHaveCount(0);
    await logout(page);

    await login(page, operator.email, operator.password);
    await openRecordByTitle(page, clientName);
    await expect(page.getByText("Trabajo cancelado")).toBeVisible();
    await expect(page.getByRole("button", { name: "Aceptar servicio" })).toHaveCount(
      0,
    );
  });

  test("operador rechaza y admin reasigna a otro", async ({ page }) => {
    const admin = requireAdminCreds();
    const suffix = uniqueSuffix();
    const clientName = `E2E Decline ${suffix}`;

    await login(page, admin.email, admin.password);
    const first = await seedOperator(page, suffix, "Op1");
    const second = await seedOperator(page, `${suffix}b`, "Op2");
    await logout(page);

    await completePublicQuote(page, clientName);
    await login(page, admin.email, admin.password);
    await approveBudgetCreateJob(page, clientName);
    await assignOperatorOnJob(page, first.name);
    const jobUrl = page.url();
    await logout(page);

    await login(page, first.email, first.password);
    await openRecordByTitle(page, clientName);
    await page.getByRole("button", { name: "Rechazar trabajo" }).click();
    await page.getByRole("button", { name: "Confirmar rechazo" }).click();
    await page.waitForURL(/\/panel\/mis-trabajos$/, { timeout: 30_000 });
    await expect(
      page.getByRole("link", { name: `Abrir ${clientName}` }),
    ).toHaveCount(0);
    await logout(page);

    await login(page, admin.email, admin.password);
    await page.goto(jobUrl);
    await expect(page.getByText("Sin conductor")).toBeVisible();
    await expect(page.getByText("Rechazado")).toBeVisible();
    await assignOperatorOnJob(page, second.name);
    await logout(page);

    await login(page, first.email, first.password);
    await expect(
      page.getByRole("link", { name: `Abrir ${clientName}` }),
    ).toHaveCount(0);
    await logout(page);

    await login(page, second.email, second.password);
    await openRecordByTitle(page, clientName);
    await expect(page.getByRole("button", { name: "Aceptar servicio" })).toBeVisible();
  });

  test("cancelar en camino bloquea finalizar y reasignar", async ({ page }) => {
    const admin = requireAdminCreds();
    const suffix = uniqueSuffix();
    const clientName = `E2E EnCamino ${suffix}`;

    await login(page, admin.email, admin.password);
    const operator = await seedOperator(page, suffix, "OpC");
    await logout(page);

    await completePublicQuote(page, clientName);
    await login(page, admin.email, admin.password);
    await approveBudgetCreateJob(page, clientName);
    await assignOperatorOnJob(page, operator.name);
    const jobUrl = page.url();
    await logout(page);

    await login(page, operator.email, operator.password);
    await openRecordByTitle(page, clientName);
    await fillAcceptSalvo(page, {
      plate: operator.fleet[0].plate,
      truckLabel: operator.fleet[0].truckLabel,
      crewName: operator.fleet[0].crewName,
      folio: `SC-CX-${suffix}`,
    });
    await page.getByRole("button", { name: "En camino" }).click();
    await expect(page.getByRole("button", { name: "Finalizar" })).toBeVisible({
      timeout: 30_000,
    });
    await logout(page);

    await login(page, admin.email, admin.password);
    await page.goto(jobUrl);
    await page.getByRole("button", { name: "Cancelar" }).click();
    await page.getByRole("button", { name: "Confirmar cancelación" }).click();
    await expect(page.getByText("Cancelado", { exact: true })).toBeVisible({
      timeout: 30_000,
    });
    await expect(page.getByRole("button", { name: "Finalizar" })).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Asignar operador" })).toHaveCount(
      0,
    );
    await expect(
      page.getByRole("button", { name: "Guardar programación" }),
    ).toHaveCount(0);
  });

  test("trabajo finalizado queda bloqueado", async ({ page }) => {
    const admin = requireAdminCreds();
    const suffix = uniqueSuffix();
    const clientName = `E2E Done ${suffix}`;

    await login(page, admin.email, admin.password);
    const operator = await seedOperator(page, suffix, "OpD");
    await logout(page);

    await completePublicQuote(page, clientName);
    await login(page, admin.email, admin.password);
    await approveBudgetCreateJob(page, clientName);
    await assignOperatorOnJob(page, operator.name);
    const jobUrl = page.url();
    await logout(page);

    await login(page, operator.email, operator.password);
    await openRecordByTitle(page, clientName);
    await fillAcceptSalvo(page, {
      plate: operator.fleet[0].plate,
      truckLabel: operator.fleet[0].truckLabel,
      crewName: operator.fleet[0].crewName,
      folio: `SC-DN-${suffix}`,
    });
    await page.getByRole("button", { name: "En camino" }).click();
    await expect(page.getByRole("button", { name: "Finalizar" })).toBeVisible({
      timeout: 30_000,
    });
    await page.getByRole("button", { name: "Finalizar" }).click();
    await expect(page.getByText("Trabajo finalizado")).toBeVisible({
      timeout: 30_000,
    });
    await logout(page);

    await login(page, admin.email, admin.password);
    await page.goto(jobUrl);
    await expect(page.getByText("Finalizado")).toBeVisible();
    await expect(page.getByRole("button", { name: "Cancelar" })).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Marcar en camino" })).toHaveCount(
      0,
    );
    await expect(page.getByRole("button", { name: "Asignar operador" })).toHaveCount(
      0,
    );
    await expect(
      page.getByRole("button", { name: "Guardar programación" }),
    ).toHaveCount(0);
  });
});
