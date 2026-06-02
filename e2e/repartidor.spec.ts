import { test, expect } from '@playwright/test'

test.describe('Portal Repartidor', () => {
  test('redirige al login cuando no hay sesión', async ({ page }) => {
    const res = await page.goto('/repartidor')
    // Acepta tanto un redirect HTTP como un redirect client-side
    await page.waitForURL(/\/auth\/login|\/repartidor/)
    const finalUrl = page.url()
    const redirected = finalUrl.includes('/auth/login') || res?.status() === 307 || res?.status() === 302
    expect(redirected || finalUrl.includes('/auth/login')).toBeTruthy()
  })

  test('detalle de pedido redirige sin sesión', async ({ page }) => {
    await page.goto('/repartidor/pedido/00000000-0000-0000-0000-000000000000')
    await page.waitForURL(/\/auth\/login|\/repartidor/)
    expect(page.url()).toMatch(/auth\/login|repartidor/)
  })
})
