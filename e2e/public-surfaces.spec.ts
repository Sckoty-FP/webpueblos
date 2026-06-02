import { test, expect } from '@playwright/test'

// Cobertura smoke de superficies públicas tocadas/relevantes en Sprint 14:
// contacto (con rate limit), delivery y free-tour del pueblo.
// Sin auth, sin acciones destructivas — solo que cargan y rinden lo clave.

const PUEBLO = 'alcocebre'

test.describe('Contacto', () => {
  test('carga y muestra el formulario', async ({ page }) => {
    await page.goto('/contacto')
    await expect(page).toHaveTitle(/Contacto/)
    // El form público (rate-limited) debe tener al menos un campo de texto.
    await expect(page.locator('form')).toBeVisible()
    await expect(page.getByRole('textbox').first()).toBeVisible()
  })
})

test.describe(`Delivery público: ${PUEBLO}`, () => {
  test('listing de delivery carga', async ({ page }) => {
    await page.goto(`/${PUEBLO}/delivery`)
    await expect(page).toHaveTitle(/Delivery en Alcocèber/)
    await expect(page).toHaveURL(`/${PUEBLO}/delivery`)
  })
})

test.describe(`Free Tour público: ${PUEBLO}`, () => {
  test('listing de free tour carga', async ({ page }) => {
    await page.goto(`/${PUEBLO}/free-tour`)
    await expect(page).toHaveTitle(/Free Tours en Alcocèber/)
    await expect(page).toHaveURL(`/${PUEBLO}/free-tour`)
  })
})
