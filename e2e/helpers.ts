import { expect, type Page } from "@playwright/test";

export type AdminCreds = {
  email: string;
  password: string;
};

export function requireAdminCreds(): AdminCreds {
  const email = process.env.ADMIN_EMAIL?.trim();
  const password = process.env.ADMIN_PASSWORD?.trim();
  if (!email || !password) {
    throw new Error(
      "Set ADMIN_EMAIL and ADMIN_PASSWORD in .env.local before running e2e.",
    );
  }
  return { email, password };
}

export function uniqueSuffix() {
  return `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
}

export async function login(page: Page, email: string, password: string) {
  await page.goto("/sign-in");
  await page.locator('input[name="email"]').fill(email);
  await page.locator('input[name="password"]').fill(password);
  await page.getByRole("button", { name: "Entrar al panel" }).click();
  await page.waitForURL(/\/panel(\/|$)/, { timeout: 30_000 });
}

export async function logout(page: Page) {
  await page.getByRole("button", { name: "Salir" }).click();
  await page.waitForURL(/\/sign-in/, { timeout: 30_000 });
}

export async function openRecordByTitle(page: Page, title: string) {
  const link = page.getByRole("link", { name: `Abrir ${title}` });
  await expect(link).toBeVisible({ timeout: 30_000 });
  await link.click();
}

export async function selectByName(
  page: Page,
  name: string,
  option: { label?: string | RegExp; value?: string; index?: number },
) {
  const select = page.locator(`select[name="${name}"]`);
  await expect(select).toBeVisible({ timeout: 15_000 });
  if (option.value !== undefined) {
    await select.selectOption(option.value);
  } else if (option.index !== undefined) {
    await select.selectOption({ index: option.index });
  } else if (option.label instanceof RegExp) {
    const value = await select.locator("option").evaluateAll(
      (opts, patternSource) => {
        const re = new RegExp(patternSource);
        const match = opts.find(
          (o): o is HTMLOptionElement =>
            o instanceof HTMLOptionElement && re.test(o.textContent ?? ""),
        );
        return match?.value ?? null;
      },
      option.label.source,
    );
    if (!value) {
      throw new Error(`No option matching ${option.label} in select[name=${name}]`);
    }
    await select.selectOption(value);
  } else if (option.label !== undefined) {
    await select.selectOption({ label: option.label });
  }
}

export async function fillByName(page: Page, name: string, value: string) {
  const input = page.locator(
    `input[name="${name}"], textarea[name="${name}"]`,
  );
  await expect(input).toBeVisible({ timeout: 15_000 });
  await input.fill(value);
}

export type FleetMember = {
  crewName: string;
  crewEmail: string;
  plate: string;
  truckLabel: string;
};

export function buildTestFleet(suffix: string, size = 5): FleetMember[] {
  return Array.from({ length: size }, (_, i) => {
    const n = i + 1;
    const plate = `E${n}${suffix}`
      .replace(/[^A-Z0-9]/gi, "")
      .toUpperCase()
      .slice(0, 12);
    return {
      crewName: `E2E Chofer ${n} ${suffix}`,
      crewEmail: `e2e.crew${n}.${suffix}@example.com`,
      plate,
      truckLabel: `Camión ${n} ${suffix}`,
    };
  });
}

export async function createOperatorWithAccess(
  page: Page,
  input: { name: string; email: string; password: string },
) {
  await page.goto("/panel/conductores/nuevo");
  await selectByName(page, "kind", { label: "Operador (cuenta flota)" });
  await fillByName(page, "name", input.name);
  await fillByName(page, "email", input.email);
  await fillByName(page, "phone", "+56911111111");
  await page.locator('input[name="enableAppAccess"]').check();
  await fillByName(page, "appPassword", input.password);
  await page.getByRole("button", { name: "Guardar" }).click();
  await page.waitForURL(/\/panel\/conductores$/, { timeout: 30_000 });
  await expect(
    page.getByRole("link", { name: `Abrir ${input.name}` }),
  ).toBeVisible();
}

export async function createOperatorFleet(
  page: Page,
  operatorName: string,
  fleet: FleetMember[],
) {
  for (const member of fleet) {
    await page.goto("/panel/conductores/nuevo");
    await selectByName(page, "kind", { label: "Conductor de flota" });
    await selectByName(page, "operatorId", { label: operatorName });
    await fillByName(page, "name", member.crewName);
    await fillByName(page, "email", member.crewEmail);
    await fillByName(page, "phone", "+56922222222");
    await page.getByRole("button", { name: "Guardar" }).click();
    await page.waitForURL(/\/panel\/conductores$/, { timeout: 30_000 });
    await expect(
      page.getByRole("link", { name: `Abrir ${member.crewName}` }),
    ).toBeVisible();
  }

  for (const member of fleet) {
    await page.goto("/panel/camiones/nuevo");
    await fillByName(page, "plate", member.plate);
    await fillByName(page, "label", member.truckLabel);
    await selectByName(page, "operatorId", { label: operatorName });
    await page.getByRole("button", { name: "Guardar camión" }).click();
    await page.waitForURL(/\/panel\/camiones$/, { timeout: 30_000 });
    await expect(
      page.getByRole("link", { name: `Abrir ${member.plate}` }).first(),
    ).toBeVisible();
  }
}

const WIZARD_STORAGE_KEY = "ep3-quote-wizard-v2";

async function fillAddressStep(page: Page, address: string) {
  await page.getByLabel("Tipo").selectOption("casa");
  await page.getByPlaceholder("Ej: Morandé 707, Santiago").fill(address);
  await page.getByRole("button", { name: "Siguiente" }).click();
}

export async function completePublicQuote(page: Page, clientName: string) {
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
  await page.getByPlaceholder("Ej: piano vertical, pecera…").fill("Caja E2E");
  await page.getByRole("button", { name: "Agregar", exact: true }).click();
  await expect(page.getByText("Caja E2E")).toBeVisible();
  await page.getByRole("button", { name: "Siguiente" }).click();

  await expect(
    page.getByRole("heading", { name: /ayudantes/i }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: /Chofer \(el chofer te ayuda\)/i })
    .click();
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

export async function approveBudgetCreateJob(page: Page, clientName: string) {
  const budgetTitle = `Cotización web — ${clientName}`;
  await page.goto("/panel/presupuestos");
  await openRecordByTitle(page, budgetTitle);
  await expect(page.getByRole("heading", { name: budgetTitle })).toBeVisible();
  await page.getByRole("button", { name: "Aprobar y crear trabajo" }).click();
  await page.waitForURL(/\/panel\/trabajos\/[^/]+$/, { timeout: 30_000 });
}

export async function assignOperatorOnJob(page: Page, operatorName: string) {
  await selectByName(page, "driverId", { label: new RegExp(operatorName) });
  const submit = page.getByRole("button", {
    name: /Asignar operador|Actualizar asignación/,
  });
  await submit.click();
  await page.waitForURL(/\/panel\/trabajos\/[^/]+$/, { timeout: 30_000 });
  await expect(
    page.getByText(new RegExp(`Operador:\\s*${operatorName}`)),
  ).toBeVisible({ timeout: 30_000 });
}

export async function fillAcceptSalvo(
  page: Page,
  input: {
    plate: string;
    truckLabel: string;
    crewName: string;
    folio: string;
  },
) {
  await page.getByRole("button", { name: "Aceptar servicio" }).click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  await dialog.locator('select[name="truckId"]').selectOption({
    label: `${input.plate} — ${input.truckLabel}`,
  });
  await dialog.locator('select[name="crewDriverId"]').selectOption({
    label: input.crewName,
  });
  await dialog.locator('input[name="folio"]').fill(input.folio);
  await dialog.locator('input[name="issuedAt"]').fill("2026-08-16");
  await dialog.locator('input[name="originCommune"]').fill("Providencia");
  await dialog
    .locator('input[name="destinationCommune"]')
    .fill("Las Condes");
  await dialog.getByRole("button", { name: "Confirmar aceptación" }).click();
  await expect(page.getByText(input.folio)).toBeVisible({ timeout: 30_000 });
}
