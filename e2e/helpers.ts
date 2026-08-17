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
