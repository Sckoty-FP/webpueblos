import { test, expect } from "@playwright/test";

// Smoke tests del flujo de recuperación de contraseña.
// Asumen el dev server en localhost:3000. No disparan el email real
// (no se hace submit) para no depender de Supabase ni enviar correos.

test.describe("Recuperar contraseña", () => {
  test("ruta /auth/recuperar carga sin 404 y muestra el form", async ({ page }) => {
    const response = await page.goto("/auth/recuperar");
    expect(response?.status()).not.toBe(404);
    expect(response?.status()).not.toBe(500);

    await expect(page.getByRole("heading", { name: "Recuperar contraseña" })).toBeVisible();
    await expect(page.getByPlaceholder("tu@email.com")).toBeVisible();
    await expect(page.getByRole("button", { name: "Enviar enlace" })).toBeVisible();
  });

  test("validación: email inválido no envía", async ({ page }) => {
    await page.goto("/auth/recuperar");
    await page.getByPlaceholder("tu@email.com").fill("no-es-un-email");
    await page.getByRole("button", { name: "Enviar enlace" }).click();
    await expect(page.getByText("Email inválido")).toBeVisible();
  });

  test("ruta /auth/nueva-clave carga sin 404 y muestra el form", async ({ page }) => {
    const response = await page.goto("/auth/nueva-clave");
    expect(response?.status()).not.toBe(404);
    expect(response?.status()).not.toBe(500);

    await expect(page.getByRole("heading", { name: "Nueva contraseña" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Guardar contraseña" })).toBeVisible();
  });
});
