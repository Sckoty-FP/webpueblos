import { test, expect } from '@playwright/test'

const PUEBLO = 'alcocebre'

test.describe('Home', () => {
  test('lista pueblos y muestra acceso a Alcocèber', async ({ page }) => {
    await page.goto('/')
    await expect(page).toHaveTitle('PUEBLO — La plataforma de los pueblos mediterráneos')
    await expect(page.getByText('Elegí tu pueblo')).toBeVisible()
    await expect(page.getByRole('link', { name: /Alcocèber/ }).first()).toBeVisible()
  })
})

test.describe('Auth', () => {
  test('login renderiza form completo', async ({ page }) => {
    await page.goto('/auth/login')
    await expect(page).toHaveTitle(/Iniciar sesión/)
    await expect(page.getByRole('heading', { name: 'Iniciar sesión' })).toBeVisible()
    await expect(page.getByRole('textbox', { name: /email/i })).toBeVisible()
    await expect(page.locator('input[type="password"]')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Entrar' })).toBeVisible()
    await expect(page.getByRole('link', { name: 'Registrate' })).toBeVisible()
  })

  test('registro renderiza form', async ({ page }) => {
    await page.goto('/auth/registro')
    await expect(page).toHaveTitle(/Crear cuenta/)
    await expect(page.getByRole('link', { name: /ya tenés cuenta/i })).toBeVisible()
  })

  test('login tiene link a registro y viceversa', async ({ page }) => {
    await page.goto('/auth/login')
    await page.getByRole('link', { name: 'Registrate' }).click()
    await expect(page).toHaveURL(/\/auth\/registro/)

    await page.getByRole('link', { name: /ya tenés cuenta/i }).click()
    await expect(page).toHaveURL(/\/auth\/login/)
  })
})

test.describe('Panel (sin auth)', () => {
  test('redirige a login con redirect param', async ({ page }) => {
    await page.goto('/panel')
    await expect(page).toHaveURL(/\/auth\/login\?redirect=%2Fpanel/)
    await expect(page.getByRole('heading', { name: 'Iniciar sesión' })).toBeVisible()
  })
})

test.describe(`Pueblo: ${PUEBLO}`, () => {
  test('landing carga y muestra secciones principales', async ({ page }) => {
    await page.goto(`/${PUEBLO}`)
    await expect(page).toHaveTitle(/Alcocèber/)
    await expect(page.getByText('¿Qué querés hacer?')).toBeVisible()
    await expect(page.getByRole('link', { name: /ver todos los servicios/i })).toBeVisible()
  })

  test('servicios listing carga', async ({ page }) => {
    await page.goto(`/${PUEBLO}/servicios`)
    await expect(page).toHaveTitle('Servicios en Alcocèber · PUEBLO')
    await expect(page).toHaveURL(`/${PUEBLO}/servicios`)
  })

  test('muro carga', async ({ page }) => {
    await page.goto(`/${PUEBLO}/muro`)
    await expect(page).toHaveTitle('Muro en Alcocèber · PUEBLO')
    await expect(page).toHaveURL(`/${PUEBLO}/muro`)
  })

  test('actividades listing carga', async ({ page }) => {
    await page.goto(`/${PUEBLO}/actividades`)
    await expect(page).toHaveTitle('Actividades en Alcocèber · PUEBLO')
    await expect(page).toHaveURL(`/${PUEBLO}/actividades`)
  })

  test('clasificados listing carga', async ({ page }) => {
    await page.goto(`/${PUEBLO}/clasificados`)
    await expect(page).toHaveTitle('Clasificados en Alcocèber · PUEBLO')
    await expect(page).toHaveURL(`/${PUEBLO}/clasificados`)
  })

  test('landing navega a servicios via link', async ({ page }) => {
    await page.goto(`/${PUEBLO}`)
    await page.getByRole('link', { name: /ver todos los servicios/i }).click()
    await expect(page).toHaveURL(`/${PUEBLO}/servicios`)
  })

  test('slug inválido devuelve 404', async ({ page }) => {
    const response = await page.goto('/pueblo-que-no-existe')
    expect(response?.status()).toBe(404)
  })
})
