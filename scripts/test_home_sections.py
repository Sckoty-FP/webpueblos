import sys, io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

from playwright.sync_api import sync_playwright
import time

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page(viewport={"width": 1440, "height": 900})
    page.goto("http://localhost:3000/alcocebre")
    page.wait_for_load_state("networkidle")

    # Obtener altura total de la página
    total_height = page.evaluate("document.body.scrollHeight")
    print(f"Altura total de la página: {total_height}px")

    # Screenshot de cada sección scrolleando cada 900px
    pos = 0
    i = 0
    while pos < total_height:
        page.evaluate(f"window.scrollTo(0, {pos})")
        time.sleep(0.4)
        path = f"/tmp/home_section_{i:02d}_y{pos}.png"
        page.screenshot(path=path, full_page=False)
        print(f"  Screenshot {i}: y={pos} → {path}")
        pos += 820
        i += 1

    browser.close()
    print("Listo")
