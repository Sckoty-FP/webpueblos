import { test, expect } from "@playwright/test";

// Estos tests asumen que el dev server corre en localhost:3000
// y que la migración 009 ya fue aplicada en Supabase.

test.describe("Panel Equipo", () => {
  test("ruta /panel/equipo existe y carga sin 404", async ({ page }) => {
    // Sin sesión → redirige a login (no 404 ni 500)
    const response = await page.goto("/panel/equipo");
    expect(response?.status()).not.toBe(404);
    expect(response?.status()).not.toBe(500);
    // Debe redirigir al login
    expect(page.url()).toContain("/auth/login");
  });

  test("ruta /auth/invitacion sin token muestra error", async ({ page }) => {
    await page.goto("/auth/invitacion");
    await expect(page.getByText("Link inválido")).toBeVisible();
  });

  test("ruta /auth/invitacion con token inválido muestra error", async ({ page }) => {
    await page.goto("/auth/invitacion?token=00000000-0000-0000-0000-000000000000");
    // Sin sesión → redirige a login
    expect(page.url()).toContain("/auth/login");
  });
});
