import sys, io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

from playwright.sync_api import sync_playwright
import time

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)

    # ── HOME ──────────────────────────────────────────────────────────
    page = browser.new_page(viewport={"width": 1440, "height": 900})
    page.goto("http://localhost:3000/alcocebre")
    page.wait_for_load_state("networkidle")
    page.screenshot(path="/tmp/final_home_top.png", full_page=False)

    # Scroll a sección gastronomía preview
    page.evaluate("window.scrollTo(0, 900)")
    time.sleep(0.3)
    page.screenshot(path="/tmp/final_home_mid.png", full_page=False)

    # Scroll a BloqueDestacados (dark section)
    page.evaluate("window.scrollTo(0, 600)")
    time.sleep(0.3)
    page.screenshot(path="/tmp/final_home_destacados.png", full_page=False)

    # Scroll a sección muro + eventos
    page.evaluate("window.scrollTo(0, 2800)")
    time.sleep(0.3)
    page.screenshot(path="/tmp/final_home_muro_eventos.png", full_page=False)

    page.close()
    print("HOME: screenshots tomados")

    # ── GASTRONOMIA ───────────────────────────────────────────────────
    page = browser.new_page(viewport={"width": 1440, "height": 900})
    page.goto("http://localhost:3000/alcocebre/gastronomia")
    page.wait_for_load_state("networkidle")

    # Top: filtros + tarjetas (verificar tipoCocina formateado)
    page.screenshot(path="/tmp/final_gastro_cards.png", full_page=False)

    # Scroll para ver el banner
    page.evaluate("window.scrollTo(0, 520)")
    time.sleep(0.3)
    page.screenshot(path="/tmp/final_gastro_banner.png", full_page=False)

    # Esperar 6s para ver rotación
    time.sleep(6)
    page.screenshot(path="/tmp/final_gastro_banner_2.png", full_page=False)

    page.close()
    print("GASTRONOMIA: screenshots tomados")

    browser.close()
    print("Listo")
