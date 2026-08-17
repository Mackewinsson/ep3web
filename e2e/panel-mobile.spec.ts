import { test, expect } from "@playwright/test";
import { login, requireAdminCreds } from "./helpers";

test.describe("panel mobile smoke", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("sign-in and panel shell usable on phone width", async ({ page }) => {
    const admin = requireAdminCreds();
    await page.goto("/sign-in");
    await expect(page.locator('input[name="email"]')).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Entrar al panel" }),
    ).toBeVisible();

    await login(page, admin.email, admin.password);
    await expect(page.getByRole("button", { name: "Abrir menú" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Salir" })).toBeVisible();
    await expect(
      page.locator("header").getByText(/Operaciones/),
    ).toBeHidden();

    await page.getByRole("button", { name: "Abrir menú" }).click();
    const drawerNav = page.locator("aside").filter({ hasText: "Panel operativo" });
    await expect(
      drawerNav.getByRole("link", { name: "Trabajos", exact: true }),
    ).toBeVisible();
    await page.getByRole("button", { name: "Cerrar", exact: true }).click();
    await expect(
      drawerNav.getByRole("link", { name: "Trabajos", exact: true }),
    ).toHaveCount(0);

    await page.goto("/panel/trabajos");
    await expect(page.getByRole("heading", { name: "Trabajos" })).toBeVisible();

    await page.goto("/panel/cotizador");
    await expect(
      page.getByRole("button", { name: "Guardar parámetros" }),
    ).toBeVisible();
    const addCategory = page.getByRole("button", { name: "Agregar categoría" });
    await expect(addCategory).toBeVisible();
    const box = await addCategory.boundingBox();
    expect(box?.height ?? 0).toBeGreaterThanOrEqual(40);
  });
});
