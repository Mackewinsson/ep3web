import { expect, test } from "@playwright/test";
import {
  completePublicQuote,
  login,
  openRecordByTitle,
  requireAdminCreds,
  uniqueSuffix,
} from "./helpers";

test("cotización: m³ estimados sincroniza Estimación auto en notas", async ({
  page,
}) => {
  test.setTimeout(180_000);

  const admin = requireAdminCreds();
  const clientName = `E2E VolSync ${uniqueSuffix()}`;

  await completePublicQuote(page, clientName);
  await login(page, admin.email, admin.password);

  await page.goto("/panel/cotizaciones");
  await openRecordByTitle(page, clientName);

  const m3Input = page.locator('input[name="estimatedM3"]');
  const notes = page.locator('textarea[name="volumeNotes"]');
  await expect(m3Input).toBeVisible({ timeout: 30_000 });
  await expect(notes).toBeVisible();

  await expect(notes).toContainText(/Estimación auto:/i);
  await expect(notes).toContainText(/Ayudantes:/i);

  const initialNotes = await notes.inputValue();
  const initialMatch = initialNotes.match(
    /Estimaci[oó]n auto:\s*([\d.,]+)\s*m³/i,
  );
  expect(initialMatch).toBeTruthy();

  await m3Input.fill("15.5");
  await expect(notes).toContainText(/Estimación auto:\s*15\.5\s*m³/i);
  await expect(notes).toContainText(/\$[\d.]+ CLP/);

  await page.getByRole("button", { name: "Guardar cambios" }).click();
  await expect(page.getByRole("heading", { name: "Detalle de cotización" })).toBeVisible({
    timeout: 30_000,
  });
  await expect(page.locator('input[name="estimatedM3"]')).toHaveValue(/15\.5/);
  await expect(page.locator('textarea[name="volumeNotes"]')).toContainText(
    /Estimación auto:\s*15\.5\s*m³/i,
  );
});
