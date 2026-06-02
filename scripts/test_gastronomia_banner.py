from playwright.sync_api import sync_playwright
import time

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page(viewport={"width": 1440, "height": 900})
    page.goto("http://localhost:3000/alcocebre/gastronomia")
    page.wait_for_load_state("networkidle")

    # Screenshot inicial
    page.screenshot(path="/tmp/gastro_banner_0.png", full_page=False)
    print("Screenshot 0 tomado")

    # Esperar 6 segundos para que rote
    time.sleep(6)
    page.screenshot(path="/tmp/gastro_banner_1.png", full_page=False)
    print("Screenshot 1 tomado (tras 6s)")

    # Esperar 6 segundos más
    time.sleep(6)
    page.screenshot(path="/tmp/gastro_banner_2.png", full_page=False)
    print("Screenshot 2 tomado (tras 12s)")

    # Full page para ver todo
    page.screenshot(path="/tmp/gastro_full.png", full_page=True)
    print("Screenshot full page tomado")

    browser.close()
    print("Listo")
